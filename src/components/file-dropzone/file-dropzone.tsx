import {
  useCallback,
  useId,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  hint?: string;
  title?: string;
  className?: string;
}

type DragState = "idle" | "dragging";

function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const tokens = accept
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();

  return tokens.some((token) => {
    if (token.startsWith(".")) {
      return name.endsWith(token);
    }
    if (token.endsWith("/*")) {
      return type.startsWith(token.slice(0, -1));
    }
    return type === token;
  });
}

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  disabled = false,
  hint,
  title = "Drop your file here",
  className,
}: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState<DragState>("idle");

  const emit = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const files = Array.from(list).filter((f) =>
        fileMatchesAccept(f, accept),
      );
      if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1));
    },
    [accept, multiple, onFiles],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      setDrag("idle");
      emit(event.dataTransfer?.files ?? null);
    },
    [disabled, emit],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      setDrag("dragging");
    },
    [disabled],
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDrag("idle");
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        inputRef.current?.click();
      }
    },
    [disabled],
  );

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={title}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={handleKeyDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "group relative flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-all",
        "hover:border-foreground/30 hover:bg-muted/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        drag === "dragging" &&
          "border-foreground/50 bg-muted/70 ring-2 ring-ring/20",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          emit(event.target.files);
          event.target.value = "";
        }}
      />

      <span
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border transition-transform group-hover:scale-105",
          drag === "dragging" && "scale-105",
        )}
        aria-hidden="true"
      >
        <UploadCloud className="h-5 w-5" />
      </span>

      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          or{" "}
          <span className="font-medium text-foreground underline decoration-border underline-offset-4">
            browse files
          </span>
        </p>
      </div>

      {hint && (
        <p className="max-w-sm text-xs text-muted-foreground">{hint}</p>
      )}

      <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
        Processed locally — never uploaded
      </p>
    </div>
  );
}
