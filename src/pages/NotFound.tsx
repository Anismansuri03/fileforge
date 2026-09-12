import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full bg-muted"
        aria-hidden="true"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        This page doesn&apos;t exist.
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you were looking for may have been moved or removed. Let&apos;s
        get you back to the tools.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link to="/">
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to="/compress">Compress a file</Link>
        </Button>
      </div>
    </div>
  );
}