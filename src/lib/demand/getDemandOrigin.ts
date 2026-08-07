export type DemandOrigin = "sample" | "browser-local";

export interface DemandOriginPresentation {
  origin: DemandOrigin;
  label: string;
}

export interface DemandOriginSummary {
  label: string;
}

export function getDemandOrigin(id: string): DemandOrigin {
  return id.startsWith("seed-") ? "sample" : "browser-local";
}

export function getDemandOriginPresentation(id: string): DemandOriginPresentation {
  const origin = getDemandOrigin(id);
  return {
    origin,
    label: origin === "sample" ? "Sample data" : "Saved in this browser",
  };
}

export function getDemandOriginSummary(ids: string[]): DemandOriginSummary {
  if (ids.length === 0) {
    return { label: "No demand records" };
  }

  const origins = new Set(ids.map(getDemandOrigin));

  if (origins.size === 1) {
    return getDemandOriginPresentation(ids[0]);
  }

  return { label: "Mixed demo data" };
}
