import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSharedScan, type SharedScan } from "@/lib/skin-analysis.functions";
import { ScanResultsView } from "@/components/app/scan-results-view";
import { Navbar } from "@/components/layout/navbar";
import logoAsset from "@/assets/sknpop-logo.png.asset.json";

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
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl p-4 md:p-8 pt-10">
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm">Loading shared scan…</p>
        </div>
      </main>
      <Footer />
    </div>
  ),
  errorComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl p-4 md:p-8 pt-10">
        <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral text-center">
          This link is invalid or has been revoked.
        </div>
      </main>
      <Footer />
    </div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-3xl p-4 md:p-8 pt-10">
        <p className="text-sm text-muted-foreground text-center py-16">Shared scan not found.</p>
      </main>
      <Footer />
    </div>
  ),
});

function Footer() {
  return (
    <footer className="border-t border-border py-10 text-center">
      <img
        src={logoAsset.url}
        alt="SKNPOP Skincare"
        className="mx-auto h-10 w-auto"
        width={200}
        height={50}
      />
      <p className="mt-3 text-sm text-muted-foreground">
        AI-powered skincare intelligence
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-muted-foreground">
        © {new Date().getFullYear()} · Decoded by AI
      </p>
    </footer>
  );
}

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
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <main className="flex-1 mx-auto w-full max-w-3xl p-4 md:p-8 pt-10">
          <div className="space-y-4 max-w-md mx-auto">
            <div className="rounded-2xl border border-coral/40 bg-coral/5 p-4 text-sm text-coral text-center">
              This link is invalid or has been revoked.
            </div>
            <Link to="/">
              <Button className="w-full rounded-2xl">Go home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-md md:max-w-3xl p-4 md:p-8 pt-6 md:pt-10">
        <h1 className="text-2xl font-bold text-center mb-6">Skin Analysis Results</h1>
        <ScanResultsView scan={scan as any} />
        <div className="mt-8 flex justify-center max-w-md mx-auto">
          <Link to="/" className="w-full">
            <Button size="lg" className="h-14 w-full rounded-2xl">
              <ExternalLink className="mr-2 h-5 w-5" /> Get your own SKIN POP scan
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
