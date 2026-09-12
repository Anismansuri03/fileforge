import { useCallback, useState } from "react";
import { toast } from "sonner";
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
import { Layers, Trash2 } from "lucide-react";

interface RotateResult {
  data: Uint8Array;
}

function newFileId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function RotatePdf() {
  const [items, setItems] = useState<FileItem[]>([]);
  const [angle, setAngle] = useState<"90" | "180" | "270">("90");

  const job = useToolJob<RotateResult>();
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

  const handleRotate = useCallback(async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();

    await job.start(async ({ onProgress, signal }) => {
      const { data } = await runWorker<
        { data: Uint8Array; indices: "all"; angle: 90 | 180 | 270 },
        RotateResult
      >(createPdfWorker, "pdf.rotate", {
        data: new Uint8Array(buffer),
        indices: "all",
        angle: parseInt(angle) as 90 | 180 | 270,
      }, { onProgress, signal });

      return { data };
    });
  }, [file, angle, job]);

  const handleDownload = useCallback(() => {
    const result = job.result;
    if (!result) return;
    const blob = new Blob([result.data.slice().buffer as ArrayBuffer], {
      type: "application/pdf",
    });
    downloadBlob(blob, buildOutputName(file?.name ?? "document.pdf", "rotated", "pdf"));
  }, [job.result, file]);

  const handleReset = useCallback(() => {
    job.reset();
    setItems([]);
  }, [job]);

  if (job.status === "processing") {
    return (
      <ToolPage eyebrow="PDF Tools" title="Rotating your PDF">
        <ProcessingView title="Rotating PDF" state={job.progress} onCancel={job.cancel} />
      </ToolPage>
    );
  }

  if (job.status === "done" && job.result) {
    const result = job.result;
    return (
      <ToolPage eyebrow="PDF Tools" title="Rotation complete">
        <CompressionResult
          result={{
            originalBytes: file?.size ?? 0,
            outputBytes: result.data.byteLength,
            targetBytes: null,
            targetReached: true,
            fileName: buildOutputName(file?.name ?? "document.pdf", "rotated", "pdf"),
            detail: `All pages rotated ${angle}°`,
          }}
          onDownload={handleDownload}
          onReset={handleReset}
          downloadLabel="Download rotated PDF"
          nextActions={PDF_NEXT_ACTIONS}
        />
      </ToolPage>
    );
  }

  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Rotate PDF"
      description="Rotate all pages in your PDF by 90°, 180° or 270°."
    >
      <div className="space-y-5">
        {job.status === "error" && job.error && (
          <ErrorState message={job.error.message} onRetry={handleRotate} />
        )}

        {items.length === 0 ? (
          <FileDropzone accept={PDF_ACCEPT} multiple={false} onFiles={handleFiles} title="Drop your PDF here" hint="Supports PDF files" />
        ) : (
          <FileList items={items} onRemove={() => setItems([])} />
        )}

        <ToolCard>
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rotation angle</label>
              <Select value={angle} onValueChange={(v) => setAngle(v as "90" | "180" | "270")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90° clockwise</SelectItem>
                  <SelectItem value="180">180°</SelectItem>
                  <SelectItem value="270">270° clockwise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="lg" onClick={handleRotate} disabled={!file}>
              Rotate all pages
            </Button>
          </div>
        </ToolCard>

        <HowToSection
          title="How to rotate a PDF"
          steps={[
            { step: "Choose your PDF.", detail: "Drag it here or click to browse." },
            { step: "Pick the rotation angle.", detail: "90°, 180°, or 270° clockwise." },
            { step: "Click Rotate all pages.", detail: "Your PDF is rotated instantly." },
            { step: "Download your rotated PDF.", detail: "All pages are now in the correct orientation." },
          ]}
          explanation="FileForge rotates all pages in your PDF by the selected angle. This is useful for scanned documents that ended up sideways."
          faqs={[
            { q: "Can I rotate just some pages?", a: "Currently FileForge rotates all pages at once. For selective rotation, you can split the PDF, rotate, and merge." },
            { q: "Is my PDF uploaded anywhere?", a: "No. Everything is processed locally in your browser. Your file never leaves your device." },
          ]}
        />

        <RelatedTools
          tools={[
            { label: "Delete pages", to: "/pdf-tools/delete-pages", icon: Trash2 },
            { label: "Compress PDF", to: "/compress/pdf", icon: Layers },
          ]}
        />
      </div>
    </ToolPage>
  );
}
