import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Droplet,
  Info,
  Moon,
  Sparkles,
  Sun,
  Waves,
  CircleDot,
  Smile,
  Shield,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ScoreArc } from "./score-arc";
import { RadarChart } from "./radar-chart";
import { METRIC_META, METRIC_ORDER, normalizeMetrics, overallLabel, scoreTone } from "./metric-tokens";
import type { ScanRow } from "@/lib/skin-analysis.functions";
import { recommendationsFor } from "@/lib/recommendations";
import { useQuery } from "@tanstack/react-query";
import { getShopifyRecommendations } from "@/lib/shopify.functions";
import { ShoppingBag } from "lucide-react";
type TabKey = "overview" | "concerns" | "analysis" | "advice";

export function ScanResultsView({
  scan,
  previous,
  initialTab = "overview",
}: {
  scan: ScanRow;
  previous?: ScanRow | null;
  initialTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(initialTab);
  const metrics = normalizeMetrics(scan.metrics);
  const prevMetrics = previous ? normalizeMetrics(previous.metrics) : null;
  const scoreDelta = previous ? scan.overall_score - previous.overall_score : null;

  return (
    <div className="space-y-5">
      {/* Top Summary Card — gauge + scan meta */}
      <div className="rounded-[28px] border border-border/70 bg-card p-4 shadow-sm">
        <div className="flex flex-col min-[380px]:grid min-[380px]:grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <div className="py-2">
            <ScoreArc score={scan.overall_score} size={180} />
          </div>
          <dl className="w-full space-y-2 text-xs">
            <MetaRow label="Scan Date" value={fmtDateShort(scan.created_at)} />
            <MetaRow label="Skin Type" value={scan.skin_type ? cap(scan.skin_type) : "—"} />
            <MetaRow label="Scan ID" value={scanIdShort(scan.id, scan.created_at)} mono />
          </dl>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border/70 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {(["overview", "concerns", "analysis", "advice"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`relative whitespace-nowrap px-4 py-2.5 text-sm font-semibold capitalize transition-colors ${
              tab === t ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {t}
            {tab === t && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <OverviewTab scan={scan} previous={previous ?? null} metrics={metrics} prevMetrics={prevMetrics} scoreDelta={scoreDelta} />
      )}
      {tab === "concerns" && <ConcernsTab scan={scan} />}
      {tab === "analysis" && <AnalysisTab scan={scan} metrics={metrics} />}
      {tab === "advice" && <AdviceTab scan={scan} />}
    </div>
  );
}

/* ---------------- Overview ---------------- */

function OverviewTab({
  scan,
  previous,
  metrics,
  prevMetrics,
  scoreDelta,
}: {
  scan: ScanRow;
  previous: ScanRow | null;
  metrics: ReturnType<typeof normalizeMetrics>;
  prevMetrics: ReturnType<typeof normalizeMetrics> | null;
  scoreDelta: number | null;
}) {
  const scoreT = scoreTone(scan.overall_score);
  const hydT = scoreTone(metrics.hydration);
  const oilT = scoreTone(metrics.oil_balance);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[24px] border border-primary/20 bg-gradient-to-b from-primary/10 to-transparent p-5">
        <div className="absolute right-0 top-0 opacity-[0.03] text-primary">
          <Sparkles className="h-32 w-32 -translate-y-6 translate-x-6" />
        </div>
        
        <div className="relative flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-primary shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Clinical AI Assessment</h3>
            <p className="text-[10px] uppercase tracking-wider text-primary font-semibold">SKIN POP AI Engine</p>
          </div>
        </div>
        
        <div className="relative z-10">
          <div className="absolute bottom-0 left-0 top-0 w-0.5 rounded-full bg-primary/30"></div>
          <p className="pl-4 text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap font-medium">
            {scan.summary ?? "Here's a quick overview of your skin health based on our AI analysis."}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <SummaryTile label="Skin Score" value={`${scan.overall_score}`} suffix="/100" tone={scoreT} bar={scan.overall_score} />
        <SummaryTile label="Skin Age" value={`${scan.skin_age ?? "—"}`} suffix="years" />
        <SummaryTile label="Hydration" value={hydT.label} tone={hydT} bar={metrics.hydration} valueSize="lg" />
        <SummaryTile label="Oil Balance" value={oilT.label} tone={oilT} bar={metrics.oil_balance} valueSize="lg" />
      </div>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold">Top Skin Concerns</h3>
          <span className="text-[11px] text-muted-foreground">We found {scan.concerns?.length ?? 0} concerns</span>
        </div>
        <div className="mt-2 divide-y divide-border/70 rounded-2xl border border-border/70 bg-card">
          {scan.concerns?.slice(0, 4).map((c, i) => (
            <div key={`${c.name}-${i}`} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ConcernIcon name={c.name} className="h-3.5 w-3.5" />
                </span>
                <p className="text-sm">{c.name}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${severityColor(c.severity)}`}>
                {c.severity}
              </span>
            </div>
          )) ?? null}
        </div>
      </section>

      {/* Detailed Overview: Radar */}
      <section className="rounded-[28px] border border-border/70 bg-card p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Skin Score Breakdown</h3>
        <p className="text-xs text-muted-foreground">Detailed breakdown of your skin health</p>
        <div className="mt-2">
          <RadarChart current={metrics} previous={prevMetrics} />
        </div>
      </section>

      <section className="rounded-[28px] border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Overall Skin Score</p>
          <span className={`text-sm font-semibold ${scoreT.cls}`}>{overallLabel(scan.overall_score)}</span>
        </div>
        <p className="mt-1 text-3xl font-semibold">
          {scan.overall_score}
          <span className="text-base font-normal text-muted-foreground"> /100</span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${scan.overall_score}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {scoreDelta !== null && previous ? (
            <>
              You've {scoreDelta >= 0 ? "improved" : "changed"} by{" "}
              <span className={scoreDelta >= 0 ? "font-semibold text-sage" : "font-semibold text-coral"}>
                {scoreDelta >= 0 ? "+" : ""}
                {scoreDelta} points
              </span>{" "}
              since your last scan {scoreDelta >= 0 ? "🎉" : ""}
            </>
          ) : (
            <>You're doing great! Keep up with your skincare routine.</>
          )}
        </p>
        <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-2xl bg-muted/50 p-3 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 text-primary" />
          <p>This score is based on AI analysis and can vary with environment, lifestyle & routine.</p>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold">Skin Health Summary</h3>
        <p className="text-xs text-muted-foreground">Your skin is overall healthy with minor concerns</p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {healthSummary(scan, metrics).map((line, i) => (
            <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------------- Concerns ---------------- */

function ConcernsTab({ scan }: { scan: ScanRow }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Skin Concerns</h3>
        <p className="text-xs text-muted-foreground">Detailed view of detected concerns</p>
      </section>
      <div className="space-y-3">
        {scan.concerns?.length ? (
          scan.concerns.map((c, i) => (
            <div key={`${c.name}-${i}`} className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
              <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="mt-0.5 shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ConcernIcon name={c.name} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{concernDescription(c.name)}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${severityColor(c.severity)}`}>
                  {c.severity}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-3">
                <span className="text-[11px] text-muted-foreground">Severity</span>
                <SeverityDots score={c.score} />
                <span className="ml-auto text-[11px] font-semibold text-muted-foreground">{c.score}%</span>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-sm text-muted-foreground">
            No concerns detected.
          </p>
        )}
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-2xl bg-primary/10 p-4 text-xs text-primary">
        <Info className="mt-0.5 h-4 w-4" />
        <p>
          <span className="font-semibold">Tip:</span> Consistency is key! Follow the recommended routine and protect your skin daily.
        </p>
      </div>
    </div>
  );
}

/* ---------------- Analysis ---------------- */

function AnalysisTab({ scan, metrics }: { scan: ScanRow; metrics: ReturnType<typeof normalizeMetrics> }) {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Detailed Analysis</h3>
        <p className="text-xs text-muted-foreground">In-depth analysis of your skin parameters</p>
      </section>
      <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
        <ul className="divide-y divide-border/70">
          {METRIC_ORDER.map((k) => {
            const meta = METRIC_META[k];
            const v = metrics[k];
            const tone = scoreTone(v);
            const Icon = meta.icon;
            return (
              <li key={k} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between">
                    <p className="text-sm font-semibold">{meta.label}</p>
                    <p className="text-xs font-semibold text-muted-foreground">
                      <span className="text-foreground">{v}</span>/100
                    </p>
                  </div>
                  <p className={`text-[11px] font-medium ${tone.cls}`}>{tone.label}</p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${toneBar(v)}`} style={{ width: `${Math.max(4, v)}%` }} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 rounded-2xl bg-muted/60 p-4 text-xs">
        <Info className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <p className="font-semibold text-foreground">AI Analysis</p>
          <p className="mt-0.5 text-muted-foreground">
            Our AI analyzes multiple factors to give you accurate results. Retake scan in different lighting for best accuracy.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Advice ---------------- */

function AdviceTab({ scan }: { scan: ScanRow }) {
  const preset = recommendationsFor(scan);
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-sm font-semibold">Personalized Advice</h3>
        <p className="text-xs text-muted-foreground">Recommendations based on your skin analysis</p>
      </section>

      <section>
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          Recommended for You
        </h4>
        <ShopifyProductList scan={scan} />
      </section>

      <section>
        <h4 className="text-sm font-semibold">Routine Recommendations</h4>

        <div className="mt-2 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sun className="h-4 w-4" />
            <p className="text-sm font-semibold">Morning Routine</p>
          </div>
          <ol className="mt-2 space-y-1.5 text-sm">
            {preset.am.map((step, i) => (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-baseline">
                <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                <div>
                  <span className="font-medium">{step.title}</span>
                  {step.hint && <span className="ml-1 text-muted-foreground">- {step.hint}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Moon className="h-4 w-4" />
            <p className="text-sm font-semibold">Evening Routine</p>
          </div>
          <ol className="mt-2 space-y-1.5 text-sm">
            {preset.pm.map((step, i) => (
              <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-baseline">
                <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
                <div>
                  <span className="font-medium">{step.title}</span>
                  {step.hint && <span className="ml-1 text-muted-foreground">- {step.hint}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="rounded-2xl border border-sage/40 bg-sage/5 p-4">
        <p className="text-sm font-semibold text-sage">Lifestyle Tips</p>
        <ul className="mt-2 space-y-1.5">
          {preset.lifestyleTips.map((tip, i) => (
            <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-sage" />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-center text-xs font-medium text-primary">
        ⭐ Remember: Consistency + Right Products + Healthy Lifestyle = Glowing Skin ✨
      </div>
    </div>
  );
}

function ShopifyProductList({ scan }: { scan: ScanRow }) {
  const concerns = scan.concerns.map(c => c.name);
  
  const { data: products, isLoading } = useQuery({
    queryKey: ["shopify-recommendations", concerns],
    queryFn: () => getShopifyRecommendations({ data: { concerns: concerns.length > 0 ? concerns : ["skincare"] } }),
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return <div className="mt-2 text-xs text-muted-foreground animate-pulse">Loading recommended products from SKNPOP...</div>;
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex gap-3 overflow-x-auto pb-4 pt-1 px-1 snap-x">
      {products.map((product) => (
        <a 
          key={product.id} 
          href={`https://sknpop.in/products/${product.handle}`} 
          target="_blank" rel="noopener noreferrer"
          className="min-w-[140px] max-w-[140px] flex-shrink-0 snap-start rounded-2xl border border-border bg-card shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
        >
          <div className="aspect-square bg-muted relative overflow-hidden">
            {product.images.edges[0]?.node?.url ? (
              <img 
                src={product.images.edges[0].node.url} 
                alt={product.title} 
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          <div className="p-3 flex flex-col flex-grow">
            <h5 className="font-semibold text-xs line-clamp-2 leading-tight">{product.title}</h5>
            <div className="mt-auto pt-2 text-sm font-bold text-primary">
              {product.priceRange.minVariantPrice.currencyCode === 'INR' ? '₹' : product.priceRange.minVariantPrice.currencyCode} 
              {parseFloat(product.priceRange.minVariantPrice.amount).toLocaleString()}
            </div>
            <div className="mt-2 bg-primary text-primary-foreground text-[10px] uppercase font-bold text-center py-1.5 rounded-lg w-full">
              Buy Now
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[minmax(0,72px)_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`truncate font-medium text-foreground ${mono ? "font-mono text-[11px]" : ""}`}>{value}</dd>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  suffix,
  tone,
  bar,
  valueSize = "xl",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: { cls: string };
  bar?: number;
  valueSize?: "xl" | "lg";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-semibold ${valueSize === "xl" ? "text-2xl" : "text-base"} ${tone?.cls ?? ""}`}>
        {value}
        {suffix && <span className="ml-1 text-xs font-normal text-muted-foreground">{suffix}</span>}
      </p>
      {typeof bar === "number" && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full ${toneBar(bar)}`} style={{ width: `${Math.max(4, bar)}%` }} />
        </div>
      )}
    </div>
  );
}

function SeverityDots({ score }: { score: number }) {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 5);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`inline-block h-1.5 w-1.5 rounded-full ${i < filled ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function toneBar(v: number) {
  if (v >= 80) return "bg-sage";
  if (v >= 60) return "bg-primary";
  if (v >= 40) return "bg-primary/70";
  return "bg-coral";
}

function severityColor(sev: string) {
  if (sev === "high") return "bg-coral/15 text-coral";
  if (sev === "moderate") return "bg-primary/15 text-primary";
  return "bg-sage/15 text-sage";
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scanIdShort(id: string, iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const tail = id.slice(0, 4).toUpperCase();
  return `SP-${y}-${m}-${day}-${tail}`;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const CONCERN_ICONS: { keywords: string[]; icon: LucideIcon }[] = [
  { keywords: ["spot", "pigment", "dark", "hyper"], icon: CircleDot },
  { keywords: ["tone", "even", "dull"], icon: Smile },
  { keywords: ["pore"], icon: Circle },
  { keywords: ["line", "wrinkle", "age"], icon: Waves },
  { keywords: ["acne", "blemish", "pimple"], icon: Sparkles },
  { keywords: ["dry", "hydrat"], icon: Droplet },
  { keywords: ["oil", "shine"], icon: Sparkles },
  { keywords: ["red", "sensitiv"], icon: Shield },
  { keywords: ["texture"], icon: Waves },
];

function ConcernIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  const found = CONCERN_ICONS.find((c) => c.keywords.some((k) => n.includes(k)));
  const Icon = found?.icon ?? Sparkles;
  return <Icon className={className} />;
}

function concernDescription(name: string) {
  const n = name.toLowerCase();
  if (n.includes("dark") || n.includes("spot") || n.includes("pigment")) return "Visible pigmentation and dark spots";
  if (n.includes("tone") || n.includes("even")) return "Uneven skin tone and dullness";
  if (n.includes("pore")) return "Enlarged pores on nose and cheeks";
  if (n.includes("line") || n.includes("wrinkle")) return "Early signs of fine lines";
  if (n.includes("acne") || n.includes("blemish")) return "Active blemishes and breakouts";
  if (n.includes("dry")) return "Dehydration and dry patches";
  if (n.includes("oil") || n.includes("shine")) return "Excess oil and shine";
  if (n.includes("red")) return "Redness and irritation";
  return "Detected by AI skin analysis";
}

function healthSummary(scan: ScanRow, m: ReturnType<typeof normalizeMetrics>): string[] {
  const aiBullets = (scan.recommendations ?? [])
    .filter(r => r.startsWith("BULLET:"))
    .map(r => r.replace("BULLET:", "").trim());
    
  if (aiBullets.length > 0) return aiBullets;

  // Fallback for old scans
  const lines: string[] = [];
  if (m.hydration >= 70) lines.push("Good hydration levels");
  else lines.push("Improve hydration with more water & moisturizer");
  if (m.oil_balance >= 70) lines.push("Balanced oil production");
  else lines.push("Oil balance can be improved");
  const hasPigment = scan.concerns?.some((c) => /dark|spot|pigment|tone/i.test(c.name));
  if (hasPigment) lines.push("Minor pigmentation issues");
  lines.push("Maintain your current routine");
  return lines.slice(0, 4);
}

const DEFAULT_TIPS = [
  "Drink 8 glasses of water daily",
  "Get 7–8 hours of sleep",
  "Use sunscreen daily",
  "Avoid touching your face",
];

function buildRoutines(scan: ScanRow): { morning: string[]; evening: string[] } {
  const concerns = (scan.concerns ?? []).map((c) => c.name.toLowerCase()).join(" ");
  const has = (kw: string) => concerns.includes(kw);
  const morning = ["Gentle Cleanser"];
  if (has("dark") || has("spot") || has("pigment") || has("dull") || has("tone")) morning.push("Vitamin C Serum");
  if (has("dry") || has("dehyd")) morning.push("Hydrating Serum");
  morning.push("Moisturizer");
  morning.push("Sunscreen SPF 50+");

  const evening = ["Gentle Cleanser"];
  if (has("pore") || has("acne") || has("blemish")) evening.push("Niacinamide Serum");
  if (has("line") || has("wrinkle") || has("age")) evening.push("Retinol Serum (2–3x/week)");
  if (has("dry")) evening.push("Hydrating Serum");
  evening.push("Night Moisturizer");
  if (has("dark") || has("under") || has("eye")) evening.push("Eye Cream (Optional)");
  else evening.push("Eye Cream (Optional)");

  return { morning: dedupe(morning), evening: dedupe(evening) };
}

function dedupe(arr: string[]) {
  return Array.from(new Set(arr));
}
