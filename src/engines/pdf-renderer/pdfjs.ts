import * as pdfjsLib from "pdfjs-dist";
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export { pdfjsLib };

export function makePdfLoadOptions(data: Uint8Array) {
  // Copy into a fresh buffer so pdf.js can transfer ownership safely.
  const buffer = data.slice().buffer as ArrayBuffer;
  return {
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableAutoFetch: true,
    disableStream: true,
  };
}

export async function loadPdfDocument(data: Uint8Array) {
  return pdfjsLib.getDocument(makePdfLoadOptions(data)).promise;
}
