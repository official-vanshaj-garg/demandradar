import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import { buildInsightsViewModel } from "../../src/lib/analytics";

function report(overrides: Partial<DemandReport> & Pick<DemandReport, "id">): DemandReport {
  return {
    id: overrides.id,
    created_at: "2026-07-25T10:00:00.000Z",
    reporter_session: "session",
    raw_text: "Need a local service",
    clean_text: "Need a local service",
    title: "Service needed",
    need_summary: "A local service is missing.",
    category: "food",
    sub_category: "Budget",
    affected_group: "students",
    urgency: 3,
    signal_strength: 50,
    impact_priority: "medium",
    privacy_status: "clean",
    confidence_score: 80,
    recommended_actor: "local_business",
    suggested_action: "Open a pilot service.",
    similar_reports_count: 0,
    location_text: "Indiranagar",
    area_label: "Indiranagar",
    latitude: 12.971,
    longitude: 77.641,
    status: "new",
    upvotes: 0,
    ...overrides,
  };
}

const clusteredDemands: DemandReport[] = [
  report({
    id: "food-1",
    area_label: "Indiranagar",
    category: "food",
    signal_strength: 80,
    impact_priority: "high",
    raw_text: "Need affordable late night food near the metro",
    suggested_action: "Start a budget dinner counter.",
    recommended_actor: "local_business",
  }),
  report({
    id: "food-2",
    area_label: "Indiranagar",
    category: "food",
    signal_strength: 100,
    impact_priority: "critical",
    raw_text: "Need late night affordable food",
    suggested_action: "Run a late-night tiffin pilot.",
    recommended_actor: "government",
  }),
  report({
    id: "study-1",
    area_label: "Koramangala",
    category: "study_space",
    signal_strength: 40,
    impact_priority: "medium",
    raw_text: "Need quiet study rooms near college",
    recommended_actor: "community",
  }),
  report({
    id: "study-2",
    area_label: "Koramangala",
    category: "study_space",
    signal_strength: 60,
    impact_priority: "high",
    raw_text: "Need quiet study seats near college",
    recommended_actor: "community",
  }),
  report({
    id: "pharmacy-1",
    area_label: "BTM Layout",
    category: "pharmacy",
    signal_strength: 90,
    affected_group: "families",
    recommended_actor: "ngo",
  }),
];

describe("buildInsightsViewModel", () => {
  test("groups clusters, averages signal, picks sample report, and orders clusters", () => {
    const viewModel = buildInsightsViewModel(clusteredDemands);

    expect(viewModel.clusters.map((cluster) => [cluster.area, cluster.category])).toEqual([
      ["Indiranagar", "food"],
      ["Koramangala", "study_space"],
    ]);
    expect(viewModel.clusters[0]).toMatchObject({
      count: 2,
      avgSignal: 90,
      worstPriority: "critical",
      sampleRawText: "Need late night affordable food",
      sampleSuggestedAction: "Run a late-night tiffin pilot.",
      sampleRecommendedActorLabel: "Government / Civic Body",
      categoryLabel: "Affordable Food",
    });
    expect(viewModel.clusters[0].detail).toMatchObject({
      clusterId: viewModel.clusters[0].id,
      areaLabel: "Indiranagar",
      categoryLabel: "Affordable Food",
      signalCount: 2,
      averageSignalStrength: 90,
      members: [{ id: "food-1" }, { id: "food-2" }],
    });
  });

  test("builds opportunity scores, actor breakdown, student areas, and underserved zones", () => {
    const viewModel = buildInsightsViewModel(clusteredDemands);

    expect(
      viewModel.opportunities.map((opportunity) => [opportunity.area, opportunity.score]),
    ).toEqual([
      ["Indiranagar", 70],
      ["Koramangala", 46],
    ]);
    expect(viewModel.actorBreakdown.map((actor) => [actor.actor, actor.count])).toEqual([
      ["community", 2],
      ["local_business", 1],
      ["government", 1],
      ["ngo", 1],
    ]);
    expect(viewModel.studentAreas.map((area) => [area.rank, area.area, area.count])).toEqual([
      [1, "Indiranagar", 2],
      [2, "Koramangala", 2],
    ]);
    expect(
      viewModel.underservedZones
        .slice(0, 3)
        .map((zone) => [zone.area, zone.categories, zone.total]),
    ).toEqual([
      ["Indiranagar", 1, 2],
      ["Koramangala", 1, 2],
      ["BTM Layout", 1, 1],
    ]);
  });

  test("caps opportunity score at 100", () => {
    const highSignalDemands = Array.from({ length: 10 }, (_, index) =>
      report({
        id: `high-${index}`,
        area_label: "Whitefield",
        category: "transport",
        raw_text: "Need reliable late night bus from Whitefield tech park",
        signal_strength: 100,
      }),
    );

    expect(buildInsightsViewModel(highSignalDemands).opportunities[0]?.score).toBe(100);
  });

  test("preserves stable tie behaviour for cluster and actor ordering", () => {
    const viewModel = buildInsightsViewModel([
      report({
        id: "food-a",
        area_label: "Indiranagar",
        category: "food",
        raw_text: "Need affordable lunch near Indiranagar metro",
        recommended_actor: "ngo",
      }),
      report({
        id: "food-b",
        area_label: "Indiranagar",
        category: "food",
        raw_text: "Affordable lunch needed near Indiranagar metro",
        recommended_actor: "ngo",
      }),
      report({
        id: "study-a",
        area_label: "Koramangala",
        category: "study_space",
        raw_text: "Need quiet study seats near Koramangala college",
        recommended_actor: "community",
      }),
      report({
        id: "study-b",
        area_label: "Koramangala",
        category: "study_space",
        raw_text: "Quiet study seats needed near Koramangala college",
        recommended_actor: "community",
      }),
    ]);

    expect(viewModel.clusters.map((cluster) => cluster.area)).toEqual([
      "Indiranagar",
      "Koramangala",
    ]);
    expect(viewModel.actorBreakdown.map((actor) => actor.actor)).toEqual(["ngo", "community"]);
  });

  test("handles empty input", () => {
    const viewModel = buildInsightsViewModel([]);

    expect(viewModel.totalSignals).toBe(0);
    expect(viewModel.activeClusterCount).toBe(0);
    expect(viewModel.clusters).toEqual([]);
    expect(viewModel.recommendedActions).toEqual([]);
    expect(viewModel.actorBreakdown).toEqual([]);
    expect(viewModel.studentAreas).toEqual([]);
    expect(viewModel.opportunities).toEqual([]);
    expect(
      viewModel.underservedZones
        .slice(0, 5)
        .map((zone) => [zone.area, zone.categories, zone.total]),
    ).toEqual([
      ["Yelahanka", 0, 0],
      ["Hebbal", 0, 0],
      ["Rajajinagar", 0, 0],
      ["Indiranagar", 0, 0],
      ["Koramangala", 0, 0],
    ]);
  });
});
