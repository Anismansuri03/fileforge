import type { PdfCompressionEngine, PdfAnalysis, PdfCompressionOptions } from "./types";
import { searchTargetSize, CancelledError } from "@/lib/target-size/search";
import { pdfCandidateScore } from "@/lib/target-size/scoring";

export interface OptimizePdfOptions {
  targetBytes: number;
  /** Restrict the search to a maximum number of engine invocations. */
  maxAttempts?: number;
  analysis?: PdfAnalysis;
  signal?: AbortSignal;
  onProgress?: (progress: {
    stage: "analyzing" | "optimizing" | "searching" | "validating";
    progress: number;
    message: string;
  }) => void;
}

export interface OptimizedPdf {
  data: Uint8Array;
  targetReached: boolean;
  originalBytes: number;
  outputBytes: number;
  options: PdfCompressionOptions;
}

interface PdfCandidate {
  imageQuality: number;
  dpi: number;
  grayscale: boolean;
}

/**
 * Candidate ladder, ordered from highest quality to lowest. Text and
 * vector content are always preserved; only raster image handling and
 * structural options change.
 */
function buildPdfCandidates(_analysis?: PdfAnalysis): PdfCandidate[] {
  return [
    // High quality
    { imageQuality: 88, dpi: 200, grayscale: false },
    { imageQuality: 82, dpi: 180, grayscale: false },
    { imageQuality: 76, dpi: 160, grayscale: false },
    // Medium quality
    { imageQuality: 70, dpi: 144, grayscale: false },
    { imageQuality: 64, dpi: 128, grayscale: false },
    { imageQuality: 58, dpi: 112, grayscale: false },
    { imageQuality: 52, dpi: 96, grayscale: false },
    // Aggressive
    { imageQuality: 46, dpi: 84, grayscale: false },
    { imageQuality: 40, dpi: 72, grayscale: false },
    { imageQuality: 34, dpi: 72, grayscale: false },
    { imageQuality: 28, dpi: 60, grayscale: false },
    // Very aggressive — with grayscale
    { imageQuality: 22, dpi: 60, grayscale: true },
    { imageQuality: 16, dpi: 48, grayscale: true },
    { imageQuality: 12, dpi: 48, grayscale: true },
    // Ultra aggressive — smallest possible
    { imageQuality: 8, dpi: 36, grayscale: true },
    { imageQuality: 5, dpi: 30, grayscale: true },
    { imageQuality: 3, dpi: 24, grayscale: true },
    { imageQuality: 1, dpi: 24, grayscale: true },
  ];
}

export async function optimizePdf(
  input: Uint8Array,
  engine: PdfCompressionEngine,
  options: OptimizePdfOptions,
): Promise<OptimizedPdf> {
  const { signal, onProgress } = options;

  const abortIfNeeded = () => {
    if (signal?.aborted) throw new CancelledError();
  };

  onProgress?.({
    stage: "analyzing",
    progress: 5,
    message: "Analyzing document",
  });

  const analysis = options.analysis ?? (await engine.analyze(input));
  abortIfNeeded();

  onProgress?.({
    stage: "analyzing",
    progress: 12,
    message:
      analysis.imageCount > 0
        ? `Found ${analysis.imageCount} image${analysis.imageCount === 1 ? "" : "s"}`
        : "No embedded images found",
  });

  const candidates = buildPdfCandidates(analysis);

  // Measured outputs are cached so the final result never needs to be
  // produced twice.
  const measured = new Map<number, Uint8Array>();

  const search = await searchTargetSize({
    targetBytes: options.targetBytes,
    candidates,
    maxAttempts: options.maxAttempts ?? candidates.length,
    signal,
    score: (candidate, _index, bytes) => {
      const qualityScore = pdfCandidateScore({
        imageQuality: candidate.imageQuality,
        dpi: candidate.dpi,
        preservesText: true,
        preservesFonts: true,
      });
      if (bytes <= options.targetBytes) {
        // Fitting candidates: reward quality but also closeness to target.
        // Closeness: 1.0 = exactly at target, 0.5 = half the target.
        const closeness = bytes / options.targetBytes;
        return qualityScore * 0.6 + closeness * 0.4;
      }
      // Over-budget: penalize by how far over, but still reward quality.
      const overRatio = options.targetBytes / bytes; // < 1
      return qualityScore * 0.4 + overRatio * 0.6;
    },
    onAttempt: (attempt, total) => {
      onProgress?.({
        stage: "searching",
        progress: 15 + Math.min(75, (attempt / total) * 75),
        message: `Testing compression setting ${attempt} of ${total}`,
      });
    },
    measure: async (candidate, index) => {
      abortIfNeeded();
      const result = await engine.compress(input, {
        imageQuality: candidate.imageQuality,
        dpi: candidate.dpi,
        grayscale: candidate.grayscale,
        removeMetadata: true,
        optimizeFonts: true,
        useObjectStreams: true,
        preserveText: true,
      });
      measured.set(index, result);
      return result.byteLength;
    },
  });

  abortIfNeeded();

  const chosen = search.bestWithinTarget ?? search.best;
  if (!chosen) {
    throw new Error("No compression candidate could be produced");
  }

  const chosenIndex = candidates.indexOf(chosen.config);
  let output = measured.get(chosenIndex);
  if (!output) {
    output = await engine.compress(input, {
      imageQuality: chosen.config.imageQuality,
      dpi: chosen.config.dpi,
      grayscale: chosen.config.grayscale,
      removeMetadata: true,
      optimizeFonts: true,
      useObjectStreams: true,
      preserveText: true,
    });
  }

  onProgress?.({
    stage: "validating",
    progress: 97,
    message: "Measuring final file size",
  });

  const targetReached = output.byteLength <= options.targetBytes;

  return {
    data: output,
    targetReached,
    originalBytes: input.byteLength,
    outputBytes: output.byteLength,
    options: {
      imageQuality: chosen.config.imageQuality,
      dpi: chosen.config.dpi,
      grayscale: chosen.config.grayscale,
      removeMetadata: true,
      optimizeFonts: true,
      useObjectStreams: true,
      preserveText: true,
    },
  };
}
