import type {
  ImageCompressionEngine,
  ImageEncodeOptions,
  ImageEngineResult,
  ImageInfo,
  ImageOutputFormat,
} from "./types";
import { OUTPUT_MIME, detectImageFormat } from "./types";

/**
 * jSquash-backed image engine.
 *
 * Codecs are imported dynamically so that opening the homepage never
 * downloads any compression WASM. Each codec is loaded on first use and
 * cached for the lifetime of the worker.
 */

type EncodeFn = (
  data: ImageData,
  options?: Record<string, unknown>,
) => Promise<ArrayBuffer>;
type DecodeFn = (data: ArrayBuffer) => Promise<ImageData>;

interface CodecBundle {
  encode: EncodeFn;
  decode: DecodeFn;
}

const bundleCache = new Map<string, Promise<CodecBundle>>();

async function loadJpeg(): Promise<CodecBundle> {
  const [enc, dec] = await Promise.all([
    import("@jsquash/jpeg/encode"),
    import("@jsquash/jpeg/decode"),
  ]);
  return { encode: enc.default as EncodeFn, decode: dec.default as DecodeFn };
}

async function loadPng(): Promise<CodecBundle> {
  const [enc, dec] = await Promise.all([
    import("@jsquash/png/encode"),
    import("@jsquash/png/decode"),
  ]);
  return { encode: enc.default as EncodeFn, decode: dec.default as DecodeFn };
}

async function loadWebp(): Promise<CodecBundle> {
  const [enc, dec] = await Promise.all([
    import("@jsquash/webp/encode"),
    import("@jsquash/webp/decode"),
  ]);
  return { encode: enc.default as EncodeFn, decode: dec.default as DecodeFn };
}

async function loadAvif(): Promise<CodecBundle> {
  const [enc, dec] = await Promise.all([
    import("@jsquash/avif/encode"),
    import("@jsquash/avif/decode"),
  ]);
  return { encode: enc.default as EncodeFn, decode: dec.default as DecodeFn };
}

async function loadOxiPng() {
  const mod = await import("@jsquash/oxipng");
  return mod.optimise as (
    data: ArrayBuffer | ImageData,
    options?: Record<string, unknown>,
  ) => Promise<ArrayBuffer>;
}

async function loadResize() {
  const mod = await import("@jsquash/resize");
  return mod.default as (
    data: ImageData,
    options?: Record<string, unknown>,
  ) => Promise<ImageData>;
}

function getCodec(format: ImageOutputFormat): Promise<CodecBundle> {
  let loader: () => Promise<CodecBundle>;
  switch (format) {
    case "jpeg":
      loader = loadJpeg;
      break;
    case "webp":
      loader = loadWebp;
      break;
    case "avif":
      loader = loadAvif;
      break;
    case "png":
      loader = loadPng;
      break;
  }
  const cached = bundleCache.get(format);
  if (cached) return cached;
  const promise = loader();
  bundleCache.set(format, promise);
  return promise;
}

/**
 * Detect whether an image contains an alpha channel by looking at the
 * decoded pixel data. Used so we never silently flatten transparency.
 */
function imageDataHasAlpha(imageData: ImageData): boolean {
  const { data } = imageData;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

function flattenToBackground(imageData: ImageData, background: string): ImageData {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return imageData;
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, imageData.width, imageData.height);
  ctx.putImageData(imageData, 0, 0);
  const flat = ctx.getImageData(0, 0, imageData.width, imageData.height);
  for (let i = 3; i < flat.data.length; i += 4) {
    flat.data[i] = 255;
  }
  return flat;
}

/**
 * Read the intrinsic size of common image formats directly from the
 * header without a full decode. Falls back to a full decode for formats
 * we cannot cheaply parse.
 */
