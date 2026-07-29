import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import { buildDemandClusters } from "../../src/lib/clustering";

function report(overrides: Partial<DemandReport> & Pick<DemandReport, "id">): DemandReport {
  return {
    id: overrides.id,
    created_at: "2026-07-25T10:00:00.000Z",
    reporter_session: "session",
    raw_text: "Need a local service",
    clean_text: "Need a local service",
    title: "Service needed",
    need_summary: "A local service is missing.",
    category: "pharmacy",
    sub_category: "Health",
    affected_group: "families",
    urgency: 3,
    signal_strength: 50,
    impact_priority: "medium",
    privacy_status: "clean",
    confidence_score: 80,
    recommended_actor: "local_business",
    suggested_action: "Open a pilot service.",
    similar_reports_count: 0,
    location_text: "BTM Layout",
    area_label: "BTM Layout",
    latitude: 12.9166,
    longitude: 77.6101,
    status: "new",
    upvotes: 0,
    ...overrides,
  };
}

function clusterSizes(demands: DemandReport[]) {
  return buildDemandClusters(demands)
    .map((cluster) => cluster.reportIds)
    .sort((a, b) => a.join("|").localeCompare(b.join("|")));
}

describe("buildDemandClusters", () => {
  test("clusters identical descriptions in the same confirmed area and category", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need 24x7 pharmacy near BTM" }),
        report({ id: "b", raw_text: "Need 24x7 pharmacy near BTM" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("clusters punctuation and casing variants", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need 24/7 PHARMACY near BTM!" }),
        report({ id: "b", raw_text: "need 24x7 pharmacy near btm" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("clusters closely related wording when token overlap is strong", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need late night pharmacy near BTM Layout" }),
        report({ id: "b", raw_text: "Night pharmacy needed near BTM" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("normalizes ATM and ATMs as a safe plural pair", () => {
    expect(
      clusterSizes([
        report({ id: "a", category: "atm", raw_text: "Need ATM near metro" }),
        report({ id: "b", category: "atm", raw_text: "Need ATMs near metro" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("normalizes pharmacy and pharmacies as a safe plural pair", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need night pharmacy in BTM" }),
        report({ id: "b", raw_text: "Need night pharmacies in BTM" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("protects non-plural final-s words from canonicalization", () => {
    expect(
      clusterSizes([
        report({ id: "bus", category: "transport", raw_text: "bus" }),
        report({ id: "bu", category: "transport", raw_text: "bu" }),
        report({ id: "class", raw_text: "class" }),
        report({ id: "clas", raw_text: "clas" }),
        report({ id: "fitness", category: "fitness", raw_text: "fitness" }),
        report({ id: "fitnes", category: "fitness", raw_text: "fitnes" }),
        report({ id: "analysis", raw_text: "analysis" }),
        report({ id: "analysi", raw_text: "analysi" }),
      ]),
    ).toEqual([
      ["analysi"],
      ["analysis"],
      ["bu"],
      ["bus"],
      ["clas"],
      ["class"],
      ["fitnes"],
      ["fitness"],
    ]);
  });

  test("keeps unrelated demands in the same area and category separate", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need night pharmacy in BTM" }),
        report({ id: "b", raw_text: "Need wheelchair rental in BTM" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("does not cluster across different confirmed areas", () => {
    expect(
      clusterSizes([
        report({ id: "a", area_label: "BTM Layout", raw_text: "Need 24x7 pharmacy" }),
        report({ id: "b", area_label: "Indiranagar", raw_text: "Need 24x7 pharmacy" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("does not cluster across different demand categories", () => {
    expect(
      clusterSizes([
        report({ id: "a", category: "pharmacy", raw_text: "Need 24x7 service" }),
        report({ id: "b", category: "grocery", raw_text: "Need 24x7 service" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("does not merge demands on generic shared words alone", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "Need affordable service near metro" }),
        report({ id: "b", raw_text: "Need affordable option for buses" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("prevents single-link transitive over-merging", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "alpha beta" }),
        report({ id: "b", raw_text: "alpha beta gamma" }),
        report({ id: "c", raw_text: "beta gamma" }),
      ]),
    ).toEqual([["a", "b"], ["c"]]);
  });

  test("does not match empty normalized descriptions", () => {
    expect(
      clusterSizes([report({ id: "a", raw_text: "!!!" }), report({ id: "b", raw_text: "..." })]),
    ).toEqual([["a"], ["b"]]);
  });

  test("allows identical one-token descriptions when meaningful", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "pharmacy" }),
        report({ id: "b", raw_text: "pharmacy" }),
      ]),
    ).toEqual([["a", "b"]]);
  });

  test("does not cluster identical one-token generic descriptions", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "affordable" }),
        report({ id: "b", raw_text: "affordable" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("deduplicates repeated tokens before measuring similarity", () => {
    expect(
      clusterSizes([
        report({ id: "a", raw_text: "pharmacy pharmacy pharmacy" }),
        report({ id: "b", raw_text: "pharmacy clinic" }),
      ]),
    ).toEqual([["a"], ["b"]]);
  });

  test("creates stable cluster ids from stable inputs", () => {
    const first = buildDemandClusters([
      report({ id: "a", raw_text: "Need 24x7 pharmacy near BTM" }),
      report({ id: "b", raw_text: "Need 24x7 pharmacy near BTM" }),
    ]);
    const second = buildDemandClusters([
      report({ id: "b", raw_text: "Need 24x7 pharmacy near BTM" }),
      report({ id: "a", raw_text: "Need 24x7 pharmacy near BTM" }),
    ]);

    expect(first.map((cluster) => cluster.id)).toEqual(second.map((cluster) => cluster.id));
    expect(first[0]?.id).toMatch(/^demand-cluster:pharmacy:btm-layout:[a-f0-9]{8}$/);
  });

  test("is deterministic when input order changes", () => {
    const demands = [
      report({ id: "a", raw_text: "Need 24x7 pharmacy near BTM" }),
      report({ id: "b", raw_text: "Need night pharmacy near BTM" }),
      report({ id: "c", raw_text: "Need wheelchair rental in BTM" }),
      report({ id: "d", raw_text: "Need 24/7 pharmacy near BTM" }),
    ];

    expect(buildDemandClusters(demands)).toEqual(buildDemandClusters([...demands].reverse()));
  });

  test("returns singleton clusters", () => {
    expect(buildDemandClusters([report({ id: "solo" })])).toMatchObject([
      { reportIds: ["solo"], memberCount: 1 },
    ]);
  });

  test("handles empty input", () => {
    expect(buildDemandClusters([])).toEqual([]);
  });
});
