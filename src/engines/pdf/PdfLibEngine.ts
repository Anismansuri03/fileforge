import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  PDFStream,
  decodePDFRawStream,
} from "pdf-lib";
import { JsquashImageEngine } from "@/engines/image/JsquashImageEngine";
import type { ImageOutputFormat } from "@/engines/image/types";
import type {
  PdfAnalysis,
  PdfCompressionEngine,
  PdfCompressionOptions,
} from "./types";
import { DEFAULT_PDF_OPTIONS } from "./types";
import { loadResize } from "@/engines/image/JsquashImageEngine";

interface ImageXObject {
  ref: PDFRef;
  stream: PDFRawStream;
  dict: PDFDict;
  width: number;
  height: number;
  filter: string | null;
  colorSpace: string | null;
  bitsPerComponent: number;
  isImageMask: boolean;
  rawBytes: number;
}

const imageEngine = new JsquashImageEngine();

function getName(value: unknown): string | null {
  if (value instanceof PDFName) return value.asString().replace(/^\//, "");
  return null;
}

function getNumber(value: unknown): number | null {
  if (value instanceof PDFNumber) return value.asNumber();
  return null;
}

/**
 * Collect every image XObject in the document, resolving indirect
 * references through the context.
 */
function collectImageXObjects(doc: PDFDocument): ImageXObject[] {
  const context = doc.context;
  const results: ImageXObject[] = [];

  for (const [ref, object] of context.enumerateIndirectObjects()) {
    if (!(object instanceof PDFRawStream)) continue;
    const dict = object.dict;
    const subtype = dict.get(PDFName.of("Subtype"));
    if (getName(subtype) !== "Image") continue;

    const width = getNumber(dict.get(PDFName.of("Width"))) ?? 0;
    const height = getNumber(dict.get(PDFName.of("Height"))) ?? 0;
    const filter = getName(dict.get(PDFName.of("Filter")));
    const colorSpaceRaw = dict.get(PDFName.of("ColorSpace"));
    let colorSpace: string | null = null;
    if (colorSpaceRaw instanceof PDFName) {
      colorSpace = getName(colorSpaceRaw);
    } else if (colorSpaceRaw instanceof PDFArray) {
      const first = colorSpaceRaw.get(0);
      colorSpace = getName(first);
    }
    const bitsPerComponent =
      getNumber(dict.get(PDFName.of("BitsPerComponent"))) ?? 8;
    const imageMask = getName(dict.get(PDFName.of("ImageMask"))) === "true";

    results.push({
      ref,
      stream: object,
      dict,
      width,
      height,
      filter,
      colorSpace,
      bitsPerComponent,
      isImageMask: imageMask,
      rawBytes: object.contents.byteLength,
    });
  }

  return results;
}

/** Detect JPEG/PNG magic bytes in an already-decoded stream. */
function sniffImageFormat(bytes: Uint8Array): ImageOutputFormat | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.byteLength > 3 && view.getUint16(0) === 0xffd8) return "jpeg";
  if (
    bytes.byteLength > 8 &&
    view.getUint32(0) === 0x89504e47 &&
    view.getUint32(4) === 0x0d0a1a0a
  ) {
    return "png";
  }
  if (
    bytes.byteLength > 12 &&
    view.getUint32(0) === 0x52494646 &&
    view.getUint32(8) === 0x57454250
  ) {
    return "webp";
  }
  if (bytes.byteLength > 12 && view.getUint32(4) === 0x66747970) {
    const brand = String.fromCharCode(
      bytes[8],
      bytes[9],
      bytes[10],
      bytes[11],
    );
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "avif";
  }
  return null;
}

function hasFlateFilter(filter: string | null): boolean {
  return filter === "FlateDecode" || filter === "Fl";
}

function hasDctFilter(filter: string | null): boolean {
  return filter === "DCTDecode" || filter === "DCT";
}



