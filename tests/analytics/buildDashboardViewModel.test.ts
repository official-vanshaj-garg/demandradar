import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import { buildDashboardViewModel } from "../../src/lib/analytics";

function report(overrides: Partial<DemandReport> & Pick<DemandReport, "id">): DemandReport {
  return {
    id: overrides.id,
    created_at: "2026-07-25T10:00:00.000Z",
    reporter_session: "session",
    raw_text: "Need a service",
    clean_text: "Need a service",
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

const demands: DemandReport[] = [
  report({
    id: "food-1",
    category: "food",
    area_label: "Indiranagar",
    signal_strength: 80,
    created_at: "2026-07-25T10:00:00.000Z",
  }),
  report({
    id: "study-1",
    category: "study_space",
    area_label: "Koramangala",
    signal_strength: 100,
    impact_priority: "critical",
    urgency: 4,
    created_at: "2026-07-25T09:00:00.000Z",
  }),
  report({
    id: "food-2",
    category: "food",
    area_label: "Indiranagar",
    signal_strength: 60,
    impact_priority: "critical",
    urgency: 5,
    created_at: "2026-07-25T08:00:00.000Z",
  }),
  report({
    id: "pharmacy-1",
    category: "pharmacy",
    area_label: "BTM Layout",
    signal_strength: 90,
    impact_priority: "high",
    urgency: 2,
    created_at: "2026-07-25T11:00:00.000Z",
  }),
  report({
    id: "study-2",
    category: "study_space",
    area_label: "Koramangala",
    signal_strength: 20,
    impact_priority: "critical",
    urgency: 5,
    created_at: "2026-07-25T07:00:00.000Z",
  }),
];

describe("buildDashboardViewModel", () => {
  test("calculates KPI values, top category, and hotspot area", () => {
    const viewModel = buildDashboardViewModel(demands, { cardSort: "signal" });

    expect(viewModel.totalSignals).toBe(5);
    expect(viewModel.averageSignalStrength).toBe(70);
    expect(viewModel.topCategory).toEqual({
      category: "food",
      label: "Affordable Food",
      color: "oklch(0.80 0.17 70)",
      count: 2,
    });
    expect(viewModel.hotspotArea).toEqual({ area: "Indiranagar", count: 2 });
  });

  test("preserves category, area, matrix, and card ordering", () => {
    const viewModel = buildDashboardViewModel(demands, { cardSort: "urgent" });

    expect(viewModel.categoryDistribution.map((entry) => [entry.category, entry.count])).toEqual([
      ["food", 2],
      ["study_space", 2],
      ["pharmacy", 1],
    ]);
    expect(viewModel.areaLeaderboard.map((entry) => [entry.rank, entry.area, entry.count])).toEqual(
      [
        [1, "Indiranagar", 2],
        [2, "Koramangala", 2],
        [3, "BTM Layout", 1],
      ],
    );
    expect(viewModel.sortedDemandIds).toEqual([
      "food-2",
      "study-2",
      "study-1",
      "pharmacy-1",
      "food-1",
    ]);

    expect(viewModel.demandMatrix.categories.map((category) => category.category)).toEqual([
      "study_space",
      "food",
      "pharmacy",
    ]);
    const indiranagar = viewModel.demandMatrix.rows.find((row) => row.area === "Indiranagar");
    expect(indiranagar?.cells.map((cell) => [cell.category, cell.count, cell.intensity])).toEqual([
      ["study_space", 0, 0],
      ["food", 2, 1],
      ["pharmacy", 0, 0],
    ]);
  });

  test("preserves stable tie behaviour for equal counts and signal sorting", () => {
    const viewModel = buildDashboardViewModel(
      [
        report({ id: "first", category: "study_space", signal_strength: 75 }),
        report({ id: "second", category: "food", signal_strength: 75 }),
      ],
      { cardSort: "signal" },
    );

    expect(viewModel.topCategory?.category).toBe("study_space");
    expect(viewModel.hotspotArea?.area).toBe("Indiranagar");
    expect(viewModel.sortedDemandIds).toEqual(["first", "second"]);
  });

  test("handles empty input", () => {
    const viewModel = buildDashboardViewModel([], { cardSort: "recent" });

    expect(viewModel.totalSignals).toBe(0);
    expect(viewModel.averageSignalStrength).toBe(0);
    expect(viewModel.topCategory).toBeNull();
    expect(viewModel.hotspotArea).toBeNull();
    expect(viewModel.categoryDistribution).toEqual([]);
    expect(viewModel.areaLeaderboard).toEqual([]);
    expect(viewModel.sortedDemandIds).toEqual([]);
    expect(viewModel.demandMatrix.categories).toEqual([]);
    expect(viewModel.demandMatrix.maxCellCount).toBe(0);
  });
});
