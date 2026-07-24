import type { DemandCategory, DemandStatus, ImpactPriority, PrivacyStatus } from "@/domain/demand";

export interface DemandCardCategoryPresentation {
  key: DemandCategory;
  label: string;
  icon: string;
  color: string;
}

export interface DemandCardViewModel {
  id: string;
  displayId: string;
  category: DemandCardCategoryPresentation;
  subCategory: string;
  title: string;
  needSummary: string;
  signalStrength: number;
  urgency: number;
  impactPriority: ImpactPriority;
  affectedGroupLabel: string;
  locationText: string;
  confidenceScore: number;
  upvotes: number;
  privacyStatus: PrivacyStatus;
  similarReportsCount: number;
  status: DemandStatus;
  recommendedActorLabel: string;
  suggestedAction: string;
  rawText: string;
  latitudeText: string;
  longitudeText: string;
  areaLabel: string;
}
