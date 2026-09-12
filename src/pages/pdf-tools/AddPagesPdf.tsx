import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
} from "lucide-react";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Layers, Scissors } from "lucide-react";

interface AddPagesResult {
  data: Uint8Array;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const ALL_ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp";

interface InsertItem {
  id: string;
  file: File;
  type: "pdf" | "image";
}

export default function AddPagesPdf() {
  const [baseItems, setBaseItems] = useState<FileItem[]>([]);
  const [insertItems, setInsertItems] = useState<InsertItem[]>([]);
  const [position, setPosition] = useState<string>("end");
  const [basePageCount, setBasePageCount] = useState(0);
  const [baseData, setBaseData] = useState<Uint8Array | null>(null);

  const job = useToolJob<AddPagesResult>();
  const baseFile = baseItems[0]?.file ?? null;

  useEffect(() => {
    if (!baseFile) {
      setBasePageCount(0);
      setBaseData(null);
      return;
    }
    baseFile.arrayBuffer().then((buf) => {
      const data = new Uint8Array(buf);
      setBaseData(data);
      loadPdfDocument(data).then((doc) => {
        setBasePageCount(doc.numPages);
      });
    });
  }, [baseFile]);

  const handleBaseFiles = useCallback((files: File[]) => {
    for (const f of files) {
      const check = validateFile(f, "pdf");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't a valid PDF.");
        continue;
      }
      setBaseItems([{ id: newFileId(), file: f }]);
    }
  }, []);

  const handleInsertFiles = useCallback((files: File[]) => {
    const newItems: InsertItem[] = [];
    for (const f of files) {
      const name = f.name.toLowerCase();
      const isPdf =
        f.type === "application/pdf" || name.endsWith(".pdf");
      const isImage =
        f.type.startsWith("image/") ||
        /\.(jpe?g|png|webp|avif)$/i.test(name);
      if (!isPdf && !isImage) {
        toast.error(`${f.name} is not a supported file type.`);
        continue;
      }
      newItems.push({
        id: newFileId(),
        file: f,
        type: isPdf ? "pdf" : "image",
      });
    }
    setInsertItems((prev) => [...prev, ...newItems]);
  }, []);

