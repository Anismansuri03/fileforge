import { useEffect, useState } from "react";
import { FileText, Image as ImageIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/bytes";
import { detectKind } from "@/lib/validation";
import { cn } from "@/lib/utils";

export interface FileItem {
  id: string;
  file: File;
}

interface FileListProps {
  items: FileItem[];
  onRemove?: (id: string) => void;
  className?: string;
  renderExtra?: (item: FileItem, index: number) => React.ReactNode;
}

const KIND_LABELS: Record<string, string> = {
  pdf: "PDF",
  image: "Image",
  unknown: "File",
};

function ImageThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <ImageIcon className="h-4 w-4" />;

  return (
    <img
      src={url}
      alt=""
      className="h-full w-full object-cover rounded-md"
    />
  );
}

export function FileList({
  items,
  onRemove,
  className,
  renderExtra,
}: FileListProps) {
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item, index) => {
        const kind = detectKind(item.file);
        const isImage = kind === "image";
        const Icon = kind === "pdf" ? FileText : ImageIcon;
        return (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border bg-card p-3"
          >
            <span
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden",
                kind === "pdf"
                  ? "bg-pdf/10 text-pdf"
                  : "bg-image/10 text-image",
              )}
              aria-hidden="true"
            >
              {isImage ? <ImageThumb file={item.file} /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.file.name}</p>
              <p className="text-xs text-muted-foreground">
                {KIND_LABELS[kind] ?? "File"} · {formatBytes(item.file.size)}
              </p>
            </div>
            {renderExtra?.(item, index)}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${item.file.name}`}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
