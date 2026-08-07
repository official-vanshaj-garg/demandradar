import { describe, expect, test } from "bun:test";
import { SEED_DEMANDS } from "../../src/lib/data/seed";
import { buildDemandClusters } from "../../src/lib/clustering";

function displayedSeedClusters() {
  return buildDemandClusters(SEED_DEMANDS).filter((cluster) => cluster.memberCount >= 2);
}

function sortedReportIdGroups(reportIdGroups: string[][]) {
  return [...reportIdGroups].sort((a, b) => a.join("|").localeCompare(b.join("|")));
}

describe("seed clustering fixture", () => {
  test("keeps canonical sample ids, neutral support, and neutral workflow state", () => {
    expect(SEED_DEMANDS.every((demand) => demand.id.startsWith("seed-"))).toBe(true);
    expect(SEED_DEMANDS.every((demand) => demand.upvotes === 0)).toBe(true);
    expect(SEED_DEMANDS.every((demand) => demand.status === "new")).toBe(true);
  });

  test("contains independently worded repeated-demand scenarios for the demo", () => {
    expect(displayedSeedClusters()).toMatchObject([
      {
        area: "Banashankari",
        category: "atm",
        reportIds: ["seed-13-fd48", "seed-41-bcb"],
      },
      {
        area: "Yelahanka",
        category: "food",
        reportIds: ["seed-36-c91e", "seed-42-d885"],
      },
    ]);
  });

  test("keeps unrelated reports sharing the same area and category separate", () => {
    const clusters = buildDemandClusters(SEED_DEMANDS);

    const broadBanashankariAtmIds = clusters
      .filter((cluster) => cluster.area === "Banashankari" && cluster.category === "atm")
      .map((cluster) => cluster.reportIds);
    const broadYelahankaFoodIds = clusters
      .filter((cluster) => cluster.area === "Yelahanka" && cluster.category === "food")
      .map((cluster) => cluster.reportIds);

    expect(sortedReportIdGroups(broadBanashankariAtmIds)).toEqual([
      ["seed-13-fd48", "seed-41-bcb"],
      ["seed-26-6054"],
    ]);
    expect(sortedReportIdGroups(broadYelahankaFoodIds)).toEqual([
      ["seed-02-4f8e"],
      ["seed-36-c91e", "seed-42-d885"],
    ]);
  });
});
