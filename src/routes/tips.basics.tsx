import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { SKIN_BASICS } from "@/lib/skin-guide";

export const Route = createFileRoute("/tips/basics")({
  head: () => ({
    meta: [
      { title: "Skincare Basics — SKIN POP" },
      { name: "description", content: "The 5-step skincare routine every beginner should know." },
    ],
  }),
  component: BasicsPage,
});

function BasicsPage() {
  const navigate = useNavigate();
  return (
    <DeviceFrame
      title="Skincare Basics"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Beginner Friendly
        </div>
        <p className="mt-1 text-lg font-semibold leading-tight">Your daily 5-step routine</p>
        <p className="mt-1 text-xs text-muted-foreground">Simple, effective steps for healthy, glowing skin — every day.</p>
      </div>

      <div className="mt-4 space-y-3">
        {SKIN_BASICS.map((s) => (
          <div key={s.step} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/70 bg-card p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-2xl">{s.emoji}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">Step {s.step}</p>
              <p className="text-sm font-semibold">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Pro tip</p>
        <p className="mt-1">Introduce one new active at a time and give it 4–6 weeks before judging results.</p>
      </div>
    </DeviceFrame>
  );
}
