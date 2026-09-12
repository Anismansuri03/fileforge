import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Combine,
  FileText,
  Image as ImageIcon,
  Layers,
  Lock,
  Plus,
  Scissors,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  Zap,
  RotateCw,
  ArrowUpDown,
  FileImage,
  GripVertical,
  CircleDot,
  ArrowDownToLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/file-dropzone/file-dropzone";
import { Greeting } from "@/components/greeting";
import { WelcomeDialog } from "@/components/welcome-dialog";
import { RecentFiles } from "@/components/recent-files";
import type { ComponentType } from "react";

interface TaskDef {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

const ALL_TASKS: TaskDef[] = [
  {
    label: "Make a PDF smaller",
    description: "Compress PDF file size while keeping it readable.",
    to: "/compress/pdf",
    icon: Layers,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Edit a PDF",
    description: "Reorder, delete, rotate, and extract pages \u2014 all in one place.",
    to: "/pdf-tools/editor",
    icon: GripVertical,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Combine PDFs into one",
    description: "Merge multiple PDF files into a single document.",
    to: "/pdf-tools/merge",
    icon: Combine,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Add pages to a PDF",
    description: "Insert images or other PDF pages into an existing document.",
    to: "/pdf-tools/add-pages",
    icon: Plus,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Split a PDF apart",
    description: "Separate a PDF into smaller files by page ranges.",
    to: "/pdf-tools/split",
    icon: Scissors,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Rotate PDF pages",
    description: "Turn all pages 90\u00b0, 180\u00b0 or 270\u00b0.",
    to: "/pdf-tools/rotate",
    icon: RotateCw,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Delete pages from a PDF",
    description: "Remove pages you don't need from a PDF.",
    to: "/pdf-tools/delete-pages",
    icon: Trash2,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Extract pages from a PDF",
    description: "Pull out specific pages into a new PDF file.",
    to: "/pdf-tools/extract-pages",
    icon: FileText,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Reorder PDF pages",
    description: "Rearrange the page order in a PDF.",
    to: "/pdf-tools/reorder",
    icon: ArrowUpDown,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Turn images into a PDF",
    description: "Combine multiple photos into a single PDF document.",
    to: "/pdf-tools/images-to-pdf",
    icon: FileImage,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Make an image smaller",
    description: "Compress image file size without losing visible quality.",
    to: "/compress/image",
    icon: Layers,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Resize an image",
    description: "Change image width and height to any dimensions.",
    to: "/resize/image",
    icon: ImageIcon,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Turn a JPG into a PNG",
    description: "Convert JPG images to PNG format.",
    to: "/convert/image",
    icon: Wand2,
    color: "text-[hsl(265,55%,52%)]",
    gradient: "from-[hsl(265,55%,52%)]/10 to-transparent",
  },
  {
    label: "Turn a PNG into a JPG",
    description: "Convert PNG images to JPG format.",
    to: "/convert/image",
    icon: Wand2,
    color: "text-[hsl(265,55%,52%)]",
    gradient: "from-[hsl(265,55%,52%)]/10 to-transparent",
  },
  {
    label: "Turn any image into WebP",
    description: "Convert images to the modern WebP format.",
    to: "/convert/image",
    icon: Wand2,
    color: "text-[hsl(265,55%,52%)]",
    gradient: "from-[hsl(265,55%,52%)]/10 to-transparent",
  },
  {
    label: "Turn any image into AVIF",
    description: "Convert images to the AVIF format for smallest size.",
    to: "/convert/image",
    icon: Wand2,
    color: "text-[hsl(265,55%,52%)]",
    gradient: "from-[hsl(265,55%,52%)]/10 to-transparent",
  },
  {
    label: "Compress a JPG to 200 KB",
    description: "Get a JPG image under 200 KB exactly.",
    to: "/compress/image",
    icon: Layers,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Compress a PNG to 100 KB",
    description: "Get a PNG image under 100 KB exactly.",
    to: "/compress/image",
    icon: Layers,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Shrink a PDF to 500 KB",
    description: "Get a PDF under 500 KB for email or upload.",
    to: "/compress/pdf",
    icon: Layers,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
  {
    label: "Make an image square",
    description: "Resize to 1080\u00d71080 for social media.",
    to: "/resize/image",
    icon: ImageIcon,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Make an image smaller for email",
    description: "Compress and resize images to send by email.",
    to: "/compress/image",
    icon: Layers,
    color: "text-[hsl(217,65%,50%)]",
    gradient: "from-[hsl(217,65%,50%)]/10 to-transparent",
  },
  {
    label: "Fix a sideways PDF",
    description: "Rotate pages that scanned in the wrong orientation.",
    to: "/pdf-tools/rotate",
    icon: RotateCw,
    color: "text-[hsl(0,65%,48%)]",
    gradient: "from-[hsl(0,65%,48%)]/10 to-transparent",
  },
];

interface ToolCardDef {
  title: string;
  description: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  accentIcon: string;
  formats: string;
}

const TOOLS: ToolCardDef[] = [
  {
    title: "Compress",
    description: "Reduce file size while keeping the best possible quality.",
    to: "/compress",
    icon: Layers,
    accent: "border-[hsl(0,65%,48%)]/20 hover:border-[hsl(0,65%,48%)]/40 hover:shadow-[hsl(0,65%,48%)]/5",
    accentIcon: "text-[hsl(0,65%,48%)] bg-[hsl(0,65%,48%)]/10",
    formats: "PDF, JPG, PNG, WebP",
  },
  {
    title: "Resize",
    description: "Change dimensions or file size without the complexity.",
    to: "/resize",
    icon: ImageIcon,
    accent: "border-[hsl(217,65%,50%)]/20 hover:border-[hsl(217,65%,50%)]/40 hover:shadow-[hsl(217,65%,50%)]/5",
    accentIcon: "text-[hsl(217,65%,50%)] bg-[hsl(217,65%,50%)]/10",
    formats: "JPG, PNG, WebP, AVIF",
  },
  {
    title: "Convert",
    description: "Convert files between popular formats directly in your browser.",
    to: "/convert",
    icon: Wand2,
    accent: "border-[hsl(265,55%,52%)]/20 hover:border-[hsl(265,55%,52%)]/40 hover:shadow-[hsl(265,55%,52%)]/5",
    accentIcon: "text-[hsl(265,55%,52%)] bg-[hsl(265,55%,52%)]/10",
    formats: "JPG, PNG, WebP, AVIF, PDF",
  },
  {
    title: "PDF Tools",
    description: "Everyday PDF tools without uploading your documents.",
    to: "/pdf-tools",
    icon: FileText,
    accent: "border-[hsl(0,65%,48%)]/20 hover:border-[hsl(0,65%,48%)]/40 hover:shadow-[hsl(0,65%,48%)]/5",
    accentIcon: "text-[hsl(0,65%,48%)] bg-[hsl(0,65%,48%)]/10",
    formats: "Merge, split, rotate, pages",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "100% private",
    body: "Files never leave your browser. Processed entirely on your device using WebAssembly.",
    color: "text-[hsl(145,55%,36%)] bg-[hsl(145,55%,36%)]/10",
  },
  {
    icon: Sparkles,
    title: "Exact target sizes",
    body: "Ask for 200 KB and get 200 KB or less. Every result is measured, never estimated.",
    color: "text-[hsl(265,55%,52%)] bg-[hsl(265,55%,52%)]/10",
  },
  {
    icon: Zap,
    title: "Instant and free",
    body: "No account, no limits, no waiting. Results appear in seconds.",
    color: "text-[hsl(38,92%,50%)] bg-[hsl(38,92%,50%)]/10",
  },
];

const ACCEPT = ".jpg,.jpeg,.png,.webp,.avif,.pdf";

type DetectedType = "pdf" | "image" | null;

interface DetectedTool {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  description: string;
  popular?: boolean;
}

function getToolsForType(type: DetectedType): DetectedTool[] {
  if (type === "pdf") {
    return [
      { label: "Compress PDF", to: "/compress/pdf", icon: Layers, description: "Make it smaller", popular: true },
      { label: "Edit PDF", to: "/pdf-tools/editor", icon: GripVertical, description: "Reorder, delete, rotate pages", popular: true },
      { label: "Merge PDFs", to: "/pdf-tools/merge", icon: Combine, description: "Combine into one file", popular: true },
      { label: "Add pages to PDF", to: "/pdf-tools/add-pages", icon: Plus, description: "Insert images or PDF pages" },
      { label: "Split PDF", to: "/pdf-tools/split", icon: Scissors, description: "Separate into smaller files" },
      { label: "Rotate PDF", to: "/pdf-tools/rotate", icon: RotateCw, description: "Fix sideways pages" },
      { label: "Delete pages", to: "/pdf-tools/delete-pages", icon: Trash2, description: "Remove pages you don't need" },
      { label: "Extract pages", to: "/pdf-tools/extract-pages", icon: FileText, description: "Pull out specific pages" },
      { label: "Reorder pages", to: "/pdf-tools/reorder", icon: ArrowUpDown, description: "Rearrange page order" },
    ];
  }
  if (type === "image") {
    return [
      { label: "Compress image", to: "/compress/image", icon: Layers, description: "Make it smaller", popular: true },
      { label: "Resize image", to: "/resize/image", icon: ImageIcon, description: "Change dimensions", popular: true },
      { label: "Convert format", to: "/convert/image", icon: Wand2, description: "JPG, PNG, WebP, AVIF", popular: true },
      { label: "Compress to 200 KB", to: "/compress/image", icon: ArrowDownToLine, description: "Exact target size" },
      { label: "Make square (1080\u00d71080)", to: "/resize/image", icon: CircleDot, description: "For social media" },
      { label: "Convert to WebP", to: "/convert/image", icon: Wand2, description: "Smallest modern format" },
    ];
  }
  return [];
}

export default function Home() {
  const [detectedType, setDetectedType] = useState<DetectedType>(null);
  const [detectedName, setDetectedName] = useState<string | null>(null);

  const handleFileDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    const type = file.type || "";
    if (type === "application/pdf" || name.endsWith(".pdf")) {
      setDetectedType("pdf");
      setDetectedName(file.name);
    } else if (
      type.startsWith("image/") ||
      /\.(jpe?g|png|webp|avif)$/i.test(name)
    ) {
      setDetectedType("image");
      setDetectedName(file.name);
    }
  }, []);

