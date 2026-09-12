export type FileKind = "pdf" | "image" | "unknown";

export interface ValidationResult {
  ok: boolean;
  kind: FileKind;
  /** User-facing, non-technical error message. */
  error?: string;
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif"]);

export const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.avif";
export const PDF_ACCEPT = ".pdf";

/** Recommended ceiling before we warn about browser memory limits. */
export const LARGE_FILE_BYTES = 150 * 1024 * 1024;
export const HUGE_FILE_BYTES = 512 * 1024 * 1024;

export function detectKind(file: File): FileKind {
  const type = (file.type || "").toLowerCase();
  const ext = file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase();
  if (type === "application/pdf" || ext === "pdf") return "pdf";
  if (IMAGE_TYPES.has(type) || IMAGE_EXTENSIONS.has(ext)) return "image";
  return "unknown";
}

export function validateFile(
  file: File,
  accept: FileKind | "any",
): ValidationResult {
  const kind = detectKind(file);

  if (kind === "unknown") {
    return {
      ok: false,
      kind,
      error: "This file type isn't supported.",
    };
  }

  if (accept !== "any" && kind !== accept) {
    return {
      ok: false,
      kind,
      error:
        accept === "pdf"
          ? "Please choose a PDF file."
          : "Please choose an image file.",
    };
  }

  if (file.size === 0) {
    return {
      ok: false,
      kind,
      error: "This file appears to be empty or damaged.",
    };
  }

  if (file.size > HUGE_FILE_BYTES) {
    return {
      ok: false,
      kind,
      error:
        "This file is too large for reliable browser processing. Please try a smaller file.",
    };
  }

  return { ok: true, kind };
}

export function isLargeFile(file: File): boolean {
  return file.size > LARGE_FILE_BYTES;
}
