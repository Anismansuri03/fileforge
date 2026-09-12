import { FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { useUserPrefs } from "@/lib/user-prefs";
import { formatBytes } from "@/lib/bytes";

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

interface RecentFilesProps {
  onSelect?: (file: { name: string; type: "pdf" | "image" }) => void;
}

export function RecentFiles({ onSelect }: RecentFilesProps) {
  const { prefs, clearRecentFiles } = useUserPrefs();

  if (prefs.recentFiles.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Recent files
        </p>
        <button
          type="button"
          onClick={clearRecentFiles}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {prefs.recentFiles.map((file) => (
          <button
            key={`${file.name}-${file.timestamp}`}
            type="button"
            onClick={() =>
              onSelect?.({ name: file.name, type: file.type })
            }
            className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                file.type === "pdf"
                  ? "bg-pdf/10 text-pdf"
                  : "bg-image/10 text-image"
              }`}
            >
              {file.type === "pdf" ? (
                <FileText className="h-4 w-4" />
              ) : (
                <ImageIcon className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium group-hover:underline">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(file.size)} · {timeAgo(file.timestamp)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
