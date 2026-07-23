import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Share2 } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ShareScanSheet } from "@/components/app/share-scan-sheet";
import { supabase } from "@/integrations/supabase/client";
import { getLatestScan, type ScanRow } from "@/lib/skin-analysis.functions";

export const Route = createFileRoute("/recommendations/share")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({ meta: [{ title: "Share Results — SKIN POP" }] }),
  component: SharePage,
});

function SharePage() {
  const navigate = useNavigate();
  const fetchLatest = useServerFn(getLatestScan);
  const [scan, setScan] = useState<ScanRow | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchLatest().then((r) => setScan((r as ScanRow | null) ?? null)).catch(() => {});
  }, [fetchLatest]);

  return (
    <DeviceFrame
      title="Share Results"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={() => navigate({ to: "/recommendations/save" })}><ArrowLeft className="h-4 w-4" /></button>}
    >
      <div className="rounded-[28px] bg-gradient-card px-6 py-8 text-center shadow-sm">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Share2 className="h-10 w-10 text-primary" />
        </div>
        <p className="mt-4 text-xl font-bold text-foreground">Share your skin score</p>
        <p className="mt-1 text-sm text-muted-foreground">Show friends your progress and invite them to try SKIN POP.</p>
      </div>

      {scan ? (
        <div className="mt-5 rounded-2xl border border-border/70 bg-card p-5 text-center">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Latest Skin Score</p>
          <p className="mt-2 text-5xl font-bold text-primary">{scan.overall_score}<span className="text-lg font-medium text-muted-foreground">/100</span></p>
          {scan.skin_type && <p className="mt-1 text-sm text-muted-foreground">{scan.skin_type} skin</p>}
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Run a scan first to share your results.
        </p>
      )}

      <div className="mt-6 space-y-2">
        <Button className="h-12 w-full rounded-2xl" onClick={() => setOpen(true)} disabled={!scan}>
          <Share2 className="mr-2 h-4 w-4" /> Share Now
        </Button>
        <Button variant="ghost" className="h-11 w-full rounded-2xl text-primary" onClick={() => navigate({ to: "/dashboard" })}>
          Back to Dashboard
        </Button>
      </div>

      {scan && <ShareScanSheet open={open} onClose={() => setOpen(false)} scan={scan} />}
    </DeviceFrame>
  );
}
