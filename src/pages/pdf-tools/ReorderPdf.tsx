import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  RotateCw,
  Trash2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { ProcessingView } from "@/components/processing/processing-view";
import { CompressionResult } from "@/components/result/compression-result";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { PdfPagePreview } from "@/components/pdf-page-preview";
import { loadPdfDocument } from "@/engines/pdf-renderer/pdfjs";
import { Scissors } from "lucide-react";

interface ReorderResult {
  data: Uint8Array;
  targetReached: boolean;
  originalBytes: number;
  outputBytes: number;
}

interface PageState {
  index: number;
  rotation: number;
  deleted: boolean;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ReorderPdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [pages, setPages] = useState<PageState[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement>(null);

  const job = useToolJob<ReorderResult>();
  const file = items[0]?.file ?? null;

  useEffect(() => {
    if (!file) {
      setPages([]);
      setPageCount(0);
      setPdfData(null);
      return;
    }
    file.arrayBuffer().then((buf) => {
      const data = new Uint8Array(buf);
      setPdfData(data);
      loadPdfDocument(data).then((doc) => {
        const count = doc.numPages;
        setPageCount(count);
        setPages(
          Array.from({ length: count }, (_, i) => ({
            index: i,
            rotation: 0,
            deleted: false,
          })),
        );
      });
    });
  }, [file]);

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

  const movePage = useCallback((fromIdx: number, toIdx: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const toggleDelete = useCallback((idx: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, deleted: !p.deleted } : p)),
    );
  }, []);

  const rotatePage = useCallback((idx: number) => {
    setPages((prev) =>
      prev.map((p, i) =>
        i === idx ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );
  }, []);

  const handleDragStart = useCallback(
    (e: React.DragEvent, idx: number) => {
      if (pages[idx].deleted) return;
      setDragIdx(idx);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(idx));
      requestAnimationFrame(() => {
        if (dragNodeRef.current) {
          dragNodeRef.current.style.opacity = "0.5";
        }
      });
    },
    [pages],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragIdx === null || idx === dragIdx) return;
      setDragOverIdx(idx);
    },
    [dragIdx],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIdx(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === toIdx) {
        setDragIdx(null);
        setDragOverIdx(null);
        return;
      }
      setPages((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
      setDragIdx(null);
      setDragOverIdx(null);
    },
    [dragIdx],
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  const handleReorder = useCallback(async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const activePages = pages.filter((p) => !p.deleted);
    if (activePages.length === 0) {
      toast.error("All pages are deleted. Keep at least one page.");
      return;
    }
    const orderArray = activePages.map((p) => p.index);
    const rotations = activePages.map((p) => p.rotation);

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { data: Uint8Array; order: number[]; rotations?: number[] },
        ReorderResult
      >(
        createPdfWorker,
        "pdf.reorder",
        {
          data: new Uint8Array(buffer),
          order: orderArray,
          rotations: rotations.some((r) => r !== 0) ? rotations : undefined,
        },
        { onProgress, signal },
      );

      const outputBytes = data.length;
      return {
        data,
        targetReached: true,
        originalBytes: file.size,
        outputBytes,
      };
    });
  }, [file, pages, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result || !file) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(file.name, "reordered", "pdf"));
  }, [job.result, file]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
    setPages([]);
    setPageCount(0);
    setPdfData(null);
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Reordering your PDF">
        <ProcessingView
          title={`Reordering ${file?.name ?? "PDF"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="PDF Tools" title="Reorder complete">
        <CompressionResult
          result={{
            originalBytes: result.originalBytes,
            outputBytes: result.outputBytes,
            targetBytes: null,
            targetReached: true,
            fileName: buildOutputName(
              file?.name ?? "document.pdf",
              "reordered",
              "pdf",
            ),
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download reordered PDF"
          explanation="Your pages have been rearranged and any deleted pages have been removed. Your original file has not been changed."
        />
      </ToolPage>
    );
  }

  const activePages = pages.filter((p) => !p.deleted);
  const deletedCount = pages.length - activePages.length;

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Reorder Pages"
      description="Drag to rearrange. Click to delete or rotate. See every page before you save."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleReorder} />
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

        {pdfData && pageCount > 0 && (
          <ToolCard>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {activePages.length} page{activePages.length !== 1 ? "s" : ""}
                  </p>
                  {deletedCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {deletedCount} page{deletedCount !== 1 ? "s" : ""} marked
                      for deletion
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setPages((prev) => [...prev].reverse())
                    }
                  >
                    Reverse order
                  </Button>
                  {deletedCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setPages((prev) =>
                          prev.map((p, i) => ({ ...p, index: i, deleted: false })),
                        )
                      }
                    >
                      Restore deleted
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {pages.map((page, idx) => (
                  <div
                    key={`${page.index}-${idx}`}
                    ref={dragIdx === idx ? dragNodeRef : undefined}
                    draggable={!page.deleted}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`group relative flex flex-col items-center rounded-lg border bg-card p-2 transition-all ${
                      page.deleted
                        ? "opacity-40 border-dashed"
                        : dragOverIdx === idx
                          ? "border-primary border-2 bg-primary/5 scale-105"
                          : dragIdx === idx
                            ? "opacity-50 border-dashed"
                            : "hover:border-foreground/20 hover:shadow-md"
                    } ${!page.deleted ? "cursor-grab active:cursor-grabbing" : ""}`}
                  >
                    <div className="relative w-full">
                      <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-muted-foreground drop-shadow" />
                      </div>
                      <PdfPagePreview
                        data={pdfData}
                        pageIndex={page.index}
                        width={140}
                        className={`w-full ${page.deleted ? "grayscale" : ""}`}
                      />
                      {page.rotation !== 0 && (
                        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-background/90 text-[10px] font-bold shadow-sm ring-1 ring-border">
                          {page.rotation}°
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      Page {idx + 1}
                      {page.deleted && " (deleted)"}
                    </p>
                    <div className="mt-1 flex gap-1">
                      {idx > 0 && !page.deleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => movePage(idx, idx - 1)}
                          aria-label="Move left"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                      )}
                      {!page.deleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => rotatePage(idx)}
                          aria-label="Rotate page"
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className={`h-6 w-6 ${page.deleted ? "text-destructive" : ""}`}
                        onClick={() => toggleDelete(idx)}
                        aria-label={page.deleted ? "Restore page" : "Delete page"}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      {idx < pages.length - 1 && !page.deleted && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => movePage(idx, idx + 1)}
                          aria-label="Move right"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                size="lg"
                onClick={handleReorder}
                disabled={activePages.length === 0}
              >
                Save changes
              </Button>
            </div>
          </ToolCard>
        )}

        <HowToSection
          title="How to reorder PDF pages"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            {
              step: "Rearrange the pages.",
              detail: "Use the arrows to move pages, the trash icon to delete, and the rotate icon to turn pages.",
            },
            {
              step: "Click Save changes.",
              detail: "Your new PDF is created with the pages in your chosen order.",
            },
            {
              step: "Download your reordered PDF.",
              detail: "Pages are in your chosen order, deleted pages removed.",
            },
          ]}
          explanation="FileForge shows you every page of your PDF as a thumbnail. You can drag to reorder, delete pages you don't need, and rotate pages that are sideways. The original file is never changed."
          faqs={[
            {
              q: "Can I undo a deletion?",
              a: "Yes. Click the trash icon again on a deleted page to restore it, or use 'Restore deleted' to bring back all deleted pages.",
            },
            {
              q: "Can I rotate individual pages?",
              a: "Yes. Click the rotate icon on any page to rotate it 90° clockwise. The rotation angle is shown on the thumbnail.",
            },
            {
              q: "Is my PDF uploaded anywhere?",
              a: "No. Everything is processed locally in your browser. Your file never leaves your device.",
            },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Delete pages", to: "/pdf-tools/delete-pages", icon: Trash2 },
            { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
            { label: "PDF Editor", to: "/pdf-tools/editor", icon: GripVertical },
          ]}
        />
      </div>
    </ToolPage>
  );
}
