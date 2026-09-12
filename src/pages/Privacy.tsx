import { Lock, MonitorSmartphone, ShieldCheck } from "lucide-react";
import { ToolPage } from "@/components/layout/tool-page";
import { Separator } from "@/components/ui/separator";

export default function Privacy() {
  return (
    <ToolPage
      eyebrow="Privacy"
      title="Your files are processed locally in your browser."
      description="FileForge does not upload your files to a server. There is no backend that receives them."
    >
      <div className="space-y-8">
        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                What happens when you use a tool
              </h2>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                When you select a file, it is read directly into your
                browser&apos;s memory. Compression, conversion and PDF
                operations are performed by WebAssembly running inside a Web
                Worker on your device. The result is offered back to you as a
                local download. At no point is the file or its contents
                transmitted to FileForge.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                What we do not do
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {[
                  "We do not upload your files.",
                  "We do not store your files or their contents.",
                  "We do not require an account, email or password.",
                  "We do not send file names, metadata or contents to analytics.",
                  "We do not have an upload endpoint.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <MonitorSmartphone className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                Browser and device limits
              </h2>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                Because processing happens on your device, very large files
                depend on your available memory. A large JPEG can expand to
                hundreds of megabytes of raw pixels after decoding. Extremely
                large files may be slow or impossible to process in a browser.
                We warn you when a file could be too large, and we never crash
                the page — the original file is always left untouched.
              </p>
            </div>
          </div>
        </section>

        <Separator />

        <section className="text-sm text-muted-foreground">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Offline use
          </h2>
          <p className="mt-2 text-pretty">
            FileForge is a progressive web app. After your first visit, the
            application shell and processing engines are cached so the tools
            can keep working offline. Your files are never cached permanently.
          </p>
        </section>
      </div>
    </ToolPage>
  );
}