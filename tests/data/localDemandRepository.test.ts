import { describe, expect, test } from "bun:test";
import type { DemandReport } from "../../src/domain/demand";
import { SEED_DEMANDS } from "../../src/lib/data/seed";
import {
  applyUserReportUpvote,
  getOrCreateSessionId,
  mergeDemandReports,
  parsePersistedUpvotes,
  parsePersistedUserReports,
  readPersistedUpvotes,
  readPersistedUserReports,
  SESSION_STORAGE_KEY,
  togglePersistedUpvote,
  UPVOTES_STORAGE_KEY,
  USER_REPORTS_STORAGE_KEY,
  writePersistedUpvotes,
  writePersistedUserReports,
  type StorageLike,
} from "../../src/lib/data/localDemandRepository";

class MemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  getThrows = false;
  setThrows = false;

  getItem(key: string): string | null {
    if (this.getThrows) throw new Error("get failed");
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.setThrows) throw new Error("set failed");
    this.values.set(key, value);
  }
}

const baseReport: DemandReport = {
  id: "usr-1",
  created_at: "2026-07-31T10:00:00.000Z",
  reporter_session: "session-1",
  raw_text: "Need a quiet study library near college",
  location_text: "Near college",
  area_label: "Indiranagar",
  latitude: 12.9716,
  longitude: 77.5946,
  status: "new",
  upvotes: 1,
  clean_text: "Need a quiet study library near college",
  title: "Quiet study library needed",
  need_summary: "Students need a quiet study library near college.",
  category: "study_space",
  sub_category: "24h study library",
  affected_group: "students",
  urgency: 3,
  signal_strength: 72,
  impact_priority: "medium",
  privacy_status: "clean",
  confidence_score: 88,
  recommended_actor: "local_business",
  suggested_action: "Assess local demand for a study space.",
  similar_reports_count: 4,
};

function report(overrides: Partial<DemandReport> = {}): DemandReport {
  return { ...baseReport, ...overrides };
}

describe("local demand repository report parsing", () => {
  test("parses valid persisted reports", () => {
    const input = report();

    expect(parsePersistedUserReports(JSON.stringify([input]))).toEqual([input]);
  });

  test("returns empty reports for missing storage value", () => {
    expect(parsePersistedUserReports(null)).toEqual([]);
    expect(readPersistedUserReports(new MemoryStorage())).toEqual([]);
  });

  test("returns empty reports for malformed JSON", () => {
    expect(parsePersistedUserReports("{not-json")).toEqual([]);
  });

  test("returns empty reports for the wrong top-level JSON shape", () => {
    expect(parsePersistedUserReports(JSON.stringify({ rows: [report()] }))).toEqual([]);
  });

  test("discards individually malformed report records", () => {
    const valid = report({ id: "usr-valid" });
    const invalid = report({ id: "" });

    expect(parsePersistedUserReports(JSON.stringify([invalid, valid]))).toEqual([valid]);
  });

  test("requires every current DemandReport field", () => {
    const requiredKeys = Object.keys(baseReport) as Array<keyof DemandReport>;

    for (const key of requiredKeys) {
      const candidate: Partial<DemandReport> = { ...baseReport };
      delete candidate[key];

      expect(parsePersistedUserReports(JSON.stringify([candidate]))).toEqual([]);
    }
  });

  test("rejects invalid enums, coordinates, timestamps, and numeric ranges", () => {
    const cases: Array<Partial<DemandReport>> = [
      { created_at: "not-a-date" },
      { latitude: Number.NaN },
      { latitude: 91 },
      { longitude: 181 },
      { status: "closed" as DemandReport["status"] },
      { category: "complaint" as DemandReport["category"] },
      { affected_group: "tourists" as DemandReport["affected_group"] },
      { recommended_actor: "police" as DemandReport["recommended_actor"] },
      { impact_priority: "urgent" as DemandReport["impact_priority"] },
      { privacy_status: "unknown" as DemandReport["privacy_status"] },
      { urgency: 6 },
      { signal_strength: 101 },
      { confidence_score: -1 },
      { similar_reports_count: 1.5 },
      { upvotes: -1 },
    ];

    for (const invalidFields of cases) {
      expect(parsePersistedUserReports(JSON.stringify([report(invalidFields)]))).toEqual([]);
    }
  });

  test("contains getItem exceptions while reading reports", () => {
    const storage = new MemoryStorage();
    storage.getThrows = true;

    expect(readPersistedUserReports(storage)).toEqual([]);
  });
});

describe("local demand repository writes", () => {
  test("returns explicit success for report writes", () => {
    const storage = new MemoryStorage();

    expect(writePersistedUserReports(storage, [report()])).toEqual({ ok: true });
    expect(storage.values.get(USER_REPORTS_STORAGE_KEY)).toBe(JSON.stringify([report()]));
  });

  test("returns explicit failure for unavailable report storage", () => {
    expect(writePersistedUserReports(null, [report()])).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
  });

  test("contains setItem exceptions while writing reports", () => {
    const storage = new MemoryStorage();
    storage.setThrows = true;

    expect(writePersistedUserReports(storage, [report()])).toEqual({
      ok: false,
      reason: "storage_error",
    });
  });
});

