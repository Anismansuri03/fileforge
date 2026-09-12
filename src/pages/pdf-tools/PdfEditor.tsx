import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  Download,
  FileText,
  GripVertical,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  RotateCw,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  FileUp,
  ArrowLeftRight,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { Button } from "@/components/ui/button";
import { ProcessingView } from "@/components/processing/processing-view";
import { ErrorState } from "@/components/result/error-state";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, PDF_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { PdfPagePreview } from "@/components/pdf-page-preview";
import { loadPdfDocument } from "@/engines/pdf-renderer/pdfjs";
import { cn } from "@/lib/utils";

interface ReorderResult {
  data: Uint8Array;
}

interface PageState {
  id: string;
  sourceIndex: number;
  rotation: number;
  deleted: boolean;
  selected: boolean;
}

interface AddedPage {
  id: string;
  file: File;
  type: "pdf" | "image";
  mime: string;
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PdfEditor() {
  const [pages, setPages] = useState<PageState[]>([]);
  const [addedPages, setAddedPages] = useState<AddedPage[]>([]);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(140);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const dragNodeRef = useRef<HTMLDivElement>(null);

  const job = useToolJob<ReorderResult>();

  const handleFiles = useCallback((files: File[]) => {
    for (const f of files) {
      const check = validateFile(f, "pdf");
      if (!check.ok) {
        toast.error(check.error ?? "Invalid PDF.");
        continue;
      }
      setFileName(f.name);
      f.arrayBuffer().then((buf) => {
        const data = new Uint8Array(buf);
        setPdfData(data);
        loadPdfDocument(data).then((doc) => {
          const count = doc.numPages;
          setPages(
            Array.from({ length: count }, (_, i) => ({
              id: newId(),
              sourceIndex: i,
              rotation: 0,
              deleted: false,
              selected: false,
            })),
          );
          setAddedPages([]);
        });
      });
    }
  }, []);

  // Close add menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  const handleAddFiles = useCallback(
    async (files: File[]) => {
      const newAdded: AddedPage[] = [];
      for (const f of files) {
        const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
        const isImage = f.type.startsWith("image/") || /\.(jpe?g|png|webp|avif)$/i.test(f.name);
        if (!isPdf && !isImage) {
          toast.error(`${f.name} is not a supported file type.`);
          continue;
        }
        newAdded.push({
          id: newId(),
          file: f,
          type: isPdf ? "pdf" : "image",
          mime: f.type || (isPdf ? "application/pdf" : "image/png"),
        });
      }
      if (newAdded.length > 0) {
        setAddedPages((prev) => [...prev, ...newAdded]);
        toast.success(`Added ${newAdded.length} file${newAdded.length !== 1 ? "s" : ""}.`);
      }
      setShowAddMenu(false);
    },
    [],
  );

