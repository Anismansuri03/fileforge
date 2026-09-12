import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdvancedSettings,
  AdvancedSection,
} from "@/components/advanced-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Layers, ImageIcon } from "lucide-react";

interface ConvertMeta {
  width: number;
  height: number;
  format: string;
  originalBytes: number;
  outputBytes: number;
}

interface ConvertResult {
  data: Uint8Array;
  meta: ConvertMeta;
  fileName: string;
  originalBytes: number;
  outputBytes: number;
  targetBytes: number;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const FORMATS: Array<{ value: ImageOutputFormat; label: string }> = [
  { value: "jpeg", label: "JPEG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "avif", label: "AVIF" },
];

const DEFAULT_ADVANCED = {
  quality: "92",
  metadata: "keep",
};

export default function ConvertImage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<ImageOutputFormat>("webp");
  const [quality, setQuality] = useState(DEFAULT_ADVANCED.quality);
  const [metadata, setMetadata] = useState(DEFAULT_ADVANCED.metadata);

  const job = useToolJob<ConvertResult>();
  const file = items[0]?.file ?? null;

  const sourceFormat = file
    ? detectImageFormat(file.type || file.name)
    : "unknown";

  const handleFiles = useCallback((files: File[]) => {
    for (const f of files) {
      const check = validateFile(f, "image");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't supported.");
        continue;
      }
      setItems([{ id: newFileId(), file: f }]);
    }
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    const buffer = await file.arrayBuffer();

    await job.start(async ({ onProgress, signal }) => {
      const { data, meta } = await runWorker<
        {
          data: ArrayBuffer;
          format: ImageOutputFormat;
          quality: number;
          stripMetadata?: boolean;
        },
        ConvertMeta
      >(
        createImageWorker,
        "image.convert",
        {
          data: buffer,
          format: targetFormat,
          quality: parseInt(quality) || 92,
          stripMetadata: metadata === "strip",
        },
        { onProgress, signal },
      );

      return {
        data,
        meta,
        fileName: buildOutputName(
          file.name,
          "converted",
          OUTPUT_EXTENSION[meta.format as ImageOutputFormat] ?? "webp",
        ),
        originalBytes: file.size,
        outputBytes: meta.outputBytes,
        targetBytes: file.size,
      };
    });
  }, [file, targetFormat, quality, metadata]);

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
        eyebrow="Convert"
        title="Converting your image"
        description="This happens entirely on your device."
      >
        <ProcessingView
          title={`Converting ${file?.name ?? "image"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="Convert" title="Conversion complete">
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
      eyebrow="Convert"
      title="Convert image"
      description="Convert files between popular formats directly in your browser."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleConvert} />
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Convert to</label>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map((fmt) => {
                  const isSource = sourceFormat === fmt.value;
                  return (
                    <button
                      key={fmt.value}
                      type="button"
                      onClick={() => setTargetFormat(fmt.value)}
                      disabled={!file}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        targetFormat === fmt.value
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      } disabled:opacity-50`}
                    >
                      {fmt.label}
                      {isSource && (
                        <Badge variant="muted" className="ml-1 text-[10px] py-0">
                          source
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {sourceFormat === "jpeg" || sourceFormat === "png" ? (
              <p className="text-xs text-muted-foreground">
                {sourceFormat === targetFormat
                  ? "Source and target formats are the same. The image will be re-encoded."
                  : `Converting ${
                      sourceFormat.toUpperCase()
                    } → ${targetFormat.toUpperCase()}. Transparency is preserved if the target supports it.`}
              </p>
            ) : null}

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

            <Button
              size="lg"
              onClick={handleConvert}
              disabled={!file}
            >
              Convert to {targetFormat.toUpperCase()}
            </Button>
          </div>
        </ToolCard>

        <HowToSection
          title="How to convert an image"
          steps={[
            { step: "Choose your image.", detail: "Drag it here or click to browse." },
            { step: "Pick the output format.", detail: "WebP is the smallest, PNG is best for transparency." },
            { step: "Click Convert.", detail: "Your image is converted instantly." },
            { step: "Download your converted image.", detail: "It's ready to use." },
          ]}
          explanation="FileForge converts images on your device. WebP is the most efficient format for web use, while PNG is ideal when you need transparent backgrounds."
          faqs={[
            { q: "Which format should I choose?", a: "WebP gives the smallest files with great quality. PNG is best if you need transparency. JPG is universally supported." },
            { q: "Does converting reduce quality?", a: "Going from JPG to PNG or WebP does not reduce quality further. Going from PNG to JPG will flatten transparency to a solid background." },
            { q: "Is my image uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Compress image", to: "/compress/image", icon: Layers },
            { label: "Resize image", to: "/resize/image", icon: ImageIcon },
          ]}
        />
      </div>
    </ToolPage>
  );
}
