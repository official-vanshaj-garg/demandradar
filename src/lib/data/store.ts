// Local-first demand store. React-facing wrapper over the browser-local repository boundary.

import { useEffect, useState } from "react";
import type { DemandReport } from "@/domain/demand";
import { SEED_DEMANDS } from "./seed";
import {
  getBrowserLocalStorage,
  getOrCreateSessionId,
  mergeDemandReports,
  readPersistedUpvotes,
  readPersistedUserReports,
  togglePersistedUpvote,
  writePersistedUserReports,
  type StorageWriteResult,
} from "./localDemandRepository";

export function getSessionId(): string {
  return getOrCreateSessionId(getBrowserLocalStorage()).id;
}

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function addDemand(report: DemandReport): StorageWriteResult {
  const storage = getBrowserLocalStorage();
  const next = [report, ...readPersistedUserReports(storage)];
  const result = writePersistedUserReports(storage, next);
  if (result.ok) {
    emit();
  }
  return result;
}

export function toggleUpvote(id: string): boolean {
  const storage = getBrowserLocalStorage();
  const result = togglePersistedUpvote(storage, id);
  if (result.ok) {
    emit();
  }
  return result.upvoted;
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

  const storage = hydrated ? getBrowserLocalStorage() : null;
  const user = hydrated ? readPersistedUserReports(storage) : [];
  const upvotes = hydrated ? readPersistedUpvotes(storage) : {};
  const all = mergeDemandReports(SEED_DEMANDS, user, upvotes);
  return { all, upvotes, ready: hydrated };
}
