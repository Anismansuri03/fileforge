import { useCallback, useState } from "react";
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
import { CompressionResult, COMPRESS_PDF_NEXT_ACTIONS } from "@/components/result/compression-result";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { parseTargetSize, formatBytes, type SizeUnit } from "@/lib/bytes";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, Combine, Scissors } from "lucide-react";

interface PdfCompressionMeta {
  targetReached: boolean;
  originalBytes: number;
  outputBytes: number;
}

interface CompressResult {
  data: Uint8Array;
  meta: PdfCompressionMeta;
  fileName: string;
  originalBytes: number;
  targetBytes: number;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const DEFAULT_ADVANCED = {
  imageQuality: "auto",
  dpi: "auto",
};

export default function CompressPdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [targetValue, setTargetValue] = useState("200");
  const [unit, setUnit] = useState<SizeUnit>("KB");
  const [imageQuality, setImageQuality] = useState(DEFAULT_ADVANCED.imageQuality);
  const [dpi, setDpi] = useState(DEFAULT_ADVANCED.dpi);

  const job = useToolJob<CompressResult>();

  const targetBytes = parseTargetSize(targetValue, unit);
  const targetError =
    targetValue.trim() !== "" && targetBytes === null
      ? "Enter a target greater than zero."
      : null;

  const handleFiles = useCallback((files: File[]) => {
    for (const file of files) {
      const check = validateFile(file, "pdf");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't a valid PDF.");
        continue;
      }
      setItems([{ id: newFileId(), file }]);
    }
  }, []);

  const file = items[0]?.file ?? null;

  const handleCompress = useCallback(async () => {
    if (!file || targetBytes === null) return;
    const buffer = await file.arrayBuffer();

    const advanced: Record<string, unknown> = {};
    if (imageQuality !== "auto") advanced.imageQuality = parseInt(imageQuality);
    if (dpi !== "auto") advanced.dpi = parseInt(dpi);

    await job.start(async ({ onProgress, signal }) => {
      const { data, meta } = await runWorker<
        {
          data: Uint8Array;
          targetBytes: number;
          advanced?: Record<string, unknown>;
        },
        PdfCompressionMeta
      >(
        createPdfWorker,
        "pdf.compress",
        { data: new Uint8Array(buffer), targetBytes, advanced: Object.keys(advanced).length > 0 ? advanced : undefined },
        { onProgress, signal },
      );

      return {
        data,
        meta,
        fileName: buildOutputName(file.name, "compressed", "pdf"),
        originalBytes: file.size,
        targetBytes,
      };
    });
  }, [file, job, targetBytes, imageQuality, dpi]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, result.fileName);
  }, [job.result]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
  }, [job]);

  const handleResetAdvanced = useCallback(() => {
    setImageQuality(DEFAULT_ADVANCED.imageQuality);
    setDpi(DEFAULT_ADVANCED.dpi);
  }, []);

  if (job.status === "processing") {
    return (
      <ToolPage
        eyebrow="Compress"
        title="Compressing your PDF"
        description="This happens entirely on your device."
      >
        <ProcessingView
          title={`Compressing ${file?.name ?? "PDF"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="Compress" title="PDF compression">
        <CompressionResult
          result={{
            originalBytes: result.originalBytes,
            outputBytes: result.meta.outputBytes,
            targetBytes: result.targetBytes,
            targetReached: result.meta.targetReached,
            fileName: result.fileName,
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download PDF"
          nextActions={COMPRESS_PDF_NEXT_ACTIONS}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="Compress"
      title="Compress PDF"
      description="Reduce your PDF while keeping the best possible quality."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleCompress} />
        )}

        {items.length === 0 ? (
          <FileDropzone
            accept={PDF_ACCEPT}
            multiple={false}
            onFiles={handleFiles}
            title="Drop your PDF here"
            hint="Supports PDF files"
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
                title="Image quality"
                description="Controls how well embedded images are preserved."
              >
                <Select
                  value={imageQuality}
                  onValueChange={setImageQuality}
                  disabled={!file}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic</SelectItem>
                    <SelectItem value="90">Highest quality</SelectItem>
                    <SelectItem value="80">High quality</SelectItem>
                    <SelectItem value="70">Medium quality</SelectItem>
                    <SelectItem value="60">Lower quality, smaller file</SelectItem>
                  </SelectContent>
                </Select>
              </AdvancedSection>
              <AdvancedSection
                title="Image resolution"
                description="Lower resolution creates smaller files but may reduce image detail."
              >
                <Select value={dpi} onValueChange={setDpi} disabled={!file}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automatic</SelectItem>
                    <SelectItem value="200">High detail (200)</SelectItem>
                    <SelectItem value="150">Good detail (150)</SelectItem>
                    <SelectItem value="120">Standard (120)</SelectItem>
                    <SelectItem value="96">Lower detail (96)</SelectItem>
                    <SelectItem value="72">Minimal detail (72)</SelectItem>
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
                Compress PDF
              </Button>
              {file && targetBytes !== null && (
                <Badge variant="muted">
                  Target: {formatBytes(targetBytes)} or less
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Text and vector content are preserved. Only embedded images are
              recompressed. The PDF is never uploaded.
            </p>
          </div>
        </ToolCard>

        <HowToSection
          title="How to compress a PDF"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            { step: "Enter the size you need.", detail: "For example, 200 KB." },
            { step: "Click Compress PDF.", detail: "We'll find the best quality that fits your target." },
            { step: "Download your optimized PDF.", detail: "It's ready instantly." },
          ]}
          explanation="FileForge recompresses the images inside your PDF while keeping all text, links, and vector content exactly as they are. The PDF is never uploaded — everything happens in your browser."
          faqs={[
            { q: "Will text quality be affected?", a: "No. Text and vector content are preserved at full quality. Only embedded images are recompressed." },
            { q: "What if my target size is too small?", a: "FileForge will try its best. If the result is larger than your target, you'll see the best achievable size and can download that instead." },
            { q: "Is my PDF uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Compress image", to: "/compress/image", icon: Layers },
            { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Combine },
            { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
          ]}
        />
      </div>
    </ToolPage>
  );
}
