import { useMemo, useState } from "react";
import type { DemandReport } from "@/domain/demand";
import { CATEGORY_META, type DemandCategory } from "@/domain/demand";
import { BLR_ZONES, projectToCanvas } from "@/lib/geo/bengaluru";

interface Props {
  demands: DemandReport[];
  selectedCategory?: DemandCategory | "all";
  onSelectDemand?: (d: DemandReport) => void;
}

export function DemandRadarMap({ demands, selectedCategory = "all", onSelectDemand }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  const points = useMemo(() => {
    return demands
      .filter((d) => selectedCategory === "all" || d.category === selectedCategory)
      .map((d) => {
        const p = projectToCanvas(d.latitude, d.longitude);
        return { d, x: p.x, y: p.y };
      });
  }, [demands, selectedCategory]);

  // density per zone (for hotspot blobs)
  const zoneDensity = useMemo(() => {
    const m = new Map<string, number>();
    points.forEach((p) => m.set(p.d.area_label, (m.get(p.d.area_label) || 0) + 1));
    return m;
  }, [points]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-[oklch(0.14_0.025_250)]">
      {/* base radar canvas */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <radialGradient id="map-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.68 0.18 250)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="hot-blob" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0.55" />
            <stop offset="60%" stopColor="oklch(0.68 0.18 250)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#map-glow)" />
        {/* grid */}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100"
                stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.1" />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10}
                stroke="oklch(1 0 0 / 0.05)" strokeWidth="0.1" />
        ))}

        {/* zone density blobs */}
        {BLR_ZONES.map((z) => {
          const n = zoneDensity.get(z.label) || 0;
          if (n === 0) return null;
          const r = Math.min(18, 6 + n * 1.6);
          return <circle key={z.key} cx={z.x} cy={z.y} r={r} fill="url(#hot-blob)" />;
        })}

        {/* zone labels */}
        {BLR_ZONES.map((z) => (
          <g key={`lbl-${z.key}`}>
            <circle cx={z.x} cy={z.y} r="0.7" fill="oklch(0.97 0.01 240 / 0.5)" />
            <text x={z.x + 1.5} y={z.y - 1.5} fontSize="2.2" fill="oklch(0.85 0.02 240 / 0.6)" fontFamily="ui-monospace">
              {z.label}
            </text>
          </g>
        ))}

        {/* signal markers */}
        {points.map((p) => {
          const meta = CATEGORY_META[p.d.category];
          const active = hover === p.d.id;
          const r = 1.1 + (p.d.signal_strength / 100) * 1.3;
          return (
            <g key={p.d.id} className="cursor-pointer"
               onMouseEnter={() => setHover(p.d.id)}
               onMouseLeave={() => setHover(null)}
               onClick={() => onSelectDemand?.(p.d)}>
              <circle cx={p.x} cy={p.y} r={r * 2.4} fill={meta.color} opacity={active ? 0.25 : 0.08} />
              <circle cx={p.x} cy={p.y} r={r} fill={meta.color} stroke="oklch(0 0 0 / 0.4)" strokeWidth="0.15"
                      style={{ filter: "drop-shadow(0 0 1px currentColor)", color: meta.color }} />
            </g>
          );
        })}

        {/* sweep */}
        <g className="anim-radar-sweep" style={{ transformOrigin: "50% 50%" }}>
          <path d="M50 50 L50 0 A50 50 0 0 1 100 36 Z"
                fill="oklch(0.82 0.16 195 / 0.06)" />
        </g>
      </svg>

      {/* hover tooltip */}
      {hover && (() => {
        const p = points.find((x) => x.d.id === hover);
        if (!p) return null;
        const meta = CATEGORY_META[p.d.category];
        return (
          <div className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-border bg-background/95 p-2 text-xs shadow-elevated"
               style={{ left: `${p.x}%`, top: `${p.y}%`, marginTop: -8 }}>
            <div className="font-mono text-[10px] uppercase tracking-widest" style={{ color: meta.color }}>{meta.label}</div>
            <div className="mt-0.5 line-clamp-2 font-medium">{p.d.title}</div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">{p.d.area_label} · signal {p.d.signal_strength}</div>
          </div>
        );
      })()}

      {/* corner badge */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-primary anim-signal-blink" />
        BLR · live demand grid
      </div>
      <div className="absolute bottom-3 right-3 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
        {points.length} signals
      </div>
    </div>
  );
}
