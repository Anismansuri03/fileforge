/// <reference lib="webworker" />
import { PdfLibEngine } from "@/engines/pdf/PdfLibEngine";
import { optimizePdf } from "@/engines/pdf/optimize";
import {
  addPagesToPdf,
  deletePages,
  extractPages,
  imagesToPdf,
  mergePdfs,
  reorderPages,
  rotatePages,
  splitPdfByRanges,
  splitPdfEveryN,
} from "@/engines/pdf/operations";
import type { PdfCompressionOptions } from "@/engines/pdf/types";
import type { WorkerRequest, WorkerResponse } from "./protocol";

const controllers = new Map<string, AbortController>();

function post(message: WorkerResponse) {
  self.postMessage(message);
}

function progress(
  id: string,
  stage: "analyzing" | "optimizing" | "encoding" | "searching" | "validating" | "complete",
  value: number,
  message: string,
) {
  post({ id, type: "progress", stage, progress: value, message });
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = event.data;

  if (type === "cancel") {
    controllers.get(id)?.abort();
    return;
  }

  const controller = new AbortController();
  controllers.set(id, controller);

  try {
    switch (type) {
      case "pdf.analyze": {
        const p = payload as { data: Uint8Array };
        progress(id, "analyzing", 20, "Analyzing document");
        const engine = new PdfLibEngine();
        const analysis = await engine.analyze(p.data);
        progress(id, "complete", 100, "Analysis complete");
        post({
          id,
          type: "result",
          data: new Uint8Array(),
          meta: { analysis },
        });
        return;
      }

      case "pdf.compress": {
        const p = payload as {
          data: Uint8Array;
          targetBytes: number;
          advanced?: Partial<PdfCompressionOptions>;
        };
        const engine = new PdfLibEngine();
        const result = await optimizePdf(p.data, engine, {
          targetBytes: p.targetBytes,
          signal: controller.signal,
          onProgress: (prog) =>
            progress(id, prog.stage, prog.progress, prog.message),
        });
        progress(id, "complete", 100, "Compression complete");
        post({
          id,
          type: "result",
          data: result.data,
          meta: {
            targetReached: result.targetReached,
            originalBytes: result.originalBytes,
            outputBytes: result.outputBytes,
            options: result.options,
          },
        });
        return;
      }

      case "pdf.merge": {
        const p = payload as { files: Uint8Array[] };
        progress(id, "optimizing", 30, "Merging documents");
        const merged = await mergePdfs(p.files);
        progress(id, "complete", 100, "Merge complete");
        post({ id, type: "result", data: merged, meta: {} });
        return;
      }

      case "pdf.split": {
        const p = payload as {
          data: Uint8Array;
          mode: "ranges" | "every";
          ranges?: Array<{ start: number; end: number }>;
          every?: number;
        };
        progress(id, "optimizing", 40, "Splitting document");
        const outputs =
          p.mode === "every"
            ? await splitPdfEveryN(p.data, p.every ?? 1)
            : await splitPdfByRanges(p.data, p.ranges ?? []);
        progress(id, "complete", 100, "Split complete");
        post({
          id,
          type: "result",
          data: new Uint8Array(),
          meta: {
            outputs: outputs.map((output) => ({
              name: output.name,
              data: output.data,
            })),
          },
        });
        return;
      }

      case "pdf.rotate": {
        const p = payload as {
          data: Uint8Array;
          indices: number[] | "all";
          angle: 90 | 180 | 270;
        };
        progress(id, "optimizing", 40, "Rotating pages");
        const result = await rotatePages(p.data, p.indices, p.angle);
        progress(id, "complete", 100, "Rotation complete");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      case "pdf.delete-pages": {
        const p = payload as { data: Uint8Array; indices: number[] };
        progress(id, "optimizing", 40, "Removing pages");
        const result = await deletePages(p.data, p.indices);
        progress(id, "complete", 100, "Pages removed");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      case "pdf.extract-pages": {
        const p = payload as { data: Uint8Array; indices: number[] };
        progress(id, "optimizing", 40, "Extracting pages");
        const result = await extractPages(p.data, p.indices);
        progress(id, "complete", 100, "Pages extracted");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      case "pdf.reorder": {
        const p = payload as { data: Uint8Array; order: number[]; rotations?: number[] };
        progress(id, "optimizing", 40, "Reordering pages");
        const result = await reorderPages(p.data, p.order, p.rotations);
        progress(id, "complete", 100, "Pages reordered");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      case "pdf.add-pages": {
        const p = payload as {
          base: Uint8Array;
          inserts: Array<{ data: Uint8Array; type: "pdf" | "image"; mime?: string }>;
          position: number;
        };
        progress(id, "optimizing", 40, "Adding pages");
        const result = await addPagesToPdf(p.base, p.inserts, p.position);
        progress(id, "complete", 100, "Pages added");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      case "pdf.images-to-pdf": {
        const p = payload as {
          images: Array<{ data: Uint8Array; mime: string }>;
        };
        progress(id, "optimizing", 40, "Building PDF");
        const result = await imagesToPdf(p.images);
        progress(id, "complete", 100, "PDF created");
        post({ id, type: "result", data: result, meta: {} });
        return;
      }

      default:
        post({ id, type: "error", message: "Unsupported request." });
    }
  } catch (error) {
    if (error instanceof Error && error.name === "CancelledError") {
      post({ id, type: "error", message: "cancelled" });
    } else {
      post({
        id,
        type: "error",
        message:
          "Something went wrong while processing this file. The original file is untouched.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    controllers.delete(id);
  }
};
