import { useState } from "react";
import { Pencil } from "lucide-react";
import { useUserPrefs } from "@/lib/user-prefs";
import { Button } from "@/components/ui/button";

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "\u2600\uFE0F";
  if (hour < 17) return "\uD83C\uDF24\uFE0F";
  return "\uD83C\uDF19";
}

export function Greeting() {
  const { prefs, setName } = useUserPrefs();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  if (!prefs.name) return null;

  if (isEditing) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed) {
        setName(trimmed);
        setIsEditing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="inline-flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {getGreetingEmoji()} {getTimeGreeting()},
        </span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={prefs.name}
          autoFocus
          className="h-8 w-28 rounded-lg border border-input bg-background px-2 text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button type="submit" size="sm" variant="ghost" className="h-8 px-2 text-xs">
          Save
        </Button>
      </form>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
      <span>{getGreetingEmoji()}</span>
      <span>
        {getTimeGreeting()},{" "}
        <strong className="font-semibold text-foreground">{prefs.name}</strong>
      </span>
      <button
        type="button"
        onClick={() => {
          setInputValue(prefs.name);
          setIsEditing(true);
        }}
        className="ml-0.5 rounded-md p-0.5 text-muted-foreground/60 hover:text-foreground hover:bg-accent transition-colors"
        aria-label="Change name"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}
