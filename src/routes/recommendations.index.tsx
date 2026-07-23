import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Sun, Moon, Leaf, Ban, ChevronRight, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";
import { recommendationsFor, scanFocus } from "@/lib/recommendations";

export const Route = createFileRoute("/recommendations/")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "AI Recommendations — SKIN POP" },
      { name: "description", content: "Your personalized AM/PM routine, ingredients to use, and lifestyle tips." },
    ],
  }),
  component: RecommendationsIndex,
});

function RecommendationsIndex() {
  const navigate = useNavigate();
  const fetchLatest = useServerFn(getLatestScan);
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchLatest()
      .then((row) => { if (active) setScan((row as ScanRow | null) ?? null); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetchLatest]);

  const preset = recommendationsFor(scan);
  const focus = scanFocus(scan);

  return (
    <DeviceFrame
      title="AI Recommendations"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/dashboard" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-[28px] bg-gradient-card px-5 py-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Personalized for you
        </div>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {scan?.skin_type ? `${cap(scan.skin_type)} skin plan` : "Your skin plan"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {loading
            ? "Loading your latest scan…"
            : scan
              ? focus.length > 0
                ? `Targeting ${focus.join(", ")}.`
                : "Based on your latest skin scan."
              : "Run a scan for a fully tailored plan. Showing a general routine for now."}
        </p>
      </div>

      <RoutineCard title="Morning Routine" icon={<Sun className="h-4 w-4" />} steps={preset.am.map((s, i) => ({ n: i + 1, ...s }))} />
      <RoutineCard title="Evening Routine" icon={<Moon className="h-4 w-4" />} steps={preset.pm.map((s, i) => ({ n: i + 1, ...s }))} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <IngredientCard title="Ingredients to Use" tone="sage" icon={<Leaf className="h-4 w-4" />} items={preset.ingredientsUse} />
        <IngredientCard title="Ingredients to Avoid" tone="coral" icon={<Ban className="h-4 w-4" />} items={preset.ingredientsAvoid} />
      </div>

      <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Lifestyle Tips</p>
        <ul className="mt-2 space-y-1.5">
          {preset.lifestyleTips.map((t) => (
            <li key={t} className="flex gap-2 text-xs text-muted-foreground">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 space-y-2">
        <Button className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations/products" })}>
          Explore Products <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations/routine" })}>
          Build My Routine
        </Button>
      </div>
    </DeviceFrame>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function RoutineCard({ title, icon, steps }: { title: string; icon: React.ReactNode; steps: { n: number; title: string; emoji: string; hint: string }[] }) {
  return (
    <div className="mt-5 rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-primary">
        {icon}
        {title}
      </div>
      <ul className="mt-3 space-y-2">
        {steps.map((s) => (
          <li key={s.n} className="flex items-center gap-3 rounded-xl bg-secondary/40 p-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{s.n}</span>
            <span className="text-xl">{s.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{s.hint}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IngredientCard({ title, tone, icon, items }: { title: string; tone: "sage" | "coral"; icon: React.ReactNode; items: string[] }) {
  const bg = tone === "sage" ? "bg-sage/15 border-sage/30" : "bg-coral/10 border-coral/30";
  const fg = tone === "sage" ? "text-sage" : "text-coral";
  return (
    <div className={`rounded-2xl border p-3 ${bg}`}>
      <div className={`flex items-center gap-1.5 text-xs font-semibold ${fg}`}>
        {icon}
        {title}
      </div>
      <ul className="mt-2 space-y-1">
        {items.map((i) => (
          <li key={i} className="text-[11px] text-foreground">• {i}</li>
        ))}
      </ul>
    </div>
  );
}
