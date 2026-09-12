import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "group inline-flex items-center gap-2 rounded-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label="FileForge home"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background transition-transform group-hover:-rotate-3"
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-4 w-4"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 17 L16 5 L16 11 L10 11" />
          <circle cx="6.5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className="text-[17px]">FileForge</span>
    </Link>
  );
}