  const movePage = useCallback((fromIdx: number, toIdx: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const toggleDelete = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, deleted: !p.deleted } : p)),
    );
  }, []);

  const removeAdded = useCallback((id: string) => {
    setAddedPages((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    );
  }, []);

  const selectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: !p.deleted })));
  }, []);

  const deselectAll = useCallback(() => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: false })));
  }, []);

  const deleteSelected = useCallback(() => {
    setPages((prev) =>
      prev.map((p) => (p.selected && !p.deleted ? { ...p, deleted: true } : p)),
    );
    setSelectionMode(false);
    toast.info("Selected pages marked for deletion.");
  }, []);

  const rotatePage = useCallback((id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p,
      ),
    );
  }, []);

  const rotateSelected = useCallback(() => {
    setPages((prev) =>
      prev.map((p) =>
        p.selected && !p.deleted
          ? { ...p, rotation: (p.rotation + 90) % 360 }
          : p,
      ),
    );
  }, []);

  const restoreAll = useCallback(() => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        deleted: false,
        selected: false,
        rotation: 0,
      })),
    );
    toast.info("All pages restored.");
  }, []);

  const reversePages = useCallback(() => {
    setPages((prev) => [...prev].reverse());
    toast.info("Page order reversed.");
  }, []);

  // Drag handlers for original pages
  const handleDragStart = useCallback(
    (e: React.DragEvent, idx: number) => {
      if (pages[idx].deleted) return;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", `orig-${idx}`);
      requestAnimationFrame(() => {
        if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4";
      });
      setDragIdx(idx);
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

  const handleDragLeave = useCallback(() => setDragOverIdx(null), []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      if (data.startsWith("orig-")) {
        const from = parseInt(data.slice(5), 10);
        if (from !== toIdx) {
          setPages((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(toIdx, 0, moved);
            return next;
          });
        }
      } else if (data.startsWith("added-")) {
        const from = parseInt(data.slice(6), 10);
        setAddedPages((prev) => {
          const next = [...prev];
          const [moved] = next.splice(from, 1);
          next.splice(toIdx, 0, moved);
          return next;
        });
      }
      setDragIdx(null);
      setDragOverIdx(null);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setDragOverIdx(null);
  }, []);

  const extractSelected = useCallback(async () => {
    if (!pdfData) return;
    const indices = pages
      .filter((p) => p.selected && !p.deleted)
      .map((p) => p.sourceIndex);
    if (indices.length === 0) {
      toast.error("Select pages to extract.");
      return;
    }
    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { data: Uint8Array; indices: number[] },
        ReorderResult
      >(
        createPdfWorker,
        "pdf.extract-pages",
        { data: pdfData, indices },
        { onProgress, signal },
      );
      return { data };
    });
  }, [pdfData, pages, job]);

  const handleSave = useCallback(async () => {
    if (!pdfData) return;
    const activePages = pages.filter((p) => !p.deleted);
    if (activePages.length === 0 && addedPages.length === 0) {
      toast.error("Keep at least one page.");
      return;
    }

    await job.start(async ({ onProgress, signal }) => {
      // Step 1: Apply reorder + rotate + delete on original pages
      let resultData: Uint8Array;
      if (activePages.length > 0) {
        const order = activePages.map((p) => p.sourceIndex);
        const rotations = activePages.map((p) => p.rotation);
        const { data } = await runWorker<
          { data: Uint8Array; order: number[]; rotations?: number[] },
          ReorderResult
        >(
          createPdfWorker,
          "pdf.reorder",
          {
            data: pdfData,
            order,
            rotations: rotations.some((r) => r !== 0) ? rotations : undefined,
          },
          { onProgress, signal },
        );
        resultData = data;
      } else {
        resultData = pdfData;
      }

      // Step 2: Merge added pages if any
      if (addedPages.length > 0) {
        const addedBuffers: Uint8Array[] = [];
        for (const ap of addedPages) {
          const buf = await ap.file.arrayBuffer();
          addedBuffers.push(new Uint8Array(buf));
        }
        const allFiles = [resultData, ...addedBuffers];
        const { data } = await runWorker<
          { files: Uint8Array[] },
          ReorderResult
        >(
          createPdfWorker,
          "pdf.merge",
          { files: allFiles },
          { onProgress, signal },
        );
        resultData = data;
      }

      return { data: resultData };
    });
  }, [pdfData, pages, addedPages, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    const name = fileName
      ? buildOutputName(fileName, "edited", "pdf")
      : "edited.pdf";
    downloadBlob(blob, name);
  }, [job.result, fileName]);

  const handleReset = useCallback(() => {
    job.reset();
    setPages([]);
    setAddedPages([]);
    setPdfData(null);
    setFileName("");
    setSelectionMode(false);
  }, [job]);

  // Processing state
  if (job.status === "processing") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <ProcessingView
          title={`Editing ${fileName || "PDF"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </div>
    );
  }

  // Done state
  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <div className="container max-w-3xl py-14">
        <div className="rounded-2xl border bg-card p-8 shadow-sm animate-fade-in text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(145,55%,36%)]/10 text-[hsl(145,55%,36%)] mb-4">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Edit complete</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
            Your edited PDF is ready. {pages.filter((p) => p.deleted).length > 0
              ? `${pages.filter((p) => p.deleted).length} page${pages.filter((p) => p.deleted).length !== 1 ? "s" : ""} removed. `
              : ""}
            {addedPages.length > 0
              ? `${addedPages.length} page${addedPages.length !== 1 ? "s" : ""} added. `
              : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Original: {(pdfData?.length ?? 0) > 0 ? `${((pdfData?.length ?? 0) / 1024).toFixed(0)} KB` : "—"} → Result: {(result.data.length / 1024).toFixed(0)} KB
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button size="lg" onClick={handleDownload} className="h-12 px-8 rounded-xl font-semibold">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button size="lg" variant="outline" onClick={handleReset} className="h-12 px-6 rounded-xl">
              <RotateCcw className="h-4 w-4 mr-2" />
              Edit another PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main editor
  const activePages = pages.filter((p) => !p.deleted);
  const deletedCount = pages.length - activePages.length;
  const selectedCount = pages.filter((p) => p.selected && !p.deleted).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-16 z-30 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {pdfData ? (
              <>
                <div className="hidden sm:flex items-center gap-1.5 mr-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate max-w-[180px]">
                    {fileName}
                  </span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activePages.length} page{(activePages.length !== 1 || deletedCount > 0) ? "s" : ""}
                  {deletedCount > 0 && (
                    <span className="text-destructive ml-1">
                      ({deletedCount} deleted)
                    </span>
                  )}
                  {addedPages.length > 0 && (
                    <span className="text-[hsl(217,65%,50%)] ml-1">
                      (+{addedPages.length} added)
                    </span>
                  )}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">PDF Editor</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {pdfData && (
              <>
                {/* Add pages */}
                <div className="relative" ref={addMenuRef}>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs font-medium"
                    onClick={() => setShowAddMenu(!showAddMenu)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    <span className="hidden sm:inline">Add pages</span>
                  </Button>
                  {showAddMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border bg-card p-1.5 shadow-lg animate-fade-in">
                      <button
                        type="button"
                        onClick={() => addInputRef.current?.click()}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                      >
                        <FileUp className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Upload files</p>
                          <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                        </div>
                      </button>
                    </div>
                  )}
                  <input
                    ref={addInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.avif"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      if (files.length > 0) handleAddFiles(files);
                      e.target.value = "";
                    }}
                  />
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Selection toggle */}
                <Button
                  size="sm"
                  variant={selectionMode ? "default" : "outline"}
                  className="h-8 rounded-lg text-xs font-medium"
                  onClick={() => {
                    setSelectionMode(!selectionMode);
                    if (selectionMode) deselectAll();
                  }}
                >
                  {selectionMode ? "Cancel" : "Select"}
                </Button>

                {/* Batch actions (visible when selection active) */}
                {selectionMode && selectedCount > 0 && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={rotateSelected}
                    >
                      <RotateCw className="h-3 w-3 mr-1" />
                      Rotate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={extractSelected}
                    >
                      <Scissors className="h-3 w-3 mr-1" />
                      Extract
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 rounded-lg text-xs"
                      onClick={deleteSelected}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </>
                )}

                {!selectionMode && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg text-xs"
                      onClick={reversePages}
                      title="Reverse page order"
                    >
                      <ArrowLeftRight className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Reverse</span>
                    </Button>
                    {deletedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg text-xs"
                        onClick={restoreAll}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        <span className="hidden sm:inline">Restore</span>
                      </Button>
                    )}
                  </>
                )}

                <div className="h-4 w-px bg-border" />

                {/* Zoom */}
                <div className="hidden md:flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setZoom((z) => Math.max(100, z - 20))}
                    disabled={zoom <= 100}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] text-muted-foreground font-medium w-8 text-center">{zoom}%</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => setZoom((z) => Math.min(200, z + 20))}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Save */}
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs font-semibold"
                  onClick={handleSave}
                  disabled={activePages.length === 0 && addedPages.length === 0}
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container py-6">
        {!pdfData ? (
          /* Dropzone */
          <div className="max-w-lg mx-auto mt-12">
            <FileDropzone
              accept={PDF_ACCEPT}
              multiple={false}
              onFiles={handleFiles}
              title="Drop your PDF here"
              hint="or click to browse files"
            />
            <div className="mt-8 text-center">
              <h2 className="text-2xl font-bold tracking-tight">PDF Editor</h2>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
                Reorder, delete, rotate, extract, and add pages — all in one place. 
                Everything runs locally in your browser.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                {[
                  { icon: GripVertical, label: "Drag to reorder" },
                  { icon: RotateCw, label: "Rotate pages" },
                  { icon: Trash2, label: "Delete pages" },
                  { icon: Scissors, label: "Extract pages" },
                  { icon: Plus, label: "Add pages" },
                ].map((item) => (
                  <span key={item.label} className="inline-flex items-center gap-1.5">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Page grid */
          <div className="space-y-4">
            {job.status === "error" && job.error && (
              <ErrorState message={job.error.message} onRetry={handleSave} />
            )}

            {selectionMode && (
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
                <span className="text-sm font-medium">
                  {selectedCount} of {activePages.length} pages selected
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={selectAll}>
                    Select all
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={deselectAll}>
                    Deselect
                  </Button>
                </div>
              </div>
            )}

            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(${zoom}px, 1fr))`,
              }}
            >
              {/* Original pages */}
              {pages.map((page, idx) => (
                <div
                  key={page.id}
                  ref={dragIdx === idx ? dragNodeRef : undefined}
                  draggable={!page.deleted}
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "group relative flex flex-col rounded-xl border bg-card shadow-sm transition-all duration-150",
                    page.deleted
                      ? "opacity-35 border-dashed"
                      : page.selected
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : dragOverIdx === idx
                          ? "border-primary border-2 bg-primary/5 scale-[1.02]"
                          : dragIdx === idx
                            ? "opacity-40 border-dashed"
                            : "hover:border-foreground/20 hover:shadow-md",
                    !page.deleted && "cursor-grab active:cursor-grabbing",
                  )}
                  onClick={() =>
                    selectionMode && !page.deleted ? toggleSelect(page.id) : undefined
                  }
                >
                  {/* Selection checkbox */}
                  {selectionMode && !page.deleted && (
                    <div className="absolute top-2 left-2 z-20">
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
                          page.selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 bg-background/80 backdrop-blur",
                        )}
                      >
                        {page.selected && <Check className="h-3 w-3" />}
                      </div>
                    </div>
                  )}

                  {/* Page number badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-background/90 px-1.5 text-[11px] font-bold shadow-sm ring-1 ring-border/50 backdrop-blur">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Rotation badge */}
                  {page.rotation !== 0 && (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="flex h-5 items-center justify-center rounded-md bg-primary/90 px-1.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                        {page.rotation}°
                      </span>
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div className="relative overflow-hidden rounded-t-[10px]">
                    <PdfPagePreview
                      data={pdfData}
                      pageIndex={page.sourceIndex}
                      width={zoom}
                      className={cn(
                        "w-full transition-all",
                        page.deleted && "grayscale",
                      )}
                    />
                    {/* Drag handle overlay */}
                    {!selectionMode && !page.deleted && (
                      <div className="absolute inset-x-0 bottom-0 flex justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1 rounded-lg bg-background/90 px-2 py-1 shadow-lg backdrop-blur ring-1 ring-border/50">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-medium text-muted-foreground">Drag</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Page footer with actions */}
                  <div className="flex items-center justify-between px-2.5 py-2">
                    <span className="text-[11px] text-muted-foreground font-medium">
                      Page {idx + 1}
                      {page.deleted && (
                        <span className="text-destructive ml-1">(deleted)</span>
                      )}
                    </span>
                    {!selectionMode && !page.deleted && (
                      <div className="flex items-center gap-0.5">
                        {idx > 0 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(idx, idx - 1);
                            }}
                            title="Move left"
                          >
                            <span className="text-xs">◀</span>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            rotatePage(page.id);
                          }}
                          title="Rotate 90°"
                        >
                          <RotateCw className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn("h-6 w-6", page.deleted && "text-destructive")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDelete(page.id);
                          }}
                          title={page.deleted ? "Restore" : "Delete"}
                        >
                          {page.deleted ? <RotateCcw className="h-3 w-3" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                        {idx < pages.length - 1 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(idx, idx + 1);
                            }}
                            title="Move right"
                          >
                            <span className="text-xs">▶</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Added pages */}
              {addedPages.map((ap, idx) => {
                const globalIdx = pages.length + idx;
                return (
                  <div
                    key={ap.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", `added-${idx}`);
                      setDragIdx(pages.length + idx);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      setDragOverIdx(pages.length + idx);
                    }}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, pages.length + idx)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group relative flex flex-col rounded-xl border-2 border-dashed border-[hsl(217,65%,50%)]/30 bg-card shadow-sm transition-all duration-150 cursor-grab active:cursor-grabbing",
                      dragOverIdx === pages.length + idx
                        ? "border-[hsl(217,65%,50%)] border-solid bg-[hsl(217,65%,50%)]/5 scale-[1.02]"
                        : "hover:border-[hsl(217,65%,50%)]/50 hover:shadow-md",
                    )}
                  >
                    {/* Added badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="flex h-5 items-center justify-center rounded-md bg-[hsl(217,65%,50%)]/90 px-1.5 text-[10px] font-bold text-white shadow-sm">
                        NEW
                      </span>
                    </div>

                    {/* Page number */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-background/90 px-1.5 text-[11px] font-bold shadow-sm ring-1 ring-border/50 backdrop-blur">
                        {globalIdx + 1}
                      </span>
                    </div>

                    {/* Thumbnail */}
                    <div className="relative overflow-hidden rounded-t-[10px]">
                      {ap.type === "image" ? (
                        <div className="flex items-center justify-center bg-muted" style={{ width: zoom, height: zoom * 1.414 }}>
                          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                          <span className="absolute bottom-2 text-[10px] text-muted-foreground font-medium">
                            {ap.file.name}
                          </span>
                        </div>
                      ) : (
                        <PdfPagePreview
                          data={new Uint8Array()}
                          pageIndex={0}
                          width={zoom}
                          className="w-full"
                        />
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-2.5 py-2">
                      <span className="text-[11px] text-muted-foreground font-medium truncate max-w-[120px]">
                        {ap.file.name}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAdded(ap.id);
                        }}
                        title="Remove"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {/* Add placeholder */}
              {pdfData && (
                <button
                  type="button"
                  onClick={() => addInputRef.current?.click()}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/30 transition-all hover:border-primary/40 hover:bg-primary/5 min-h-[200px]",
                    "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="text-sm font-medium">Add pages</span>
                  <span className="text-xs text-muted-foreground/70 mt-1">PDF or images</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
