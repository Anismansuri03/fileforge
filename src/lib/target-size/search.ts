/**
 * Generic target-size optimizer.
 *
 * This is the heart of FileForge. Given an encoder that maps a
 * "configuration" to a produced byte size, it searches for the
 * highest-quality configuration whose measured output is <= target.
 *
 * It NEVER estimates sizes: every candidate configuration is actually
 * encoded and its real byte length is measured.
 */

export interface CandidateResult<TConfig> {
  config: TConfig;
  bytes: number;
  qualityScore: number;
}

export interface SearchOptions<TConfig> {
  targetBytes: number;
  /** Ordered from best quality (index 0) to worst quality. */
  candidates: TConfig[];
  /** Runs the real encoder and returns the produced bytes. */
  measure: (config: TConfig, index: number) => Promise<number>;
  /** Optional quality score for tie-breaking; higher is better. */
  score?: (config: TConfig, index: number, bytes: number) => number;
  /** Hard cap on encoder invocations. */
  maxAttempts?: number;
  /** Invoked before each measurement, for progress reporting. */
  onAttempt?: (attempt: number, total: number) => void;
  /** Cooperative cancellation. */
  signal?: AbortSignal;
}

export interface SearchResult<TConfig> {
  /** Best measured result, if any candidate was evaluated. */
  best: CandidateResult<TConfig> | null;
  /** Highest-quality result satisfying the target, if any. */
  bestWithinTarget: CandidateResult<TConfig> | null;
  targetReached: boolean;
  attempts: number;
  exhaustedBudget: boolean;
}

export class CancelledError extends Error {
  constructor() {
    super("Processing cancelled");
    this.name = "CancelledError";
  }
}

function abortIfNeeded(signal?: AbortSignal) {
  if (signal?.aborted) throw new CancelledError();
}

/**
 * Search the candidate list (best-quality first) for the first one that
 * fits within the target. Because candidates are ordered by descending
 * quality, the first in-budget candidate is the highest quality that fits.
 *
 * When a `score` function is supplied, all in-budget candidates found so
 * far are compared and the highest score wins (allowing non-monotonic
 * encoders to still select the best result).
 */
export async function searchTargetSize<TConfig>(
  options: SearchOptions<TConfig>,
): Promise<SearchResult<TConfig>> {
  const {
    targetBytes,
    candidates,
    measure,
    score,
    maxAttempts = candidates.length,
    onAttempt,
    signal,
  } = options;

  let attempts = 0;
  let best: CandidateResult<TConfig> | null = null;
  let bestWithinTarget: CandidateResult<TConfig> | null = null;
  let exhaustedBudget = false;

  for (let i = 0; i < candidates.length; i += 1) {
    abortIfNeeded(signal);

    if (attempts >= maxAttempts) {
      exhaustedBudget = true;
      break;
    }

    const config = candidates[i];
    onAttempt?.(attempts + 1, Math.min(maxAttempts, candidates.length));
    const bytes = await measure(config, i);
    attempts += 1;

    const qualityScore = score ? score(config, i, bytes) : candidates.length - i;
    const candidate: CandidateResult<TConfig> = { config, bytes, qualityScore };

    if (best === null || bytes < best.bytes) {
      best = candidate;
    }

    if (bytes <= targetBytes) {
      if (
        bestWithinTarget === null ||
        qualityScore > bestWithinTarget.qualityScore
      ) {
        bestWithinTarget = candidate;
      }
      // Candidates are ordered best-first. Once we have a fitting result we
      // can keep checking remaining candidates only if a score function is
      // provided (they may score higher); otherwise stop early.
      if (!score) break;
    }
  }

  return {
    best,
    bestWithinTarget,
    targetReached: bestWithinTarget !== null,
    attempts,
    exhaustedBudget,
  };
}

/**
 * Binary-search a numeric quality parameter over an already-measured
 * monotonic range. Useful when quality maps predictably to size.
 */
export function nextBinaryQuality(
  low: number,
  high: number,
  outputAtLow: number,
  targetBytes: number,
): number {
  if (outputAtLow <= targetBytes) return low;
  return Math.max(low, Math.round((low + high) / 2));
}
