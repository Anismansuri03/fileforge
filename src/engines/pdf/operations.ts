import { degrees, PDFDocument } from "pdf-lib";

export interface PageRange {
  start: number;
  end: number;
}

/** Parse a human page-range string like "1-3,5,8-10" into zero-based indices. */
export function parsePageRanges(
  input: string,
  pageCount: number,
): number[] {
  const result = new Set<number>();
  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) continue;
    const start = Number.parseInt(match[1], 10);
    const end = match[2] ? Number.parseInt(match[2], 10) : start;
    const lo = Math.max(1, Math.min(start, end));
    const hi = Math.min(pageCount, Math.max(start, end));
    for (let page = lo; page <= hi; page += 1) {
      result.add(page - 1);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

export async function mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const input of inputs) {
    const doc = await PDFDocument.load(input, {
      ignoreEncryption: true,
      updateMetadata: false,
    });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) merged.addPage(page);
  }
  return merged.save({ useObjectStreams: true });
}

export async function splitPdfByRanges(
  input: Uint8Array,
  ranges: PageRange[],
): Promise<Array<{ name: string; data: Uint8Array }>> {
  const source = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pageCount = source.getPageCount();
  const outputs: Array<{ name: string; data: Uint8Array }> = [];

  for (const range of ranges) {
    const indices: number[] = [];
    const start = Math.max(1, Math.min(range.start, range.end));
    const end = Math.min(pageCount, Math.max(range.start, range.end));
    for (let page = start; page <= end; page += 1) indices.push(page - 1);
    if (indices.length === 0) continue;

    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(source, indices);
    for (const page of pages) doc.addPage(page);
    outputs.push({
      name: `pages-${start}-${end}.pdf`,
      data: await doc.save({ useObjectStreams: true }),
    });
  }

  return outputs;
}

export async function splitPdfEveryN(
  input: Uint8Array,
  n: number,
): Promise<Array<{ name: string; data: Uint8Array }>> {
  const source = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pageCount = source.getPageCount();
  const size = Math.max(1, Math.floor(n));
  const ranges: PageRange[] = [];
  for (let start = 1; start <= pageCount; start += size) {
    ranges.push({ start, end: Math.min(pageCount, start + size - 1) });
  }
  return splitPdfByRanges(input, ranges);
}

export async function extractPages(
  input: Uint8Array,
  indices: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pageCount = source.getPageCount();
  const valid = indices
    .filter((i) => i >= 0 && i < pageCount)
    .sort((a, b) => a - b);
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(source, valid);
  for (const page of pages) doc.addPage(page);
  return doc.save({ useObjectStreams: true });
}

