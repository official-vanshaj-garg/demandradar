import { BLR_ZONES } from "@/lib/geo/bengaluru";

interface Props {
  size?: number;
  pulses?: Array<{ x: number; y: number; intensity?: number; color?: string }>;
}

// Pure-SVG radar — works in SSR, no canvas, no JS deps.
export function RadarHero({ size = 480, pulses }: Props) {
  const items =
    pulses ??
    BLR_ZONES.slice(0, 9).map((z, i) => ({
      x: z.x,
      y: z.y,
      intensity: 0.5 + (i % 5) * 0.12,
      color: i % 3 === 0 ? "var(--primary)" : i % 3 === 1 ? "var(--secondary)" : "var(--warm)",
    }));

  // Use 100% so the parent (`aspect-square w-full max-w-[size]`) controls
  // the actual rendered size. Avoids forcing a fixed pixel width on mobile.
  return (
    <div
      className="relative h-full w-full"
      style={{ aspectRatio: "1 / 1", maxWidth: size, maxHeight: size, marginInline: "auto" }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, oklch(0.68 0.18 250 / 0.18), transparent 70%)",
        }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <radialGradient id="rg-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0.18" />
            <stop offset="60%" stopColor="oklch(0.68 0.18 250)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="sweep" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0" />
            <stop offset="100%" stopColor="oklch(0.82 0.16 195)" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        {/* base disc */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#rg-bg)"
          stroke="oklch(1 0 0 / 0.10)"
          strokeWidth="0.3"
        />
        {/* concentric rings */}
        {[12, 24, 36, 46].map((r) => (
          <circle
            key={r}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke="oklch(0.82 0.16 195 / 0.18)"
            strokeWidth="0.18"
          />
        ))}
        {/* crosshair */}
        <line x1="2" y1="50" x2="98" y2="50" stroke="oklch(1 0 0 / 0.06)" strokeWidth="0.2" />
        <line x1="50" y1="2" x2="50" y2="98" stroke="oklch(1 0 0 / 0.06)" strokeWidth="0.2" />

        {/* sweeping cone */}
        <g className="anim-radar-sweep" style={{ transformOrigin: "50% 50%" }}>
          <path d="M50 50 L50 2 A48 48 0 0 1 96 38 Z" fill="url(#sweep)" opacity="0.85" />
        </g>

        {/* signals */}
        {items.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="2.4"
              fill={p.color || "var(--primary)"}
              style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
            />
            <circle
              cx={p.x}
              cy={p.y}
              r="2.4"
              fill="none"
              stroke={p.color || "var(--primary)"}
              strokeWidth="0.4"
              className="anim-radar-pulse"
              style={{ transformOrigin: `${p.x}px ${p.y}px`, animationDelay: `${(i % 6) * 0.35}s` }}
            />
          </g>
        ))}

        {/* center glyph */}
        <circle cx="50" cy="50" r="1.6" fill="oklch(0.97 0.01 240)" />
        <circle
          cx="50"
          cy="50"
          r="3.2"
          fill="none"
          stroke="oklch(0.82 0.16 195 / 0.6)"
          strokeWidth="0.3"
        />
      </svg>

      {/* corner ticks */}
      <div className="pointer-events-none absolute inset-0">
        {["NW", "NE", "SW", "SE"].map((label, i) => (
          <span
            key={label}
            className={
              "absolute font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 " +
              ["left-2 top-2", "right-2 top-2", "bottom-2 left-2", "bottom-2 right-2"][i]
            }
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
