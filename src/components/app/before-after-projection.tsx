import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Layers,
  Sparkle,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import type { ScanRow } from "@/lib/skin-analysis.functions";
import { normalizeMetrics, METRIC_META, METRIC_ORDER } from "./metric-tokens";
import heroImg from "@/assets/skinpop-hero.jpg";

type Timeframe = "8weeks" | "12weeks";

export function BeforeAfterProjection({ scan }: { scan: ScanRow }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("8weeks");
  const [sliderPos, setSliderPos] = useState<number>(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Retrieve user's uploaded selfie from session storage if available
  const [selfieSrc, setSelfieSrc] = useState<string | null>(null);
  const [isReferencePhoto, setIsReferencePhoto] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("skinpop:lastScan");
      if (stored && stored.startsWith("data:image/")) {
        setSelfieSrc(stored);
        setIsReferencePhoto(false);
      } else {
        setSelfieSrc(heroImg);
        setIsReferencePhoto(true);
      }
    } catch {
      setSelfieSrc(heroImg);
      setIsReferencePhoto(true);
    }
  }, []);

  const metrics = normalizeMetrics(scan.metrics);

  // Calculate projected scores for 8 and 12 weeks
  const baselineScore = scan.overall_score;
  const projectedScore8w = Math.min(95, Math.round(baselineScore + (100 - baselineScore) * 0.45));
  const projectedScore12w = Math.min(99, Math.round(baselineScore + (100 - baselineScore) * 0.75));

  const currentProjectedScore = timeframe === "8weeks" ? projectedScore8w : projectedScore12w;
  const scoreGain = currentProjectedScore - baselineScore;

  // Drag interaction handlers
  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const pct = Math.round((clamped / rect.width) * 100);
    setSliderPos(pct);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleMove(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Projected metrics calculations
  const projectedMetrics = {
    hydration: Math.min(
      98,
      Math.round(
        metrics.hydration + (100 - metrics.hydration) * (timeframe === "8weeks" ? 0.45 : 0.75),
      ),
    ),
    oil_balance: Math.min(
      95,
      Math.round(
        metrics.oil_balance + (100 - metrics.oil_balance) * (timeframe === "8weeks" ? 0.4 : 0.7),
      ),
    ),
    texture: Math.min(
      96,
      Math.round(metrics.texture + (100 - metrics.texture) * (timeframe === "8weeks" ? 0.5 : 0.8)),
    ),
    pores: Math.min(
      94,
      Math.round(metrics.pores + (100 - metrics.pores) * (timeframe === "8weeks" ? 0.4 : 0.7)),
    ),
    evenness: Math.min(
      97,
      Math.round(
        metrics.evenness + (100 - metrics.evenness) * (timeframe === "8weeks" ? 0.55 : 0.85),
      ),
    ),
    elasticity: Math.min(
      96,
      Math.round(
        metrics.elasticity + (100 - metrics.elasticity) * (timeframe === "8weeks" ? 0.35 : 0.65),
      ),
    ),
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[28px] border border-primary/25 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">Before & After Projection</h2>
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider">
                AI Preview
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Projected clinical transformation with consistent SKNPOP serum routine
            </p>
          </div>
        </div>

        {/* Timeframe selector pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 text-center">
          <button
            type="button"
            onClick={() => setTimeframe("8weeks")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              timeframe === "8weeks"
                ? "bg-card text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />8 Weeks Projection
          </button>
          <button
            type="button"
            onClick={() => setTimeframe("12weeks")}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all ${
              timeframe === "12weeks"
                ? "bg-card text-foreground shadow-sm border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkle className="h-3.5 w-3.5 text-primary" />
            12 Weeks (Peak Glow)
          </button>
        </div>
      </div>

      {/* Interactive Before / After Split Slider Card */}
      <div className="rounded-[28px] border border-border/70 bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/60" />
            Before (Day 0)
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground italic">
            Drag slider left or right ⟷
          </div>
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            {timeframe === "8weeks" ? "After (Week 8)" : "After (Week 12)"}
          </div>
        </div>

        {/* Interactive Split Frame */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative aspect-[3/4] w-full max-h-[460px] overflow-hidden rounded-[22px] border border-border/80 select-none cursor-ew-resize touch-none shadow-inner bg-black/5"
        >
          {selfieSrc && (
            <>
              {/* Layer 1: Enhanced After Image (Bottom full width) */}
              <div
                className="absolute inset-0 h-full w-full overflow-hidden"
                style={{
                  filter:
                    timeframe === "8weeks"
                      ? "brightness(1.05) contrast(1.03) saturate(1.05)"
                      : "brightness(1.08) contrast(1.05) saturate(1.08)",
                }}
              >
                <img
                  src={selfieSrc}
                  alt="Projected transformed skin"
                  className="h-full w-full object-cover"
                />
                {/* Clinical skin smoothing & glow overlay */}
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    background:
                      timeframe === "8weeks"
                        ? "radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.14) 0%, rgba(244,114,182,0.06) 60%, rgba(0,0,0,0) 100%)"
                        : "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.22) 0%, rgba(251,191,36,0.07) 50%, rgba(0,0,0,0) 100%)",
                    mixBlendMode: "soft-light",
                  }}
                />
                {/* After Badge */}
                <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-bold text-primary-foreground shadow-md backdrop-blur-md">
                  ✨{" "}
                  {timeframe === "8weeks" ? "Week 8 Projection" : "Week 12 Maximum Transformation"}
                </div>
              </div>

              {/* Layer 2: Original Before Image (Clipped by slider position) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white/90 shadow-[0_0_15px_rgba(0,0,0,0.4)]"
                style={{ width: `${sliderPos}%` }}
              >
                <div
                  className="relative h-full"
                  style={{ width: containerRef.current?.clientWidth ?? "100%" }}
                >
                  <img
                    src={selfieSrc}
                    alt="Current skin scan"
                    className="h-full w-full object-cover"
                    style={{ width: containerRef.current?.clientWidth ?? "100%" }}
                  />
                  {/* Before Badge */}
                  <div className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white shadow-md backdrop-blur-md">
                    Day 0 (Initial Scan)
                  </div>
                </div>
              </div>

              {/* Slider Handle Divider */}
              <div
                className="absolute inset-y-0 -ml-4 flex items-center justify-center pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-primary text-primary-foreground shadow-xl">
                  <span className="text-[12px] font-black leading-none">⟷</span>
                </div>
              </div>
            </>
          )}
        </div>

        {isReferencePhoto && (
          <p className="text-[11px] text-center text-muted-foreground italic">
            * Displaying visual projection on clinical skin model reference
          </p>
        )}

        {/* Score comparison callout */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Current Baseline
            </p>
            <p className="mt-0.5 text-2xl font-black text-foreground">{baselineScore}</p>
            <p className="text-[11px] text-muted-foreground">Skin Score</p>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              {timeframe === "8weeks" ? "Week 8 Projected" : "Week 12 Projected"}
            </p>
            <div className="mt-0.5 flex items-center justify-center gap-1.5">
              <span className="text-2xl font-black text-primary">{currentProjectedScore}</span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3 mr-0.5" />+{scoreGain}
              </span>
            </div>
            <p className="text-[11px] text-primary/80 font-medium">Expected Score</p>
          </div>
        </div>
      </div>

      {/* Clinical Metrics Progress Comparison */}
      <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Projected Metric Improvements</h3>
            <p className="text-xs text-muted-foreground">
              Expected gains across key dermatological markers
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {timeframe === "8weeks" ? "+35% Avg Boost" : "+60% Avg Boost"}
          </span>
        </div>

        <div className="space-y-3">
          {METRIC_ORDER.map((k) => {
            const meta = METRIC_META[k];
            const Icon = meta.icon;
            const currentVal = metrics[k];
            const projectedVal = projectedMetrics[k];
            const diff = projectedVal - currentVal;

            return (
              <div
                key={k}
                className="rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through">{currentVal}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-bold text-foreground">{projectedVal}</span>
                    <span className="rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                      +{diff}
                    </span>
                  </div>
                </div>

                {/* Comparative Progress Bar */}
                <div className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                  {/* Current baseline bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-muted-foreground/35 rounded-full"
                    style={{ width: `${currentVal}%` }}
                  />
                  {/* Projected gain bar */}
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${projectedVal}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Week-by-Week Clinical Milestones Timeline */}
      <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Transformation Milestones</h3>
        </div>

        <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[17px] before:w-0.5 before:bg-border/80">
          {/* Milestone 1 */}
          <div className="relative flex items-start gap-3 pl-1">
            <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground text-xs font-bold shadow-sm">
              1
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/20 p-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">
                  Weeks 1 – 2: Cellular Activation
                </p>
                <span className="text-[10px] text-muted-foreground font-semibold">Immediate</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Active serums deeply hydrate the stratum corneum, normalize excess sebum, and soothe
                micro-inflammation.
              </p>
            </div>
          </div>

          {/* Milestone 2 */}
          <div className="relative flex items-start gap-3 pl-1">
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-card text-xs font-bold shadow-sm ${
                timeframe === "8weeks" || timeframe === "12weeks"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">
                  Weeks 3 – 8: Active Renewal & Clearance
                </p>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {timeframe === "8weeks" ? "Current View" : "Milestone Passed"}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Melanin hyperpigmentation clusters dissolve. Active breakouts reduce by ~65%, and
                skin texture visibly smooths out.
              </p>
            </div>
          </div>

          {/* Milestone 3 */}
          <div className="relative flex items-start gap-3 pl-1">
            <div
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-card text-xs font-bold shadow-sm ${
                timeframe === "12weeks"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </div>
            <div
              className={`rounded-2xl border p-3 flex-1 ${
                timeframe === "12weeks"
                  ? "border-primary/40 bg-gradient-to-r from-primary/10 to-transparent"
                  : "border-border/60 bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-foreground">
                  Weeks 9 – 12: Peak Radiance & Barrier Strength
                </p>
                {timeframe === "12weeks" && (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                    Peak Glow ✨
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                Collagen and peptide matrix reach maximum density. Fine lines are softened, pores
                refined, and a lasting healthy glass-skin glow is locked in.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regimen CTA Card */}
      <div className="rounded-[28px] border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-card p-5 shadow-sm text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Ready to Achieve This Transformation?</h3>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Start your personalized clinical regimen formulated with proven SKNPOP active serums to
          hit your 8 & 12 week milestones.
        </p>
        <div className="pt-1 flex flex-col gap-2">
          <Button asChild size="lg" className="h-12 w-full rounded-2xl">
            <Link to="/recommendations">
              <Sparkles className="mr-2 h-4 w-4" /> View Recommended Routine
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-2xl">
            <Link to="/recommendations/products">
              <ShoppingBag className="mr-2 h-4 w-4" /> Shop Clinical Serums
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
