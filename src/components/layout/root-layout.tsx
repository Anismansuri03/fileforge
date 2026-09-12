import { Outlet, ScrollRestoration } from "react-router-dom";
import { Header } from "./header";
import { Footer } from "./footer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RootLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-full flex-col">
        <Header />
        <main id="main" className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
      <ScrollRestoration />
    </TooltipProvider>
  );
}
