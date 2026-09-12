import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcessingView } from "@/components/processing/processing-view";
import { CompressionResult, PDF_NEXT_ACTIONS } from "@/components/result/compression-result";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, Combine, FileText } from "lucide-react";

interface SplitOutput {
  name: string;
  data: Uint8Array;
}

interface SplitResult {
  outputs: SplitOutput[];
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function SplitPdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [splitMode, setSplitMode] = useState<"ranges" | "every">("ranges");
  const [ranges, setRanges] = useState("1-3");
  const [everyN, setEveryN] = useState("1");

  const job = useToolJob<SplitResult>();
  const file = items[0]?.file ?? null;

  const handleFiles = useCallback((files: File[]) => {
    for (const f of files) {
      const check = validateFile(f, "pdf");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't a valid PDF.");
        continue;
      }
      setItems([{ id: newFileId(), file: f }]);
    }
  }, []);

  const handleSplit = useCallback(async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();

    const payload =
      splitMode === "every"
        ? { mode: "every" as const, every: Math.max(1, parseInt(everyN) || 1) }
        : { mode: "ranges" as const, ranges: parseRanges(ranges) };

    await job.start(async ({ onProgress, signal }) => {
      const { meta } = await runWorker<
        { data: Uint8Array; mode: "ranges" | "every"; ranges?: Array<{ start: number; end: number }>; every?: number },
        SplitResult
      >(createPdfWorker, "pdf.split", { data: new Uint8Array(buffer), ...payload }, { onProgress, signal });

      return { outputs: (meta as unknown as SplitResult).outputs ?? [] };
    });
  }, [file, splitMode, ranges, everyN, job]);

  const handleDownloadAll = useCallback(() => {
    const result = job.result;
    if (!result) return;
    for (const output of result.outputs) {
      const blob = new Blob([output.data.slice().buffer as ArrayBuffer], {
        type: "application/pdf",
      });
      downloadBlob(blob, output.name);
    }
  }, [job.result]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Splitting your PDF">
        <ProcessingView title="Splitting PDF" state={job.progress} onCancel={job.cancel} />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    const totalSize = result.outputs.reduce((sum, o) => sum + o.data.byteLength, 0);
    return (
      <ToolPage eyebrow="PDF Tools" title="Split complete">
        <CompressionResult
          result={{
            originalBytes: file?.size ?? 0,
            outputBytes: totalSize,
            targetBytes: null,
            targetReached: true,
            fileName: `${result.outputs.length} files created`,
            detail: result.outputs.map((o) => o.name).join(", "),
          }}
          onDownload={handleDownloadAll}
          onReset={handleReset}
          downloadLabel="Download all"
          nextActions={PDF_NEXT_ACTIONS}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Split PDF"
      description="Separate a PDF into smaller documents by page ranges or every N pages."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleSplit} />
        )}

        {items.length === 0 ? (
          <FileDropzone accept={PDF_ACCEPT} multiple={false} onFiles={handleFiles} title="Drop your PDF here" hint="Supports PDF files" />
        ) : (
          <FileList items={items} onRemove={() => setItems([])} />
        )}

        <ToolCard>
          <div className="space-y-5">
            <div className="flex gap-2">
              {(["ranges", "every"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSplitMode(mode)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    splitMode === mode
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  {mode === "ranges" ? "Page ranges" : "Every N pages"}
                </button>
              ))}
            </div>

            {splitMode === "ranges" ? (
              <div className="space-y-2">
                <Label htmlFor="ranges">Page ranges</Label>
                <Input
                  id="ranges"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="1-3,5,8-10"
                />
                <p className="text-xs text-muted-foreground">
                  Enter page ranges separated by commas. For example: 1-3,5,8-10
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="every-n">Split every N pages</Label>
                <Input
                  id="every-n"
                  type="number"
                  min={1}
                  value={everyN}
                  onChange={(e) => setEveryN(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Each group of pages will be saved as a separate PDF.
                </p>
              </div>
            )}

            <Button size="lg" onClick={handleSplit} disabled={!file}>
              Split PDF
            </Button>
          </div>
        </ToolCard>

        <HowToSection
          title="How to split a PDF"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            { step: "Pick how to split.", detail: "Extract specific pages, split every N pages, or enter custom ranges." },
            { step: "Click Split PDF.", detail: "Your PDF is split instantly." },
            { step: "Download your files.", detail: "Each part is saved as a separate PDF." },
          ]}
          explanation="FileForge splits your PDF into smaller documents without altering the content. Text, images, and links are preserved in each part."
          faqs={[
            { q: "How do I enter page ranges?", a: "Use commas and dashes: 1-3,5,8-10 means pages 1 through 3, page 5, and pages 8 through 10." },
            { q: "Can I split every 5 pages?", a: "Yes. Select 'Split every N pages' and enter 5. Each group becomes a separate PDF." },
            { q: "Are my PDFs uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Combine },
            { label: "Compress PDF", to: "/compress/pdf", icon: Layers },
            { label: "Extract pages", to: "/pdf-tools/extract-pages", icon: FileText },
          ]}
        />
      </div>
    </ToolPage>
  );
}

function parseRanges(input: string): Array<{ start: number; end: number }> {
  const ranges: Array<{ start: number; end: number }> = [];
  const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) continue;
    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : start;
    ranges.push({ start, end });
  }
  return ranges;
}
