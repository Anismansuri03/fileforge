import { describe, it, expect } from "vitest";
import {
  searchTargetSize,
  nextBinaryQuality,
  CancelledError,
} from "@/lib/target-size/search";

describe("target-size search", () => {
  describe("searchTargetSize", () => {
    it("returns the first fitting candidate", async () => {
      const result = await searchTargetSize({
        targetBytes: 100,
        candidates: ["a", "b", "c"],
        measure: async (config) => {
          const sizes: Record<string, number> = { a: 200, b: 80, c: 50 };
          return sizes[config];
        },
      });

      expect(result.targetReached).toBe(true);
      expect(result.bestWithinTarget?.config).toBe("b");
      expect(result.bestWithinTarget?.bytes).toBe(80);
    });

    it("returns targetReached false when nothing fits", async () => {
      const result = await searchTargetSize({
        targetBytes: 10,
        candidates: ["a", "b"],
        measure: async (config) => {
          const sizes: Record<string, number> = { a: 200, b: 100 };
          return sizes[config];
        },
      });

      expect(result.targetReached).toBe(false);
      expect(result.bestWithinTarget).toBeNull();
      expect(result.best?.bytes).toBe(100);
    });

    it("picks highest score when score function provided", async () => {
      const result = await searchTargetSize({
        targetBytes: 100,
        candidates: ["a", "b", "c"],
        measure: async (config) => {
          const sizes: Record<string, number> = { a: 90, b: 60, c: 30 };
          return sizes[config];
        },
        score: (config) => (config === "b" ? 100 : 50),
      });

      expect(result.targetReached).toBe(true);
      expect(result.bestWithinTarget?.config).toBe("b");
      expect(result.bestWithinTarget?.qualityScore).toBe(100);
    });

    it("stops early when maxAttempts reached", async () => {
      const result = await searchTargetSize({
        targetBytes: 10,
        candidates: ["a", "b", "c"],
        measure: async () => 50,
        maxAttempts: 2,
      });

      expect(result.attempts).toBe(2);
      expect(result.exhaustedBudget).toBe(true);
    });

    it("calls onAttempt with progress", async () => {
      const progress: Array<[number, number]> = [];
      await searchTargetSize({
        targetBytes: 100,
        candidates: ["a", "b", "c"],
        measure: async () => 50,
        onAttempt: (attempt, total) => progress.push([attempt, total]),
      });

      expect(progress.length).toBe(1);
      expect(progress[0][0]).toBe(1);
      expect(progress[0][1]).toBe(3);
    });

    it("handles cancellation via AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        searchTargetSize({
          targetBytes: 100,
          candidates: ["a"],
          measure: async () => 50,
          signal: controller.signal,
        }),
      ).rejects.toThrow(CancelledError);
    });

    it("handles empty candidates", async () => {
      const result = await searchTargetSize({
        targetBytes: 100,
        candidates: [],
        measure: async () => 0,
      });

      expect(result.best).toBeNull();
      expect(result.bestWithinTarget).toBeNull();
      expect(result.targetReached).toBe(false);
      expect(result.attempts).toBe(0);
    });
  });

  describe("nextBinaryQuality", () => {
    it("returns low when already within target", () => {
      expect(nextBinaryQuality(0, 100, 50, 100)).toBe(0);
    });

    it("returns midpoint when above target", () => {
      expect(nextBinaryQuality(0, 100, 200, 100)).toBe(50);
    });
  });
});
