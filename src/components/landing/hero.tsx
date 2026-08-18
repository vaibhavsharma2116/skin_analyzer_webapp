import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getScanCount } from "@/lib/public-stats.functions";
import heroImage from "@/assets/WEB_IMAGE.webp";

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}K+`;
  return n.toLocaleString();
}

export function Hero() {
  const { data } = useQuery({
    queryKey: ["public-scan-count"],
    queryFn: () => getScanCount(),
    staleTime: 60_000,
  });
  const scanCount = data?.count ?? 0;
  return (
    <section className="relative overflow-hidden px-4 pt-14 pb-24 sm:px-6 lg:pt-20 lg:pb-32">
      <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="flex h-2 w-2 rounded-full bg-primary" />
            Next-gen skincare intelligence
          </div>

          <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your skin&rsquo;s DNA,{" "}
            <span className="text-primary">decoded by AI.</span>
          </h1>

          <p className="mt-6 max-w-lg text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
            SKIN POP analyzes 40+ dermal concerns in seconds. Get a clinical-grade
            skin score and a personalized routine — powered by data, not guesswork.
          </p>

          <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="rounded-full px-8">
              <Link to="/auth">
                Start free AI scan
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8">
              <Link to="/auth">View sample report</Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Privacy-first. Photos encrypted &amp; never sold.</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl">
            <img
              src={heroImage}
              alt="Portrait showing luminous, healthy skin analyzed by SKIN POP"
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover"
            />

            <div className="absolute left-4 top-4 rounded-2xl border border-white/25 bg-white/20 p-3 text-white shadow-lg backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-80">Hydration</p>
              <p className="text-2xl font-semibold">88%</p>
            </div>

            <div className="absolute bottom-4 right-4 rounded-2xl border border-white/25 bg-white/20 p-3 text-white shadow-lg backdrop-blur-md">
              <p className="text-[9px] uppercase tracking-[0.2em] opacity-80">Skin age</p>
              <p className="text-2xl font-semibold">24 yrs</p>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full border border-white/25 bg-white/20 px-3 py-1.5 text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">Analyzing 40+</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-3xl font-semibold text-foreground sm:text-4xl">40+</p>
          <p className="mt-1 text-xs text-muted-foreground">Concerns detected</p>
        </div>
        <div className="border-x border-border">
          <p className="text-3xl font-semibold text-foreground sm:text-4xl">{formatCount(scanCount)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Scans completed</p>
        </div>
        <div>
          <p className="text-3xl font-semibold text-foreground sm:text-4xl">
            4.9<span className="text-lg text-primary">★</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">User rating</p>
        </div>
      </div>
    </section>
  );
}
