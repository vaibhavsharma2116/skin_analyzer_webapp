import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { ArrowLeft, ChevronRight, Search, Share2, Star } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listExperts, listExpertAnswers } from "@/lib/experts.functions";

export const Route = createFileRoute("/tips/experts")({
  loader: async () => {
    const experts = await listExperts();
    const answers = await listExpertAnswers(undefined);
    return { experts, answers };
  },
  head: () => ({
    meta: [
      { title: "Expert Advice — SKIN POP" },
      { name: "description", content: "Get personalized skincare answers from dermatologists and skincare experts." },
    ],
  }),
  component: ExpertsPage,
});

const TABS = ["All Experts", "Dermatologists", "Skincare Experts", "Nutritionists"];

function ExpertsPage() {
  const { experts: dbExperts, answers: dbAnswers } = Route.useLoaderData();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");

  const experts = dbExperts.filter((e) => {
    if (tab === 1) return e.title.toLowerCase().includes("dermat");
    if (tab === 2) return e.title.toLowerCase().includes("skincare");
    if (tab === 3) return e.title.toLowerCase().includes("nutrit");
    return true;
  }).filter((e) => (q ? e.name.toLowerCase().includes(q.toLowerCase()) : true));

  const popular = dbAnswers.slice(0, 3);

  return (
    <DeviceFrame
      title="Expert Advice"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/tips" })}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Share"><Share2 className="h-4 w-4" /></button>}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search expert, topics…" className="h-11 rounded-2xl pl-9" />
      </div>

      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(i)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium ${
              tab === i ? "border-primary bg-primary/10 text-primary" : "border-border/70 bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold">Ask an Expert</p>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div>
          <p className="text-sm font-semibold">Have a skin concern?</p>
          <p className="mt-1 text-xs text-muted-foreground">Get personalized advice from our experts.</p>
          <Button className="mt-3 h-9 rounded-xl">Ask Now</Button>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/70 text-3xl">👩‍⚕️</div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Featured Experts</p>
        <button className="text-xs font-semibold text-primary">View All</button>
      </div>
      <div className="mt-2 space-y-2">
        {experts.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => navigate({ to: "/tips/experts/$id", params: { id: e.id } })}
            className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full font-semibold ${e.tone}`}>
              {e.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{e.name}</p>
              <p className="truncate text-xs text-muted-foreground">{e.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{e.years}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                {e.rating} <span className="text-muted-foreground">({e.answers_count} Answers)</span>
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">Popular Questions</p>
        <button className="text-xs font-semibold text-primary">View All</button>
      </div>
      <div className="mt-2 space-y-2">
        {popular.map((a: any) => {
          const expert = dbExperts.find(e => e.slug === a.expert_id || e.id === a.expert_id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => navigate({ to: "/tips/experts/$id", params: { id: a.expert_id } })}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 text-left"
            >
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold">{a.question}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">{expert?.name}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </DeviceFrame>
  );
}
