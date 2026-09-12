/**
 * File name utilities. Names are never injected into HTML.
 */

const INVALID_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function sanitizeFileName(name: string): string {
  const stripped = name.replace(INVALID_CHARS, "").trim();
  const collapsed = stripped.replace(/\s+/g, " ");
  const safe = collapsed.replace(/^\.+/, "");
  return safe.length > 0 ? safe.slice(0, 180) : "file";
}

export function getExtension(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0 || dot === name.length - 1) return "";
  return name.slice(dot + 1).toLowerCase();
}

export function getBaseName(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot <= 0) return name;
  return name.slice(0, dot);
}

/**
 * Build an output name while preserving the useful original stem.
 * e.g. "My Document.pdf" + "compressed" + "pdf" -> "My Document-compressed.pdf"
 */
export function buildOutputName(
  originalName: string,
  suffix: string,
  extension: string,
): string {
  const base = getBaseName(sanitizeFileName(originalName));
  const ext = extension.replace(/^\./, "");
  return `${base}-${suffix}.${ext}`;
}

export function replaceExtension(name: string, extension: string): string {
  const base = getBaseName(sanitizeFileName(name));
  const ext = extension.replace(/^\./, "");
  return `${base}.${ext}`;
}