  const removeInsert = useCallback((id: string) => {
    setInsertItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleAdd = useCallback(async () => {
    if (!baseFile || insertItems.length === 0) return;
    const baseBuffer = await baseFile.arrayBuffer();
    const inserts = await Promise.all(
      insertItems.map(async (item) => {
        const buf = await item.file.arrayBuffer();
        return {
          data: new Uint8Array(buf),
          type: item.type as "pdf" | "image",
          mime: item.file.type || undefined,
        };
      }),
    );

    const pos =
      position === "end"
        ? basePageCount
        : position === "start"
          ? 0
          : parseInt(position, 10);

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        {
          base: Uint8Array;
          inserts: Array<{ data: Uint8Array; type: string; mime?: string }>;
          position: number;
        },
        AddPagesResult
      >(
        createPdfWorker,
        "pdf.add-pages",
        {
          base: new Uint8Array(baseBuffer),
          inserts,
          position: pos,
        },
        { onProgress, signal },
      );

      return { data };
    });
  }, [baseFile, insertItems, position, basePageCount, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result || !baseFile) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(baseFile.name, "updated", "pdf"));
  }, [job.result, baseFile]);

  const handleReset = useCallback(() => {
    job.reset();
    setBaseItems([]);
    setInsertItems([]);
    setBasePageCount(0);
    setBaseData(null);
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Adding pages to your PDF">
        <ProcessingView
          title={`Updating ${baseFile?.name ?? "PDF"}`}
          state={job.progress}
          onCancel={job.cancel}
        />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="PDF Tools" title="Pages added">
        <CompressionResult
          result={{
            originalBytes: baseFile?.size ?? 0,
            outputBytes: result.data.length,
            targetBytes: null,
            targetReached: true,
            fileName: buildOutputName(
              baseFile?.name ?? "document.pdf",
              "updated",
              "pdf",
            ),
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download updated PDF"
          explanation={`${insertItems.length} page${insertItems.length !== 1 ? "s" : ""} added to your PDF. Your original file has not been changed.`}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Add Pages to PDF"
      description="Insert images or other PDF pages into your existing PDF."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleAdd} />
        )}

        {baseItems.length === 0 ? (
          <FileDropzone
            accept={PDF_ACCEPT}
            multiple={false}
            onFiles={handleBaseFiles}
            title="Drop your PDF here"
            hint="This is the PDF you want to add pages to"
          />
        ) : (
          <FileList items={baseItems} onRemove={() => setBaseItems([])} />
        )}

        {baseFile && (
          <ToolCard>
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium mb-2">
                  Pages to add
                </p>
                <FileDropzone
                  accept={ALL_ACCEPT}
                  multiple={true}
                  onFiles={handleInsertFiles}
                  title="Drop images or PDFs here"
                  hint="JPG, PNG, WebP, or PDF — you can add multiple files"
                />
              </div>

              {insertItems.length > 0 && (
                <div className="space-y-2">
                  {insertItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border bg-card p-3"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                        {item.type === "pdf" ? (
                          <FileText className="h-4 w-4 text-pdf" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-image" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {item.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === "pdf" ? "PDF" : "Image"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground"
                        onClick={() => removeInsert(item.id)}
                        aria-label={`Remove ${item.file.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {basePageCount > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Insert position</label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="start">Beginning of PDF</SelectItem>
                      <SelectItem value="end">End of PDF (default)</SelectItem>
                      {Array.from({ length: basePageCount }, (_, i) => (
                        <SelectItem key={i} value={String(i + 1)}>
                          After page {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {baseData && basePageCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current pages
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: basePageCount }, (_, i) => (
                      <div key={i} className="relative shrink-0">
                        <PdfPagePreview
                          data={baseData}
                          pageIndex={i}
                          width={80}
                        />
                        <p className="mt-1 text-center text-[10px] text-muted-foreground">
                          {i + 1}
                        </p>
                        {position === String(i + 1) && (
                          <div className="absolute inset-0 rounded-md border-2 border-dashed border-primary bg-primary/5" />
                        )}
                      </div>
                    ))}
                    {insertItems.length > 0 && (
                      <div className="flex shrink-0 flex-col items-center justify-center rounded-md border-2 border-dashed border-primary bg-primary/5 px-3">
                        <Plus className="h-4 w-4 text-primary" />
                        <p className="mt-1 text-[10px] text-primary font-medium">
                          +{insertItems.length}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                size="lg"
                onClick={handleAdd}
                disabled={!baseFile || insertItems.length === 0}
              >
                Add {insertItems.length > 0 ? insertItems.length : ""} page
                {insertItems.length !== 1 ? "s" : ""} to PDF
              </Button>
            </div>
          </ToolCard>
        )}

        <HowToSection
          title="How to add pages to a PDF"
          steps={[
            { step: "Choose your base PDF.", detail: "This is the document you want to add pages to." },
            { step: "Add images or PDFs.", detail: "Drag them here or click to browse. You can add multiple files." },
            { step: "Pick the insert position.", detail: "Add pages at the beginning, end, or after any specific page." },
            { step: "Click Add pages.", detail: "Your updated PDF is created instantly." },
            { step: "Download your updated PDF.", detail: "It now contains your added pages." },
          ]}
          explanation="FileForge lets you insert images and pages from other PDFs into your existing document. You choose exactly where each set of pages goes. The original file is never changed."
          faqs={[
            { q: "What file types can I add?", a: "You can add JPG, PNG, WebP images and PDF files. Images become full pages in the PDF." },
            { q: "Can I add pages in the middle?", a: "Yes. Choose 'After page N' to insert after any specific page number." },
            { q: "Is my PDF uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Layers },
            { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
            { label: "PDF Editor", to: "/pdf-tools/editor", icon: FileText },
          ]}
        />
      </div>
    </ToolPage>
  );
}