class SelectiveMemoryStorage implements StorageLike {
  readonly values = new Map<string, string>();
  readonly failKeys = new Set<string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failKeys.has(key)) throw new Error(`set failed for ${key}`);
    this.values.set(key, value);
  }
}

describe("local demand repository merging and ordering", () => {
  test("deduplicates user reports by id using newest created_at", () => {
    const older = report({ id: "usr-dup", created_at: "2026-07-30T10:00:00.000Z", title: "Old" });
    const newer = report({ id: "usr-dup", created_at: "2026-07-31T10:00:00.000Z", title: "New" });

    expect(mergeDemandReports([], [older, newer]).map((demand) => demand.title)).toEqual(["New"]);
  });

  test("resolves equal-id equal-timestamp duplicates by retaining first valid stored occurrence", () => {
    const sameTime = "2026-07-31T10:00:00.000Z";
    const first = report({ id: "usr-dup", created_at: sameTime, title: "First stored" });
    const second = report({ id: "usr-dup", created_at: sameTime, title: "Second stored" });

    expect(mergeDemandReports([], [first, second]).map((demand) => demand.title)).toEqual([
      "First stored",
    ]);
  });

  test("keeps seed reports canonical during seed/user id collisions", () => {
    const seed = report({ id: "seed-canonical", title: "Seed title", upvotes: 10 });
    const collidingUser = report({ id: "seed-canonical", title: "User shadow", upvotes: 99 });

    expect(mergeDemandReports([seed], [collidingUser])).toEqual([seed]);
  });

  test("merges seed and user reports", () => {
    const seed = report({ id: "seed-1", created_at: "2026-07-30T10:00:00.000Z" });
    const user = report({ id: "usr-1", created_at: "2026-07-31T10:00:00.000Z" });

    expect(mergeDemandReports([seed], [user]).map((demand) => demand.id)).toEqual([
      "usr-1",
      "seed-1",
    ]);
  });

  test("sorts by created_at descending with stable id tie-break", () => {
    const sameTime = "2026-07-31T10:00:00.000Z";
    const reports = [
      report({ id: "b", created_at: sameTime }),
      report({ id: "a", created_at: sameTime }),
      report({ id: "c", created_at: "2026-07-30T10:00:00.000Z" }),
    ];

    expect(mergeDemandReports([], reports).map((demand) => demand.id)).toEqual(["a", "b", "c"]);
  });
});

