import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2
        className="h-5 w-5 animate-spin text-muted-foreground"
        aria-label="Loading"
      />
    </div>
  );
}