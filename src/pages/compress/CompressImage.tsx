import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { TargetSizeInput } from "@/components/size-input/target-size-input";
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
import { parseTargetSize, formatBytes, type SizeUnit } from "@/lib/bytes";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, isLargeFile, IMAGE_ACCEPT } from "@/lib/validation";
import { detectImageFormat, OUTPUT_EXTENSION, type ImageOutputFormat } from "@/engines/image/types";
import { runWorker, createImageWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, ImageIcon, Wand2 } from "lucide-react";

interface ImageCompressionMeta {
  width: number;
  height: number;
  quality: number;
  targetReached: boolean;
  originalBytes: number;
  outputBytes: number;
  format: ImageOutputFormat;
}

interface CompressResult {
  data: Uint8Array;
  meta: ImageCompressionMeta;
  fileName: string;
  originalBytes: number;
  targetBytes: number;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_ADVANCED = {
  outputFormat: "keep" as ImageOutputFormat | "keep",
  metadata: "strip",
};

export default function CompressImage() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [targetValue, setTargetValue] = useState("200");
  const [unit, setUnit] = useState<SizeUnit>("KB");
  const [outputFormat, setOutputFormat] = useState<ImageOutputFormat | "keep">(DEFAULT_ADVANCED.outputFormat);
  const [metadata, setMetadata] = useState(DEFAULT_ADVANCED.metadata);

  const job = useToolJob<CompressResult>();
  const { reset: resetJob } = job;

  const targetBytes = parseTargetSize(targetValue, unit);
  const targetError =
    targetValue.trim() !== "" && targetBytes === null
      ? "Enter a target greater than zero."
      : null;

  const handleFiles = useCallback((files: File[]) => {
    const valid: FileItem[] = [];
    for (const file of files) {
      const check = validateFile(file, "image");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't supported.");
        continue;
      }
      if (isLargeFile(file)) {
        toast.warning(
          "This is a large image. It may take a while and use significant memory.",
        );
      }
      valid.push({ id: newFileId(), file });
    }
    if (valid.length > 0) setItems(valid.slice(0, 1));
  }, []);

  const file = items[0]?.file ?? null;

  const handleCompress = useCallback(async () => {
    if (!file || targetBytes === null) return;
    const sourceFormat = detectImageFormat(file.type || file.name);
    const format: ImageOutputFormat =
      outputFormat !== "keep"
        ? outputFormat
        : sourceFormat === "unknown"
          ? "jpeg"
          : sourceFormat;

    const buffer = await file.arrayBuffer();

    await job.start(async ({ onProgress, signal }) => {
      const { data, meta } = await runWorker<
        {
          data: ArrayBuffer;
          format: ImageOutputFormat;
          targetBytes: number;
          stripMetadata?: boolean;
        },
        ImageCompressionMeta
      >(
        createImageWorker,
        "image.compress",
        {
          data: buffer,
          format,
          targetBytes,
          stripMetadata: metadata === "strip",
        },
        { onProgress, signal },
      );

      return {
        data,
        meta,
        fileName: buildOutputName(
          file.name,
          "compressed",
          OUTPUT_EXTENSION[meta.format] ?? "jpg",
        ),
        originalBytes: file.size,
        targetBytes,
      };
    });
  }, [file, job, targetBytes, outputFormat, metadata]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: `image/${result.meta.format}`,
    });
    downloadBlob(blob, result.fileName);
  }, [job.result]);

  const handleReset = useCallback(() => {
    resetJob();
    setItems([]);
  }, [resetJob]);

  const handleResetAdvanced = useCallback(() => {
    setOutputFormat(DEFAULT_ADVANCED.outputFormat);
    setMetadata(DEFAULT_ADVANCED.metadata);
  }, []);

  const aside = useMemo(
    () => (
      <ToolCard>
        <h2 className="text-sm font-semibold tracking-tight">How it works</h2>
        <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-image" />
            We encode the image at several quality levels and measure each real
            output.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-image" />
            If quality alone can&apos;t reach your target, dimensions are
            reduced gradually.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-image" />
            The highest-quality result at or below your target is returned.
          </li>
        </ul>
      </ToolCard>
    ),
    [],
  );

  if (job.status === "processing") {
    return (
      <ToolPage
        eyebrow="Compress"
        title="Compressing your image"
        description="This happens entirely on your device."
      >
        <ProcessingView
          title={`Compressing ${file?.name ?? "image"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="Compress" title="Image compression">
        <CompressionResult
          result={{
            originalBytes: result.originalBytes,
            outputBytes: result.meta.outputBytes,
            targetBytes: result.targetBytes,
            targetReached: result.meta.targetReached,
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
      eyebrow="Compress"
      title="Compress image"
      description="Reduce your image while keeping the best possible quality."
      aside={aside}
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleCompress} />
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
            <TargetSizeInput
              value={targetValue}
              unit={unit}
              onValueChange={setTargetValue}
              onUnitChange={setUnit}
              error={targetError}
              disabled={!file}
            />

            <AdvancedSettings onReset={handleResetAdvanced}>
              <AdvancedSection
                title="Output format"
                description="Choose the format for the compressed image."
              >
                <Select
                  value={outputFormat}
                  onValueChange={(v) => setOutputFormat(v as ImageOutputFormat | "keep")}
                  disabled={!file}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keep">Keep original format</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="avif">AVIF</SelectItem>
                  </SelectContent>
                </Select>
              </AdvancedSection>
              <AdvancedSection
                title="Metadata"
                description="Remove metadata to reduce file size slightly."
              >
                <Select
                  value={metadata}
                  onValueChange={setMetadata}
                  disabled={!file}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strip">Remove unnecessary data</SelectItem>
                    <SelectItem value="keep">Keep all metadata</SelectItem>
                  </SelectContent>
                </Select>
              </AdvancedSection>
            </AdvancedSettings>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                onClick={handleCompress}
                disabled={!file || targetBytes === null}
              >
                Compress image
              </Button>
              {file && targetBytes !== null && (
                <Badge variant="muted">
                  Target: {formatBytes(targetBytes)} or less
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              The image is compressed on your device and never uploaded.
            </p>
          </div>
        </ToolCard>

        <HowToSection
          title="How to compress an image"
          steps={[
            { step: "Choose your image.", detail: "Drag it here or click to browse." },
            { step: "Enter the size you need.", detail: "For example, 200 KB." },
            { step: "Click Compress image.", detail: "We'll find the best quality that fits your target." },
            { step: "Download your compressed image.", detail: "It's ready instantly." },
          ]}
          explanation="FileForge compresses your image on your device using modern codecs. You can also choose a different output format (like WebP) for even smaller files."
          faqs={[
            { q: "Will the image look worse?", a: "FileForge finds the best quality that fits your target. For most images, the difference is invisible. You can try 100 KB vs 200 KB to see what works for you." },
            { q: "Can I convert to WebP while compressing?", a: "Yes. Open Advanced settings and change the Output format to WebP. WebP files are typically smaller than JPG or PNG at the same quality." },
            { q: "Is my image uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Resize image", to: "/resize/image", icon: ImageIcon },
            { label: "Convert format", to: "/convert/image", icon: Wand2 },
            { label: "Compress PDF", to: "/compress/pdf", icon: Layers },
          ]}
        />
      </div>
    </ToolPage>
  );
}