describe("local demand repository upvote handling", () => {
  test("reads valid upvote state and rejects invalid entry values", () => {
    const raw = JSON.stringify({ "seed-1": true, "seed-2": false, "seed-3": 1, "": true });

    expect(parsePersistedUpvotes(raw)).toEqual({ "seed-1": true });
  });

  test("recovers from malformed upvote state", () => {
    expect(parsePersistedUpvotes("{bad-json")).toEqual({});
    expect(parsePersistedUpvotes(JSON.stringify(["seed-1"]))).toEqual({});
  });

  test("contains getItem exceptions while reading upvotes", () => {
    const storage = new MemoryStorage();
    storage.getThrows = true;

    expect(readPersistedUpvotes(storage)).toEqual({});
  });

  test("returns explicit upvote write success and failure results", () => {
    const storage = new MemoryStorage();

    expect(writePersistedUpvotes(storage, { "seed-1": true })).toEqual({ ok: true });
    expect(storage.values.get(UPVOTES_STORAGE_KEY)).toBe(JSON.stringify({ "seed-1": true }));

    storage.setThrows = true;
    expect(writePersistedUpvotes(storage, { "seed-1": true })).toEqual({
      ok: false,
      reason: "storage_error",
    });
  });

  test("applies current upvote semantics to seed reports only during merge", () => {
    const seed = report({ id: "seed-1", upvotes: 10 });
    const user = report({ id: "usr-1", upvotes: 1 });

    const merged = mergeDemandReports([seed], [user], { "seed-1": true, "usr-1": true });

    expect(merged.find((demand) => demand.id === "seed-1")?.upvotes).toBe(11);
    expect(merged.find((demand) => demand.id === "usr-1")?.upvotes).toBe(1);
  });

  test("applies persisted user-report upvote increments immutably", () => {
    const user = report({ id: "usr-1", upvotes: 1 });
    const unchanged = report({ id: "usr-2", upvotes: 5 });
    const input = [user, unchanged];

    const updated = applyUserReportUpvote(input, "usr-1", true);

    expect(updated.map((demand) => demand.upvotes)).toEqual([2, 5]);
    expect(input.map((demand) => demand.upvotes)).toEqual([1, 5]);
    expect(updated[0]).not.toBe(user);
    expect(updated[1]).not.toBe(unchanged);
  });

  test("toggles upvotes on user reports atomically across toggle on, reload, toggle off, reload", () => {
    const storage = new MemoryStorage();
    const user = report({ id: "usr-1", upvotes: 1 });
    writePersistedUserReports(storage, [user]);

    const onResult = togglePersistedUpvote(storage, "usr-1");
    expect(onResult).toEqual({ ok: true, upvoted: true });
    expect(readPersistedUpvotes(storage)).toEqual({ "usr-1": true });
    expect(readPersistedUserReports(storage)[0].upvotes).toBe(2);

    const mergedAfterOn = mergeDemandReports(
      [],
      readPersistedUserReports(storage),
      readPersistedUpvotes(storage),
    );
    expect(mergedAfterOn[0].upvotes).toBe(2);

    const offResult = togglePersistedUpvote(storage, "usr-1");
    expect(offResult).toEqual({ ok: true, upvoted: false });
    expect(readPersistedUpvotes(storage)).toEqual({});
    expect(readPersistedUserReports(storage)[0].upvotes).toBe(1);

    const mergedAfterOff = mergeDemandReports(
      [],
      readPersistedUserReports(storage),
      readPersistedUpvotes(storage),
    );
    expect(mergedAfterOff[0].upvotes).toBe(1);
  });

  test("rolls back upvote-state write when user-report persistence fails", () => {
    const storage = new SelectiveMemoryStorage();
    const user = report({ id: "usr-1", upvotes: 1 });
    storage.values.set(USER_REPORTS_STORAGE_KEY, JSON.stringify([user]));
    storage.failKeys.add(USER_REPORTS_STORAGE_KEY);

    const result = togglePersistedUpvote(storage, "usr-1");

    expect(result).toEqual({ ok: false, upvoted: false, reason: "storage_error" });
    expect(readPersistedUpvotes(storage)).toEqual({});
    expect(readPersistedUserReports(storage)[0].upvotes).toBe(1);
  });

  test("returns failure and leaves state unchanged when upvote-state storage write fails", () => {
    const storage = new SelectiveMemoryStorage();
    storage.failKeys.add(UPVOTES_STORAGE_KEY);

    const result = togglePersistedUpvote(storage, "usr-1");

    expect(result).toEqual({ ok: false, upvoted: false, reason: "storage_error" });
    expect(readPersistedUpvotes(storage)).toEqual({});
  });
});

describe("local demand repository immutability and unavailable storage", () => {
  test("does not mutate caller arrays or report objects while merging", () => {
    const seed = [report({ id: "seed-1", upvotes: 3 })];
    const user = [report({ id: "usr-1", upvotes: 1 })];
    const before = JSON.stringify({ seed, user });

    mergeDemandReports(seed, user, { "seed-1": true });

    expect(JSON.stringify({ seed, user })).toBe(before);
  });

  test("does not mutate SEED_DEMANDS", () => {
    const before = JSON.stringify(SEED_DEMANDS);

    mergeDemandReports(SEED_DEMANDS, [report({ id: "usr-1" })], { [SEED_DEMANDS[0].id]: true });

    expect(JSON.stringify(SEED_DEMANDS)).toBe(before);
  });

  test("handles unavailable browser storage safely", () => {
    expect(readPersistedUserReports(null)).toEqual([]);
    expect(readPersistedUpvotes(undefined)).toEqual({});
    expect(writePersistedUpvotes(null, {})).toEqual({
      ok: false,
      reason: "storage_unavailable",
    });
  });
});

describe("local demand repository session id handling", () => {
  test("returns ssr when storage is unavailable", () => {
    expect(getOrCreateSessionId(null, () => "session-new")).toEqual({
      id: "ssr",
      writeResult: { ok: false, reason: "storage_unavailable" },
    });
  });

  test("reuses an existing plain-string session id", () => {
    const storage = new MemoryStorage();
    storage.values.set(SESSION_STORAGE_KEY, "session-existing");

    expect(getOrCreateSessionId(storage, () => "session-new")).toEqual({
      id: "session-existing",
    });
  });

  test("creates and stores a plain-string session id when missing", () => {
    const storage = new MemoryStorage();

    expect(getOrCreateSessionId(storage, () => "session-new")).toEqual({
      id: "session-new",
      writeResult: { ok: true },
    });
    expect(storage.values.get(SESSION_STORAGE_KEY)).toBe("session-new");
  });

  test("contains session storage exceptions", () => {
    const storage = new MemoryStorage();
    storage.setThrows = true;

    expect(getOrCreateSessionId(storage, () => "session-new")).toEqual({
      id: "session-new",
      writeResult: { ok: false, reason: "storage_error" },
    });
  });
});
