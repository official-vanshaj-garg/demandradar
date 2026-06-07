import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDemands, toggleUpvote } from "@/lib/data/store";
import { CATEGORY_META, PRIORITY_RANK, type DemandCategory, type DemandReport } from "@/lib/ai/types";
import { BLR_ZONES } from "@/lib/geo/bengaluru";
import { DemandCard } from "@/components/demand/DemandCard";
import { DemandCardDrawer } from "@/components/demand/DemandCardDrawer";
import { LiveSignalFeed } from "@/components/feed/LiveSignalFeed";
import { Activity, TrendingUp, MapPin, Layers } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Intelligence Dashboard · DemandRadar" },
      { name: "description", content: "The Demand Intelligence OS for Bengaluru: signals, hotspots, opportunity scores, and recommended actions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { all, upvotes, ready } = useDemands();
  const [open, setOpen] = useState<DemandReport | null>(null);
  const [sort, setSort] = useState<"recent" | "signal" | "urgent">("signal");

  const stats = useMemo(() => {
    const total = all.length;
    const avgSignal = total ? Math.round(all.reduce((s, d) => s + d.signal_strength, 0) / total) : 0;
    const catCount = new Map<DemandCategory, number>();
    const areaCount = new Map<string, number>();
    all.forEach((d) => {
      catCount.set(d.category, (catCount.get(d.category) || 0) + 1);
      areaCount.set(d.area_label, (areaCount.get(d.area_label) || 0) + 1);
    });
    const topCat = [...catCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const hotspot = [...areaCount.entries()].sort((a, b) => b[1] - a[1])[0];
    return { total, avgSignal, topCat, hotspot, catCount, areaCount };
  }, [all]);

  const sorted = useMemo(() => {
    const arr = [...all];
    if (sort === "recent") arr.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else if (sort === "signal") arr.sort((a, b) => b.signal_strength - a.signal_strength);
    else arr.sort((a, b) => PRIORITY_RANK[b.impact_priority] - PRIORITY_RANK[a.impact_priority] || b.urgency - a.urgency);
    return arr.slice(0, 9);
  }, [all, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary anim-signal-blink" /> Demand Intelligence OS · Bengaluru pilot
      </div>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Intelligence Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Live, ranked, geo-tagged demand signals — powered by the DemandRadar intelligence layer.</p>

      {/* KPI tiles */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Activity} label="Total demand signals" value={stats.total.toString()} hint="across pilot zones" />
        <Kpi icon={TrendingUp} label="Avg signal strength" value={`${stats.avgSignal}`} hint="0–100" />
        <Kpi icon={Layers} label="Top unmet category" value={stats.topCat ? CATEGORY_META[stats.topCat[0]].label : "—"} hint={stats.topCat ? `${stats.topCat[1]} signals` : ""} accent={stats.topCat ? CATEGORY_META[stats.topCat[0]].color : undefined} />
        <Kpi icon={MapPin} label="Hotspot area" value={stats.hotspot?.[0] ?? "—"} hint={stats.hotspot ? `${stats.hotspot[1]} signals` : ""} />
      </div>

      {/* Matrix + Area leaderboard */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest">Demand matrix · category × area</h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">heat = volume</span>
          </div>
          <DemandMatrix all={all} />
        </div>

        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">Area leaderboard</h3>
          <ul className="mt-3 space-y-2">
            {[...stats.areaCount.entries()].sort((a, b) => b[1] - a[1]).map(([area, n], i) => {
              const max = Math.max(...stats.areaCount.values());
              return (
                <li key={area} className="flex items-center gap-3">
                  <span className="w-5 font-mono text-[10px] text-muted-foreground">#{i + 1}</span>
                  <span className="w-32 truncate text-sm">{area}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${(n / max) * 100}%` }} />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{n}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Category distribution + Live feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">Category distribution</h3>
          <div className="mt-4 space-y-2">
            {[...stats.catCount.entries()].sort((a, b) => b[1] - a[1]).map(([c, n]) => {
              const m = CATEGORY_META[c];
              const max = Math.max(...stats.catCount.values());
              return (
                <div key={c} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  <span className="w-40 truncate text-sm">{m.label}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(n / max) * 100}%`, background: m.color }} />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
        <LiveSignalFeed limit={8} />
      </div>

      {/* Demand cards grid */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">Recent Demand Cards</h3>
          <div className="flex items-center gap-1 rounded-md border border-border bg-glass p-1 text-xs glass">
            {(["signal","urgent","recent"] as const).map((s) => (
              <button key={s} onClick={() => setSort(s)}
                      className={"rounded px-2.5 py-1 capitalize " + (sort === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((d) => (
            <DemandCard key={d.id} d={d} onOpen={setOpen} onUpvote={(id) => toggleUpvote(id)} upvoted={!!upvotes[d.id]} />
          ))}
        </div>
      </div>

      <DemandCardDrawer demand={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, hint, accent }: { icon: any; label: string; value: string; hint?: string; accent?: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-glass p-5 glass">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold" style={accent ? { color: accent } : undefined}>{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent || "var(--primary)"}, transparent)` }} />
    </div>
  );
}

function DemandMatrix({ all }: { all: DemandReport[] }) {
  const cats = (Object.keys(CATEGORY_META) as DemandCategory[]).filter((c) => all.some((d) => d.category === c));
  const grid: Record<string, Record<string, number>> = {};
  let max = 0;
  BLR_ZONES.forEach((z) => {
    grid[z.label] = {};
    cats.forEach((c) => {
      const n = all.filter((d) => d.area_label === z.label && d.category === c).length;
      grid[z.label][c] = n;
      if (n > max) max = n;
    });
  });
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-glass p-1.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Area</th>
            {cats.map((c) => (
              <th key={c} className="p-1.5 text-left font-mono text-[10px] uppercase tracking-widest" style={{ color: CATEGORY_META[c].color }}>
                {CATEGORY_META[c].label.split(" ")[0]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {BLR_ZONES.map((z) => (
            <tr key={z.key}>
              <td className="sticky left-0 bg-glass p-1.5 text-foreground">{z.label}</td>
              {cats.map((c) => {
                const n = grid[z.label][c];
                const intensity = max ? n / max : 0;
                return (
                  <td key={c} className="p-1">
                    <div className="flex h-7 w-full items-center justify-center rounded-md text-[11px]"
                         style={{ background: n ? `color-mix(in oklch, ${CATEGORY_META[c].color} ${30 + intensity*55}%, transparent)` : "oklch(1 0 0 / 0.04)",
                                  color: n ? "oklch(0.15 0.02 250)" : "oklch(0.5 0.02 240)",
                                  fontWeight: n ? 600 : 400 }}>
                      {n || "·"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
