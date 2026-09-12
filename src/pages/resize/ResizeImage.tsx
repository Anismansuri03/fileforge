import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AdvancedSettings,
  AdvancedSection,
} from "@/components/advanced-settings";
import { ProcessingView } from "@/components/processing/processing-view";
import { CompressionResult, IMAGE_NEXT_ACTIONS } from "@/components/result/compression-result";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, IMAGE_ACCEPT } from "@/lib/validation";
import { detectImageFormat, OUTPUT_EXTENSION, type ImageOutputFormat } from "@/engines/image/types";
import { runWorker, createImageWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, Wand2 } from "lucide-react";

type ResizeMode = "fit" | "fill" | "exact" | "percentage";

interface ResizeMeta {
  width: number;
  height: number;
  format: string;
  originalBytes: number;
  outputBytes: number;
}

interface ResizeResult {
  data: Uint8Array;
  meta: ResizeMeta;
  fileName: string;
  originalBytes: number;
  outputBytes: number;
  targetBytes: number;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_ADVANCED = {
  quality: "92",
  metadata: "keep",
};

export default function ResizeImage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [width, setWidth] = useState("1080");
  const [height, setHeight] = useState("1080");
  const [lockAspect, setLockAspect] = useState(true);
  const [mode, setMode] = useState<ResizeMode>("fit");
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat | "keep">(
    "keep",
  );
  const [aspectRatio, setAspectRatio] = useState(1);
  const [quality, setQuality] = useState(DEFAULT_ADVANCED.quality);
  const [metadata, setMetadata] = useState(DEFAULT_ADVANCED.metadata);

  const job = useToolJob<ResizeResult>();
  const file = items[0]?.file ?? null;

