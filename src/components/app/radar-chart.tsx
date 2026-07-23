import { METRIC_META, METRIC_ORDER } from "./metric-tokens";
import type { ScanMetrics } from "@/lib/skin-analysis.functions";

interface RadarChartProps {
  current: ScanMetrics;
  previous?: ScanMetrics | null;
  currentLabel?: string;
  previousLabel?: string;
  size?: number;
}

/** 6-axis radar chart for the skin metrics breakdown. */
export function RadarChart({
  current,
  previous,
  currentLabel = "You",
  previousLabel = "Previous",
  size = 280,
}: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 40;
  const axes = METRIC_ORDER.length;

  const pointFor = (idx: number, value: number) => {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
    const r = (Math.max(0, Math.min(100, value)) / 100) * maxR;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const axisPoint = (idx: number, r: number) => {
    const angle = (Math.PI * 2 * idx) / axes - Math.PI / 2;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  };

  const polygon = (values: number[]) =>
    values.map((v, i) => pointFor(i, v).join(",")).join(" ");

  const currentValues = METRIC_ORDER.map((k) => current[k] ?? 0);
  const previousValues = previous ? METRIC_ORDER.map((k) => previous[k] ?? 0) : null;

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block h-auto w-full max-w-[320px]">
        {/* Grid rings */}
        {rings.map((ratio) => (
          <polygon
            key={ratio}
            points={METRIC_ORDER.map((_, i) => axisPoint(i, maxR * ratio).join(",")).join(" ")}
            fill="none"
            stroke="color-mix(in oklab, var(--border) 80%, transparent)"
            strokeWidth={1}
          />
        ))}
        {/* Axes */}
        {METRIC_ORDER.map((_, i) => {
          const [x, y] = axisPoint(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="color-mix(in oklab, var(--border) 60%, transparent)" strokeWidth={1} />;
        })}
        {/* Previous */}
        {previousValues && (
          <polygon
            points={polygon(previousValues)}
            fill="color-mix(in oklab, var(--muted-foreground) 15%, transparent)"
            stroke="color-mix(in oklab, var(--muted-foreground) 60%, transparent)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
          />
        )}
        {/* Current */}
        <polygon
          points={polygon(currentValues)}
          fill="color-mix(in oklab, var(--primary) 22%, transparent)"
          stroke="var(--primary)"
          strokeWidth={2}
        />
        {/* Points */}
        {currentValues.map((v, i) => {
          const [x, y] = pointFor(i, v);
          return <circle key={i} cx={x} cy={y} r={3} fill="var(--primary)" />;
        })}
        {/* Labels */}
        {METRIC_ORDER.map((k, i) => {
          const [x, y] = axisPoint(i, maxR + 22);
          const meta = METRIC_META[k];
          const v = current[k] ?? 0;
          return (
            <g key={k}>
              <text
                x={x}
                y={y - 4}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: 11, fontWeight: 600 }}
              >
                {meta.short}
              </text>
              <text
                x={x}
                y={y + 10}
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontSize: 11 }}
              >
                {v}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-4 rounded-full bg-primary" /> {currentLabel}
        </span>
        {previousValues && (
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full border border-dashed border-muted-foreground/60" /> {previousLabel}
          </span>
        )}
      </div>
    </div>
  );
}
