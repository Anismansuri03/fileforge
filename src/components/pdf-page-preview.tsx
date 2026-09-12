import { useEffect, useRef, useState } from "react";
import { loadPdfDocument } from "@/engines/pdf-renderer/pdfjs";
import type { PDFDocumentProxy } from "pdfjs-dist";

const docCache = new Map<string, Promise<PDFDocumentProxy>>();

function getDocKey(data: Uint8Array): string {
  // Use the first 64 bytes as a quick fingerprint to avoid hashing the whole file
  const slice = data.slice(0, 64);
  let hex = "";
  for (let i = 0; i < slice.length; i++) {
    hex += slice[i].toString(16).padStart(2, "0");
  }
  return `${hex}-${data.length}`;
}

async function getDocument(data: Uint8Array): Promise<PDFDocumentProxy> {
  const key = getDocKey(data);
  let cached = docCache.get(key);
  if (!cached) {
    cached = loadPdfDocument(data);
    docCache.set(key, cached);
    // Clean up after 60 seconds
    setTimeout(() => docCache.delete(key), 60_000);
  }
  return cached;
}

interface PdfPagePreviewProps {
  data: Uint8Array;
  pageIndex: number;
  width?: number;
  className?: string;
}

export function PdfPagePreview({
  data,
  pageIndex,
  width = 160,
  className,
}: PdfPagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const render = async () => {
      try {
        const doc = await getDocument(data);
        if (cancelled) return;
        const page = await doc.getPage(pageIndex + 1);
        if (cancelled) return;

        const viewport = page.getViewport({ scale: 1 });
        const scale = width / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        await page.render({
          canvasContext: ctx,
          viewport: scaledViewport,
        }).promise;

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setError(true);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [data, pageIndex, width]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted text-xs text-muted-foreground ${className ?? ""}`}
        style={{ width, height: width * 1.414 }}
      >
        Preview unavailable
      </div>
    );
  }

  return (
    <div className={`relative ${className ?? ""}`} style={{ width }}>
      {!ready && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-muted rounded-md animate-pulse"
          style={{ height: width * 1.414 }}
        >
          <span className="text-[10px] text-muted-foreground">Loading...</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`block rounded-md border border-border/60 shadow-sm transition-opacity duration-200 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        style={{ width }}
      />
    </div>
  );
}

interface PdfPageCountProps {
  data: Uint8Array;
  onCount: (count: number) => void;
}

export function PdfPageCount({ data, onCount }: PdfPageCountProps) {
  useEffect(() => {
    let cancelled = false;
    getDocument(data).then((doc) => {
      if (!cancelled) onCount(doc.numPages);
    });
    return () => {
      cancelled = true;
    };
  }, [data, onCount]);

  return null;
}
