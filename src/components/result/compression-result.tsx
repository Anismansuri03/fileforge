import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Check,
  Download,
  Image as ImageIcon,
  Layers,
  RotateCcw,
  Scissors,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatBytes, formatPercent } from "@/lib/bytes";
import { cn } from "@/lib/utils";

export interface ResultSummary {
  originalBytes: number;
  outputBytes: number;
  targetBytes: number | null;
  targetReached: boolean;
  fileName: string;
  /** Optional detail line, e.g. output dimensions. */
  detail?: string;
}

export interface NextAction {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompressionResultProps {
  result: ResultSummary;
  onDownload: () => void;
  onCompare?: () => void;
  onReset: () => void;
  downloadLabel?: string;
  nextActions?: NextAction[];
  explanation?: string;
  className?: string;
}

export function CompressionResult({
  result,
  onDownload,
  onCompare,
  onReset,
  downloadLabel,
  nextActions,
  explanation,
  className,
}: CompressionResultProps) {
  const {
    originalBytes,
    outputBytes,
    targetBytes,
    targetReached,
    fileName,
    detail,
  } = result;

  const smaller = formatPercent(originalBytes, outputBytes);

  const defaultExplanation = targetReached
    ? `Your file was reduced from ${formatBytes(originalBytes)} to ${formatBytes(outputBytes)} — that's ${smaller} smaller. Your original file has not been changed.`
    : targetBytes !== null
      ? `We reduced your file to ${formatBytes(outputBytes)}, but couldn't quite reach ${formatBytes(targetBytes)} without losing too much quality. This is the best result we could produce. Your original file has not been changed.`
      : `Your file was reduced from ${formatBytes(originalBytes)} to ${formatBytes(outputBytes)} — that's ${smaller} smaller. Your original file has not been changed.`;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm sm:p-8 animate-fade-in",
        className,
      )}
      role="status"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            All done
          </h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {fileName}
          </p>
        </div>
        {targetReached ? (
          <Badge variant="success" className="shrink-0 gap-1 py-1">
            <Check className="h-3 w-3" />
            Target achieved
          </Badge>
        ) : targetBytes !== null ? (
          <Badge
            variant="muted"
            className="shrink-0 gap-1 py-1 text-amber-700 dark:text-amber-400"
          >
            <AlertTriangle className="h-3 w-3" />
            Target not reached
          </Badge>
        ) : null}
      </div>

      <div className="mt-8 flex items-center gap-4 sm:gap-8">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Original
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {formatBytes(originalBytes)}
          </p>
        </div>

        <ArrowDown
          className="h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />

        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Result
          </p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-success sm:text-3xl">
            {formatBytes(outputBytes)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{smaller} smaller</span>
        {targetBytes !== null && (
          <>
            <span aria-hidden="true">·</span>
            <span>Requested ≤ {formatBytes(targetBytes)}</span>
          </>
        )}
        {detail && (
          <>
            <span aria-hidden="true">·</span>
            <span>{detail}</span>
          </>
        )}
      </div>

      {explanation && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {explanation}
        </p>
      )}
      {!explanation && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          {defaultExplanation}
        </p>
      )}

      {!targetReached && targetBytes !== null && (
        <div className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-300">
          We couldn&apos;t reach {formatBytes(targetBytes)} without severely
          reducing quality. The result above is the best quality we could
          produce at or below your target.
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={onDownload}>
          <Download className="h-4 w-4" />
          {downloadLabel ?? "Download"}
        </Button>
        {onCompare && (
          <Button size="lg" variant="outline" onClick={onCompare}>
            Compare
          </Button>
        )}
        <Button size="lg" variant="ghost" onClick={onReset}>
          <RotateCcw className="h-4 w-4" />
          Start over
        </Button>
      </div>

      {nextActions && nextActions.length > 0 && (
        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            What&apos;s next?
          </p>
          <div className="flex flex-wrap gap-2">
            {nextActions.map((action) => (
              <Button
                key={action.to}
                asChild
                variant="outline"
                size="sm"
              >
                <Link to={action.to}>
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                  <ArrowRight className="h-3 w-3 opacity-50" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const PDF_NEXT_ACTIONS: NextAction[] = [
  { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Layers },
  { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
  { label: "Convert to image", to: "/pdf-tools/split", icon: ImageIcon },
];

export const IMAGE_NEXT_ACTIONS: NextAction[] = [
  { label: "Compress another", to: "/compress/image", icon: Layers },
  { label: "Resize image", to: "/resize/image", icon: ImageIcon },
  { label: "Convert format", to: "/convert/image", icon: Wand2 },
];

export const COMPRESS_PDF_NEXT_ACTIONS: NextAction[] = [
  { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Layers },
  { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors },
  { label: "Rotate PDF", to: "/pdf-tools/rotate", icon: RotateCcw },
];

