import { JsquashImageEngine, loadResize } from "./JsquashImageEngine";
import { buildImageCandidates } from "@/lib/target-size/candidates";
import { searchTargetSize, CancelledError } from "@/lib/target-size/search";
import { imageCandidateScore } from "@/lib/target-size/scoring";
import type { ImageEncodeOptions, ImageOutputFormat } from "./types";

export interface OptimizeImageOptions {
  format: ImageOutputFormat;
  targetBytes: number;
  minQuality?: number;
  allowDownscale?: boolean;
  /** Reserved for future advanced controls. */
  maxDimension?: number;
  signal?: AbortSignal;
  onProgress?: (progress: {
    stage: "analyzing" | "optimizing" | "searching" | "validating";
    progress: number;
    message: string;
  }) => void;
}

export interface OptimizedImage {
  data: Uint8Array;
  format: ImageOutputFormat;
  width: number;
  height: number;
  quality: number;
  targetReached: boolean;
  originalBytes: number;
  outputBytes: number;
}

/**
 * Real target-size optimizer for images.
 *
 * Every candidate is actually encoded and measured — never estimated.
 * Candidates sweep quality first, then dimensions, so the result stays as
 * sharp as possible while fitting under the target.
 */
export async function optimizeImage(
  input: ArrayBuffer,
  options: OptimizeImageOptions,
  _originalFormat: ImageOutputFormat,
): Promise<OptimizedImage> {
  const { signal, onProgress } = options;
  const engine = new JsquashImageEngine();

  const abort = () => {
    if (signal?.aborted) throw new CancelledError();
  };

  onProgress?.({
    stage: "analyzing",
    progress: 4,
    message: "Reading image information",
  });

  const info = await engine.inspect(input);
  abort();

  onProgress?.({
    stage: "analyzing",
    progress: 10,
    message: `Detected ${info.width}×${info.height} image`,
  });

  const decoded = await engine.decode(input);
  abort();

  // Cap enormous images up-front to keep memory predictable.
  let source = decoded;
  const maxDimension = options.maxDimension ?? 8192;
  if (Math.max(decoded.width, decoded.height) > maxDimension) {
    const ratio = maxDimension / Math.max(decoded.width, decoded.height);
    const resize = await loadResize();
    source = await resize(decoded, {
      width: Math.max(1, Math.round(decoded.width * ratio)),
      height: Math.max(1, Math.round(decoded.height * ratio)),
      method: "lanczos3",
      fitMethod: "stretch",
      premultiply: true,
      linearRGB: true,
    });
  }

  const candidates = buildImageCandidates({
    minQuality: options.minQuality,
    allowDownscale: options.allowDownscale,
  });

  const resize = await loadResize();
  // Cache scaled pixels per scale factor to avoid redundant resizes.
  const scaledCache = new Map<number, ImageData>();

  const getScaled = async (scale: number): Promise<ImageData> => {
    const key = Math.round(scale * 1000);
    const cached = scaledCache.get(key);
    if (cached) return cached;
    if (scale === 1) {
      scaledCache.set(key, source);
      return source;
    }
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const resized = await resize(source, {
      width,
      height,
      method: "lanczos3",
      fitMethod: "stretch",
      premultiply: true,
      linearRGB: true,
    });
    scaledCache.set(key, resized);
    return resized;
  };

  const search = await searchTargetSize({
    targetBytes: options.targetBytes,
    candidates,
    signal,
    score: (config) => imageCandidateScore(config),
    onAttempt: (attempt, total) => {
      onProgress?.({
        stage: "searching",
        progress: 20 + Math.min(70, (attempt / total) * 70),
        message: `Testing compression option ${attempt} of ${total}`,
      });
    },
    measure: async (config) => {
      abort();
      const scaled = await getScaled(config.scale);
      const encodeOptions: ImageEncodeOptions = {
        format: options.format,
        quality: config.quality,
        optimizePng: true,
      };
      const result = await engine.encode(scaled, encodeOptions);
      return result.data.byteLength;
    },
  });

  abort();

  onProgress?.({
    stage: "validating",
    progress: 95,
    message: "Measuring final file size",
  });

  const chosen = search.bestWithinTarget ?? search.best;
  if (!chosen) {
    throw new Error("No compression candidate could be produced");
  }

  const scaled = await getScaled(chosen.config.scale);
  const finalResult = await engine.encode(scaled, {
    format: options.format,
    quality: chosen.config.quality,
    optimizePng: true,
  });

  const outputBytes = finalResult.data.byteLength;
  const targetReached = outputBytes <= options.targetBytes;

  onProgress?.({
    stage: "validating",
    progress: 100,
    message: "Done",
  });

  return {
    data: finalResult.data,
    format: finalResult.format,
    width: finalResult.width,
    height: finalResult.height,
    quality: chosen.config.quality,
    targetReached,
    originalBytes: input.byteLength,
    outputBytes,
  };
}

export function defaultOutputFormat(
  source: ImageOutputFormat,
): ImageOutputFormat {
  return source;
}
