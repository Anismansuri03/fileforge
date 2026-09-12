import { Link } from "react-router-dom";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { ToolPage } from "@/components/layout/tool-page";

export default function ConvertIndex() {
  return (
    <ToolPage
      eyebrow="Convert"
      title="Convert between popular formats."
      description="Change image formats directly in your browser. Transparency is always handled safely."
    >
      <Link
        to="/convert/image"
        className="group flex max-w-md flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-convert/10 text-convert"
          aria-hidden="true"
        >
          <ImageIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 flex items-center gap-2 text-base font-semibold tracking-tight">
          Convert Image
          <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG, PNG, WebP and AVIF conversion.
        </p>
      </Link>
    </ToolPage>
  );
}
