import type { DemandCardViewModel } from "@/lib/demand";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MapPin, Users, ShieldCheck, Lightbulb, Activity, type LucideIcon } from "lucide-react";
import { ConfidenceBar, ImpactPriorityTag, SignalStrengthMeter, UrgencyChip } from "./Indicators";

export function DemandCardDrawer({
  viewModel,
  onClose,
}: {
  viewModel: DemandCardViewModel | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(viewModel)} onOpenChange={(open) => !open && onClose()}>
      {viewModel && <DemandCardDrawerContent viewModel={viewModel} />}
    </Sheet>
  );
}

function DemandCardDrawerContent({ viewModel }: { viewModel: DemandCardViewModel }) {
  const meta = viewModel.category;

  return (
    <SheetContent
      side="right"
      className="w-full overflow-y-auto border-border bg-background/95 p-0 sm:max-w-xl glass-strong"
    >
      <SheetHeader className="sticky top-0 z-10 border-b border-border bg-background/80 px-6 py-4 text-left backdrop-blur">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span
            className="h-2 w-2 rounded-full anim-signal-blink"
            style={{ background: meta.color }}
          />
          Demand Card / {viewModel.displayId}
        </div>
        <SheetTitle className="font-display text-2xl font-semibold leading-tight">
          {viewModel.title}
        </SheetTitle>
        <SheetDescription className="sr-only">
          Demand card details for {viewModel.title}.
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-12 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div
            className="text-[11px] font-mono uppercase tracking-[0.18em]"
            style={{ color: meta.color }}
          >
            {meta.label} / {viewModel.subCategory}
          </div>
          <SignalStrengthMeter value={viewModel.signalStrength} size={84} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <UrgencyChip value={viewModel.urgency} />
          <ImpactPriorityTag value={viewModel.impactPriority} />
          <span className="inline-flex items-center gap-1 rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Privacy: {viewModel.privacyStatus}
          </span>
          <span className="inline-flex rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
            {viewModel.originLabel}
          </span>
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-border bg-surface/60 p-4">
          <Field label="Need summary">{viewModel.needSummary}</Field>
          <ConfidenceBar value={viewModel.confidenceScore} />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Stat icon={Users} label="Affected group" value={viewModel.affectedGroupLabel} />
          <Stat icon={MapPin} label="Location" value={viewModel.locationText} />
          <Stat icon={Activity} label="Status" value={viewModel.status} />
          <Stat
            icon={Lightbulb}
            label="Recommended actor"
            value={viewModel.recommendedActorLabel}
          />
        </div>

        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-primary">
            Suggested action
          </div>
          <p className="mt-1 text-sm">{viewModel.suggestedAction}</p>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-surface/40 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
            Saved report text
          </div>
          <p className="mt-1 text-sm italic text-muted-foreground">
            &quot;{viewModel.rawText}&quot;
          </p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          <div className="rounded-md border border-border bg-muted/20 p-2">
            <div>lat</div>
            <div className="mt-0.5 text-foreground">{viewModel.latitudeText}</div>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-2">
            <div>lng</div>
            <div className="mt-0.5 text-foreground">{viewModel.longitudeText}</div>
          </div>
          <div className="rounded-md border border-border bg-muted/20 p-2">
            <div>area</div>
            <div className="mt-0.5 text-foreground">{viewModel.areaLabel}</div>
          </div>
        </div>
      </div>
    </SheetContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm text-foreground">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface/40 p-3">
      <Icon className="mt-0.5 h-4 w-4 text-primary" />
      <div className="min-w-0">
        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 truncate text-sm capitalize text-foreground">{value}</div>
      </div>
    </div>
  );
}