export async function deletePages(
  input: Uint8Array,
  indices: number[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const toDelete = new Set(indices);
  for (let i = doc.getPageCount() - 1; i >= 0; i -= 1) {
    if (toDelete.has(i)) doc.removePage(i);
  }
  if (doc.getPageCount() === 0) {
    throw new Error("A PDF must contain at least one page.");
  }
  return doc.save({ useObjectStreams: true });
}

export async function reorderPages(
  input: Uint8Array,
  order: number[],
  rotations?: number[],
): Promise<Uint8Array> {
  const source = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pageCount = source.getPageCount();
  const normalized = order.filter((i) => i >= 0 && i < pageCount);
  // Append any pages omitted from the order to avoid data loss.
  const seen = new Set(normalized);
  for (let i = 0; i < pageCount; i += 1) {
    if (!seen.has(i)) normalized.push(i);
  }
  const doc = await PDFDocument.create();
  const pages = await doc.copyPages(source, normalized);
  for (let i = 0; i < pages.length; i += 1) {
    const page = pages[i];
    doc.addPage(page);
    if (rotations && i < rotations.length && rotations[i] !== 0) {
      const current = page.getRotation().angle;
      page.setRotation(degrees((current + rotations[i]) % 360));
    }
  }
  return doc.save({ useObjectStreams: true });
}

export async function rotatePages(
  input: Uint8Array,
  indices: number[] | "all",
  angle: 90 | 180 | 270,
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(input, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const pages = doc.getPages();
  const targets =
    indices === "all"
      ? pages.map((_, i) => i)
      : indices.filter((i) => i >= 0 && i < pages.length);

  for (const index of targets) {
    const page = pages[index];
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  }

  return doc.save({ useObjectStreams: true });
}

export async function imagesToPdf(
  images: Array<{ data: Uint8Array; mime: string }>,
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (const image of images) {
    let embedded;
    if (image.mime === "image/png") {
      embedded = await doc.embedPng(image.data);
    } else if (image.mime === "image/jpeg") {
      embedded = await doc.embedJpg(image.data);
    } else {
      // Convert other formats to PNG via an OffscreenCanvas.
      const blob = new Blob([image.data.slice().buffer as ArrayBuffer], {
        type: image.mime,
      });
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Unable to process image");
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      const pngBlob = await canvas.convertToBlob({ type: "image/png" });
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      embedded = await doc.embedPng(pngBytes);
    }

    const maxWidth = 595;
    const maxHeight = 842;
    const scale = Math.min(
      maxWidth / embedded.width,
      maxHeight / embedded.height,
      1,
    );
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const page = doc.addPage([maxWidth, maxHeight]);
    page.drawImage(embedded, {
      x: (maxWidth - width) / 2,
      y: (maxHeight - height) / 2,
      width,
      height,
    });
  }
  return doc.save({ useObjectStreams: true });
}

export { PDFDocument };

export async function addPagesToPdf(
  base: Uint8Array,
  inserts: Array<{ data: Uint8Array; type: "pdf" | "image"; mime?: string }>,
  position: number,
): Promise<Uint8Array> {
  const baseDoc = await PDFDocument.load(base, {
    ignoreEncryption: true,
    updateMetadata: false,
  });

  const insertPos = Math.min(position, baseDoc.getPageCount());

  // Build the final document by copying base pages and inserting new pages
  const resultDoc = await PDFDocument.create();
  const basePageCount = baseDoc.getPageCount();

  for (let i = 0; i <= basePageCount; i++) {
    // Insert new pages at the specified position
    if (i === insertPos) {
      for (const insert of inserts) {
        if (insert.type === "pdf") {
          const srcDoc = await PDFDocument.load(insert.data, {
            ignoreEncryption: true,
            updateMetadata: false,
          });
          const copiedPages = await resultDoc.copyPages(
            srcDoc,
            srcDoc.getPageIndices(),
          );
          for (const page of copiedPages) resultDoc.addPage(page);
        } else {
          let embedded;
          if (insert.mime === "image/png") {
            embedded = await resultDoc.embedPng(insert.data);
          } else if (insert.mime === "image/jpeg") {
            embedded = await resultDoc.embedJpg(insert.data);
          } else {
            const blob = new Blob(
              [insert.data.slice().buffer as ArrayBuffer],
              { type: insert.mime ?? "image/png" },
            );
            const bitmap = await createImageBitmap(blob);
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Unable to process image");
            ctx.drawImage(bitmap, 0, 0);
            bitmap.close();
            const pngBlob = await canvas.convertToBlob({ type: "image/png" });
            const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
            embedded = await resultDoc.embedPng(pngBytes);
          }

          const maxWidth = 595;
          const maxHeight = 842;
          const scale = Math.min(
            maxWidth / embedded.width,
            maxHeight / embedded.height,
            1,
          );
          const width = embedded.width * scale;
          const height = embedded.height * scale;
          const page = resultDoc.addPage([maxWidth, maxHeight]);
          page.drawImage(embedded, {
            x: (maxWidth - width) / 2,
            y: (maxHeight - height) / 2,
            width,
            height,
          });
        }
      }
    }
    // Copy base page
    if (i < basePageCount) {
      const [copiedPage] = await resultDoc.copyPages(baseDoc, [i]);
      resultDoc.addPage(copiedPage);
    }
  }

  return resultDoc.save({ useObjectStreams: true });
}
