import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onChooseFile?: () => void;
  className?: string;
}

export function ErrorState({
  title = "We couldn't process this file",
  message,
  onRetry,
  onChooseFile,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 p-6",
        className,
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {message}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your original file has not been changed.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && (
              <Button size="sm" onClick={onRetry}>
                <RotateCcw className="h-3.5 w-3.5" />
                Try again
              </Button>
            )}
            {onChooseFile && (
              <Button size="sm" variant="outline" onClick={onChooseFile}>
                Choose another file
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
