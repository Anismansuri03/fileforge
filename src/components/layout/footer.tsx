import { Link } from "react-router-dom";
import { Lock, ShieldCheck } from "lucide-react";

const LINKS = [
  {
    title: "Compress",
    items: [
      { label: "Compress PDF", to: "/compress/pdf" },
      { label: "Compress Image", to: "/compress/image" },
    ],
  },
  {
    title: "Resize",
    items: [{ label: "Resize Image", to: "/resize/image" }],
  },
  {
    title: "Convert",
    items: [
      { label: "Convert Image", to: "/convert/image" },
      { label: "Images to PDF", to: "/pdf-tools/images-to-pdf" },
    ],
  },
  {
    title: "PDF Tools",
    items: [
      { label: "Merge PDF", to: "/pdf-tools/merge" },
      { label: "Split PDF", to: "/pdf-tools/split" },
      { label: "Extract Pages", to: "/pdf-tools/extract-pages" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <p className="text-sm font-semibold">FileForge</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Simple tools for your files. Compress, resize and convert —
              privately, directly in your browser.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>Local processing. No uploads.</span>
            </div>
          </div>

          {LINKS.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {new Date().getFullYear()} FileForge. Files are processed locally in
            your browser.
          </p>
          <Link
            to="/privacy"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}
