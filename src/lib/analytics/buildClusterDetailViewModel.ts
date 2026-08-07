import { CATEGORY_META, type DemandReport } from "@/domain/demand";
import { buildDemandCardViewModel, getDemandOriginSummary } from "@/lib/demand";
import type { DemandCluster } from "@/lib/clustering";
import type { ClusterDetailViewModel, ClusterMemberViewModel } from "./types";

export function buildClusterDetailViewModel(
  cluster: DemandCluster,
  demands: DemandReport[],
): ClusterDetailViewModel {
  const reportsById = new Map(demands.map((demand) => [demand.id, demand]));
  const members = [...cluster.reportIds].sort().flatMap<ClusterMemberViewModel>((reportId) => {
    const report = reportsById.get(reportId);
    if (!report) return [];

    const card = buildDemandCardViewModel(report);
    return [
      {
        id: card.id,
        displayId: card.displayId,
        description: report.clean_text,
        signalStrength: card.signalStrength,
        urgencyLabel: formatUrgencyLabel(card.urgency),
        recommendedActorLabel: card.recommendedActorLabel,
        originLabel: card.originLabel,
      },
    ];
  });

  const meta = CATEGORY_META[cluster.category];
  const averageSignalStrength = members.length
    ? Math.round(members.reduce((sum, member) => sum + member.signalStrength, 0) / members.length)
    : 0;

  return {
    clusterId: cluster.id,
    areaLabel: cluster.area,
    categoryLabel: meta.label,
    categoryColor: meta.color,
    signalCount: members.length,
    averageSignalStrength,
    originLabel: getDemandOriginSummary(members.map((member) => member.id)).label,
    members,
  };
}

function formatUrgencyLabel(value: number) {
  return `Urgency ${value}/5`;
}
