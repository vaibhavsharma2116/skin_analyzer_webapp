import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Bell, CheckCircle2, Heart, Loader2, Share2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { createReminder } from "@/lib/reminders.functions";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";
import { recommendationsFor } from "@/lib/recommendations";

const KEY = "skinpop.builder.v1";

type BuilderState = {
  am: string[];
  pm: string[];
  amTime: string;
  pmTime: string;
};

export const Route = createFileRoute("/recommendations/save")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Save & Follow — SKIN POP" }] }),
  component: SaveAndFollow,
});

function SaveAndFollow() {
  const navigate = useNavigate();
  const fetchLatest = useServerFn(getLatestScan);
  const addReminder = useServerFn(createReminder);
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState({ am: false, pm: false });

  useEffect(() => {
    fetchLatest().then((r) => setScan((r as ScanRow | null) ?? null)).catch(() => {});
  }, [fetchLatest]);

  const builder: BuilderState | null = useMemo(() => {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(KEY) ?? "null"); } catch { return null; }
  }, []);

  const preset = recommendationsFor(scan);

  const runSave = async () => {
    if (!builder) return;
    setStatus("saving");
    setError(null);
    try {
      const amSteps = preset.am.filter((s) => builder.am.includes(s.id)).map((s) => s.title);
      const pmSteps = preset.pm.filter((s) => builder.pm.includes(s.id)).map((s) => s.title);
      let didAm = false, didPm = false;
      if (amSteps.length > 0) {
        await addReminder({ data: {
          category: "routine",
          name: "Morning Routine",
          repeat: "daily",
          time_of_day: builder.amTime,
          steps: amSteps,
          note: "Auto-created from your AI recommendations",
        } });
        didAm = true;
      }
      if (pmSteps.length > 0) {
        await addReminder({ data: {
          category: "routine",
          name: "Evening Routine",
          repeat: "daily",
          time_of_day: builder.pmTime,
          steps: pmSteps,
          note: "Auto-created from your AI recommendations",
        } });
        didPm = true;
      }
      setSaved({ am: didAm, pm: didPm });
      setStatus("saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save routine");
      setStatus("error");
    }
  };

  return (
    <DeviceFrame
      title="Save & Follow"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/recommendations/routine" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      {status === "saved" ? (
        <div className="flex flex-col items-center pt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-coral/15">
            <Heart className="h-10 w-10 fill-coral text-coral" />
          </div>
          <p className="mt-4 text-lg font-bold text-foreground">Routine saved!</p>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {saved.am && saved.pm
              ? "Morning & evening reminders are set."
              : saved.am
                ? "Morning reminder is set."
                : "Evening reminder is set."}
          </p>

          <div className="mt-6 w-full space-y-2">
            <Button className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/reminders" })}>
              <Bell className="mr-2 h-4 w-4" /> View Reminders
            </Button>
            <Button variant="outline" className="h-12 w-full rounded-2xl" onClick={() => navigate({ to: "/recommendations/share" })}>
              <Share2 className="mr-2 h-4 w-4" /> Share My Skin Score
            </Button>
            <Button variant="ghost" className="h-11 w-full rounded-2xl text-primary" onClick={() => navigate({ to: "/dashboard" })}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-[28px] bg-gradient-card px-5 py-5 shadow-sm text-center">
            <Heart className="mx-auto h-12 w-12 fill-coral text-coral" />
            <p className="mt-3 text-lg font-semibold text-foreground">Save your routine</p>
            <p className="mt-1 text-sm text-muted-foreground">We'll create daily reminders so you never miss a step.</p>
          </div>

          {builder ? (
            <div className="mt-5 space-y-3">
              <SummaryRow label="Morning steps" value={`${builder.am.length} · ${builder.amTime}`} />
              <SummaryRow label="Evening steps" value={`${builder.pm.length} · ${builder.pmTime}`} />
              {scan?.skin_type && <SummaryRow label="Skin type" value={scan.skin_type} />}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No routine to save yet.{" "}
              <button className="font-semibold text-primary" onClick={() => navigate({ to: "/recommendations/routine" })}>Build one</button>.
            </div>
          )}

          {status === "error" && error && (
            <p className="mt-4 rounded-xl border border-coral/40 bg-coral/5 p-3 text-xs text-coral">{error}</p>
          )}

          <Button
            className="mt-6 h-12 w-full rounded-2xl"
            onClick={runSave}
            disabled={!builder || status === "saving" || (builder.am.length + builder.pm.length === 0)}
          >
            {status === "saving" ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>) : (<><CheckCircle2 className="mr-2 h-4 w-4" /> Save Routine</>)}
          </Button>
        </>
      )}
    </DeviceFrame>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
