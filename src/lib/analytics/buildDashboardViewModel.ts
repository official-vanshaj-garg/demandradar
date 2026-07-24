import {
  CATEGORY_META,
  PRIORITY_RANK,
  type DemandCategory,
  type DemandReport,
} from "@/domain/demand";
import { BLR_ZONES } from "@/lib/geo/bengaluru";
import type {
  DashboardAreaLeaderboardViewModel,
  DashboardCardSort,
  DashboardCategoryDistributionViewModel,
  DashboardViewModel,
  DemandMatrixCellViewModel,
} from "./types";

interface DashboardViewModelOptions {
  cardSort: DashboardCardSort;
}

export function buildDashboardViewModel(
  demands: DemandReport[],
  options: DashboardViewModelOptions,
): DashboardViewModel {
  const totalSignals = demands.length;
  const averageSignalStrength = totalSignals
    ? Math.round(demands.reduce((sum, d) => sum + d.signal_strength, 0) / totalSignals)
    : 0;

  const categoryCounts = new Map<DemandCategory, number>();
  const areaCounts = new Map<string, number>();
  demands.forEach((d) => {
    categoryCounts.set(d.category, (categoryCounts.get(d.category) || 0) + 1);
    areaCounts.set(d.area_label, (areaCounts.get(d.area_label) || 0) + 1);
  });

  const topCategoryEntry = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topCategory = topCategoryEntry
    ? {
        category: topCategoryEntry[0],
        label: CATEGORY_META[topCategoryEntry[0]].label,
        color: CATEGORY_META[topCategoryEntry[0]].color,
        count: topCategoryEntry[1],
      }
    : null;

  const hotspotEntry = [...areaCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const hotspotArea = hotspotEntry ? { area: hotspotEntry[0], count: hotspotEntry[1] } : null;

  const maxCategoryCount = Math.max(...categoryCounts.values());
  const categoryDistribution = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map<DashboardCategoryDistributionViewModel>(([category, count]) => ({
      category,
      label: CATEGORY_META[category].label,
      color: CATEGORY_META[category].color,
      count,
      widthPercent: (count / maxCategoryCount) * 100,
    }));

  const maxAreaCount = Math.max(...areaCounts.values());
  const areaLeaderboard = [...areaCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map<DashboardAreaLeaderboardViewModel>(([area, count], index) => ({
      area,
      count,
      rank: index + 1,
      widthPercent: (count / maxAreaCount) * 100,
    }));

  const matrixCategories = (Object.keys(CATEGORY_META) as DemandCategory[])
    .filter((category) => demands.some((d) => d.category === category))
    .map((category) => ({
      category,
      label: CATEGORY_META[category].label,
      shortLabel: CATEGORY_META[category].label.split(" ")[0],
      color: CATEGORY_META[category].color,
    }));

  const grid: Record<string, Record<string, number>> = {};
  let maxCellCount = 0;
  BLR_ZONES.forEach((zone) => {
    grid[zone.label] = {};
    matrixCategories.forEach(({ category }) => {
      const count = demands.filter(
        (d) => d.area_label === zone.label && d.category === category,
      ).length;
      grid[zone.label][category] = count;
      if (count > maxCellCount) maxCellCount = count;
    });
  });

  const matrixRows = BLR_ZONES.map((zone) => ({
    zoneKey: zone.key,
    area: zone.label,
    cells: matrixCategories.map<DemandMatrixCellViewModel>(({ category, color }) => {
      const count = grid[zone.label][category];
      const intensity = maxCellCount ? count / maxCellCount : 0;
      return {
        category,
        count,
        intensity,
        heatPercent: 30 + intensity * 55,
        color,
      };
    }),
  }));

  const sortedDemandIds = sortDemandIds(demands, options.cardSort);

  return {
    totalSignals,
    averageSignalStrength,
    topCategory,
    hotspotArea,
    categoryDistribution,
    areaLeaderboard,
    demandMatrix: {
      categories: matrixCategories,
      rows: matrixRows,
      maxCellCount,
    },
    sortedDemandIds,
  };
}

function sortDemandIds(demands: DemandReport[], sort: DashboardCardSort) {
  const sorted = [...demands];
  if (sort === "recent") {
    sorted.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  } else if (sort === "signal") {
    sorted.sort((a, b) => b.signal_strength - a.signal_strength);
  } else {
    sorted.sort(
      (a, b) =>
        PRIORITY_RANK[b.impact_priority] - PRIORITY_RANK[a.impact_priority] ||
        b.urgency - a.urgency,
    );
  }
  return sorted.slice(0, 9).map((d) => d.id);
}
