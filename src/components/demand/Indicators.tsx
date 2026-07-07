import type { ImpactPriority } from "@/domain/demand";

export function SignalStrengthMeter({ value, size = 64 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="oklch(1 0 0 / 0.08)"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth="4"
          fill="none"
          stroke="url(#meter-grad)"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
        <defs>
          <linearGradient id="meter-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="oklch(0.68 0.18 250)" />
            <stop offset="100%" stopColor="oklch(0.82 0.16 195)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-mono text-sm font-semibold text-foreground">{v}</span>
        <span className="font-mono text-[8px] uppercase tracking-widest text-muted-foreground">
          signal
        </span>
      </div>
    </div>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <span>Confidence</span>
        <span>{v}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-secondary to-primary"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  );
}

const URGENCY_COLOR = [
  "",
  "oklch(0.78 0.10 220)",
  "oklch(0.78 0.13 190)",
  "oklch(0.80 0.17 70)",
  "oklch(0.74 0.20 35)",
  "oklch(0.68 0.22 25)",
];
export function UrgencyChip({ value }: { value: number }) {
  const v = Math.max(1, Math.min(5, value));
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px]"
      style={{ borderColor: `${URGENCY_COLOR[v]} / 0.4`, color: URGENCY_COLOR[v] }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: URGENCY_COLOR[v] }} />
      Urgency {v}/5
    </span>
  );
}

const PRIORITY_STYLE: Record<ImpactPriority, { bg: string; text: string; label: string }> = {
  low: { bg: "oklch(0.30 0.04 220 / 0.5)", text: "oklch(0.85 0.06 220)", label: "Low" },
  medium: { bg: "oklch(0.42 0.10 195 / 0.4)", text: "oklch(0.88 0.12 195)", label: "Medium" },
  high: { bg: "oklch(0.50 0.14 70 / 0.35)", text: "oklch(0.88 0.16 70)", label: "High" },
  critical: { bg: "oklch(0.45 0.18 25 / 0.45)", text: "oklch(0.85 0.20 25)", label: "Critical" },
};

export function ImpactPriorityTag({ value }: { value: ImpactPriority }) {
  const s = PRIORITY_STYLE[value];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{ background: s.bg, color: s.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.text }} />
      {s.label} impact
    </span>
  );
}
