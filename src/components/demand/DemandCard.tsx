import type { DemandCardViewModel } from "@/lib/demand";
import { ConfidenceBar, ImpactPriorityTag, SignalStrengthMeter, UrgencyChip } from "./Indicators";
import { ArrowUpRight, MapPin, Users, ThumbsUp } from "lucide-react";

interface Props {
  viewModel: DemandCardViewModel;
  onOpen?: () => void;
  onUpvote?: (id: string) => void;
  upvoted?: boolean;
}

export function DemandCard({ viewModel, onOpen, onUpvote, upvoted }: Props) {
  const meta = viewModel.category;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-glass p-5 transition hover:border-primary/40 glass anim-float-up">
      {/* accent edge */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
            <span style={{ color: meta.color }}>{meta.label}</span>
            <span>/</span>
            <span>{viewModel.subCategory}</span>
          </div>
          <h3 className="mt-1.5 text-base font-semibold leading-snug text-foreground">
            {viewModel.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
            {viewModel.needSummary}
          </p>
        </div>
        <SignalStrengthMeter value={viewModel.signalStrength} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <UrgencyChip value={viewModel.urgency} />
        <ImpactPriorityTag value={viewModel.impactPriority} />
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          <Users className="h-3 w-3" /> {viewModel.affectedGroupLabel}
        </span>
        <span className="inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" /> {viewModel.locationText}
        </span>
        <span className="inline-flex rounded-md bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
          {viewModel.originLabel}
        </span>
      </div>

      <div className="mt-4">
        <ConfidenceBar value={viewModel.confidenceScore} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <div>
          <button
            type="button"
            onClick={() => onUpvote?.(viewModel.id)}
            aria-pressed={Boolean(upvoted)}
            aria-label={`${upvoted ? "Remove" : "Add"} browser-local support for ${viewModel.title}`}
            className={
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 " +
              (upvoted
                ? "border-primary/50 bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary")
            }
          >
            <ThumbsUp className="h-3.5 w-3.5" /> I need this too ({viewModel.upvotes})
          </button>
          <div className="mt-1 text-[10px] text-muted-foreground">Browser-local demo support</div>
        </div>
        <button
          onClick={() => onOpen?.()}
          className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Open Demand Card <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
