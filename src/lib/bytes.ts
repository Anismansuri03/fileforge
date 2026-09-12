/**
 * Byte conventions used consistently throughout FileForge.
 *
 * 1 KB = 1024 bytes
 * 1 MB = 1024 * 1024 bytes
 */
export const BYTES_PER_KB = 1024;
export const BYTES_PER_MB = 1024 * 1024;

export type SizeUnit = "KB" | "MB";

export interface SizeValue {
  value: number;
  unit: SizeUnit;
}

export function toBytes(size: SizeValue): number {
  const factor = size.unit === "MB" ? BYTES_PER_MB : BYTES_PER_KB;
  return Math.floor(size.value * factor);
}

export function fromBytes(bytes: number, unit: SizeUnit = "KB"): number {
  const factor = unit === "MB" ? BYTES_PER_MB : BYTES_PER_KB;
  return bytes / factor;
}

/**
 * Human readable formatting with sensible unit selection.
 * Uses 1024-based units (KB/MB/GB).
 */
export function formatBytes(bytes: number, fractionDigits?: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < BYTES_PER_KB) {
    return `${Math.round(bytes)} B`;
  }
  const units: Array<[number, string]> = [
    [BYTES_PER_MB, "MB"],
    [1024 * BYTES_PER_MB, "GB"],
  ];
  if (bytes < BYTES_PER_MB) {
    const v = bytes / BYTES_PER_KB;
    return `${v.toFixed(fractionDigits ?? 1)} KB`;
  }
  for (let i = units.length - 1; i >= 0; i -= 1) {
    const [limit, label] = units[i];
    if (bytes >= limit) {
      const v = bytes / limit;
      return `${v.toFixed(fractionDigits ?? 2)} ${label}`;
    }
  }
  const v = bytes / BYTES_PER_MB;
  return `${v.toFixed(fractionDigits ?? 2)} MB`;
}

/**
 * Parse a user-provided target size into bytes.
 * Returns null when the input is not a valid positive finite number.
 */
export function parseTargetSize(
  value: string | number,
  unit: SizeUnit,
): number | null {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return toBytes({ value: num, unit });
}

export function formatPercent(from: number, to: number): string {
  if (from <= 0) return "0%";
  const change = ((from - to) / from) * 100;
  return `${change.toFixed(1)}%`;
}
