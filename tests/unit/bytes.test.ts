import { describe, it, expect } from "vitest";
import {
  toBytes,
  fromBytes,
  formatBytes,
  parseTargetSize,
  formatPercent,
  BYTES_PER_MB,
} from "@/lib/bytes";

describe("bytes", () => {
  describe("toBytes", () => {
    it("converts KB to bytes", () => {
      expect(toBytes({ value: 1, unit: "KB" })).toBe(1024);
    });

    it("converts MB to bytes", () => {
      expect(toBytes({ value: 1, unit: "MB" })).toBe(1048576);
    });

    it("truncates fractional bytes", () => {
      expect(toBytes({ value: 0.5, unit: "KB" })).toBe(512);
    });

    it("handles zero", () => {
      expect(toBytes({ value: 0, unit: "KB" })).toBe(0);
    });
  });

  describe("fromBytes", () => {
    it("converts bytes to KB", () => {
      expect(fromBytes(2048, "KB")).toBeCloseTo(2);
    });

    it("converts bytes to MB", () => {
      expect(fromBytes(1048576, "MB")).toBeCloseTo(1);
    });

    it("defaults to KB", () => {
      expect(fromBytes(1024)).toBeCloseTo(1);
    });
  });

  describe("formatBytes", () => {
    it("formats bytes", () => {
      expect(formatBytes(512)).toBe("512 B");
    });

    it("formats KB", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });

    it("formats MB", () => {
      expect(formatBytes(2 * BYTES_PER_MB)).toBe("2.00 MB");
    });

    it("formats GB", () => {
      expect(formatBytes(2 * 1024 * BYTES_PER_MB)).toBe("2.00 GB");
    });

    it("returns 0 B for negative input", () => {
      expect(formatBytes(-100)).toBe("0 B");
    });

    it("returns 0 B for NaN", () => {
      expect(formatBytes(NaN)).toBe("0 B");
    });
  });

  describe("parseTargetSize", () => {
    it("parses KB input", () => {
      expect(parseTargetSize("500", "KB")).toBe(512000);
    });

    it("parses MB input", () => {
      expect(parseTargetSize("2", "MB")).toBe(2097152);
    });

    it("parses numeric input", () => {
      expect(parseTargetSize(100, "KB")).toBe(102400);
    });

    it("returns null for zero", () => {
      expect(parseTargetSize("0", "KB")).toBeNull();
    });

    it("returns null for negative", () => {
      expect(parseTargetSize("-5", "KB")).toBeNull();
    });

    it("returns null for NaN", () => {
      expect(parseTargetSize("abc", "KB")).toBeNull();
    });
  });

  describe("formatPercent", () => {
    it("calculates reduction percentage", () => {
      expect(formatPercent(1000, 500)).toBe("50.0%");
    });

    it("returns 0% when from is zero", () => {
      expect(formatPercent(0, 0)).toBe("0%");
    });

    it("shows negative for increase", () => {
      expect(formatPercent(100, 200)).toBe("-100.0%");
    });
  });
});
