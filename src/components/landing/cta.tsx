import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section id="cta" className="px-4 py-24 sm:px-6">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-foreground px-8 py-20 text-center text-background sm:px-16 sm:py-24">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Ready for your <span className="text-primary">best skin</span> yet?
        </h2>
        <p className="mx-auto mt-6 max-w-md text-background/70">
          Free forever. No credit card. Your first personalized routine in under 60 seconds.
        </p>

        <div className="mt-10">
          <Button asChild size="lg" className="rounded-full px-10 py-6 text-base">
            <Link to="/auth">Scan my face now</Link>
          </Button>
        </div>

        <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.24em] text-background/50">
          Privacy first · Encrypted · GDPR compliant
        </p>
      </div>
    </section>
  );
}
