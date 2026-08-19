import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { getSharedScan, type SharedScan } from "@/lib/skin-analysis.functions";
import { ScanResultsView } from "@/components/app/scan-results-view";

export const Route = createFileRoute("/s/$token")({
  loader: async ({ params }) => {
    try {
      const scan = (await getSharedScan({ data: { token: params.token } })) as SharedScan | null;
      return { scan };
    } catch {
      return { scan: null as SharedScan | null };
    }
  },
  head: ({ loaderData }) => {
    const scan = loaderData?.scan;
    if (!scan) {
      return {
        meta: [
          { title: "Shared skin scan — SKIN POP" },
          { name: "description", content: "This share link is invalid or has been revoked." },
        ],
      };
    }
    return {
      meta: [
        { title: `Skin Score ${scan.overall_score}/100 — SKIN POP` },
        {
          name: "description",
          content: `AI skin analysis: score ${scan.overall_score}, skin age ${scan.skin_age ?? "—"}, ${scan.skin_type ?? "detected"} skin.`,
        },
        { property: "og:title", content: `Skin Score ${scan.overall_score}/100 — SKIN POP` },
        {
          property: "og:description",
          content: `AI skin analysis: score ${scan.overall_score}, skin age ${scan.skin_age ?? "—"}.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: SharedScanPage,
  pendingComponent: () => (
    <DeviceFrame title="Shared Scan">
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm">Loading shared scan…</p>
      </div>
    </DeviceFrame>
  ),
  errorComponent: () => (
    <DeviceFrame title="Shared Scan">
      <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">
        This link is invalid or has been revoked.
      </div>
    </DeviceFrame>
  ),
  notFoundComponent: () => (
    <DeviceFrame title="Shared Scan">
      <p className="text-sm text-muted-foreground">Shared scan not found.</p>
    </DeviceFrame>
  ),
});

function scoreLabel(score: number) {
  if (score >= 85) return { label: "Excellent", tone: "text-sage" };
  if (score >= 70) return { label: "Good", tone: "text-sage" };
  if (score >= 55) return { label: "Fair", tone: "text-primary" };
  return { label: "Needs care", tone: "text-coral" };
}

function severityColor(sev: string) {
  if (sev === "high") return "bg-coral/15 text-coral";
  if (sev === "moderate") return "bg-primary/15 text-primary";
  return "bg-sage/15 text-sage";
}

function SharedScanPage() {
  const { scan } = Route.useLoaderData() as { scan: SharedScan | null };

  if (!scan) {
    return (
      <DeviceFrame title="Shared Scan">
        <div className="space-y-4">
          <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral">
            This link is invalid or has been revoked.
          </div>
          <Link to="/">
            <Button className="w-full rounded-2xl">Go home</Button>
          </Link>
        </div>
      </DeviceFrame>
    );
  }

  return (
    <DeviceFrame title="Shared Scan">
      <ScanResultsView scan={scan as any} />
      <div className="mt-5">
        <Link to="/">
          <Button size="lg" className="h-12 w-full rounded-2xl">
            <ExternalLink className="mr-2 h-4 w-4" /> Get your own SKIN POP scan
          </Button>
        </Link>
      </div>
    </DeviceFrame>
  );
}
