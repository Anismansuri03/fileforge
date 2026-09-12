import { Link } from "react-router-dom";
import { ArrowRight, FileText, Image as ImageIcon } from "lucide-react";
import { ToolPage } from "@/components/layout/tool-page";
import { cn } from "@/lib/utils";

interface Choice {
  title: string;
  description: string;
  to: string;
  icon: typeof FileText;
  accent: string;
}

const CHOICES: Choice[] = [
  {
    title: "Compress PDF",
    description: "Shrink a PDF toward an exact target size.",
    to: "/compress/pdf",
    icon: FileText,
    accent: "text-pdf bg-pdf/10",
  },
  {
    title: "Compress Image",
    description: "JPG, PNG, WebP and AVIF with target-size search.",
    to: "/compress/image",
    icon: ImageIcon,
    accent: "text-image bg-image/10",
  },
];

export default function CompressIndex() {
  return (
    <ToolPage
      eyebrow="Compress"
      title="Reduce file size, keep the quality."
      description="Pick a format to get started. Every result is measured against your target size."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {CHOICES.map((choice) => (
          <Link
            key={choice.to}
            to={choice.to}
            className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                choice.accent,
              )}
              aria-hidden="true"
            >
              <choice.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 flex items-center gap-2 text-base font-semibold tracking-tight">
              {choice.title}
              <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {choice.description}
            </p>
          </Link>
        ))}
      </div>
    </ToolPage>
  );
}
