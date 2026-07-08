import { CATEGORY_META, type DemandCategory, type DemandReport } from "@/domain/demand";
import { BLR_ZONES, projectToCanvas } from "@/lib/geo/bengaluru";
import type {
  DemandMapCategoryCount,
  DemandMapFilters,
  DemandMapHotspot,
  DemandMapMarker,
  DemandMapViewModel,
  DemandMapZoneLabel,
} from "./types";

const DEFAULT_SIDEBAR_LIMIT = 30;

export function buildDemandMapViewModel(
  demands: DemandReport[],
  filters: DemandMapFilters,
): DemandMapViewModel {
  const normalizedFilters = {
    category: filters.category,
    minUrgency: filters.minUrgency,
    sidebarLimit: filters.sidebarLimit ?? DEFAULT_SIDEBAR_LIMIT,
  };

  const filteredDemands = demands.filter(
    (d) =>
      (normalizedFilters.category === "all" || d.category === normalizedFilters.category) &&
      d.urgency >= normalizedFilters.minUrgency,
  );

  const markers = filteredDemands.map<DemandMapMarker>((d) => {
    const p = projectToCanvas(d.latitude, d.longitude);
    const meta = CATEGORY_META[d.category];
    return {
      id: d.id,
      demand: d,
      x: p.x,
      y: p.y,
      lat: d.latitude,
      lng: d.longitude,
      radius: 1.1 + (d.signal_strength / 100) * 1.3,
      color: meta.color,
      categoryLabel: meta.label,
      title: d.title,
      areaLabel: d.area_label,
      signalStrength: d.signal_strength,
    };
  });

  const zoneDensity = new Map<string, number>();
  markers.forEach((m) => zoneDensity.set(m.areaLabel, (zoneDensity.get(m.areaLabel) || 0) + 1));

  const hotspots = BLR_ZONES.flatMap<DemandMapHotspot>((z) => {
    const signalCount = zoneDensity.get(z.label) || 0;
    if (signalCount === 0) return [];
    return [
      {
        zoneKey: z.key,
        areaLabel: z.label,
        x: z.x,
        y: z.y,
        lat: z.lat,
        lng: z.lng,
        signalCount,
        radius: Math.min(18, 6 + signalCount * 1.6),
      },
    ];
  });

  const zoneLabels = BLR_ZONES.map<DemandMapZoneLabel>((z) => ({
    zoneKey: z.key,
    label: z.label,
    x: z.x,
    y: z.y,
    lat: z.lat,
    lng: z.lng,
  }));

  const categoryCounts = (
    Object.keys(CATEGORY_META) as DemandCategory[]
  ).flatMap<DemandMapCategoryCount>((category) => {
    const count = demands.filter((d) => d.category === category).length;
    if (count === 0) return [];
    const meta = CATEGORY_META[category];
    return [{ category, label: meta.label, color: meta.color, count }];
  });

  return {
    filters: normalizedFilters,
    allCount: demands.length,
    filteredCount: filteredDemands.length,
    filteredDemands,
    sidebarDemands: filteredDemands.slice(0, normalizedFilters.sidebarLimit),
    markers,
    hotspots,
    zoneLabels,
    categoryCounts,
  };
}
