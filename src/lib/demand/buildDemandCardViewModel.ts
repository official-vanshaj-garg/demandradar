import { ACTOR_LABEL, CATEGORY_META, type DemandReport } from "@/domain/demand";
import { getDemandOriginPresentation } from "./getDemandOrigin";
import type { DemandCardViewModel } from "./types";

function formatAffectedGroup(value: DemandReport["affected_group"]) {
  return value.replace("_", " ");
}

function formatDisplayId(id: string) {
  return id.slice(0, 8);
}

function formatCoordinate(value: number) {
  return value.toFixed(3);
}

export function buildDemandCardViewModel(demand: DemandReport): DemandCardViewModel {
  const meta = CATEGORY_META[demand.category];
  const origin = getDemandOriginPresentation(demand.id);

  return {
    id: demand.id,
    displayId: formatDisplayId(demand.id),
    category: {
      key: demand.category,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
    },
    subCategory: demand.sub_category,
    title: demand.title,
    needSummary: demand.need_summary,
    signalStrength: demand.signal_strength,
    urgency: demand.urgency,
    impactPriority: demand.impact_priority,
    affectedGroupLabel: formatAffectedGroup(demand.affected_group),
    locationText: demand.location_text,
    confidenceScore: demand.confidence_score,
    upvotes: demand.upvotes,
    privacyStatus: demand.privacy_status,
    similarReportsCount: demand.similar_reports_count,
    status: demand.status,
    recommendedActorLabel: ACTOR_LABEL[demand.recommended_actor],
    suggestedAction: demand.suggested_action,
    rawText: demand.raw_text,
    latitudeText: formatCoordinate(demand.latitude),
    longitudeText: formatCoordinate(demand.longitude),
    areaLabel: demand.area_label,
    origin: origin.origin,
    originLabel: origin.label,
  };
}
