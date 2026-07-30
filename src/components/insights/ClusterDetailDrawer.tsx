import type { ClusterDetailViewModel } from "@/lib/analytics";
import type { ComponentType } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Activity, Hash, Lightbulb, MapPin, Signal } from "lucide-react";

export function ClusterDetailDrawer({
  viewModel,
  onClose,
}: {
  viewModel: ClusterDetailViewModel | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(viewModel)} onOpenChange={(open) => !open && onClose()}>
      {viewModel && (
        <SheetContent
          side="right"
          className="w-full overflow-y-auto border-border bg-background/95 p-0 sm:max-w-xl glass-strong"
        >
          <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/85 px-6 py-5 text-left backdrop-blur">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.2em]"
              style={{ color: viewModel.categoryColor }}
            >
              {viewModel.categoryLabel}
            </div>
            <SheetTitle className="font-display text-2xl">
              {viewModel.areaLabel} demand cluster
            </SheetTitle>
            <SheetDescription>
              Corroborating demand signals grouped by deterministic app-owned clustering.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-6 pb-10 pt-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat icon={MapPin} label="Confirmed area" value={viewModel.areaLabel} />
              <Stat icon={Signal} label="Signals" value={viewModel.signalCount.toString()} />
              <Stat
                icon={Activity}
                label="Avg strength"
                value={viewModel.averageSignalStrength.toString()}
              />
            </div>

            <section>
              <div className="font-display text-sm font-semibold uppercase tracking-widest">
                Corroborating signals
              </div>
              <div className="mt-3 space-y-3">
                {viewModel.members.map((member) => (
                  <article
                    key={member.id}
                    className="rounded-xl border border-border bg-surface/40 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {member.displayId}
                      </span>
                      <span>·</span>
                      <span>{member.urgencyLabel}</span>
                      <span>·</span>
                      <span>{member.signalStrength} signal</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      "{member.description}"
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary">
                      <Lightbulb className="h-3 w-3" />
                      {member.recommendedActorLabel}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </SheetContent>
      )}
    </Sheet>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/50 p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}
