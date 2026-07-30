import {
  ACTOR_LABEL,
  CATEGORY_META,
  PRIORITY_RANK,
  type DemandCategory,
  type DemandReport,
  type RecommendedActor,
} from "@/domain/demand";
import { buildDemandClusters } from "@/lib/clustering";
import { BLR_ZONES } from "@/lib/geo/bengaluru";
import { buildClusterDetailViewModel } from "./buildClusterDetailViewModel";
import type {
  ActorBreakdownViewModel,
  EmergingClusterViewModel,
  InsightsViewModel,
  OpportunityScorecardViewModel,
  RecommendedActionViewModel,
  StudentAreaInsightViewModel,
  UnderservedZoneViewModel,
} from "./types";

export function buildInsightsViewModel(demands: DemandReport[]): InsightsViewModel {
  const clusters = buildClusters(demands);
  const actorBreakdown = buildActorBreakdown(demands);
  const studentAreas = buildStudentAreas(demands);
  const opportunities = clusters.slice(0, 4).map<OpportunityScorecardViewModel>((cluster) => ({
    id: cluster.id,
    area: cluster.area,
    category: cluster.category,
    categoryLabel: cluster.categoryLabel,
    categoryColor: cluster.categoryColor,
    count: cluster.count,
    avgSignal: cluster.avgSignal,
    score: Math.min(100, Math.round(cluster.avgSignal * 0.6 + cluster.count * 8)),
  }));
  const underservedZones = buildUnderservedZones(demands);

  return {
    totalSignals: demands.length,
    activeClusterCount: clusters.length,
    clusters,
    recommendedActions: clusters.slice(0, 6).map<RecommendedActionViewModel>((cluster) => ({
      id: cluster.id,
      area: cluster.area,
      category: cluster.category,
      count: cluster.count,
      avgSignal: cluster.avgSignal,
      sampleSuggestedAction: cluster.sampleSuggestedAction,
      sampleRecommendedActorLabel: cluster.sampleRecommendedActorLabel,
    })),
    actorBreakdown,
    studentAreas,
    opportunities,
    underservedZones,
  };
}

function buildClusters(demands: DemandReport[]) {
  const reportById = new Map(demands.map((demand) => [demand.id, demand]));

  const clusters: EmergingClusterViewModel[] = [];
  buildDemandClusters(demands).forEach((demandCluster) => {
    const rows = demandCluster.reportIds
      .map((reportId) => reportById.get(reportId))
      .filter((report): report is DemandReport => Boolean(report));

    if (rows.length < 2) return;
    const avgSignal = Math.round(rows.reduce((sum, d) => sum + d.signal_strength, 0) / rows.length);
    const sample = [...rows].sort(
      (a, b) =>
        PRIORITY_RANK[b.impact_priority] - PRIORITY_RANK[a.impact_priority] ||
        a.id.localeCompare(b.id),
    )[0];
    const meta = CATEGORY_META[demandCluster.category];
    clusters.push({
      id: demandCluster.id,
      area: demandCluster.area,
      category: demandCluster.category,
      categoryLabel: meta.label,
      categoryColor: meta.color,
      count: rows.length,
      avgSignal,
      worstPriority: sample.impact_priority,
      sampleRawText: sample.raw_text,
      sampleSuggestedAction: sample.suggested_action,
      sampleRecommendedActor: sample.recommended_actor,
      sampleRecommendedActorLabel: ACTOR_LABEL[sample.recommended_actor],
      detail: buildClusterDetailViewModel(demandCluster, rows),
    });
  });

  return clusters
    .sort((a, b) => b.avgSignal * b.count - a.avgSignal * a.count || a.id.localeCompare(b.id))
    .slice(0, 6);
}

function buildActorBreakdown(demands: DemandReport[]) {
  const counts = new Map<RecommendedActor, number>();
  demands.forEach((d) =>
    counts.set(d.recommended_actor, (counts.get(d.recommended_actor) || 0) + 1),
  );
  const max = Math.max(...counts.values());
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map<ActorBreakdownViewModel>(([actor, count]) => ({
      actor,
      label: ACTOR_LABEL[actor],
      count,
      widthPercent: (count / max) * 100,
    }));
}

function buildStudentAreas(demands: DemandReport[]) {
  const counts = new Map<string, number>();
  demands
    .filter((d) => d.affected_group === "students")
    .forEach((d) => counts.set(d.area_label, (counts.get(d.area_label) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map<StudentAreaInsightViewModel>(([area, count], index) => ({
      area,
      count,
      rank: index + 1,
    }));
}

function buildUnderservedZones(demands: DemandReport[]) {
  const counts = new Map<string, { areas: Set<DemandCategory>; total: number }>();
  BLR_ZONES.forEach((zone) => counts.set(zone.label, { areas: new Set(), total: 0 }));
  demands.forEach((d) => {
    const entry = counts.get(d.area_label);
    if (!entry) return;
    entry.areas.add(d.category);
    entry.total += 1;
  });
  return [...counts.entries()]
    .map<UnderservedZoneViewModel>(([area, value]) => ({
      area,
      categories: value.areas.size,
      total: value.total,
      widthPercent: Math.min(100, value.areas.size * 14),
    }))
    .sort((a, b) => b.categories - a.categories)
    .slice(0, 5);
}