  const detectedTools = getToolsForType(detectedType);

  return (
    <div>
      <WelcomeDialog />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.25] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/[0.03] blur-3xl" aria-hidden="true" />

        <div className="container relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 flex justify-center">
              <Greeting />
            </div>

            <h1 className="text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl text-balance">
              Simple tools for your files.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg leading-relaxed">
              Compress, resize and convert files — privately, directly in your
              browser.
            </p>

            <div className="mt-10 mx-auto max-w-lg">
              {!detectedType ? (
                <FileDropzone
                  accept={ACCEPT}
                  multiple={false}
                  onFiles={handleFileDrop}
                  title="Drop a file here"
                  hint="PDF, JPG, PNG, WebP or AVIF"
                />
              ) : (
                <div className="rounded-2xl border bg-card p-6 shadow-lg animate-fade-in text-left">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {detectedType === "pdf" ? "PDF" : "Image"} detected
                      </p>
                      <p className="mt-1 text-sm font-semibold truncate max-w-[240px]">
                        {detectedName}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(145,55%,36%)]/10 text-[hsl(145,55%,36%)]">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <p className="mt-4 text-sm font-bold tracking-tight">
                    What would you like to do?
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Popular actions shown first.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {detectedTools.map((tool) => (
                      <Link
                        key={tool.to + tool.label}
                        to={tool.to}
                        className={`group flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          tool.popular
                            ? "border-primary/20 bg-primary/[0.03] hover:border-primary/30"
                            : "border-border/70 bg-background hover:border-border hover:shadow-sm"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            detectedType === "pdf"
                              ? "bg-[hsl(0,65%,48%)]/10 text-[hsl(0,65%,48%)]"
                              : "bg-[hsl(217,65%,50%)]/10 text-[hsl(217,65%,50%)]"
                          }`}
                        >
                          <tool.icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium group-hover:underline">
                            {tool.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {tool.description}
                          </p>
                        </div>
                        <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-0 transition-all group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDetectedType(null);
                      setDetectedName(null);
                    }}
                    className="mt-4 text-xs text-muted-foreground underline decoration-border underline-offset-4 hover:decoration-foreground transition-colors"
                  >
                    Choose a different file
                  </button>
                </div>
              )}
            </div>

            <RecentFiles />

            <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Local processing", "No uploads", "Free to use"].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(145,55%,36%)]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* All tasks */}
      <section className="container py-14 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-balance">
            What can FileForge do for you?
          </h2>
          <p className="mt-3 text-pretty text-muted-foreground">
            Pick a task below. Each one runs privately in your browser — no
            uploads, no sign-ups.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_TASKS.map((task) => (
            <Link
              key={task.label}
              to={task.to}
              className="group flex items-start gap-3.5 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span
                className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${task.gradient} ring-1 ring-border/60 ${task.color}`}
                aria-hidden="true"
              >
                <task.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold group-hover:underline leading-snug">
                  {task.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground text-pretty leading-relaxed">
                  {task.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Browse by category */}
      <section className="border-y border-border/50 bg-muted/30 py-14 sm:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-balance">
              Browse by category
            </h2>
            <p className="mt-3 text-pretty text-muted-foreground">
              Or choose a category to see all related tools.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className={`group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${tool.accent}`}
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${tool.accentIcon}`}
                  aria-hidden="true"
                >
                  <tool.icon className="h-5 w-5" />
                </span>
                <h2 className="mt-4 flex items-center gap-2 text-lg font-bold tracking-tight">
                  {tool.title}
                  <ArrowRight className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </h2>
                <p className="mt-1.5 text-sm text-muted-foreground text-pretty leading-relaxed">
                  {tool.description}
                </p>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {tool.formats}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-14 sm:py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="group">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-sm ring-1 ring-border/50 ${feature.color}`}
                aria-hidden="true"
              >
                <feature.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground text-pretty leading-relaxed">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Target size CTA */}
      <section className="container py-14 sm:py-20">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl border border-border/50 bg-card p-10 sm:p-14 text-center shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.03] via-transparent to-primary/[0.06]" aria-hidden="true" />
          <div className="relative">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-balance">
              The size you ask for is the size you get.
            </h2>
            <p className="mt-4 text-pretty text-muted-foreground leading-relaxed">
              Most tools guess. FileForge actually compresses, measures the
              result, and keeps searching until it fits under your target — so a
              request for 200 KB always stays at or below 200 KB.
            </p>
            <Button asChild className="mt-8 h-11 rounded-xl font-semibold" size="lg">
              <Link to="/compress/image">
                Try it on an image
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
