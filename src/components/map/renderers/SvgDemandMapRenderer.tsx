import { useState } from "react";
import type { DemandReport } from "@/domain/demand";
import type { DemandMapViewModel } from "@/lib/map";

interface Props {
  viewModel: DemandMapViewModel;
  onSelectDemand: (demand: DemandReport) => void;
}

export function SvgDemandMapRenderer({ viewModel, onSelectDemand }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const { hotspots, markers, zoneLabels } = viewModel;

  return (
    <>
      {/* base radar canvas */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
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
          <line
            key={`v${i}`}
            x1={i * 10}
            y1="0"
            x2={i * 10}
            y2="100"
            stroke="oklch(1 0 0 / 0.05)"
            strokeWidth="0.1"
          />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 10}
            x2="100"
            y2={i * 10}
            stroke="oklch(1 0 0 / 0.05)"
            strokeWidth="0.1"
          />
        ))}

        {/* zone density blobs */}
        {hotspots.map((hotspot) => (
          <circle
            key={hotspot.zoneKey}
            cx={hotspot.x}
            cy={hotspot.y}
            r={hotspot.radius}
            fill="url(#hot-blob)"
          />
        ))}

        {/* zone labels */}
        {zoneLabels.map((zone) => (
          <g key={`lbl-${zone.zoneKey}`}>
            <circle cx={zone.x} cy={zone.y} r="0.7" fill="oklch(0.97 0.01 240 / 0.5)" />
            <text
              x={zone.x + 1.5}
              y={zone.y - 1.5}
              fontSize="2.2"
              fill="oklch(0.85 0.02 240 / 0.6)"
              fontFamily="ui-monospace"
            >
              {zone.label}
            </text>
          </g>
        ))}

        {/* signal markers */}
        {markers.map((marker) => {
          const active = hover === marker.id;
          return (
            <g
              key={marker.id}
              className="cursor-pointer"
              onMouseEnter={() => setHover(marker.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelectDemand(marker.demand)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectDemand(marker.demand);
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`Open demand card: ${marker.title}`}
            >
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.radius * 2.4}
                fill={marker.color}
                opacity={active ? 0.25 : 0.08}
              />
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.radius}
                fill={marker.color}
                stroke="oklch(0 0 0 / 0.4)"
                strokeWidth="0.15"
                style={{ filter: "drop-shadow(0 0 1px currentColor)", color: marker.color }}
              />
            </g>
          );
        })}

        {/* sweep */}
        <g className="anim-radar-sweep" style={{ transformOrigin: "50% 50%" }}>
          <path d="M50 50 L50 0 A50 50 0 0 1 100 36 Z" fill="oklch(0.82 0.16 195 / 0.06)" />
        </g>
      </svg>

      {/* hover tooltip */}
      {hover &&
        (() => {
          const marker = markers.find((x) => x.id === hover);
          if (!marker) return null;
          return (
            <div
              className="pointer-events-none absolute z-10 max-w-[220px] -translate-x-1/2 -translate-y-full rounded-md border border-border bg-background/95 p-2 text-xs shadow-elevated"
              style={{ left: `${marker.x}%`, top: `${marker.y}%`, marginTop: -8 }}
            >
              <div
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: marker.color }}
              >
                {marker.categoryLabel}
              </div>
              <div className="mt-0.5 line-clamp-2 font-medium">{marker.title}</div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">
                {marker.areaLabel} / signal {marker.signalStrength}
              </div>
            </div>
          );
        })()}
    </>
  );
}
