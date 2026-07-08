import type { DemandReport } from "@/domain/demand";
import type { DemandMapViewModel } from "@/lib/map";
import { SvgDemandMapRenderer } from "@/components/map/renderers";

interface Props {
  viewModel: DemandMapViewModel;
  onSelectDemand?: (d: DemandReport) => void;
}

const noopSelectDemand = () => {};

export function DemandRadarMap({ viewModel, onSelectDemand }: Props) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-[oklch(0.14_0.025_250)]">
      <SvgDemandMapRenderer
        viewModel={viewModel}
        onSelectDemand={onSelectDemand ?? noopSelectDemand}
      />

      {/* corner badge */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-primary anim-signal-blink" />
        BLR · live demand grid
      </div>
      <div className="absolute bottom-3 right-3 rounded-md border border-border bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
        {viewModel.markers.length} signals
      </div>
    </div>
  );
}
