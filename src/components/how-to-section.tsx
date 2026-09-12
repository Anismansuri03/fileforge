import { ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";

interface HowToStep {
  step: string;
  detail: string;
}

interface HowToSectionProps {
  title: string;
  steps: HowToStep[];
  explanation?: string;
  faqs?: { q: string; a: string }[];
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: { q: string; a: string };
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between py-3 text-left text-sm font-medium hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={isOpen}
      >
        {item.q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <p className="pb-3 text-sm text-muted-foreground leading-relaxed">
          {item.a}
        </p>
      )}
    </div>
  );
}

export function HowToSection({
  title,
  steps,
  explanation,
  faqs,
}: HowToSectionProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="mt-14 border-t border-border/60 pt-14 sm:mt-20 sm:pt-20">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>

        <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                {i + 1}
              </span>
              <span>
                <strong className="font-medium text-foreground">{s.step}</strong>
                {s.detail && (
                  <span className="ml-1 text-muted-foreground">
                    {s.detail}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>

        {explanation && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {explanation}
          </p>
        )}

        {faqs && faqs.length > 0 && (
          <div className="mt-8">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              Frequently asked questions
            </h3>
            <div className="mt-3">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  item={faq}
                  isOpen={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
