/**
 * Candidate generation for image compression.
 *
 * Order matters: index 0 is the highest quality candidate. The search
 * walks the list in order and returns the first (best) candidate that
 * fits within the target.
 */

export interface ImageCandidate {
  /** Encoder quality, 1-100. */
  quality: number;
  /** Scale factor applied to the source dimensions (1 = original). */
  scale: number;
}

/**
 * Build a candidate ladder that gracefully trades quality for size.
 *
 * Strategy:
 *  1. Sweep quality down at full resolution.
 *  2. Then reduce dimensions step by step, restarting from a high quality
 *     so the result stays visually sharp at the smaller size.
 *
 * The list is intentionally bounded so the search cannot run forever.
 */
export function buildImageCandidates(options?: {
  minQuality?: number;
  allowDownscale?: boolean;
}): ImageCandidate[] {
  const minQuality = options?.minQuality ?? 45;
  const allowDownscale = options?.allowDownscale ?? true;

  const qualities: number[] = [];
  for (let q = 92; q >= minQuality; q -= 6) qualities.push(q);
  if (qualities[qualities.length - 1] !== minQuality) qualities.push(minQuality);

  const candidates: ImageCandidate[] = qualities.map((quality) => ({
    quality,
    scale: 1,
  }));

  if (allowDownscale) {
    const scales = [0.8, 0.65, 0.5, 0.4, 0.3];
    for (const scale of scales) {
      candidates.push({ quality: 82, scale });
      candidates.push({ quality: 70, scale });
      candidates.push({ quality: 58, scale });
    }
  }

  return candidates;
}

export function qualityToLabel(quality: number): string {
  if (quality >= 85) return "High";
  if (quality >= 70) return "Balanced";
  if (quality >= 55) return "Smaller";
  return "Smallest";
}
