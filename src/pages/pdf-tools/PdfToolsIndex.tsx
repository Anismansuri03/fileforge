import { Link } from "react-router-dom";
import {
  ArrowRight,
  Combine,
  FileImage,
  Images,
  Move,
  RotateCw,
  Scissors,
  Trash2,
  Layers,
} from "lucide-react";
import { ToolPage } from "@/components/layout/tool-page";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDFs into one.",
    to: "/pdf-tools/merge",
    icon: Combine,
  },
  {
    title: "Split PDF",
    description: "Split by ranges or every N pages.",
    to: "/pdf-tools/split",
    icon: Scissors,
  },
  {
    title: "Rotate PDF",
    description: "Rotate pages 90°, 180° or 270°.",
    to: "/pdf-tools/rotate",
    icon: RotateCw,
  },
  {
    title: "Reorder Pages",
    description: "Rearrange pages by dragging.",
    to: "/pdf-tools/reorder",
    icon: Move,
  },
  {
    title: "Delete Pages",
    description: "Remove pages you don't need.",
    to: "/pdf-tools/delete-pages",
    icon: Trash2,
  },
  {
    title: "Extract Pages",
    description: "Create a new PDF from selected pages.",
    to: "/pdf-tools/extract-pages",
    icon: Layers,
  },
  {
    title: "Images to PDF",
    description: "Turn images into a single PDF.",
    to: "/pdf-tools/images-to-pdf",
    icon: Images,
  },
  {
    title: "PDF to Images",
    description: "Export pages as images.",
    to: "/pdf-tools/split",
    icon: FileImage,
  },
];

export default function PdfToolsIndex() {
  return (
    <ToolPage
      eyebrow="PDF Tools"
      title="Everyday PDF tools, without the upload."
      description="Your documents stay on your device. Every tool runs locally in your browser."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.title}
            to={tool.to}
            className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg bg-pdf/10 text-pdf",
              )}
              aria-hidden="true"
            >
              <tool.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 flex items-center gap-2 text-sm font-semibold tracking-tight">
              {tool.title}
              <ArrowRight className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </ToolPage>
  );
}