function readDimensionsFromHeader(
  data: ArrayBuffer,
): { width: number; height: number; hasAlpha: boolean } | null {
  const view = new DataView(data);
  if (data.byteLength < 16) return null;

  // PNG
  if (
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    const colorType = view.getUint8(25);
    const hasAlpha = colorType === 4 || colorType === 6;
    return { width, height, hasAlpha };
  }

  // JPEG
  if (view.getUint16(0) === 0xffd8) {
    let offset = 2;
    while (offset < data.byteLength - 9) {
      if (view.getUint8(offset) !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = view.getUint8(offset + 1);
      const length = view.getUint16(offset + 2);
      // SOF0-SOF15 (excluding DHT/DAC/RSTn)
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        const height = view.getUint16(offset + 5);
        const width = view.getUint16(offset + 7);
        const components = view.getUint8(offset + 9);
        return { width, height, hasAlpha: components === 4 };
      }
      offset += 2 + length;
    }
  }

  // WebP
  if (
    view.getUint32(0) === 0x52494646 &&
    view.getUint32(8) === 0x57454250
  ) {
    const chunk = view.getUint32(12);
    // VP8X
    if (chunk === 0x56503858) {
      const width = 1 + (view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16));
      const height = 1 + (view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16));
      const flags = view.getUint8(20);
      const hasAlpha = (flags & 0x10) !== 0;
      return { width, height, hasAlpha };
    }
    // VP8 lossy
    if (chunk === 0x56503820) {
      const width = view.getUint16(26, true) & 0x3fff;
      const height = view.getUint16(28, true) & 0x3fff;
      return { width, height, hasAlpha: false };
    }
    // VP8L lossless
    if (chunk === 0x5650384c) {
      const bits = view.getUint32(21, true);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      const hasAlpha = true;
      return { width, height, hasAlpha };
    }
  }

  // AVIF: ispe box contains width/height. Search for 'ispe'.
  if (data.byteLength > 32) {
    const bytes = new Uint8Array(data);
    for (let i = 4; i < bytes.length - 12; i += 1) {
      if (
        bytes[i] === 0x69 &&
        bytes[i + 1] === 0x73 &&
        bytes[i + 2] === 0x70 &&
        bytes[i + 3] === 0x65
      ) {
        const dv = new DataView(data, i + 4, 12);
        const width = dv.getUint32(4);
        const height = dv.getUint32(8);
        if (width > 0 && height > 0 && width < 100000 && height < 100000) {
          return { width, height, hasAlpha: true };
        }
      }
    }
  }

  return null;
}

export class JsquashImageEngine implements ImageCompressionEngine {
  async inspect(data: ArrayBuffer): Promise<ImageInfo> {
    const header = readDimensionsFromHeader(data);
    if (header) {
      return {
        width: header.width,
        height: header.height,
        format: "unknown",
        hasAlpha: header.hasAlpha,
      };
    }
    // Fallback: decode via the PNG codec (handles arbitrary input well).
    const decoded = await (await getCodec("png")).decode(data);
    return {
      width: decoded.width,
      height: decoded.height,
      format: "unknown",
      hasAlpha: imageDataHasAlpha(decoded),
    };
  }

  async decode(data: ArrayBuffer): Promise<ImageData> {
    // Try the progressive headers first; if none match, sweep codecs.
    const attempts: ImageOutputFormat[] = ["jpeg", "png", "webp", "avif"];
    let lastError: unknown = null;
    for (const format of attempts) {
      try {
        const codec = await getCodec(format);
        return await codec.decode(data);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to decode image");
  }

  async encode(
    imageData: ImageData,
    options: ImageEncodeOptions,
  ): Promise<ImageEngineResult> {
    const { format, quality } = options;
    const mimeType = OUTPUT_MIME[format];

    if (format === "png") {
      const result = await this.encodePng(imageData, options);
      return result;
    }

    const codec = await getCodec(format);
    let image = imageData;

    if (format === "jpeg" && imageDataHasAlpha(imageData)) {
      image = flattenToBackground(imageData, options.background ?? "#ffffff");
    }

    const encodeOptions: Record<string, unknown> = { quality };
    if (format === "avif") {
      encodeOptions.speed = 6;
    }

    const buffer = await codec.encode(image, encodeOptions);
    return {
      data: new Uint8Array(buffer),
      format,
      width: image.width,
      height: image.height,
      mimeType,
    };
  }

  private async encodePng(
    imageData: ImageData,
    options: ImageEncodeOptions,
  ): Promise<ImageEngineResult> {
    const codec = await getCodec("png");
    const raw = await codec.encode(imageData);

    if (options.optimizePng !== false) {
      const oxi = await loadOxiPng();
      const optimized = await oxi(raw, { level: 2, interlace: false });
      return {
        data: new Uint8Array(optimized),
        format: "png",
        width: imageData.width,
        height: imageData.height,
        mimeType: OUTPUT_MIME.png,
      };
    }

    return {
      data: new Uint8Array(raw),
      format: "png",
      width: imageData.width,
      height: imageData.height,
      mimeType: OUTPUT_MIME.png,
    };
  }
}

export { loadResize, detectImageFormat };

export function detectFormatFromMime(mime: string): ImageOutputFormat | "unknown" {
  return detectImageFormat(mime);
}
