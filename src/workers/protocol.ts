/** Shared worker protocol used by all processing workers. */

export type WorkerRequestType =
  | "image.compress"
  | "image.resize"
  | "image.convert"
  | "pdf.compress"
  | "pdf.analyze"
  | "pdf.merge"
  | "pdf.split"
  | "pdf.rotate"
  | "pdf.delete-pages"
  | "pdf.extract-pages"
  | "pdf.reorder"
  | "pdf.images-to-pdf"
  | "pdf.add-pages"
  | "cancel";

export interface WorkerRequest<TType extends string = WorkerRequestType, TPayload = unknown> {
  id: string;
  type: TType;
  payload: TPayload;
}

export type WorkerProgressStage =
  | "analyzing"
  | "optimizing"
  | "encoding"
  | "searching"
  | "validating"
  | "complete";

export type WorkerResponse =
  | {
      id: string;
      type: "progress";
      stage: WorkerProgressStage;
      progress: number;
      message: string;
    }
  | {
      id: string;
      type: "result";
      data: Uint8Array;
      meta?: Record<string, unknown>;
    }
  | {
      id: string;
      type: "error";
      message: string;
      detail?: string;
    };

export function isWorkerResponse(value: unknown): value is WorkerResponse {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: unknown }).type;
  return type === "progress" || type === "result" || type === "error";
}
