import type { DemandCategory, ImpactPriority, RecommendedActor } from "@/domain/demand";

export type DashboardCardSort = "recent" | "signal" | "urgent";

export interface DashboardTopCategoryViewModel {
  category: DemandCategory;
  label: string;
  color: string;
  count: number;
}

export interface DashboardHotspotViewModel {
  area: string;
  count: number;
}

export interface DashboardCategoryDistributionViewModel {
  category: DemandCategory;
  label: string;
  color: string;
  count: number;
  widthPercent: number;
}

export interface DashboardAreaLeaderboardViewModel {
  area: string;
  count: number;
  rank: number;
  widthPercent: number;
}

export interface DemandMatrixCategoryViewModel {
  category: DemandCategory;
  label: string;
  shortLabel: string;
  color: string;
}

export interface DemandMatrixCellViewModel {
  category: DemandCategory;
  count: number;
  intensity: number;
  heatPercent: number;
  color: string;
}

export interface DemandMatrixRowViewModel {
  zoneKey: string;
  area: string;
  cells: DemandMatrixCellViewModel[];
}

export interface DashboardViewModel {
  totalSignals: number;
  averageSignalStrength: number;
  topCategory: DashboardTopCategoryViewModel | null;
  hotspotArea: DashboardHotspotViewModel | null;
  categoryDistribution: DashboardCategoryDistributionViewModel[];
  areaLeaderboard: DashboardAreaLeaderboardViewModel[];
  demandMatrix: {
    categories: DemandMatrixCategoryViewModel[];
    rows: DemandMatrixRowViewModel[];
    maxCellCount: number;
  };
  sortedDemandIds: string[];
}

export interface EmergingClusterViewModel {
  area: string;
  category: DemandCategory;
  categoryLabel: string;
  categoryColor: string;
  count: number;
  avgSignal: number;
  worstPriority: ImpactPriority;
  sampleRawText: string;
  sampleSuggestedAction: string;
  sampleRecommendedActor: RecommendedActor;
  sampleRecommendedActorLabel: string;
}

export interface RecommendedActionViewModel {
  area: string;
  count: number;
  avgSignal: number;
  sampleSuggestedAction: string;
  sampleRecommendedActorLabel: string;
  category: DemandCategory;
}

export interface ActorBreakdownViewModel {
  actor: RecommendedActor;
  label: string;
  count: number;
  widthPercent: number;
}

export interface StudentAreaInsightViewModel {
  area: string;
  count: number;
  rank: number;
}

export interface OpportunityScorecardViewModel {
  area: string;
  category: DemandCategory;
  categoryLabel: string;
  categoryColor: string;
  count: number;
  avgSignal: number;
  score: number;
}

export interface UnderservedZoneViewModel {
  area: string;
  categories: number;
  total: number;
  widthPercent: number;
}

export interface InsightsViewModel {
  totalSignals: number;
  activeClusterCount: number;
  clusters: EmergingClusterViewModel[];
  recommendedActions: RecommendedActionViewModel[];
  actorBreakdown: ActorBreakdownViewModel[];
  studentAreas: StudentAreaInsightViewModel[];
  opportunities: OpportunityScorecardViewModel[];
  underservedZones: UnderservedZoneViewModel[];
}
