import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolPageProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function ToolPage({
  title,
  description,
  eyebrow,
  children,
  aside,
  className,
}: ToolPageProps) {
  return (
    <div className={cn("container max-w-5xl py-10 sm:py-14", className)}>
      <div className="mb-8 max-w-2xl animate-fade-in">
        {eyebrow && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>

      <div
        className={cn(
          aside ? "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" : "",
        )}
      >
        <div className="min-w-0">{children}</div>
        {aside && <div className="min-w-0">{aside}</div>}
      </div>
    </div>
  );
}

export function ToolCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
