import { describe, it, expect } from "vitest";
import {
  detectKind,
  validateFile,
  isLargeFile,
  HUGE_FILE_BYTES,
  LARGE_FILE_BYTES,
} from "@/lib/validation";

function makeFile(name: string, type: string, size: number): File {
  const file = new File(["x".repeat(Math.min(size, 1024))], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("validation", () => {
  describe("detectKind", () => {
    it("detects PDF by type", () => {
      expect(detectKind(makeFile("doc.pdf", "application/pdf", 1000))).toBe(
        "pdf",
      );
    });

    it("detects image by type", () => {
      expect(detectKind(makeFile("photo.jpg", "image/jpeg", 1000))).toBe(
        "image",
      );
    });

    it("detects PNG by extension", () => {
      expect(detectKind(makeFile("img.png", "", 1000))).toBe("image");
    });

    it("detects unknown file", () => {
      expect(detectKind(makeFile("data.bin", "application/octet-stream", 1000))).toBe(
        "unknown",
      );
    });
  });

  describe("validateFile", () => {
    it("accepts valid PDF", () => {
      const result = validateFile(
        makeFile("doc.pdf", "application/pdf", 1024),
        "pdf",
      );
      expect(result.ok).toBe(true);
    });

    it("accepts valid image", () => {
      const result = validateFile(
        makeFile("photo.jpg", "image/jpeg", 1024),
        "image",
      );
      expect(result.ok).toBe(true);
    });

    it("rejects image when PDF expected", () => {
      const result = validateFile(
        makeFile("photo.jpg", "image/jpeg", 1024),
        "pdf",
      );
      expect(result.ok).toBe(false);
      expect(result.error).toContain("PDF");
    });

    it("rejects empty file", () => {
      const result = validateFile(
        makeFile("doc.pdf", "application/pdf", 0),
        "pdf",
      );
      expect(result.ok).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("rejects huge file", () => {
      const result = validateFile(
        makeFile("big.pdf", "application/pdf", HUGE_FILE_BYTES + 1),
        "pdf",
      );
      expect(result.ok).toBe(false);
      expect(result.error).toContain("large");
    });

    it("accepts 'any' kind", () => {
      const result = validateFile(
        makeFile("doc.pdf", "application/pdf", 1024),
        "any",
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("isLargeFile", () => {
    it("returns true for large files", () => {
      expect(isLargeFile(makeFile("big.pdf", "application/pdf", LARGE_FILE_BYTES + 1))).toBe(true);
    });

    it("returns false for small files", () => {
      expect(isLargeFile(makeFile("small.pdf", "application/pdf", 1024))).toBe(false);
    });
  });
});
