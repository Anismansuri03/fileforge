import type {
  WorkerRequest,
  WorkerResponse,
  WorkerRequestType,
} from "./protocol";
import { isWorkerResponse } from "./protocol";
import type { ProgressState } from "@/components/processing/processing-view";

export interface WorkerResult<Meta = Record<string, unknown>> {
  data: Uint8Array;
  meta: Meta;
}

export interface RunWorkerOptions {
  onProgress?: (state: ProgressState) => void;
  signal?: AbortSignal;
}

let requestCounter = 0;

function nextId(): string {
  requestCounter += 1;
  return `req_${Date.now().toString(36)}_${requestCounter}`;
}

/**
 * Runs a single request against a fresh worker, streaming progress and
 * resolving with the produced bytes. The worker is terminated when the
 * job finishes (success, error, or cancel) so WASM memory cannot linger.
 */
export function runWorker<TPayload, Meta = Record<string, unknown>>(
  factory: () => Worker,
  type: WorkerRequestType,
  payload: TPayload,
  options: RunWorkerOptions = {},
): Promise<WorkerResult<Meta>> {
  const id = nextId();
  const worker = factory();

  return new Promise<WorkerResult<Meta>>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const succeed = (data: Uint8Array, meta: Meta) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ data, meta });
    };

    const onAbort = () => {
      worker.postMessage({ id, type: "cancel", payload: null });
      fail(new DOMException("Cancelled", "AbortError"));
    };

    if (options.signal) {
      if (options.signal.aborted) {
        onAbort();
        return;
      }
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    worker.onmessage = (event: MessageEvent<unknown>) => {
      if (!isWorkerResponse(event.data)) return;
      const response = event.data as WorkerResponse;
      if (response.id !== id) return;

      switch (response.type) {
        case "progress":
          options.onProgress?.({
            stage: response.stage,
            progress: response.progress,
            message: response.message,
          });
          break;
        case "result":
          succeed(response.data, (response.meta ?? {}) as Meta);
          break;
        case "error":
          if (response.message === "cancelled") {
            fail(new DOMException("Cancelled", "AbortError"));
          } else {
            fail(
              Object.assign(new Error(response.message), {
                detail: response.detail,
              }),
            );
          }
          break;
      }
    };

    worker.onerror = (event) => {
      fail(new Error(event.message || "Worker error"));
    };

    const request: WorkerRequest = {
      id,
      type,
      payload,
    };
    worker.postMessage(request);
  });
}

export function createImageWorker(): Worker {
  return new Worker(new URL("./image.worker.ts", import.meta.url), {
    type: "module",
  });
}

export function createPdfWorker(): Worker {
  return new Worker(new URL("./pdf.worker.ts", import.meta.url), {
    type: "module",
  });
}
