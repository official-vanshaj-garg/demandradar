import type { DemandCategory } from "@/domain/demand";

export interface DemandCluster {
  id: string;
  area: string;
  category: DemandCategory;
  reportIds: string[];
  memberCount: number;
  matchTokens: string[];
}
