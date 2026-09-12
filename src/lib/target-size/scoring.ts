/**
 * Quality scoring used to rank candidate results once they fit the target.
 *
 * The score is deliberately simple and documented:
 *
 *   score = qualityWeight + resolutionWeight
 *
 * where each weight is normalized to [0, 1]. Higher is better. This lets
 * the engine prefer a slightly larger but sharper/cleaner output over an
 * aggressive, artifact-heavy one when both satisfy the target.
 */

export function imageCandidateScore(input: {
  quality: number;
  scale: number;
}): number {
  const qualityWeight = clamp01(input.quality / 100);
  const resolutionWeight = clamp01(input.scale);
  return qualityWeight * 0.65 + resolutionWeight * 0.35;
}

export interface PdfScoreInput {
  /** 0-100 image quality. */
  imageQuality: number;
  /** Downsampling DPI, lower = more loss. */
  dpi: number;
  /** Whether text/vector structure is preserved. */
  preservesText: boolean;
  /** Whether embedded fonts are retained. */
  preservesFonts: boolean;
}

export function pdfCandidateScore(input: PdfScoreInput): number {
  const qualityWeight = clamp01(input.imageQuality / 100);
  const dpiWeight = clamp01(input.dpi / 300);
  const textWeight = input.preservesText ? 1 : 0;
  const fontWeight = input.preservesFonts ? 1 : 0;
  return (
    qualityWeight * 0.3 +
    dpiWeight * 0.3 +
    textWeight * 0.25 +
    fontWeight * 0.15
  );
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
