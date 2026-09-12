import { useCallback, useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { ToolPage, ToolCard } from "@/components/layout/tool-page";
import { Button } from "@/components/ui/button";
import { ProcessingView } from "@/components/processing/processing-view";
import { ErrorState } from "@/components/result/error-state";
import { FileList, type FileItem } from "@/components/file-list/file-list";
import { useToolJob } from "@/features/use-tool-job";
import { buildOutputName } from "@/lib/file-names";
import { downloadBlob } from "@/lib/download";
import { validateFile, IMAGE_ACCEPT } from "@/lib/validation";
import { runWorker, createPdfWorker } from "@/workers/client";
import { HowToSection } from "@/components/how-to-section";
import { RelatedTools } from "@/components/related-tools";
import { Layers, Combine } from "lucide-react";

interface ImagesToPdfResult {
  data: Uint8Array;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

const MIME_MAP: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

function getMime(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? file.type;
}

export default function ImagesToPdf() {
  const [items, setItems] = useState<FileItem[]>([]);

  const job = useToolJob<ImagesToPdfResult>();

  const handleFiles = useCallback((files: File[]) => {
    const valid: FileItem[] = [];
    for (const f of files) {
      const check = validateFile(f, "image");
      if (!check.ok) {
        toast.error(check.error ?? "This file isn't supported.");
        continue;
      }
      valid.push({ id: newFileId(), file: f });
    }
    if (valid.length > 0) setItems((prev) => [...prev, ...valid]);
  }, []);

  const handleConvert = useCallback(async () => {
    if (items.length === 0) return;

    const images = await Promise.all(
      items.map(async (item) => {
        const buffer = await item.file.arrayBuffer();
        return {
          data: new Uint8Array(buffer),
          mime: getMime(item.file),
        };
      }),
    );

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { images: Array<{ data: Uint8Array; mime: string }> },
        ImagesToPdfResult
      >(createPdfWorker, "pdf.images-to-pdf", { images }, { onProgress, signal });

      return { data };
    });
  }, [items, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(items[0]?.file.name ?? "images.pdf", "converted", "pdf"));
  }, [job.result, items]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Building your PDF">
        <ProcessingView title="Creating PDF from images" state={job.progress} onCancel={job.cancel} />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    return (
      <ToolPage eyebrow="PDF Tools" title="PDF created">
        <div className="rounded-xl border bg-card p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-semibold tracking-tight">PDF created</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} image{items.length !== 1 ? "s" : ""} converted to a single PDF
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={handleDownload}>Download PDF</Button>
            <Button size="lg" variant="ghost" onClick={handleReset}>Convert more</Button>
          </div>
        </div>
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Images to PDF"
      description="Turn one or more images into a single PDF document."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleConvert} />
        )}

        <FileDropzone
          accept={IMAGE_ACCEPT}
          multiple={true}
          onFiles={handleFiles}
          title="Drop your images here"
          hint="Supports JPG, PNG, WebP and AVIF"
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
                <Button size="lg" onClick={handleConvert} disabled={items.length === 0}>
                  Create PDF
                </Button>
                <Button size="lg" variant="outline" onClick={() => setItems([])}>
                  Clear all
                </Button>
              </div>
            </div>
          </ToolCard>
        )}

        <HowToSection
          title="How to turn images into a PDF"
          steps={[
            { step: "Choose your images.", detail: "Drag them here or click to browse. JPG, PNG, and WebP are supported." },
            { step: "Arrange the order.", detail: "Images will appear in the PDF in the order shown." },
            { step: "Click Create PDF.", detail: "Your images are combined into a PDF instantly." },
            { step: "Download your PDF.", detail: "It contains all your images as pages." },
          ]}
          explanation="FileForge combines your images into a single PDF document. Each image becomes one page, scaled to fit the page size."
          faqs={[
            { q: "What image formats are supported?", a: "JPG, PNG, and WebP images are supported." },
            { q: "Can I control the page size?", a: "Currently the page size is determined automatically based on the image dimensions." },
            { q: "Are my images uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your files never leave your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Compress image", to: "/compress/image", icon: Layers },
            { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Combine },
          ]}
        />
      </div>
    </ToolPage>
  );
}
