import { overallLabel } from "./metric-tokens";

/**
 * Semi-circle gauge with a colored arc that fills based on score.
 * Coral (low) → primary (mid) → sage (high).
 */
export function ScoreArc({
  score,
  size = 200,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = 14;
  const padding = 8;
  const r = (size - stroke - padding * 2) / 2;
  const cx = size / 2;
  const cy = size / 2 + padding / 2; // Shift down slightly
  // half circle from 180deg (left) to 360deg (right); use path arc for progress
  const startX = cx - r;
  const startY = cy;
  const endX = cx + r;
  const endY = cy;

  // Progress endpoint along the top semicircle
  const angle = Math.PI * (1 - s / 100); // 180deg → 0deg
  const px = cx + r * Math.cos(angle);
  const py = cy - r * Math.sin(angle);
  const largeArc = s > 50 ? 1 : 0;

  const tone =
    s >= 80 ? "var(--sage)" : s >= 60 ? "var(--primary)" : s >= 40 ? "var(--coral)" : "var(--destructive)";
  const displayLabel = label ?? overallLabel(s);

  return (
    <div className="relative mx-auto flex items-center justify-center" style={{ width: size, height: size / 2 + 24 }}>
      <svg width={size} height={size / 2 + padding * 2} viewBox={`0 0 ${size} ${size / 2 + padding * 2}`} className="overflow-visible">
        {/* Track */}
        <path
          d={`M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="color-mix(in oklab, var(--border) 80%, transparent)"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Progress */}
        {s > 0 && (
          <path
            d={`M ${startX} ${startY} A ${r} ${r} 0 ${largeArc} 1 ${px} ${py}`}
            fill="none"
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <div className="text-4xl font-semibold text-foreground">{s}</div>
        <div className="text-xs text-muted-foreground">/100</div>
        <div className="text-sm font-semibold" style={{ color: tone }}>{displayLabel}</div>
      </div>
    </div>
  );
}

export function MiniScoreArc({ score, size = 72 }: { score: number; size?: number }) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = 7;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (c * s) / 100;
  const tone =
    s >= 80 ? "var(--sage)" : s >= 60 ? "var(--primary)" : s >= 40 ? "var(--coral)" : "var(--destructive)";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklab, var(--border) 80%, transparent)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-sm font-semibold" style={{ color: tone }}>{s}</span>
      </div>
    </div>
  );
}
