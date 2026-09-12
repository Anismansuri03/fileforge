export type ImageOutputFormat = "jpeg" | "png" | "webp" | "avif";

export interface ImageEncodeOptions {
  format: ImageOutputFormat;
  /** Encoder quality 1-100. Ignored for PNG (lossless). */
  quality: number;
  /** Target dimensions. Omit to keep source dimensions. */
  width?: number;
  height?: number;
  /** For PNG: run lossless optimization passes. */
  optimizePng?: boolean;
  /** For PNG: allow conversion to a lossy format when needed. */
  pngFallbackFormat?: "webp" | "avif" | null;
  /** Background color used when flattening transparency (jpeg). */
  background?: string;
}

export interface ImageInfo {
  width: number;
  height: number;
  format: ImageOutputFormat | "unknown";
  hasAlpha: boolean;
}

export interface ImageEngineResult {
  data: Uint8Array;
  format: ImageOutputFormat;
  width: number;
  height: number;
  mimeType: string;
}

export interface ImageCompressionEngine {
  /**
   * Probe the image header to determine dimensions/format without fully
   * decoding whenever possible.
   */
  inspect(data: ArrayBuffer): Promise<ImageInfo>;

  /** Decode to raw RGBA pixels. */
  decode(data: ArrayBuffer): Promise<ImageData>;

  /** Encode raw pixels using the requested options. */
  encode(
    imageData: ImageData,
    options: ImageEncodeOptions,
  ): Promise<ImageEngineResult>;
}

export const OUTPUT_MIME: Record<ImageOutputFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

export const OUTPUT_EXTENSION: Record<ImageOutputFormat, string> = {
  jpeg: "jpg",
  png: "png",
  webp: "webp",
  avif: "avif",
};

export function detectImageFormat(
  mimeOrName: string,
): ImageOutputFormat | "unknown" {
  const value = mimeOrName.toLowerCase();
  if (value.includes("jpeg") || value.includes("jpg")) return "jpeg";
  if (value.includes("png")) return "png";
  if (value.includes("webp")) return "webp";
  if (value.includes("avif")) return "avif";
  return "unknown";
}
