import type { DemandCategory, DemandReport } from "@/domain/demand";

export type DemandMapCategoryFilter = DemandCategory | "all";

export interface DemandMapFilters {
  category: DemandMapCategoryFilter;
  minUrgency: number;
  sidebarLimit?: number;
}

export interface DemandMapMarker {
  id: string;
  demand: DemandReport;
  x: number;
  y: number;
  radius: number;
  color: string;
  categoryLabel: string;
  title: string;
  areaLabel: string;
  signalStrength: number;
}

export interface DemandMapHotspot {
  zoneKey: string;
  areaLabel: string;
  x: number;
  y: number;
  signalCount: number;
  radius: number;
}

export interface DemandMapZoneLabel {
  zoneKey: string;
  label: string;
  x: number;
  y: number;
}

export interface DemandMapCategoryCount {
  category: DemandCategory;
  label: string;
  color: string;
  count: number;
}

export interface DemandMapViewModel {
  filters: Required<DemandMapFilters>;
  allCount: number;
  filteredCount: number;
  filteredDemands: DemandReport[];
  sidebarDemands: DemandReport[];
  markers: DemandMapMarker[];
  hotspots: DemandMapHotspot[];
  zoneLabels: DemandMapZoneLabel[];
  categoryCounts: DemandMapCategoryCount[];
}
