import type {
  AffectedGroup,
  DemandCategory,
  DemandReport,
  DemandStatus,
  ImpactPriority,
  PrivacyStatus,
  RecommendedActor,
} from "@/domain/demand";

export const USER_REPORTS_STORAGE_KEY = "demandradar.user_reports.v1";
export const SESSION_STORAGE_KEY = "demandradar.session";
export const UPVOTES_STORAGE_KEY = "demandradar.upvotes.v1";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type UpvoteState = Record<string, true>;

export type StorageWriteFailureReason =
  | "storage_unavailable"
  | "storage_error"
  | "serialization_error";

export type StorageWriteResult = { ok: true } | { ok: false; reason: StorageWriteFailureReason };

type StorageReadResult =
  | { ok: true; value: string | null }
  | { ok: false; reason: "storage_unavailable" | "storage_error" };

const DEMAND_CATEGORIES = new Set<DemandCategory>([
  "study_space",
  "food",
  "fitness",
  "pharmacy",
  "pg_hostel",
  "printing",
  "transport",
  "laundry",
  "mental_health",
  "grocery",
  "womens_safety",
  "daycare",
  "atm",
  "other",
]);

const AFFECTED_GROUPS = new Set<AffectedGroup>([
  "students",
  "working_women",
  "seniors",
  "families",
  "commuters",
  "tech_workers",
  "general",
]);

const RECOMMENDED_ACTORS = new Set<RecommendedActor>([
  "local_business",
  "government",
  "ngo",
  "community",
  "transport_authority",
]);

const IMPACT_PRIORITIES = new Set<ImpactPriority>(["low", "medium", "high", "critical"]);
const PRIVACY_STATUSES = new Set<PrivacyStatus>(["clean", "redacted"]);
const DEMAND_STATUSES = new Set<DemandStatus>(["new", "reviewing", "acknowledged"]);

export function getBrowserLocalStorage(): StorageLike | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function parsePersistedUserReports(raw: string | null): DemandReport[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isDemandReport);
  } catch {
    return [];
  }
}

export function readPersistedUserReports(storage: StorageLike | null | undefined): DemandReport[] {
  const result = safeGetItem(storage, USER_REPORTS_STORAGE_KEY);
  if (!result.ok) return [];
  return parsePersistedUserReports(result.value);
}

export function writePersistedUserReports(
  storage: StorageLike | null | undefined,
  reports: DemandReport[],
): StorageWriteResult {
  return safeSetJson(storage, USER_REPORTS_STORAGE_KEY, reports);
}

