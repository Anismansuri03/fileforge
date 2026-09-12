import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface RelatedTool {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface RelatedToolsProps {
  tools: RelatedTool[];
}

export function RelatedTools({ tools }: RelatedToolsProps) {
  if (tools.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-dashed border-border/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
        Other tools
      </p>
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => (
          <Link
            key={tool.to}
            to={tool.to}
            className="inline-flex items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <tool.icon className="h-3 w-3" />
            {tool.label}
            <ArrowRight className="h-3 w-3 opacity-50" />
          </Link>
        ))}
      </div>
    </div>
  );
}
