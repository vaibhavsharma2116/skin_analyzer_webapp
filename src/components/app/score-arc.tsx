import { overallLabel } from "./metric-tokens";

/**
 * Semi-circle gauge with a colored arc that fills based on score.
 * Coral (low) → primary (mid) → sage (high).
 */
export function ScoreArc({
  score,
  size = 200, // Expected visual width of the arc
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const s = Math.max(0, Math.min(100, score));
  const stroke = 14;
  const p = 4; // Safety padding on all sides to prevent browser clipping

  // The actual viewBox size needed to fit the stroke and padding
  const svgWidth = size + p * 2;
  const svgHeight = size / 2 + stroke + p * 2;
  
  const cx = svgWidth / 2;
  // Position cy so that the bottom caps touch the bottom padding
  const cy = svgHeight - stroke / 2 - p;
  const r = (size - stroke) / 2;

  // half circle from 180deg (left) to 360deg (right)
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
    <div className="relative mx-auto" style={{ width: svgWidth, height: svgHeight }}>
      <svg width={svgWidth} height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
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
      {/* Absolute positioned text in the center */}
      <div 
        className="absolute inset-x-0 flex flex-col items-center justify-end pb-1"
        style={{ top: 0, bottom: p + stroke/2 - 4 }} 
      >
        <div className="text-[36px] font-bold text-foreground leading-none">{s}</div>
        <div className="text-xs text-muted-foreground mt-0.5">/100</div>
        <div className="text-[13px] font-semibold mt-0.5" style={{ color: tone }}>{displayLabel}</div>
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
