import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUserPrefs } from "@/lib/user-prefs";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeDialog() {
  const { prefs, setName } = useUserPrefs();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!prefs.name) {
      const timer = setTimeout(() => {
        setShow(true);
        setOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [prefs.name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) {
      setName(trimmed);
      setOpen(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  if (!show) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md overflow-hidden border-0 p-0">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
          <div className="relative p-8 pb-6">
            <DialogHeader className="text-center space-y-3">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/15">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight">
                Welcome to FileForge
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                {getTimeGreeting()}! What should we call you?
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your name"
                  autoFocus
                  maxLength={30}
                  className="h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-medium shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex-1 h-11 rounded-xl font-semibold text-sm"
                  size="lg"
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Get started
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="h-11 rounded-xl font-medium text-sm text-muted-foreground px-4"
                >
                  Skip
                </Button>
              </div>
            </form>

            <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
              Stored locally on your device. Never uploaded.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
