import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDemands, toggleUpvote } from "@/lib/data/store";
import { buildDashboardViewModel, type DashboardViewModel } from "@/lib/analytics";
import { buildDemandCardViewModel, type DemandCardViewModel } from "@/lib/demand";
import { DemandCard } from "@/components/demand/DemandCard";
import { DemandCardDrawer } from "@/components/demand/DemandCardDrawer";
import { LiveSignalFeed } from "@/components/feed/LiveSignalFeed";
import { Activity, TrendingUp, MapPin, Layers, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Demand Dashboard / DemandRadar" },
      {
        name: "description",
        content:
          "Local-demo demand signals, hotspots, opportunity scores, and recommended actions for Bengaluru.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { all, upvotes, ready } = useDemands();
  const [open, setOpen] = useState<DemandCardViewModel | null>(null);
  const [sort, setSort] = useState<"recent" | "signal" | "urgent">("signal");

  const dashboardViewModel = useMemo(
    () => buildDashboardViewModel(all, { cardSort: sort }),
    [all, sort],
  );

  const reportsById = useMemo(() => new Map(all.map((d) => [d.id, d])), [all]);
  const cardViewModels = useMemo(
    () =>
      dashboardViewModel.sortedDemandIds.flatMap((id) => {
        const report = reportsById.get(id);
        return report ? [buildDemandCardViewModel(report)] : [];
      }),
    [dashboardViewModel.sortedDemandIds, reportsById],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary anim-signal-blink" /> Demand Local demo
        / Bengaluru
      </div>
      <h1 className="font-display text-3xl font-semibold sm:text-4xl">Intelligence Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Deterministic demo scores over sample data and reports saved in this browser.
      </p>

      {/* KPI tiles */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Activity}
          label="Total demand signals"
          value={dashboardViewModel.totalSignals.toString()}
          hint="sample + browser-local"
        />
        <Kpi
          icon={TrendingUp}
          label="Avg signal strength"
          value={`${dashboardViewModel.averageSignalStrength}`}
          hint="0-100"
        />
        <Kpi
          icon={Layers}
          label="Top unmet category"
          value={dashboardViewModel.topCategory ? dashboardViewModel.topCategory.label : "-"}
          hint={
            dashboardViewModel.topCategory ? `${dashboardViewModel.topCategory.count} signals` : ""
          }
          accent={dashboardViewModel.topCategory?.color}
        />
        <Kpi
          icon={MapPin}
          label="Hotspot area"
          value={dashboardViewModel.hotspotArea?.area ?? "-"}
          hint={
            dashboardViewModel.hotspotArea ? `${dashboardViewModel.hotspotArea.count} signals` : ""
          }
        />
      </div>

      {/* Matrix + Area leaderboard */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
              Demand matrix / category by area
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              heat = volume
            </span>
          </div>
          <DemandMatrix matrix={dashboardViewModel.demandMatrix} />
        </div>

        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
            Area leaderboard
          </h3>
          <ul className="mt-3 space-y-2">
            {dashboardViewModel.areaLeaderboard.map((area) => (
              <li key={area.area} className="flex items-center gap-3">
                <span className="w-5 font-mono text-[10px] text-muted-foreground">
                  #{area.rank}
                </span>
                <span className="w-32 truncate text-sm">{area.area}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-secondary to-primary"
                    style={{ width: `${area.widthPercent}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{area.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Category distribution + Live feed */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-5 glass">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
            Category distribution
          </h3>
          <div className="mt-4 space-y-2">
            {dashboardViewModel.categoryDistribution.map((category) => (
              <div key={category.category} className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full" style={{ background: category.color }} />
                <span className="w-40 truncate text-sm">{category.label}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${category.widthPercent}%`, background: category.color }}
                  />
                </div>
                <span className="font-mono text-xs text-muted-foreground">{category.count}</span>
              </div>
            ))}
          </div>
        </div>
        <LiveSignalFeed limit={8} />
      </div>

      {/* Demand cards grid */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-sm font-semibold uppercase tracking-widest">
            Recent Demand Cards
          </h3>
          <div className="flex items-center gap-1 rounded-md border border-border bg-glass p-1 text-xs glass">
            {(["signal", "urgent", "recent"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={
                  "rounded px-2.5 py-1 capitalize " +
                  (sort === s
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cardViewModels.map((card) => (
            <DemandCard
              key={card.id}
              viewModel={card}
              onOpen={() => setOpen(card)}
              onUpvote={(id) => toggleUpvote(id)}
              upvoted={!!upvotes[card.id]}
            />
          ))}
        </div>
      </div>

      <DemandCardDrawer viewModel={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-glass p-5 glass">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div
        className="mt-2 font-display text-3xl font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent || "var(--primary)"}, transparent)`,
        }}
      />
    </div>
  );
}

function DemandMatrix({ matrix }: { matrix: DashboardViewModel["demandMatrix"] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-glass p-1.5 text-left font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Area
            </th>
            {matrix.categories.map((category) => (
              <th
                key={category.category}
                className="p-1.5 text-left font-mono text-[10px] uppercase tracking-widest"
                style={{ color: category.color }}
              >
                {category.shortLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.rows.map((row) => (
            <tr key={row.zoneKey}>
              <td className="sticky left-0 bg-glass p-1.5 text-foreground">{row.area}</td>
              {row.cells.map((cell) => {
                return (
                  <td key={cell.category} className="p-1">
                    <div
                      className="flex h-7 w-full items-center justify-center rounded-md text-[11px]"
                      style={{
                        background: cell.count
                          ? `color-mix(in oklch, ${cell.color} ${cell.heatPercent}%, transparent)`
                          : "oklch(1 0 0 / 0.04)",
                        color: cell.count ? "oklch(0.15 0.02 250)" : "oklch(0.5 0.02 240)",
                        fontWeight: cell.count ? 600 : 400,
                      }}
                    >
                      {cell.count || "/"}
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