  const handleFiles = useCallback((files: File[]) => {
    for (const f of files) {
      const check = validateFile(f, "image");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't supported.");
        continue;
      }
      const img = new Image();
      const url = URL.createObjectURL(f);
      img.onload = () => {
        setAspectRatio(img.width / img.height);
        setWidth(String(img.width));
        setHeight(String(img.height));
        URL.revokeObjectURL(url);
      };
      img.src = url;
      setItems([{ id: newFileId(), file: f }]);
    }
  }, []);

  const handleWidthChange = useCallback(
    (value: string) => {
      setWidth(value);
      if (lockAspect) {
        const num = Number.parseFloat(value);
        if (Number.isFinite(num) && num > 0) {
          setHeight(String(Math.round(num / aspectRatio)));
        }
      }
    },
    [lockAspect, aspectRatio],
  );

  const handleHeightChange = useCallback(
    (value: string) => {
      setHeight(value);
      if (lockAspect) {
        const num = Number.parseFloat(value);
        if (Number.isFinite(num) && num > 0) {
          setWidth(String(Math.round(num * aspectRatio)));
        }
      }
    },
    [lockAspect, aspectRatio],
  );

  const handleResize = useCallback(async () => {
    if (!file) return;
    const w = Math.max(1, Math.round(Number.parseFloat(width) || 1080));
    const h = Math.max(1, Math.round(Number.parseFloat(height) || 1080));
    const sourceFormatRaw = detectImageFormat(file.type || file.name);
    const sourceFormat: ImageOutputFormat =
      sourceFormatRaw === "unknown" ? "jpeg" : sourceFormatRaw;
    const format: ImageOutputFormat =
      outputFormat === "keep" ? sourceFormat : outputFormat;

    const buffer = await file.arrayBuffer();

    await job.start(async ({ onProgress, signal }) => {
      const { data, meta } = await runWorker<
        {
          data: ArrayBuffer;
          outputFormat: ImageOutputFormat | "keep";
          sourceFormat: ImageOutputFormat;
          width: number;
          height: number;
          quality: number;
          mode: ResizeMode;
          stripMetadata?: boolean;
        },
        ResizeMeta
      >(
        createImageWorker,
        "image.resize",
        {
          data: buffer,
          outputFormat,
          sourceFormat,
          width: w,
          height: h,
          quality: parseInt(quality) || 92,
          mode,
          stripMetadata: metadata === "strip",
        },
        { onProgress, signal },
      );

      return {
        data,
        meta,
        fileName: buildOutputName(
          file.name,
          "resized",
          OUTPUT_EXTENSION[format] ?? "jpg",
        ),
        originalBytes: file.size,
        outputBytes: meta.outputBytes,
        targetBytes: file.size,
      };
    });
  }, [file, width, height, mode, outputFormat, quality, metadata]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: `image/${result.meta.format}`,
    });
    downloadBlob(blob, result.fileName);
  }, [job.result]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
  }, [job]);

  const handleResetAdvanced = useCallback(() => {
    setQuality(DEFAULT_ADVANCED.quality);
    setMetadata(DEFAULT_ADVANCED.metadata);
  }, []);

  if (job.status === "processing") {
    return (
      <ToolPage
        eyebrow="Resize"
        title="Resizing your image"
        description="This happens entirely on your device."
      >
        <ProcessingView
          title={`Resizing ${file?.name ?? "image"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="Resize" title="Resize complete">
        <CompressionResult
          result={{
            originalBytes: result.originalBytes,
            outputBytes: result.meta.outputBytes,
            targetBytes: result.originalBytes,
            targetReached: true,
            fileName: result.fileName,
            detail: `${result.meta.width}×${result.meta.height}`,
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download image"
          nextActions={IMAGE_NEXT_ACTIONS}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="Resize"
      title="Resize image"
      description="Change dimensions without unnecessary complexity."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleResize} />
        )}

        {items.length === 0 ? (
          <FileDropzone
            accept={IMAGE_ACCEPT}
            multiple={false}
            onFiles={handleFiles}
            title="Drop your image here"
            hint="Supports JPG, PNG, WebP and AVIF"
          />
        ) : (
          <FileList items={items} onRemove={() => setItems([])} />
        )}

        <ToolCard>
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resize-width">Width</Label>
                <Input
                  id="resize-width"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={width}
                  onChange={(e) => handleWidthChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resize-height">Height</Label>
                <Input
                  id="resize-height"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={height}
                  onChange={(e) => handleHeightChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="lock-aspect"
                checked={lockAspect}
                onCheckedChange={(v) => setLockAspect(v === true)}
              />
              <Label htmlFor="lock-aspect" className="cursor-pointer text-sm">
                Lock aspect ratio
              </Label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Resize mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as ResizeMode)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fit">Fit within dimensions</SelectItem>
                    <SelectItem value="fill">Fill dimensions (crop)</SelectItem>
                    <SelectItem value="exact">Exact dimensions</SelectItem>
                    <SelectItem value="percentage">Scale by percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Output format</Label>
                <Select
                  value={outputFormat}
                  onValueChange={(v) =>
                    setOutputFormat(v as ImageOutputFormat | "keep")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep original</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AdvancedSettings onReset={handleResetAdvanced}>
              <AdvancedSection
                title="Output quality"
                description="Lower values create smaller files but may reduce visual quality."
              >
                <Select value={quality} onValueChange={setQuality} disabled={!file}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="98">Highest (98)</SelectItem>
                    <SelectItem value="92">High (92)</SelectItem>
                    <SelectItem value="85">Good (85)</SelectItem>
                    <SelectItem value="75">Medium (75)</SelectItem>
                    <SelectItem value="65">Lower (65)</SelectItem>
                  </SelectContent>
                </Select>
              </AdvancedSection>
              <AdvancedSection
                title="Metadata"
                description="Remove metadata to reduce file size slightly."
              >
                <Select value={metadata} onValueChange={setMetadata} disabled={!file}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep all metadata</SelectItem>
                    <SelectItem value="strip">Remove unnecessary data</SelectItem>
                  </SelectContent>
                </Select>
              </AdvancedSection>
            </AdvancedSettings>

            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={handleResize} disabled={!file}>
                Resize image
              </Button>
              {file && (
                <Badge variant="muted">
                  Target: {width}×{height}
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              The image is resized on your device and never uploaded.
            </p>
          </div>
        </ToolCard>

        <HowToSection
          title="How to resize an image"
          steps={[
            { step: "Choose your image.", detail: "Drag it here or click to browse." },
            { step: "Set the width or height.", detail: "The other dimension updates automatically to keep proportions." },
            { step: "Click Resize image.", detail: "Your image is resized instantly." },
            { step: "Download your resized image.", detail: "It's ready to use." },
          ]}
          explanation="FileForge resizes images on your device. You can lock the aspect ratio to keep proportions, or unlock it to set custom dimensions."
          faqs={[
            { q: "What happens if I enter very large dimensions?", a: "The image will be upscaled, which may reduce quality. FileForge will not reject it, but downsizing usually gives better results." },
            { q: "Can I make an image square for Instagram?", a: "Yes. Enter 1080 for both width and height to get a standard square format." },
            { q: "Is my image uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Compress image", to: "/compress/image", icon: Layers },
            { label: "Convert format", to: "/convert/image", icon: Wand2 },
          ]}
        />
      </div>
    </ToolPage>
  );
}
