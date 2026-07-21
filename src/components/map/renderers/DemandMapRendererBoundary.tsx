import React, { Suspense } from "react";
import type { DemandReport } from "@/domain/demand";
import { getConfiguredMapProvider, type DemandMapViewModel } from "@/lib/map";
import { SvgDemandMapRenderer } from "./SvgDemandMapRenderer";

const MapplsDemandMapRenderer = React.lazy(() =>
  import("./MapplsDemandMapRenderer").then((m) => ({ default: m.MapplsDemandMapRenderer })),
);

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface Props {
  viewModel: DemandMapViewModel;
  onSelectDemand: (demand: DemandReport) => void;
}

export function DemandMapRendererBoundary({ viewModel, onSelectDemand }: Props) {
  const provider = getConfiguredMapProvider();

  if (provider === "mappls") {
    return (
      <MapErrorBoundary
        fallback={<SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />}
      >
        <Suspense
          fallback={<SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />}
        >
          <MapplsDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />
        </Suspense>
      </MapErrorBoundary>
    );
  }

  return <SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />;
}
