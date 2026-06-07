import type { DemandReport } from "@/lib/ai/types";
import { CATEGORY_META } from "@/lib/ai/types";
import { ConfidenceBar, ImpactPriorityTag, SignalStrengthMeter, UrgencyChip } from "./Indicators";
import { ArrowUpRight, MapPin, Users, ThumbsUp } from "lucide-react";

interface Props {
  d: DemandReport;
  onOpen?: (d: DemandReport) => void;
  onUpvote?: (id: string) => void;
  upvoted?: boolean;
}

export function DemandCard({ d, onOpen, onUpvote, upvoted }: Props) {
  const meta = CATEGORY_META[d.category];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-glass p-5 transition hover:border-primary/40 glass anim-float-up">
      {/* accent edge */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            <span style={{ color: meta.color }}>{meta.label}</span>
            <span>·</span>
            <span>{d.sub_category}</span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-foreground">{d.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{d.need_summary}</p>
        </div>
        <SignalStrengthMeter value={d.signal_strength} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <UrgencyChip value={d.urgency} />
        <ImpactPriorityTag value={d.impact_priority} />
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" /> {d.affected_group.replace("_", " ")}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {d.location_text}
        </span>
      </div>

      <div className="mt-4">
        <ConfidenceBar value={d.confidence_score} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
        <button
          onClick={() => onUpvote?.(d.id)}
          className={
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition " +
            (upvoted
              ? "border-primary/50 bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary")
          }
        >
          <ThumbsUp className="h-3.5 w-3.5" /> {d.upvotes + (upvoted ? 0 : 0)}
        </button>
        <button
          onClick={() => onOpen?.(d)}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open Demand Card <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
