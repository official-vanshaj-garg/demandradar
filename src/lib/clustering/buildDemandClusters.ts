import type { DemandCategory, DemandReport } from "@/domain/demand";
import type { DemandCluster } from "./types";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "around",
  "at",
  "be",
  "by",
  "for",
  "from",
  "here",
  "in",
  "is",
  "need",
  "needed",
  "needs",
  "near",
  "nearby",
  "no",
  "of",
  "on",
  "or",
  "our",
  "please",
  "service",
  "services",
  "the",
  "there",
  "to",
  "we",
  "with",
]);

const GENERIC_ONLY_TOKENS = new Set(["affordable", "available", "better", "good", "local"]);
const KNOWN_SIMPLE_PLURALS = new Map([
  ["atms", "atm"],
  ["tiffins", "tiffin"],
]);

interface ClusterCandidate {
  report: DemandReport;
  normalizedText: string;
  tokens: string[];
}

interface DemandPartition {
  area: string;
  category: DemandCategory;
  candidates: ClusterCandidate[];
}

export function buildDemandClusters(demands: DemandReport[]): DemandCluster[] {
  const partitions = buildPartitions(demands);

  return partitions
    .flatMap((partition) => buildPartitionClusters(partition))
    .sort(
      (a, b) =>
        a.area.localeCompare(b.area) ||
        a.category.localeCompare(b.category) ||
        a.id.localeCompare(b.id),
    );
}

function buildPartitions(demands: DemandReport[]) {
  const partitions = new Map<string, DemandPartition>();

  demands.forEach((report) => {
    const key = `${report.area_label}\u0000${report.category}`;
    const partition =
      partitions.get(key) ||
      ({
        area: report.area_label,
        category: report.category,
        candidates: [],
      } satisfies DemandPartition);

    partition.candidates.push({
      report,
      normalizedText: normalizeText(report.raw_text),
      tokens: tokenizeDemandText(report.raw_text),
    });
    partitions.set(key, partition);
  });

  return [...partitions.values()].sort(
    (a, b) => a.area.localeCompare(b.area) || a.category.localeCompare(b.category),
  );
}

function buildPartitionClusters(partition: DemandPartition) {
  const candidates = [...partition.candidates].sort(compareCandidates);
  const clusters: ClusterCandidate[][] = [];

  candidates.forEach((candidate) => {
    const qualifyingCluster = clusters.find((cluster) =>
      cluster.every((member) => areConservativelySimilar(candidate, member)),
    );

    if (qualifyingCluster) {
      qualifyingCluster.push(candidate);
      qualifyingCluster.sort(compareCandidates);
    } else {
      clusters.push([candidate]);
    }
  });

  return clusters.map((cluster) => {
    const reportIds = cluster.map((candidate) => candidate.report.id).sort();
    const matchTokens = collectMatchTokens(cluster);

    return {
      id: createClusterId(partition.area, partition.category, reportIds),
      area: partition.area,
      category: partition.category,
      reportIds,
      memberCount: reportIds.length,
      matchTokens,
    };
  });
}

function compareCandidates(a: ClusterCandidate, b: ClusterCandidate) {
  return a.normalizedText.localeCompare(b.normalizedText) || a.report.id.localeCompare(b.report.id);
}

function collectMatchTokens(candidates: ClusterCandidate[]) {
  const counts = new Map<string, number>();
  candidates.forEach((candidate) => {
    new Set(candidate.tokens).forEach((token) => counts.set(token, (counts.get(token) || 0) + 1));
  });

  const minimumCount = candidates.length > 1 ? 2 : 1;
  return [...counts.entries()]
    .filter(([, count]) => count >= minimumCount)
    .map(([token]) => token)
    .sort();
}

function areConservativelySimilar(a: ClusterCandidate, b: ClusterCandidate) {
  if (a.normalizedText === b.normalizedText) {
    if (!a.normalizedText || a.tokens.length === 0) return false;
    if (a.tokens.length === 1) return isMeaningfulToken(a.tokens[0]);
    return true;
  }
  if (a.tokens.length < 2 || b.tokens.length < 2) return false;

  const aTokens = new Set(a.tokens);
  const bTokens = new Set(b.tokens);
  const overlap = [...aTokens].filter((token) => bTokens.has(token));
  const meaningfulOverlap = overlap.filter((token) => !GENERIC_ONLY_TOKENS.has(token));

  if (overlap.length < 2 || meaningfulOverlap.length < 1) return false;

  const union = new Set([...aTokens, ...bTokens]);
  const jaccard = overlap.length / union.size;
  const containment = overlap.length / Math.min(aTokens.size, bTokens.size);

  return jaccard >= 0.42 || containment >= 0.75;
}

function isMeaningfulToken(token: string) {
  return !GENERIC_ONLY_TOKENS.has(token);
}

function normalizeText(text: string) {
  return text
    .toLowerCase()
    .replace(/(\d+)\s*[x/]\s*(\d+)/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeDemandText(text: string) {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  return [...new Set(normalized.split(" "))]
    .map(canonicalizeToken)
    .filter((token) => token.length > 1 || /^\d+$/.test(token))
    .filter((token) => !STOP_WORDS.has(token))
    .sort();
}

function canonicalizeToken(token: string) {
  // Small plural-only canonicalization: explicit simple plurals plus narrow
  // suffixes, without stemming words where final "s" belongs to the base word.
  const knownPlural = KNOWN_SIMPLE_PLURALS.get(token);
  if (knownPlural) return knownPlural;
  if (token.length > 4 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ices")) return `${token.slice(0, -1)}`;

  return token;
}

function createClusterId(area: string, category: DemandCategory, reportIds: string[]) {
  return `demand-cluster:${slug(category)}:${slug(area)}:${stableHash(reportIds.join("|"))}`;
}

function slug(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "unknown"
  );
}

function stableHash(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}
