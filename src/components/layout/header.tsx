import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { FileText, Image as ImageIcon, Layers, Menu, Moon, Sun, Wand2, X, GripVertical } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/app/theme-provider";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "PDF Editor", to: "/pdf-tools/editor", icon: GripVertical },
  { label: "Compress", to: "/compress", icon: Layers },
  { label: "Resize", to: "/resize", icon: ImageIcon },
  { label: "Convert", to: "/convert", icon: Wand2 },
  { label: "PDF Tools", to: "/pdf-tools", icon: FileText },
];

const MOBILE_SECTIONS = [
  {
    title: "PDF Editor",
    to: "/pdf-tools/editor",
    icon: GripVertical,
    items: [],
  },
  {
    title: "Compress",
    to: "/compress",
    icon: Layers,
    items: [
      { label: "Compress PDF", to: "/compress/pdf" },
      { label: "Compress Image", to: "/compress/image" },
    ],
  },
  {
    title: "Resize",
    to: "/resize",
    icon: ImageIcon,
    items: [{ label: "Resize Image", to: "/resize/image" }],
  },
  {
    title: "Convert",
    to: "/convert",
    icon: Wand2,
    items: [{ label: "Convert Image", to: "/convert/image" }],
  },
  {
    title: "PDF Tools",
    to: "/pdf-tools",
    icon: FileText,
    items: [
      { label: "Merge PDF", to: "/pdf-tools/merge" },
      { label: "Split PDF", to: "/pdf-tools/split" },
      { label: "Add pages to PDF", to: "/pdf-tools/add-pages" },
      { label: "More PDF tools", to: "/pdf-tools" },
    ],
  },
];

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {NAV_ITEMS.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === 0 && "text-foreground font-semibold",
                isActive(item.to) && "text-foreground",
              )}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/privacy"
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive("/privacy") && "text-foreground",
            )}
          >
            Privacy
          </NavLink>
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            className="rounded-lg"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-border/70 bg-background md:hidden"
        >
          <div className="container flex flex-col gap-1 py-3">
            {MOBILE_SECTIONS.map((section) => (
              <div key={section.to}>
                <Link
                  to={section.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold",
                    isActive(section.to)
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </Link>
                <div className="ml-6 flex flex-col">
                  {section.items.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive(item.to)
                          ? "font-medium text-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <div className="my-1 h-px bg-border" />
            <Link
              to="/privacy"
              onClick={() => setMobileOpen(false)}
              className={cn(
                "rounded-lg px-3 py-2.5 text-sm font-medium",
                isActive("/privacy")
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Privacy
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
