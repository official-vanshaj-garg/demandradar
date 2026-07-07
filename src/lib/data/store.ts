// Local-first demand store. Persists user-submitted reports to localStorage and merges with seed.
// (When a production database is wired up later, swap the read/write impls here behind the same hooks.)

import { useEffect, useState, useCallback } from "react";
import type { DemandReport } from "@/domain/demand";
import { SEED_DEMANDS } from "./seed";

const STORAGE_KEY = "demandradar.user_reports.v1";
const SESSION_KEY = "demandradar.session";
const UPVOTES_KEY = "demandradar.upvotes.v1";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSessionId(): string {
  if (!isBrowser()) return "ssr";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function readUser(): DemandReport[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeUser(rows: DemandReport[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

function readUpvotes(): Record<string, true> {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(localStorage.getItem(UPVOTES_KEY) || "{}");
  } catch {
    return {};
  }
}
function writeUpvotes(v: Record<string, true>) {
  if (!isBrowser()) return;
  localStorage.setItem(UPVOTES_KEY, JSON.stringify(v));
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function addDemand(report: DemandReport) {
  const next = [report, ...readUser()];
  writeUser(next);
  emit();
}

export function toggleUpvote(id: string): boolean {
  const cur = readUpvotes();
  let upvoted: boolean;
  if (cur[id]) {
    delete cur[id];
    upvoted = false;
  } else {
    cur[id] = true;
    upvoted = true;
  }
  writeUpvotes(cur);
  // bump persisted user-row upvote count if applicable
  const user = readUser();
  const idx = user.findIndex((r) => r.id === id);
  if (idx >= 0) {
    user[idx] = { ...user[idx], upvotes: Math.max(0, user[idx].upvotes + (upvoted ? 1 : -1)) };
    writeUser(user);
  }
  emit();
  return upvoted;
}

/**
 * Hook that returns the merged list of seed + user demand reports.
 * SSR-safe: returns just SEED on first render, hydrates user rows on client.
 */
export function useDemands(): {
  all: DemandReport[];
  upvotes: Record<string, true>;
  ready: boolean;
} {
  const [, setTick] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const fn = () => setTick((t) => t + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  const user = hydrated ? readUser() : [];
  const upvotes = hydrated ? readUpvotes() : {};
  // Apply session upvote deltas to seed rows so UI reflects live count
  const seed = SEED_DEMANDS.map((r) => (upvotes[r.id] ? { ...r, upvotes: r.upvotes + 1 } : r));
  const all = [...user, ...seed].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return { all, upvotes, ready: hydrated };
}