export function parsePersistedUpvotes(raw: string | null): UpvoteState {
  if (!raw) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};

    const valid: UpvoteState = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof id === "string" && id.length > 0 && value === true) {
        valid[id] = true;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

export function readPersistedUpvotes(storage: StorageLike | null | undefined): UpvoteState {
  const result = safeGetItem(storage, UPVOTES_STORAGE_KEY);
  if (!result.ok) return {};
  return parsePersistedUpvotes(result.value);
}

export function writePersistedUpvotes(
  storage: StorageLike | null | undefined,
  upvotes: UpvoteState,
): StorageWriteResult {
  return safeSetJson(storage, UPVOTES_STORAGE_KEY, upvotes);
}

export function mergeDemandReports(
  seedReports: DemandReport[],
  userReports: DemandReport[],
  upvotes: UpvoteState = {},
): DemandReport[] {
  const seedIds = new Set(seedReports.map((report) => report.id));
  const uniqueUsers = dedupeUserReports(userReports).filter((report) => !seedIds.has(report.id));
  const seedWithUpvotes = seedReports.map((report) =>
    upvotes[report.id] ? { ...report, upvotes: report.upvotes + 1 } : { ...report },
  );

  return sortDemandReports([...uniqueUsers.map(cloneReport), ...seedWithUpvotes]);
}

export function applyUserReportUpvote(
  userReports: DemandReport[],
  id: string,
  upvoted: boolean,
): DemandReport[] {
  return userReports.map((report) =>
    report.id === id
      ? { ...report, upvotes: Math.max(0, report.upvotes + (upvoted ? 1 : -1)) }
      : { ...report },
  );
}

export type UpvoteToggleResult =
  | { ok: true; upvoted: boolean }
  | { ok: false; upvoted: boolean; reason: StorageWriteFailureReason };

export function togglePersistedUpvote(
  storage: StorageLike | null | undefined,
  id: string,
): UpvoteToggleResult {
  const upvotes = readPersistedUpvotes(storage);
  const isCurrentlyUpvoted = Boolean(upvotes[id]);
  const nextUpvoted = !isCurrentlyUpvoted;

  const nextUpvotes: UpvoteState = { ...upvotes };
  if (nextUpvoted) {
    nextUpvotes[id] = true;
  } else {
    delete nextUpvotes[id];
  }

  const userReports = readPersistedUserReports(storage);
  const isUserReport = userReports.some((report) => report.id === id);
  const nextUserReports = isUserReport ? applyUserReportUpvote(userReports, id, nextUpvoted) : null;

  const upvotesResult = writePersistedUpvotes(storage, nextUpvotes);
  if (!upvotesResult.ok) {
    return { ok: false, upvoted: isCurrentlyUpvoted, reason: upvotesResult.reason };
  }

  if (isUserReport && nextUserReports) {
    const userReportsResult = writePersistedUserReports(storage, nextUserReports);
    if (!userReportsResult.ok) {
      writePersistedUpvotes(storage, upvotes);
      return { ok: false, upvoted: isCurrentlyUpvoted, reason: userReportsResult.reason };
    }
  }

  return { ok: true, upvoted: nextUpvoted };
}

export function getOrCreateSessionId(
  storage: StorageLike | null | undefined,
  createId = createLocalSessionId,
): { id: string; writeResult?: StorageWriteResult } {
  if (!storage) return { id: "ssr", writeResult: { ok: false, reason: "storage_unavailable" } };

  const existing = safeGetItem(storage, SESSION_STORAGE_KEY);
  if (existing.ok && existing.value) return { id: existing.value };

  const id = createId();
  return { id, writeResult: safeSetString(storage, SESSION_STORAGE_KEY, id) };
}

function safeGetItem(storage: StorageLike | null | undefined, key: string): StorageReadResult {
  if (!storage) return { ok: false, reason: "storage_unavailable" };
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

function safeSetJson(
  storage: StorageLike | null | undefined,
  key: string,
  value: unknown,
): StorageWriteResult {
  if (!storage) return { ok: false, reason: "storage_unavailable" };

  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    return { ok: false, reason: "serialization_error" };
  }

  try {
    storage.setItem(key, serialized);
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

function safeSetString(
  storage: StorageLike | null | undefined,
  key: string,
  value: string,
): StorageWriteResult {
  if (!storage) return { ok: false, reason: "storage_unavailable" };
  try {
    storage.setItem(key, value);
    return { ok: true };
  } catch {
    return { ok: false, reason: "storage_error" };
  }
}

function isDemandReport(value: unknown): value is DemandReport {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    isTimestamp(value.created_at) &&
    isNonEmptyString(value.reporter_session) &&
    isString(value.raw_text) &&
    isString(value.location_text) &&
    isNonEmptyString(value.area_label) &&
    isLatitude(value.latitude) &&
    isLongitude(value.longitude) &&
    isEnum(value.status, DEMAND_STATUSES) &&
    isNonNegativeInteger(value.upvotes) &&
    isString(value.clean_text) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.need_summary) &&
    isEnum(value.category, DEMAND_CATEGORIES) &&
    isNonEmptyString(value.sub_category) &&
    isEnum(value.affected_group, AFFECTED_GROUPS) &&
    isRangeNumber(value.urgency, 1, 5) &&
    isRangeNumber(value.signal_strength, 0, 100) &&
    isEnum(value.impact_priority, IMPACT_PRIORITIES) &&
    isEnum(value.privacy_status, PRIVACY_STATUSES) &&
    isRangeNumber(value.confidence_score, 0, 100) &&
    isEnum(value.recommended_actor, RECOMMENDED_ACTORS) &&
    isNonEmptyString(value.suggested_action) &&
    isNonNegativeInteger(value.similar_reports_count)
  );
}

function dedupeUserReports(reports: DemandReport[]): DemandReport[] {
  const byId = new Map<string, DemandReport>();

  for (const report of reports) {
    const existing = byId.get(report.id);
    if (!existing) {
      byId.set(report.id, report);
    } else {
      const timeDelta = Date.parse(report.created_at) - Date.parse(existing.created_at);
      if (timeDelta > 0) {
        // Newer created_at replaces older record
        byId.set(report.id, report);
      }
      // If timeDelta <= 0 (older or equal timestamp), keep existing (first valid stored occurrence wins)
    }
  }

  return Array.from(byId.values());
}

function sortDemandReports(reports: DemandReport[]): DemandReport[] {
  return [...reports].sort(compareCreatedDescThenId);
}

function compareCreatedDescThenId(a: DemandReport, b: DemandReport): number {
  const timeDelta = Date.parse(b.created_at) - Date.parse(a.created_at);
  if (timeDelta !== 0) return timeDelta;
  return a.id.localeCompare(b.id);
}

function cloneReport(report: DemandReport): DemandReport {
  return { ...report };
}

function createLocalSessionId(): string {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (randomUUID) return randomUUID.call(globalThis.crypto);
  return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function isLatitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isLongitude(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

function isRangeNumber(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isEnum<T extends string>(value: unknown, values: Set<T>): value is T {
  return typeof value === "string" && values.has(value as T);
}
