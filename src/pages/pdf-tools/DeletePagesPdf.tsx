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
import { FileText, ArrowUpDown } from "lucide-react";

interface DeleteResult {
  data: Uint8Array;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function DeletePagesPdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [pagesToDelete, setPagesToDelete] = useState("");

  const job = useToolJob<DeleteResult>();
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

  const handleDelete = useCallback(async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const indices = pagesToDelete
      .split(",")
      .map((s) => parseInt(s.trim(), 10) - 1)
      .filter((n) => !Number.isNaN(n) && n >= 0);

    if (indices.length === 0) {
      toast.error("Please enter at least one page number to delete.");
      return;
    }

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { data: Uint8Array; indices: number[] },
        DeleteResult
      >(createPdfWorker, "pdf.delete-pages", {
        data: new Uint8Array(buffer),
        indices,
      }, { onProgress, signal });

      return { data };
    });
  }, [file, pagesToDelete, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(file?.name ?? "document.pdf", "trimmed", "pdf"));
  }, [job.result, file]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
    setPagesToDelete("");
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Removing pages">
        <ProcessingView title="Removing pages" state={job.progress} onCancel={job.cancel} />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    return (
      <ToolPage eyebrow="PDF Tools" title="Pages removed">
        <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold tracking-tight">Pages removed</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Removed {pagesToDelete.split(",").filter(Boolean).length} page(s)
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleDownload}>Download trimmed PDF</Button>
            <Button size="lg" variant="ghost" onClick={handleReset}>Start over</Button>
          </div>
        </div>
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Delete Pages"
      description="Remove pages you don't need."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleDelete} />
        )}

        {items.length === 0 ? (
          <FileDropzone accept={PDF_ACCEPT} multiple={false} onFiles={handleFiles} title="Drop your PDF here" />
        ) : (
          <FileList items={items} onRemove={() => setItems([])} />
        )}

        <ToolCard>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="delete-pages">Pages to delete</Label>
              <Input
                id="delete-pages"
                value={pagesToDelete}
                onChange={(e) => setPagesToDelete(e.target.value)}
                placeholder="1,3,5-7"
              />
              <p className="text-xs text-muted-foreground">
                Enter 1-based page numbers separated by commas (e.g. 1,3,5-7).
              </p>
            </div>
            <Button size="lg" onClick={handleDelete} disabled={!file}>
              Delete pages
            </Button>
          </div>
        </ToolCard>

        <HowToSection
          title="How to delete pages from a PDF"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            { step: "Enter the pages to remove.", detail: "Use commas and dashes: 1,3,5-7." },
            { step: "Click Delete pages.", detail: "The selected pages are removed instantly." },
            { step: "Download your trimmed PDF.", detail: "It's ready to use." },
          ]}
          explanation="FileForge removes the selected pages from your PDF. The remaining pages stay exactly as they were."
          faqs={[
            { q: "How do page numbers work?", a: "Pages are numbered starting from 1. Enter the numbers of the pages you want to delete." },
            { q: "Can I preview before deleting?", a: "Currently there's no preview. Check your PDF's page count before deleting." },
            { q: "Is my PDF uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Extract pages", to: "/pdf-tools/extract-pages", icon: FileText },
            { label: "Reorder pages", to: "/pdf-tools/reorder", icon: ArrowUpDown },
          ]}
        />
      </div>
    </ToolPage>
  );
}