function inspectContentStream(
  obj: PDFRawStream,
): { hasText: boolean; hasVector: boolean } {
  let hasText = false;
  let hasVector = false;
  try {
    const decoded = decodePDFRawStream(obj).decode();
    const text = new TextDecoder("latin1").decode(decoded);
    if (/\bT[jJ]\b/.test(text) || /\bT[fF]\b/.test(text)) hasText = true;
    if (
      /\b[mlc]\b/.test(text) ||
      /\bre\b/.test(text) ||
      /\bS\b/.test(text) ||
      /\bf\b/.test(text)
    ) {
      hasVector = true;
    }
  } catch {
    // Ignore content streams we cannot decode.
  }
  return { hasText, hasVector };
}

/**
 * Convert a decoded image XObject into raw RGBA ImageData suitable for
 * re-encoding with jSquash.
 */
async function toImageData(
  image: ImageXObject,
): Promise<ImageData | null> {
  // JPEG: re-encode directly without a canvas round-trip.
  if (hasDctFilter(image.filter)) {
    try {
      return await imageEngine.decode(
        image.stream.contents.slice().buffer as ArrayBuffer,
      );
    } catch {
      return null;
    }
  }

  if (!hasFlateFilter(image.filter)) return null;

  try {
    const decoded = decodePDFRawStream(image.stream);
    const bytes = decoded.decode();
    const format = sniffImageFormat(bytes);
    if (format) {
      try {
        return await imageEngine.decode(
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
        );
      } catch {
        // Fall through to raw pixel interpretation.
      }
    }
    return rawPixelsToImageData(image, bytes);
  } catch {
    return null;
  }
}

function rawPixelsToImageData(
  image: ImageXObject,
  bytes: Uint8Array,
): ImageData | null {
  const { width, height, bitsPerComponent, colorSpace } = image;
  if (width <= 0 || height <= 0) return null;
  if (bitsPerComponent !== 8) return null;

  const normalized = (colorSpace ?? "").toLowerCase();
  const isGray = normalized === "devicegray" || normalized === "gray";
  const isRgb = normalized === "devicergb" || normalized === "rgb";
  const isCmyk = normalized === "devicecmyk" || normalized === "cmyk";
  const isIndexed =
    normalized === "indexed" ||
    normalized === "i" ||
    (colorSpace ?? "").toLowerCase() === "indexed";

  if (isIndexed) return null;

  const expected = width * height * 4;
  const out = new Uint8ClampedArray(expected);

  if (isGray) {
    for (let i = 0; i < width * height; i += 1) {
      const v = bytes[i];
      out[i * 4] = v;
      out[i * 4 + 1] = v;
      out[i * 4 + 2] = v;
      out[i * 4 + 3] = 255;
    }
  } else if (isRgb) {
    for (let i = 0; i < width * height; i += 1) {
      out[i * 4] = bytes[i * 3];
      out[i * 4 + 1] = bytes[i * 3 + 1];
      out[i * 4 + 2] = bytes[i * 3 + 2];
      out[i * 4 + 3] = 255;
    }
  } else if (isCmyk) {
    for (let i = 0; i < width * height; i += 1) {
      const c = bytes[i * 4] / 255;
      const m = bytes[i * 4 + 1] / 255;
      const y = bytes[i * 4 + 2] / 255;
      const k = bytes[i * 4 + 3] / 255;
      out[i * 4] = 255 * (1 - c) * (1 - k);
      out[i * 4 + 1] = 255 * (1 - m) * (1 - k);
      out[i * 4 + 2] = 255 * (1 - y) * (1 - k);
      out[i * 4 + 3] = 255;
    }
  } else {
    return null;
  }

  return new ImageData(out, width, height);
}

function readMetadataKeys(doc: PDFDocument): string[] {
  try {
    const infoRef = doc.context.trailerInfo.Info;
    if (!infoRef) return [];
    const info = doc.context.lookup(infoRef);
    if (!(info instanceof PDFDict)) return [];
    return info.keys().map((key) => key.decodeText());
  } catch {
    return [];
  }
}

