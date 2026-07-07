import { useEffect, useMemo, useState } from "react";
import type { DemandReport } from "@/domain/demand";
import { CATEGORY_META } from "@/domain/demand";
import { useDemands } from "@/lib/data/store";

export function LiveSignalFeed({ limit = 6 }: { limit?: number }) {
  const { all, ready } = useDemands();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 4000);
    return () => clearInterval(id);
  }, []);

  const items = useMemo(() => all.slice(0, limit), [all, limit]);
  if (!ready && items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-glass p-5 glass">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
            Live signal feed
          </h3>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Bengaluru pilot
        </span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((d, i) => (
          <SignalRow key={d.id} d={d} delay={i * 0.05} />
        ))}
      </ul>
    </div>
  );
}

function SignalRow({ d, delay }: { d: DemandReport; delay: number }) {
  const meta = CATEGORY_META[d.category];
  const ago = timeAgo(d.created_at);
  return (
    <li
      className="anim-ticker-in flex items-center gap-3 py-3"
      style={{ animationDelay: `${delay}s` }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full anim-signal-blink"
        style={{ background: meta.color }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm">{d.title}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {ago}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span style={{ color: meta.color }}>{meta.label}</span>
          <span>·</span>
          <span>{d.area_label}</span>
          <span>·</span>
          <span className="font-mono">signal {d.signal_strength}</span>
        </div>
      </div>
    </li>
  );
}

function timeAgo(iso: string): string {
  const diff = Date.now() - +new Date(iso);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
