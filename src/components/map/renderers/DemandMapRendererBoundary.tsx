import type { DemandReport } from "@/domain/demand";
import { getConfiguredMapProvider, type DemandMapViewModel } from "@/lib/map";
import { SvgDemandMapRenderer } from "./SvgDemandMapRenderer";

interface Props {
  viewModel: DemandMapViewModel;
  onSelectDemand: (demand: DemandReport) => void;
}

export function DemandMapRendererBoundary({ viewModel, onSelectDemand }: Props) {
  const provider = getConfiguredMapProvider();

  if (provider === "mappls") {
    // Future layer: attach the provider-backed Mappls renderer here.
    return <SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />;
  }

  return <SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />;
}
