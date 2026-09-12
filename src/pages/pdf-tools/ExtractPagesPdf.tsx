import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProcessingView } from "@/components/processing/processing-view";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Trash2, Combine } from "lucide-react";

interface ExtractResult {
  data: Uint8Array;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ExtractPagesPdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [pages, setPages] = useState("1,2,3");

  const job = useToolJob<ExtractResult>();
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

  const handleExtract = useCallback(async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const indices = pages
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((n) => !Number.isNaN(n) && n >= 0);

    if (indices.length === 0) {
      toast.error("Please enter at least one page number to extract.");
      return;
    }

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { data: Uint8Array; indices: number[] },
        ExtractResult
      >(createPdfWorker, "pdf.extract-pages", {
        data: new Uint8Array(buffer),
        indices,
      }, { onProgress, signal });

      return { data };
    });
  }, [file, pages, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(file?.name ?? "document.pdf", "extracted", "pdf"));
  }, [job.result, file]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
    setPages("");
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Extracting pages">
        <ProcessingView title="Extracting pages" state={job.progress} onCancel={job.cancel} />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    return (
      <ToolPage eyebrow="PDF Tools" title="Pages extracted">
        <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold tracking-tight">Pages extracted</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Created a new PDF with {pages.split(",").filter(Boolean).length} page(s)
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleDownload}>Download extracted PDF</Button>
            <Button size="lg" variant="ghost" onClick={handleReset}>Start over</Button>
          </div>
        </div>
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Extract Pages"
      description="Create a new PDF from selected pages."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleExtract} />
        )}

        {items.length === 0 ? (
          <FileDropzone accept={PDF_ACCEPT} multiple={false} onFiles={handleFiles} title="Drop your PDF here" />
        ) : (
          <FileList items={items} onRemove={() => setItems([])} />
        )}

        <ToolCard>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="extract-pages">Pages to extract</Label>
              <Input
                id="extract-pages"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="1,2,3"
              />
              <p className="text-xs text-muted-foreground">
                Enter 1-based page numbers separated by commas (e.g. 1,2,3).
              </p>
            </div>
            <Button size="lg" onClick={handleExtract} disabled={!file}>
              Extract pages
            </Button>
          </div>
        </ToolCard>

        <HowToSection
          title="How to extract pages from a PDF"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            { step: "Enter the pages to extract.", detail: "Use commas and dashes: 1,2,3 or 1-5." },
            { step: "Click Extract pages.", detail: "Your selected pages become a new PDF." },
            { step: "Download your new PDF.", detail: "It contains only the pages you chose." },
          ]}
          explanation="FileForge pulls specific pages out of your PDF and creates a new document with just those pages. The original PDF is unchanged."
          faqs={[
            { q: "What if I enter a page that doesn't exist?", a: "Page numbers beyond the document's length are ignored. The extraction still works for valid pages." },
            { q: "Can I extract all pages?", a: "Yes, but that's the same as the original. Use Merge PDF if you want to combine pages from multiple PDFs." },
            { q: "Is my PDF uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Delete pages", to: "/pdf-tools/delete-pages", icon: Trash2 },
            { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Combine },
          ]}
        />
      </div>
    </ToolPage>
  );
}
