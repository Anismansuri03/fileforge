import { Link } from "react-router-dom";
import { ArrowRight, Image as ImageIcon } from "lucide-react";
import { ToolPage } from "@/components/layout/tool-page";

export default function ResizeIndex() {
  return (
    <ToolPage
      eyebrow="Resize"
      title="Change dimensions without the guesswork."
      description="Resize images to exact dimensions or by percentage, right in your browser."
    >
      <Link
        to="/resize/image"
        className="group flex max-w-md flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-image/10 text-image"
          aria-hidden="true"
        >
          <ImageIcon className="h-5 w-5" />
        </span>
        <h2 className="mt-4 flex items-center gap-2 text-base font-semibold tracking-tight">
          Resize Image
          <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          JPG, PNG, WebP and AVIF. Fit, fill, exact or percentage.
        </p>
      </Link>
    </ToolPage>
  );
}
