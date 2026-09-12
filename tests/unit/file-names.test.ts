import { describe, it, expect } from "vitest";
import {
  sanitizeFileName,
  getExtension,
  getBaseName,
  buildOutputName,
  replaceExtension,
} from "@/lib/file-names";

describe("file-names", () => {
  describe("sanitizeFileName", () => {
    it("removes invalid characters", () => {
      expect(sanitizeFileName('file<>:"/\\|?*.txt')).toBe("file.txt");
    });

    it("collapses whitespace", () => {
      expect(sanitizeFileName("my   file.txt")).toBe("my file.txt");
    });

    it("strips leading dots", () => {
      expect(sanitizeFileName("...hidden.txt")).toBe("hidden.txt");
    });

    it("truncates long names to 180 chars", () => {
      const long = "a".repeat(250);
      expect(sanitizeFileName(long)).toHaveLength(180);
    });

    it("returns 'file' for empty result", () => {
      expect(sanitizeFileName("\x00\x01\x02")).toBe("file");
    });
  });

  describe("getExtension", () => {
    it("returns lowercase extension", () => {
      expect(getExtension("Photo.JPG")).toBe("jpg");
    });

    it("returns empty string for no extension", () => {
      expect(getExtension("Makefile")).toBe("");
    });

    it("returns empty string for dot-only extension", () => {
      expect(getExtension("file.")).toBe("");
    });

    it("handles double extension", () => {
      expect(getExtension("archive.tar.gz")).toBe("gz");
    });
  });

  describe("getBaseName", () => {
    it("returns name without extension", () => {
      expect(getBaseName("doc.pdf")).toBe("doc");
    });

    it("returns full name when no dot", () => {
      expect(getBaseName("README")).toBe("README");
    });

    it("handles leading dot", () => {
      expect(getBaseName(".gitignore")).toBe(".gitignore");
    });
  });

  describe("buildOutputName", () => {
    it("builds name with suffix and extension", () => {
      expect(buildOutputName("photo.jpg", "compressed", "jpg")).toBe(
        "photo-compressed.jpg",
      );
    });

    it("sanitizes original name", () => {
      expect(buildOutputName("my<>file.png", "resized", "png")).toBe(
        "myfile-resized.png",
      );
    });

    it("strips leading dots from extension", () => {
      expect(buildOutputName("doc.pdf", "merged", ".pdf")).toBe(
        "doc-merged.pdf",
      );
    });
  });

  describe("replaceExtension", () => {
    it("replaces extension", () => {
      expect(replaceExtension("photo.jpg", "webp")).toBe("photo.webp");
    });

    it("handles leading dot", () => {
      expect(replaceExtension("doc.pdf", ".docx")).toBe("doc.docx");
    });
  });
});
