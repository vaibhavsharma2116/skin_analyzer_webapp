import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Share2, Trash2 } from "lucide-react";
import { z } from "zod";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { ShareScanSheet } from "@/components/app/share-scan-sheet";
import { ScanResultsView } from "@/components/app/scan-results-view";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteScan,
  getScanById,
  listMyScans,
  type ScanRow,
} from "@/lib/skin-analysis.functions";

const viewSchema = z
  .object({
    tab: z.enum(["overview", "concerns", "analysis", "advice"]).catch("overview").optional(),
  })
  .catch({});

export const Route = createFileRoute("/history/$id")({
  ssr: false,
  validateSearch: (s) => viewSchema.parse(s),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
  },
  head: () => ({
    meta: [
      { title: "Scan Details — SKIN POP" },
      { name: "description", content: "Review a saved AI skin analysis: score, concerns, skin age, and tips." },
    ],
  }),
  component: HistoryDetailPage,
});

function HistoryDetailPage() {
  const { id } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const fetchOne = useServerFn(getScanById);
  const fetchList = useServerFn(listMyScans);
  const removeScan = useServerFn(deleteScan);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [row, setRow] = useState<ScanRow | null>(null);
  const [previous, setPrevious] = useState<ScanRow | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    setStatus("loading");
    Promise.all([fetchOne({ data: { id } }), fetchList()])
      .then(([r, list]) => {
        if (!r) {
          setError("Scan not found.");
          setStatus("error");
          return;
        }
        const current = r as ScanRow;
        setRow(current);
        const others = (list as ScanRow[]).filter((s) => s.id !== current.id);
        const before = others.find((s) => s.created_at < current.created_at) ?? null;
        setPrevious(before);
        setStatus("ready");
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Failed to load scan");
        setStatus("error");
      });
  }, [id, fetchOne, fetchList]);

  const back = () => navigate({ to: "/history" });

  async function handleDelete() {
    if (!row) return;
    if (!confirm("Delete this scan? This cannot be undone.")) return;
    try {
      await removeScan({ data: { id: row.id } });
      navigate({ to: "/history" });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  }

  if (status === "loading") {
    return (
      <DeviceFrame
        title="Results Summary"
        leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      >
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading scan…</p>
        </div>
      </DeviceFrame>
    );
  }

  if (status === "error" || !row) {
    return (
      <DeviceFrame
        title="Results Summary"
        leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      >
        <div className="space-y-3">
          <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">{error}</div>
          <Button className="w-full" onClick={back}>Back to history</Button>
        </div>
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame
      title="Results Summary"
      leftSlot={<button className="icon-button" aria-label="Back" onClick={back}><ArrowLeft className="h-4 w-4" /></button>}
      rightSlot={
        <div className="flex items-center gap-1">
          <button className="icon-button" aria-label="Share" onClick={() => setShareOpen(true)}>
            <Share2 className="h-4 w-4" />
          </button>
          <button className="icon-button" aria-label="Delete" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      }
    >
      <ScanResultsView scan={row} previous={previous} initialTab={tab ?? "overview"} />

      {previous && (
        <div className="mt-5">
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full rounded-2xl"
            onClick={() => navigate({ to: "/history/compare", search: { a: row.id, b: previous.id } })}
          >
            Compare with previous scan
          </Button>
        </div>
      )}

      <ShareScanSheet open={shareOpen} onClose={() => setShareOpen(false)} scan={row} />
    </DeviceFrame>
  );
}
