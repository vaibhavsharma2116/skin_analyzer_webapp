import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { DeviceFrame } from "@/components/app/device-frame";
import { Button } from "@/components/ui/button";
import { getSharedScan, type SharedScan } from "@/lib/skin-analysis.functions";

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

  const label = scoreLabel(scan.overall_score);

  return (
    <DeviceFrame title="Shared Scan">
      <div className="space-y-5">
        <div className="rounded-[28px] bg-gradient-card px-5 py-6 text-center shadow-sm">
          <div className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> SKIN POP · AI Analysis
          </div>
          <div className="mt-4 text-6xl font-semibold text-primary">{scan.overall_score}</div>
          <div className="text-sm text-muted-foreground">Skin Score / 100</div>
          <div className={`mt-1 text-base font-semibold ${label.tone}`}>{label.label}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Skin Age</p>
            <p className="mt-1 text-2xl font-semibold">{scan.skin_age ?? "—"}</p>
            <p className="text-xs text-muted-foreground">years</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">Skin Type</p>
            <p className="mt-1 text-2xl font-semibold capitalize">{scan.skin_type ?? "—"}</p>
            <p className="text-xs text-muted-foreground">detected</p>
          </div>
        </div>

        {scan.summary && (
          <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
            <p className="text-sm font-semibold">Summary</p>
            <p className="mt-1 text-sm text-muted-foreground">{scan.summary}</p>
          </div>
        )}

        {scan.concerns?.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Detected concerns</p>
            {scan.concerns.map((c, i) => (
              <div key={`${c.name}-${i}`} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{c.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${severityColor(c.severity)}`}>
                    {c.severity}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, Math.min(100, c.score))}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {scan.recommendations?.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Personalized tips</p>
            <div className="space-y-2">
              {scan.recommendations.map((tip, i) => (
                <div key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-sage" />
                  <p className="text-sm text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link to="/">
          <Button size="lg" className="h-12 w-full rounded-2xl">
            <ExternalLink className="mr-2 h-4 w-4" /> Get your own SKIN POP scan
          </Button>
        </Link>
      </div>
    </DeviceFrame>
  );
}
