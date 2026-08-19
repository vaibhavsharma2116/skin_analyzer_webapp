import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowUp, ArrowDown, Loader2, Share2 } from "lucide-react";
import { z } from "zod";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { MiniScoreArc } from "@/components/app/score-arc";
import { METRIC_META, METRIC_ORDER, normalizeMetrics, scoreTone } from "@/components/app/metric-tokens";
import { supabase } from "@/integrations/supabase/client";
import { getScansForCompare, listMyScans, type ScanRow } from "@/lib/skin-analysis.functions";

const searchSchema = z.object({
  a: z.string().uuid().optional(),
  b: z.string().uuid().optional(),
});

export const Route = createFileRoute("/history/compare")({
  ssr: false,
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Compare Progress — SKIN POP" },
      { name: "description", content: "Compare two of your AI skin scans side-by-side to track progress." },
    ],
  }),
  component: ComparePage,
});

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function ComparePage() {
  const { a, b } = Route.useSearch();
  const navigate = useNavigate();
  const fetchPair = useServerFn(getScansForCompare);
  const fetchList = useServerFn(listMyScans);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [scanA, setScanA] = useState<ScanRow | null>(null);
  const [scanB, setScanB] = useState<ScanRow | null>(null);
  const [allScans, setAllScans] = useState<ScanRow[]>([]);

  useEffect(() => {
    setStatus("loading");
    fetchList()
      .then(async (list) => {
        const scans = (list as ScanRow[]) ?? [];
        setAllScans(scans);
        if (!a || !b) {
          if (scans.length < 2) {
            setError("You need at least two scans to compare.");
            setStatus("error");
            return;
          }
          setScanA(scans[0]);
          setScanB(scans[1]);
          setStatus("ready");
          return;
        }
        const pair = await fetchPair({ data: { a, b } });
        if (!pair.a || !pair.b) {
          setError("Selected scans not found.");
          setStatus("error");
          return;
        }
        setScanA(pair.a as ScanRow);
        setScanB(pair.b as ScanRow);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load");
        setStatus("error");
      });
  }, [a, b, fetchPair, fetchList]);

  // Ensure A is newer, B is older (deltas = A - B)
  const [current, previous] = useMemo(() => {
    if (!scanA || !scanB) return [scanA, scanB] as const;
    if (scanA.created_at >= scanB.created_at) return [scanA, scanB] as const;
    return [scanB, scanA] as const;
  }, [scanA, scanB]);

  const back = () => navigate({ to: "/history" });

  if (status === "loading") {
    return (
      <DeviceFrame
        title="Compare Progress"
        leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading comparison…</p>
        </div>
      </DeviceFrame>
    );
  }

  if (status === "error" || !current || !previous) {
    return (
      <DeviceFrame
        title="Compare Progress"
        leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">{error ?? "Unable to compare"}</div>
          <Button className="w-full" onClick={back}>Back to history</Button>
        </div>
      </DeviceFrame>
    );
  }

  const mCurrent = normalizeMetrics(current.metrics);
  const mPrevious = normalizeMetrics(previous.metrics);
  const scoreDelta = current.overall_score - previous.overall_score;
  const dtCurr = fmtDateTime(current.created_at);
  const dtPrev = fmtDateTime(previous.created_at);

  const improvedCount = METRIC_ORDER.filter((k) => mCurrent[k] > mPrevious[k]).length;
  const allImproved = improvedCount === METRIC_ORDER.length;

  const swapOptions = allScans.filter((s) => s.id !== current.id && s.id !== previous.id);

  return (
    <DeviceFrame
      title="Compare Progress"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={<button className="icon-button" aria-label="Share"><Share2 className="h-4 w-4" /></button>}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm">
            <p className="text-xs font-medium">{dtCurr.date}</p>
            <p className="text-[10px] text-muted-foreground">{dtCurr.time}</p>
            <div className="mt-2 flex justify-center"><MiniScoreArc score={current.overall_score} size={72} /></div>
            <p className={`mt-1 text-[10px] font-semibold ${scoreTone(current.overall_score).cls}`}>{scoreTone(current.overall_score).label}</p>
          </div>
          <p className="text-sm font-semibold text-muted-foreground">VS</p>
          <div className="rounded-2xl border border-border/70 bg-card p-3 text-center shadow-sm">
            <p className="text-xs font-medium">{dtPrev.date}</p>
            <p className="text-[10px] text-muted-foreground">{dtPrev.time}</p>
            <div className="mt-2 flex justify-center"><MiniScoreArc score={previous.overall_score} size={72} /></div>
            <p className={`mt-1 text-[10px] font-semibold ${scoreTone(previous.overall_score).cls}`}>{scoreTone(previous.overall_score).label}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Score Comparison</p>
          <div className="mt-2 space-y-2">
            {METRIC_ORDER.map((k) => {
              const meta = METRIC_META[k];
              const Icon = meta.icon;
              const cur = mCurrent[k];
              const prev = mPrevious[k];
              const diff = cur - prev;
              const positive = diff > 0;
              const neutral = diff === 0;
              return (
                <div key={k} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-3 shadow-sm">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="truncate text-sm font-medium">{meta.label}</p>
                  <p className="w-8 text-right text-sm font-semibold">{cur}</p>
                  <p className="w-8 text-right text-xs text-muted-foreground">{prev}</p>
                  <p className={`inline-flex w-12 items-center justify-end gap-0.5 text-xs font-semibold ${
                    neutral ? "text-muted-foreground" : positive ? "text-sage" : "text-coral"
                  }`}>
                    {!neutral && (positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                    {positive ? "+" : ""}{diff}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`rounded-2xl p-4 ${scoreDelta >= 0 ? "bg-sage/10 text-sage" : "bg-coral/10 text-coral"}`}>
          <p className="text-sm font-semibold">
            {scoreDelta >= 0 ? (allImproved ? "Great Progress! 🎉" : "Nice work!") : "Keep going 💪"}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {scoreDelta >= 0
              ? `You've improved in ${improvedCount} of ${METRIC_ORDER.length} areas. Keep up the great work and stay consistent!`
              : "A few areas dropped. Stay consistent with your routine and you'll see results next time."}
          </p>
        </div>

        {swapOptions.length > 0 && (
          <div>
            <p className="text-sm font-semibold">Compare against another scan</p>
            <div className="mt-2 space-y-2">
              {swapOptions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => navigate({ to: "/history/compare", search: { a: current.id, b: s.id } })}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-2 text-left"
                >
                  <MiniScoreArc score={s.overall_score} size={44} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {new Date(s.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="truncate text-xs text-muted-foreground capitalize">
                      {new Date(s.created_at).getHours() >= 5 && new Date(s.created_at).getHours() < 17 ? "morning" : "night"} scan
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${scoreTone(s.overall_score).cls}`}>{s.overall_score}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Button size="lg" className="h-12 w-full rounded-2xl" onClick={back}>Back to history</Button>
      </div>
    </DeviceFrame>
  );
}
