import { useCallback, useRef, useState } from "react";
import type { ProgressState } from "@/components/processing/processing-view";

export type JobStatus = "idle" | "processing" | "done" | "error";

export interface JobError {
  message: string;
  detail?: string;
}

interface UseToolJobReturn<TResult> {
  status: JobStatus;
  progress: ProgressState;
  result: TResult | null;
  error: JobError | null;
  isCancelling: boolean;
  start: (
    runner: (helpers: {
      onProgress: (state: ProgressState) => void;
      signal: AbortSignal;
    }) => Promise<TResult>,
  ) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

const INITIAL_PROGRESS: ProgressState = {
  stage: "analyzing",
  progress: 0,
  message: "Preparing",
};

/**
 * Generic async job controller used by every tool. Handles progress,
 * cancellation and user-friendly error normalization.
 */
export function useToolJob<TResult>(): UseToolJobReturn<TResult> {
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [result, setResult] = useState<TResult | null>(null);
  const [error, setError] = useState<JobError | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    if (controllerRef.current) {
      setIsCancelling(true);
      controllerRef.current.abort();
    }
  }, []);

  const reset = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setProgress(INITIAL_PROGRESS);
    setResult(null);
    setError(null);
    setIsCancelling(false);
  }, []);

  const start = useCallback(
    async (
      runner: (helpers: {
        onProgress: (state: ProgressState) => void;
        signal: AbortSignal;
      }) => Promise<TResult>,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("processing");
      setError(null);
      setResult(null);
      setIsCancelling(false);
      setProgress(INITIAL_PROGRESS);

      try {
        const value = await runner({
          onProgress: setProgress,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setResult(value);
        setStatus("done");
      } catch (caught) {
        if (
          controller.signal.aborted ||
          (caught instanceof DOMException && caught.name === "AbortError")
        ) {
          setStatus("idle");
          setProgress(INITIAL_PROGRESS);
          return;
        }
        const detail =
          caught && typeof caught === "object" && "detail" in caught
            ? String((caught as { detail?: unknown }).detail ?? "")
            : undefined;
        setError({
          message:
            caught instanceof Error
              ? caught.message
              : "Something went wrong while processing this file.",
          detail,
        });
        setStatus("error");
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        setIsCancelling(false);
      }
    },
    [],
  );

  return {
    status,
    progress,
    result,
    error,
    isCancelling,
    start,
    cancel,
    reset,
  };
}