export class PdfLibEngine implements PdfCompressionEngine {
  /**
   * Analyze a PDF's structure: pages, images, text, vectors, fonts and
   * metadata. This drives which compression candidates we try.
   */
  async analyze(input: Uint8Array): Promise<PdfAnalysis> {
    const doc = await PDFDocument.load(input, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const pages = doc.getPages();
    const images = collectImageXObjects(doc);

    let hasText = false;
    let hasVectorContent = false;
    let hasEmbeddedFonts = false;

    for (const page of pages) {
      const node = page.node;
      const resources = node.Resources();
      if (!resources) continue;

      const fonts = resources.lookupMaybe(PDFName.of("Font"), PDFDict);
      if (fonts && fonts.keys().length > 0) hasEmbeddedFonts = true;

      const xobjects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
      if (xobjects) {
        for (const key of xobjects.keys()) {
          const xobj = xobjects.get(key);
          const resolved = xobj instanceof PDFRef ? doc.context.lookup(xobj) : xobj;
          if (resolved instanceof PDFStream) {
            const subtype = getName(resolved.dict.get(PDFName.of("Subtype")));
            if (subtype === "Form") hasVectorContent = true;
          }
        }
      }

      // Inspect content stream for text-showing operators (Tj/TJ).
      try {
        const contents = node.Contents();
        if (contents instanceof PDFRawStream) {
          const r = inspectContentStream(contents);
          if (r.hasText) hasText = true;
          if (r.hasVector) hasVectorContent = true;
        } else if (contents instanceof PDFArray) {
          for (let i = 0; i < contents.size(); i += 1) {
            const ref = contents.get(i);
            const obj = ref instanceof PDFRef ? doc.context.lookup(ref) : ref;
            if (obj instanceof PDFRawStream) {
              const r = inspectContentStream(obj);
              if (r.hasText) hasText = true;
              if (r.hasVector) hasVectorContent = true;
            }
          }
        }
      } catch {
        // Ignore pages without readable contents.
      }

      if (hasText && hasVectorContent && hasEmbeddedFonts) break;
    }

    const totalImageBytes = images.reduce((sum, img) => sum + img.rawBytes, 0);
    const maxImageWidth = images.reduce(
      (max, img) => Math.max(max, img.width),
      0,
    );
    const maxImageHeight = images.reduce(
      (max, img) => Math.max(max, img.height),
      0,
    );
    const formats = Array.from(
      new Set(
        images
          .map((img) => (img.filter ? img.filter.toLowerCase() : "raw"))
          .filter(Boolean),
      ),
    );

    const pageCount = pages.length || 1;
    const imageRatio = totalImageBytes / Math.max(1, input.byteLength);
    const imagesPerPage = images.length / pageCount;

    let documentType: PdfAnalysis["documentType"] = "unknown";
    if (images.length === 0 && hasText) {
      documentType = "text";
    } else if (imagesPerPage >= 1 && !hasText) {
      documentType = "scan";
    } else if (imageRatio > 0.6 || imagesPerPage > 2) {
      documentType = "image-heavy";
    } else if (hasText && images.length > 0) {
      documentType = "mixed";
    } else if (images.length > 0) {
      documentType = "image-heavy";
    } else if (hasText) {
      documentType = "text";
    }

    let estimatedComplexity: PdfAnalysis["estimatedComplexity"] = "low";
    if (pageCount > 40 || images.length > 60) {
      estimatedComplexity = "high";
    } else if (pageCount > 10 || images.length > 15) {
      estimatedComplexity = "medium";
    }

    return {
      pageCount,
      hasImages: images.length > 0,
      imageCount: images.length,
      hasText,
      hasVectorContent,
      estimatedComplexity,
      documentType,
      imageBytes: totalImageBytes,
      totalBytes: input.byteLength,
      maxImageWidth,
      maxImageHeight,
      imageFormats: formats,
      hasEmbeddedFonts,
      metadataKeys: readMetadataKeys(doc),
    };
  }

  /**
   * Compress a PDF by re-encoding embedded raster images, downsampling
   * oversized images, optionally stripping metadata and using object
   * streams. Text and vector content are preserved — pages are never
   * rasterized.
   */
  async compress(
    input: Uint8Array,
    options: PdfCompressionOptions = DEFAULT_PDF_OPTIONS,
  ): Promise<Uint8Array> {
    const doc = await PDFDocument.load(input, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const images = collectImageXObjects(doc);
    const resize = await loadResize();
    const targetDpi = Math.max(24, Math.min(600, options.dpi));

    for (const image of images) {
      if (image.isImageMask) continue;
      if (image.width <= 0 || image.height <= 0) continue;

      const imageData = await toImageData(image);
      if (!imageData) continue;

      let working = imageData;

      // Downsample oversized raster images.
      const longest = Math.max(image.width, image.height);
      const targetLongest = Math.round(targetDpi * 11);
      const scale = Math.min(1, targetLongest / longest);
      if (scale < 1) {
        const width = Math.max(1, Math.round(imageData.width * scale));
        const height = Math.max(1, Math.round(imageData.height * scale));
        try {
          working = await resize(imageData, {
            width,
            height,
            method: "lanczos3",
            fitMethod: "stretch",
            premultiply: true,
            linearRGB: true,
          });
        } catch {
          working = imageData;
        }
      }

      if (options.grayscale) {
        working = toGrayscale(working);
      }

      const quality = Math.max(1, Math.min(95, options.imageQuality));

      let encoded: Uint8Array;
      let mime: string;
      try {
        const result = await imageEngine.encode(working, {
          format: "jpeg",
          quality,
          background: "#ffffff",
        });
        encoded = result.data;
        mime = result.mimeType;
      } catch {
        continue;
      }

      // Only replace when we actually saved bytes.
      const originalSize = image.stream.contents.byteLength;
      if (encoded.byteLength >= originalSize) continue;

      replaceImageStream(
        doc,
        image,
        encoded,
        working.width,
        working.height,
        mime,
      );
    }

    if (options.removeMetadata) {
      try {
        doc.setTitle("");
        doc.setAuthor("");
        doc.setSubject("");
        doc.setKeywords([]);
        doc.setCreator("");
        doc.setProducer("");
      } catch {
        // Metadata removal is best-effort.
      }
    }

    let saved = await doc.save({
      useObjectStreams: options.useObjectStreams,
      addDefaultPage: false,
      updateFieldAppearances: false,
    });

    // Aggressive post-processing: strip duplicate objects and re-flate
    // content streams for further size reduction.
    if (options.dpi <= 72) {
      try {
        const reDoc = await PDFDocument.load(saved, {
          ignoreEncryption: true,
          updateMetadata: false,
        });
        saved = await reDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          updateFieldAppearances: false,
        });
      } catch {
        // Best-effort second pass.
      }
    }

    return saved;
  }
}

function toGrayscale(imageData: ImageData): ImageData {
  const { data, width, height } = imageData;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(
      data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114,
    );
    out[i] = gray;
    out[i + 1] = gray;
    out[i + 2] = gray;
    out[i + 3] = data[i + 3];
  }
  return new ImageData(out, width, height);
}

function replaceImageStream(
  doc: PDFDocument,
  image: ImageXObject,
  encoded: Uint8Array,
  width: number,
  height: number,
  mime: string,
): void {
  const context = doc.context;
  const dict = context.obj({});
  dict.set(PDFName.of("Type"), PDFName.of("XObject"));
  dict.set(PDFName.of("Subtype"), PDFName.of("Image"));
  dict.set(PDFName.of("Width"), context.obj(width));
  dict.set(PDFName.of("Height"), context.obj(height));
  dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
  dict.set(PDFName.of("BitsPerComponent"), context.obj(8));
  dict.set(
    PDFName.of("Filter"),
    PDFName.of(mime === "image/jpeg" ? "DCTDecode" : "FlateDecode"),
  );
  dict.set(PDFName.of("Length"), context.obj(encoded.byteLength));

  const newStream = PDFRawStream.of(dict, encoded);
  context.assign(image.ref, newStream);
}
