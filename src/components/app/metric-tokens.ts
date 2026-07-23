import { Droplet, Sparkles, Waves, CircleDot, Smile, Shield, type LucideIcon } from "lucide-react";
import type { ScanMetrics } from "@/lib/skin-analysis.functions";

export type MetricKey = keyof ScanMetrics;

export const METRIC_ORDER: MetricKey[] = [
  "hydration",
  "oil_balance",
  "texture",
  "pores",
  "evenness",
  "elasticity",
];

export const METRIC_META: Record<
  MetricKey,
  { label: string; short: string; icon: LucideIcon }
> = {
  hydration: { label: "Hydration", short: "Hydration", icon: Droplet },
  oil_balance: { label: "Oil Balance", short: "Oil Balance", icon: Sparkles },
  texture: { label: "Texture", short: "Texture", icon: Waves },
  pores: { label: "Pores", short: "Pores", icon: CircleDot },
  evenness: { label: "Evenness", short: "Evenness", icon: Smile },
  elasticity: { label: "Elasticity", short: "Elasticity", icon: Shield },
};

export function scoreTone(score: number) {
  if (score >= 80) return { label: "Good", cls: "text-sage" };
  if (score >= 60) return { label: "Balanced", cls: "text-primary" };
  if (score >= 40) return { label: "Fair", cls: "text-primary" };
  return { label: "Needs care", cls: "text-coral" };
}

export function overallLabel(score: number) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Needs care";
}

export function normalizeMetrics(m: unknown): ScanMetrics {
  const obj = (m ?? {}) as Partial<Record<MetricKey, number>>;
  const clamp = (v: unknown) => {
    const n = typeof v === "number" && Number.isFinite(v) ? Math.round(v) : 0;
    return Math.max(0, Math.min(100, n));
  };
  return {
    hydration: clamp(obj.hydration),
    oil_balance: clamp(obj.oil_balance),
    texture: clamp(obj.texture),
    pores: clamp(obj.pores),
    evenness: clamp(obj.evenness),
    elasticity: clamp(obj.elasticity),
  };
}

export function hasMetrics(m: ScanMetrics) {
  return METRIC_ORDER.some((k) => (m[k] ?? 0) > 0);
}
