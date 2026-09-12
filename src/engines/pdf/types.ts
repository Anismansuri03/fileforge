export type PdfDocumentType =
  | "text"
  | "scan"
  | "mixed"
  | "image-heavy"
  | "unknown";

export interface PdfAnalysis {
  pageCount: number;
  hasImages: boolean;
  imageCount: number;
  hasText: boolean;
  hasVectorContent: boolean;
  estimatedComplexity: "low" | "medium" | "high";
  documentType: PdfDocumentType;
  /** Sum of the encoded byte sizes of all image XObjects. */
  imageBytes: number;
  /** Total bytes of the source file. */
  totalBytes: number;
  /** Approximate pixel dimensions of the largest image. */
  maxImageWidth: number;
  maxImageHeight: number;
  /** Encoded image formats detected (e.g. jpeg, png, raw). */
  imageFormats: string[];
  hasEmbeddedFonts: boolean;
  metadataKeys: string[];
}

export interface PdfCompressionOptions {
  /**
   * Target image quality 0-100. Higher keeps more detail.
   * Requires PdfCompressionOptions.dpi to be set for downsampling.
   */
  imageQuality: number;
  /** Target resolution for embedded raster images, in DPI. */
  dpi: number;
  /** Convert color images to grayscale. */
  grayscale: boolean;
  /** Strip non-essential metadata from the document info dictionary. */
  removeMetadata: boolean;
  /** Attempt font optimization where safe. */
  optimizeFonts: boolean;
  /** Use object streams to improve structural compression. */
  useObjectStreams: boolean;
  /** Preserve text and vector content (should always be true). */
  preserveText: boolean;
}

export interface PdfCompressionEngine {
  analyze(input: Uint8Array): Promise<PdfAnalysis>;
  compress(
    input: Uint8Array,
    options: PdfCompressionOptions,
  ): Promise<Uint8Array>;
}

export const DEFAULT_PDF_OPTIONS: PdfCompressionOptions = {
  imageQuality: 80,
  dpi: 150,
  grayscale: false,
  removeMetadata: true,
  optimizeFonts: true,
  useObjectStreams: true,
  preserveText: true,
};
