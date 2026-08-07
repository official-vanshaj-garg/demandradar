import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import type { DemandCluster } from "../../src/lib/clustering";
import { buildClusterDetailViewModel } from "../../src/lib/analytics";

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

function cluster(overrides: Partial<DemandCluster> = {}): DemandCluster {
  return {
    id: "cluster-food-indiranagar",
    area: "Indiranagar",
    category: "food",
    reportIds: ["food-b", "food-a"],
    memberCount: 2,
    matchTokens: ["affordable", "food"],
    ...overrides,
  };
}

describe("buildClusterDetailViewModel", () => {
  test("projects cluster identity, category, area, count, and average signal", () => {
    const viewModel = buildClusterDetailViewModel(cluster(), [
      report({ id: "food-a", signal_strength: 80 }),
      report({ id: "food-b", signal_strength: 100 }),
    ]);

    expect(viewModel).toMatchObject({
      clusterId: "cluster-food-indiranagar",
      areaLabel: "Indiranagar",
      categoryLabel: "Affordable Food",
      categoryColor: "oklch(0.80 0.17 70)",
      signalCount: 2,
      averageSignalStrength: 90,
      originLabel: "Saved in this browser",
    });
  });

  test("distinguishes sample-only, browser-local-only, and mixed member provenance", () => {
    const sampleOnly = buildClusterDetailViewModel(cluster({ reportIds: ["seed-a", "seed-b"] }), [
      report({ id: "seed-a" }),
      report({ id: "seed-b" }),
    ]);
    const browserOnly = buildClusterDetailViewModel(cluster({ reportIds: ["usr-a", "usr-b"] }), [
      report({ id: "usr-a" }),
      report({ id: "usr-b" }),
    ]);
    const mixed = buildClusterDetailViewModel(cluster({ reportIds: ["seed-a", "usr-a"] }), [
      report({ id: "seed-a" }),
      report({ id: "usr-a" }),
    ]);

    expect(sampleOnly.originLabel).toBe("Sample data");
    expect(browserOnly.originLabel).toBe("Saved in this browser");
    expect(mixed.originLabel).toBe("Mixed demo data");
    expect(mixed.members.map((member) => member.originLabel)).toEqual([
      "Sample data",
      "Saved in this browser",
    ]);
  });

  test("includes every cluster member in deterministic id order", () => {
    const viewModel = buildClusterDetailViewModel(cluster(), [
      report({ id: "food-b", signal_strength: 100 }),
      report({ id: "food-a", signal_strength: 80 }),
      report({ id: "food-c", signal_strength: 70 }),
    ]);

    expect(viewModel.members.map((member) => member.id)).toEqual(["food-a", "food-b"]);
  });

  test("formats stable display ids, urgency labels, and actor labels", () => {
    const viewModel = buildClusterDetailViewModel(cluster({ reportIds: ["demand-123456789"] }), [
      report({
        id: "demand-123456789",
        urgency: 4,
        recommended_actor: "transport_authority",
      }),
    ]);

    expect(viewModel.members[0]).toMatchObject({
      displayId: "demand-1",
      urgencyLabel: "Urgency 4/5",
      recommendedActorLabel: "Transport Authority",
    });
  });

  test("keeps members when recommended actors differ", () => {
    const viewModel = buildClusterDetailViewModel(cluster(), [
      report({ id: "food-a", recommended_actor: "local_business" }),
      report({ id: "food-b", recommended_actor: "government" }),
    ]);

    expect(viewModel.members.map((member) => member.recommendedActorLabel)).toEqual([
      "Local Business",
      "Government / Civic Body",
    ]);
  });

  test("uses stored redacted descriptions and excludes coordinate fields", () => {
    const viewModel = buildClusterDetailViewModel(cluster({ reportIds: ["food-a"] }), [
      report({
        id: "food-a",
        raw_text: "Need service, call 9999999999",
        clean_text: "Need service, call [redacted]",
        latitude: 12.123,
        longitude: 77.456,
      }),
    ]);
    const member = viewModel.members[0] as Record<string, unknown>;

    expect(member.description).toBe("Need service, call [redacted]");
    expect("latitude" in member).toBe(false);
    expect("longitude" in member).toBe(false);
    expect("latitudeText" in member).toBe(false);
    expect("longitudeText" in member).toBe(false);
  });

  test("handles a single-member cluster deterministically", () => {
    const viewModel = buildClusterDetailViewModel(
      cluster({ reportIds: ["solo"], memberCount: 1 }),
      [report({ id: "solo", signal_strength: 67 })],
    );

    expect(viewModel).toMatchObject({
      signalCount: 1,
      averageSignalStrength: 67,
      members: [{ id: "solo" }],
    });
  });

  test("does not mutate input cluster or reports", () => {
    const inputCluster = cluster();
    const inputReports = [
      report({ id: "food-a", signal_strength: 80 }),
      report({ id: "food-b", signal_strength: 100 }),
    ];
    const before = JSON.stringify({ inputCluster, inputReports });

    buildClusterDetailViewModel(inputCluster, inputReports);

    expect(JSON.stringify({ inputCluster, inputReports })).toBe(before);
  });
});
