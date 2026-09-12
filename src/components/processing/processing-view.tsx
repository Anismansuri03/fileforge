import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ProcessingStage =
  | "analyzing"
  | "optimizing"
  | "encoding"
  | "searching"
  | "validating"
  | "complete";

export interface ProgressState {
  stage: ProcessingStage;
  progress: number;
  message: string;
}

const STAGE_ORDER: ProcessingStage[] = [
  "analyzing",
  "optimizing",
  "searching",
  "validating",
];

const STAGE_LABELS: Record<ProcessingStage, string> = {
  analyzing: "Analyzing file",
  optimizing: "Optimizing contents",
  encoding: "Encoding output",
  searching: "Finding best compression",
  validating: "Checking target size",
  complete: "Complete",
};

function stageIndex(stage: ProcessingStage): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? 0 : idx;
}

interface ProcessingViewProps {
  title: string;
  state: ProgressState;
  onCancel?: () => void;
  className?: string;
}

export function ProcessingView({
  title,
  state,
  onCancel,
  className,
}: ProcessingViewProps) {
  const activeIndex = stageIndex(state.stage);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm sm:p-8",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <Loader2
          className="h-4 w-4 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      </div>

      <ol className="mt-6 space-y-3">
        {STAGE_ORDER.map((stage, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <li
              key={stage}
              className={cn(
                "flex items-center gap-3 text-sm",
                done && "text-muted-foreground",
                active && "text-foreground",
                !done && !active && "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border",
                  done && "border-success/30 bg-success/10 text-success",
                  active && "border-foreground/30 bg-foreground text-background",
                )}
                aria-hidden="true"
              >
                {done ? (
                  <Check className="h-3 w-3" />
                ) : active ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-background" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-border" />
                )}
              </span>
              <span>{STAGE_LABELS[stage]}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 space-y-2">
        <Progress
          value={Math.round(Math.min(100, Math.max(0, state.progress)))}
          aria-label="Processing progress"
        />
        <p className="text-xs text-muted-foreground">{state.message}</p>
      </div>

      {onCancel && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
