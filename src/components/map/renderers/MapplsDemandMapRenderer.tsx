import { useEffect, useRef, useState } from "react";
import type { DemandReport } from "@/domain/demand";
import type { DemandMapViewModel } from "@/lib/map";
import { loadMapplsSdk } from "@/lib/map/loadMapplsSdk";
import { SvgDemandMapRenderer } from "./SvgDemandMapRenderer";

import type { MapplsMapInstance, MapplsMarker } from "@/lib/map/mappls.types";

interface Props {
  viewModel: DemandMapViewModel;
  onSelectDemand: (demand: DemandReport) => void;
}

export function MapplsDemandMapRenderer({ viewModel, onSelectDemand }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mapInstanceRef = useRef<MapplsMapInstance | null>(null);
  const markersRef = useRef<MapplsMarker[]>([]);

  useEffect(() => {
    let mounted = true;
    loadMapplsSdk()
      .then(() => {
        if (mounted) setLoading(false);
      })
      .catch((err) => {
        console.error("DemandRadar: Mappls SDK failed to load.", err);
        if (mounted) setError(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const mappls = window.mappls;
    if (loading || error || !containerRef.current || !mappls) return;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new mappls.Map(containerRef.current, {
        center: [12.9716, 77.5946], // Bengaluru center
        zoom: 11,
      });
    }
  }, [loading, error]);

  useEffect(() => {
    const mappls = window.mappls;
    if (loading || error || !mapInstanceRef.current || !mappls) return;

    markersRef.current.forEach((m) => {
      if (typeof m.remove === "function") m.remove();
    });
    markersRef.current = [];

    viewModel.markers.forEach((markerData) => {
      const marker = new mappls.Marker({
        map: mapInstanceRef.current,
        position: { lat: markerData.lat, lng: markerData.lng },
      });
      if (typeof marker.addListener === "function") {
        marker.addListener("click", () => onSelectDemand(markerData.demand));
      }
      markersRef.current.push(marker);
    });
  }, [loading, error, viewModel.markers, onSelectDemand]);

  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => {
        if (typeof m.remove === "function") m.remove();
      });
      markersRef.current = [];
      if (mapInstanceRef.current && typeof mapInstanceRef.current.remove === "function") {
        mapInstanceRef.current.remove();
      }
      mapInstanceRef.current = null;
    };
  }, []);

  if (error || loading) {
    return <SvgDemandMapRenderer viewModel={viewModel} onSelectDemand={onSelectDemand} />;
  }

  return (
    <div ref={containerRef} className="absolute inset-0 h-full w-full bg-[oklch(0.14_0.025_250)]" />
  );
}
