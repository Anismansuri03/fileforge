/// <reference lib="webworker" />
import { JsquashImageEngine, loadResize } from "@/engines/image/JsquashImageEngine";
import { optimizeImage } from "@/engines/image/optimize";
import type {
  ImageEncodeOptions,
  ImageOutputFormat,
} from "@/engines/image/types";
import type { WorkerRequest, WorkerResponse } from "./protocol";

const engine = new JsquashImageEngine();
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
    if (type === "image.compress") {
      const p = payload as {
        data: ArrayBuffer;
        format: ImageOutputFormat;
        targetBytes: number;
        minQuality?: number;
      };
      const result = await optimizeImage(
        p.data,
        {
          format: p.format,
          targetBytes: p.targetBytes,
          minQuality: p.minQuality,
          signal: controller.signal,
          onProgress: (prog) => progress(id, prog.stage, prog.progress, prog.message),
        },
        p.format,
      );
      progress(id, "complete", 100, "Compression complete");
      post({
        id,
        type: "result",
        data: result.data,
        meta: {
          width: result.width,
          height: result.height,
          quality: result.quality,
          targetReached: result.targetReached,
          originalBytes: result.originalBytes,
          outputBytes: result.outputBytes,
          format: result.format,
        },
      });
      return;
    }

    if (type === "image.resize") {
      const p = payload as {
        data: ArrayBuffer;
        outputFormat?: ImageOutputFormat | "keep";
        sourceFormat?: ImageOutputFormat;
        width: number;
        height: number;
        quality?: number;
        mode: "fit" | "fill" | "exact" | "percentage";
      };

      progress(id, "analyzing", 10, "Reading image");
      const source = await engine.decode(p.data);
      progress(id, "optimizing", 40, `Resizing to ${p.width}×${p.height}`);

      const resize = await loadResize();
      const resized = await resize(source, {
        width: p.width,
        height: p.height,
        method: "lanczos3",
        fitMethod: "stretch",
        premultiply: true,
        linearRGB: true,
      });

      const format: ImageOutputFormat =
        p.outputFormat && p.outputFormat !== "keep"
          ? p.outputFormat
          : (p.sourceFormat ?? "jpeg");

      progress(id, "encoding", 75, "Encoding output");
      const encoded = await engine.encode(resized, {
        format,
        quality: p.quality ?? 92,
      });

      progress(id, "complete", 100, "Resize complete");
      post({
        id,
        type: "result",
        data: encoded.data,
        meta: {
          width: encoded.width,
          height: encoded.height,
          format: encoded.format,
          originalBytes: p.data.byteLength,
          outputBytes: encoded.data.byteLength,
        },
      });
      return;
    }

    if (type === "image.convert") {
      const p = payload as {
        data: ArrayBuffer;
        format: ImageOutputFormat;
        quality?: number;
        width?: number;
        height?: number;
      };

      progress(id, "analyzing", 10, "Decoding image");
      const source = await engine.decode(p.data);

      let image = source;
      if (p.width && p.height) {
        progress(id, "optimizing", 40, "Resizing output");
        const resize = await loadResize();
        image = await resize(source, {
          width: p.width,
          height: p.height,
          method: "lanczos3",
          fitMethod: "stretch",
          premultiply: true,
          linearRGB: true,
        });
      }

      progress(id, "encoding", 70, "Encoding image");
      const options: ImageEncodeOptions = {
        format: p.format,
        quality: p.quality ?? 90,
      };
      const encoded = await engine.encode(image, options);

      progress(id, "complete", 100, "Conversion complete");
      post({
        id,
        type: "result",
        data: encoded.data,
        meta: {
          width: encoded.width,
          height: encoded.height,
          format: encoded.format,
          originalBytes: p.data.byteLength,
          outputBytes: encoded.data.byteLength,
        },
      });
      return;
    }

    post({ id, type: "error", message: "Unsupported request." });
  } catch (error) {
    if (error instanceof Error && error.name === "CancelledError") {
      post({ id, type: "error", message: "cancelled" });
    } else {
      post({
        id,
        type: "error",
        message: "Something went wrong while processing this file.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  } finally {
    controllers.delete(id);
  }
};
