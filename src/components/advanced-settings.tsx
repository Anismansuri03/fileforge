import { type ReactNode } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface AdvancedSettingsProps {
  children: ReactNode;
  onReset?: () => void;
  defaultOpen?: boolean;
}

export function AdvancedSettings({
  children,
  onReset,
  defaultOpen = false,
}: AdvancedSettingsProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? "advanced" : undefined}
    >
      <AccordionItem value="advanced" className="border-none">
        <AccordionTrigger className="text-sm text-muted-foreground py-2">
          Advanced settings
        </AccordionTrigger>
        <AccordionContent className="space-y-4 pt-2">
          {children}
          {onReset && (
            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to recommended
              </Button>
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface AdvancedSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AdvancedSection({
  title,
  description,
  children,
}: AdvancedSectionProps) {
  return (
    <div className="space-y-2">
      <div>
        <label className="text-sm font-medium">{title}</label>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
