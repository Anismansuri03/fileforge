import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { ProcessingView } from "@/components/processing/processing-view";
import { CompressionResult, PDF_NEXT_ACTIONS } from "@/components/result/compression-result";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, Scissors, FileText } from "lucide-react";

interface MergeResult {
  data: Uint8Array;
  fileName: string;
  originalBytes: number;
  outputBytes: number;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function MergePdf() {
  const [items, setItems] = useState<FileItem[]>([]);

  const job = useToolJob<MergeResult>();

  const handleFiles = useCallback((files: File[]) => {
    const valid: FileItem[] = [];
    for (const f of files) {
      const check = validateFile(f, "pdf");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't a valid PDF.");
        continue;
      }
      valid.push({ id: newFileId(), file: f });
    }
    if (valid.length > 0) {
      setItems((prev) => [...prev, ...valid]);
    }
  }, []);

  const handleMerge = useCallback(async () => {
    if (items.length < 2) {
      toast.error("Please select at least 2 PDF files.");
      return;
    }

    const buffers = await Promise.all(items.map((item) => item.file.arrayBuffer()));

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<{ files: Uint8Array[] }, object>(
        createPdfWorker,
        "pdf.merge",
        { files: buffers.map((b) => new Uint8Array(b)) },
        { onProgress, signal },
      );

      return {
        data,
        fileName: buildOutputName(items[0].file.name, "merged", "pdf"),
        originalBytes: items.reduce((sum, item) => sum + item.file.size, 0),
        outputBytes: data.byteLength,
      };
    });
  }, [items, job]);

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

  if (job.status === "processing") {
    return (
      <ToolPage
        eyebrow="PDF Tools"
        title="Merging your PDFs"
        description="This happens entirely on your device."
      >
        <ProcessingView
          title={`Merging ${items.length} PDFs`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="PDF Tools" title="Merge complete">
        <CompressionResult
          result={{
            originalBytes: result.originalBytes,
            outputBytes: result.outputBytes,
            targetBytes: null,
            targetReached: true,
            fileName: result.fileName,
            detail: `${items.length} files merged`,
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download merged PDF"
          nextActions={PDF_NEXT_ACTIONS}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Merge PDF"
      description="Combine multiple PDFs into a single document."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleMerge} />
        )}

        <FileDropzone
          accept={PDF_ACCEPT}
          multiple={true}
          onFiles={handleFiles}
          title="Drop your PDFs here"
          hint="Select 2 or more PDF files to merge"
        />

        {items.length > 0 && (
          <ToolCard>
            <div className="space-y-4">
              <FileList
                items={items}
                onRemove={(id) =>
                  setItems((prev) => prev.filter((item) => item.id !== id))
                }
              />
              <div className="flex items-center gap-3">
                <Button
                  size="lg"
                  onClick={handleMerge}
                  disabled={items.length < 2}
                >
                  Merge {items.length} PDFs
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setItems([])}
                >
                  Clear all
                </Button>
              </div>
              {items.length < 2 && (
                <p className="text-xs text-muted-foreground">
                  Add at least 2 PDF files to merge them together.
                </p>
              )}
            </div>
          </ToolCard>
        )}

        <HowToSection
          title="How to merge PDFs"
          steps={[
            { step: "Choose your PDF files.", detail: "Drag them here or click to browse. You need at least 2." },
            { step: "Arrange the order.", detail: "The files will be combined in the order shown." },
            { step: "Click Merge PDFs.", detail: "Your files are combined instantly." },
            { step: "Download your merged PDF.", detail: "It's one complete document now." },
          ]}
          explanation="FileForge combines multiple PDF files into a single document. All pages, text, and images are preserved."
          faqs={[
            { q: "What if my PDFs have different page sizes?", a: "The merged PDF will use the first file's page size. Content from other files is scaled to fit." },
            { q: "Is there a file limit?", a: "There's no strict limit, but very large files (100+ pages each) may use more memory. Process in smaller batches if needed." },
            { q: "Are my PDFs uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your files never leave your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
            { label: "Compress PDF", to: "/compress/pdf", icon: Layers },
            { label: "Images to PDF", to: "/pdf-tools/images-to-pdf", icon: FileText },
          ]}
        />
      </div>
    </ToolPage>
  );
}
