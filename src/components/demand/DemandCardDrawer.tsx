import type { DemandReport } from "@/domain/demand";
import { ACTOR_LABEL, CATEGORY_META } from "@/domain/demand";
import { X, MapPin, Users, ShieldCheck, Lightbulb, Activity, Hash } from "lucide-react";
import { ConfidenceBar, ImpactPriorityTag, SignalStrengthMeter, UrgencyChip } from "./Indicators";

export function DemandCardDrawer({ demand, onClose }: { demand: DemandReport | null; onClose: () => void }) {
  if (!demand) return null;
  const meta = CATEGORY_META[demand.category];
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm anim-float-up" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-border bg-background/95 shadow-elevated glass-strong anim-float-up">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-2 w-2 rounded-full anim-signal-blink" style={{ background: meta.color }} />
            Demand Card · {demand.id.slice(0, 8)}
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-12 pt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: meta.color }}>
                {meta.label} · {demand.sub_category}
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">{demand.title}</h2>
            </div>
            <SignalStrengthMeter value={demand.signal_strength} size={84} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <UrgencyChip value={demand.urgency} />
            <ImpactPriorityTag value={demand.impact_priority} />
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              Privacy: {demand.privacy_status}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Hash className="h-3 w-3" />
              {demand.similar_reports_count} similar nearby
            </span>
          </div>

          <div className="mt-6 grid gap-4 rounded-xl border border-border bg-surface/60 p-4">
            <Field label="Need summary">{demand.need_summary}</Field>
            <ConfidenceBar value={demand.confidence_score} />
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Stat icon={Users} label="Affected group" value={demand.affected_group.replace("_", " ")} />
            <Stat icon={MapPin} label="Location" value={demand.location_text} />
            <Stat icon={Activity} label="Status" value={demand.status} />
            <Stat icon={Lightbulb} label="Recommended actor" value={ACTOR_LABEL[demand.recommended_actor]} />
          </div>

          <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary">Suggested action</div>
            <p className="mt-1 text-sm">{demand.suggested_action}</p>
          </div>

          <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Original report</div>
            <p className="mt-1 text-sm italic text-muted-foreground">"{demand.raw_text}"</p>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>lat</div><div className="mt-0.5 text-foreground">{demand.latitude.toFixed(3)}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>lng</div><div className="mt-0.5 text-foreground">{demand.longitude.toFixed(3)}</div>
            </div>
            <div className="rounded-md border border-border bg-muted/20 p-2">
              <div>area</div><div className="mt-0.5 text-foreground">{demand.area_label}</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-sm capitalize text-foreground">{value}</div>
      </div>
    </div>
  );
}
