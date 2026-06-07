// Bengaluru pilot zones. Lat/lng are real area centroids (rounded to 3 decimals).
// `x`/`y` are positions (0–100) on our SVG radar map (custom dark canvas).

export interface BlrZone {
  key: string;
  label: string;
  lat: number;
  lng: number;
  x: number; // svg %
  y: number; // svg %
  tags: string[];
}

export const BLR_CENTER = { lat: 12.972, lng: 77.594 };

export const BLR_ZONES: BlrZone[] = [
  { key: "yelahanka",       label: "Yelahanka",       lat: 13.100, lng: 77.594, x: 50, y: 14, tags: ["students", "affordable"] },
  { key: "hebbal",          label: "Hebbal",          lat: 13.036, lng: 77.597, x: 53, y: 27, tags: ["commuters"] },
  { key: "rajajinagar",     label: "Rajajinagar",     lat: 12.991, lng: 77.555, x: 36, y: 42, tags: ["families"] },
  { key: "indiranagar",     label: "Indiranagar",     lat: 12.971, lng: 77.641, x: 70, y: 46, tags: ["working_women", "tech_workers"] },
  { key: "koramangala",     label: "Koramangala",     lat: 12.935, lng: 77.614, x: 60, y: 58, tags: ["students", "tech_workers"] },
  { key: "jayanagar",       label: "Jayanagar",       lat: 12.928, lng: 77.583, x: 46, y: 60, tags: ["families", "seniors"] },
  { key: "btm_layout",      label: "BTM Layout",      lat: 12.916, lng: 77.610, x: 58, y: 65, tags: ["students"] },
  { key: "banashankari",    label: "Banashankari",    lat: 12.918, lng: 77.556, x: 38, y: 67, tags: ["families"] },
  { key: "whitefield",      label: "Whitefield",      lat: 12.969, lng: 77.749, x: 88, y: 50, tags: ["tech_workers", "commuters"] },
  { key: "electronic_city", label: "Electronic City", lat: 12.844, lng: 77.671, x: 72, y: 86, tags: ["tech_workers", "commuters"] },
];

export function zoneByKey(key: string): BlrZone | undefined {
  return BLR_ZONES.find((z) => z.key === key);
}

export function zoneByLabel(label: string): BlrZone | undefined {
  return BLR_ZONES.find((z) => z.label.toLowerCase() === label.toLowerCase());
}

// Map a real lat/lng to our radar canvas (0–100 each).
// Uses a simple linear projection over the Bengaluru bounding box.
const BBOX = { minLat: 12.80, maxLat: 13.13, minLng: 77.50, maxLng: 77.80 };

export function projectToCanvas(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100;
  const y = (1 - (lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

// Round lat/lng to ~110m for privacy.
export function roundCoord(n: number) { return Math.round(n * 1000) / 1000; }

// ----------------------------------------------------------------------------
// Location source-of-truth resolver.
//
// DemandRadar rule: the user-selected/entered area is authoritative. The AI
// classifier (mock today, Gemma 4 later) MUST NEVER override location fields.
// This helper normalizes whatever the report form gives us into a consistent
// { area_label, location_text, latitude, longitude } tuple used everywhere
// downstream (Dashboard, Map, Insights all read these stored fields directly).
//
// Resolution order:
//   1. If we know the zone (by key or label) → use its centroid as the
//      coordinate fallback, but keep any user-supplied lat/lng.
//   2. If the user gave coordinates but no recognizable area → keep coords,
//      label as "Unknown Bengaluru Area".
//   3. If nothing is known → fall back to BLR_CENTER + "Unknown Bengaluru Area".
//      We deliberately do NOT default to Koramangala or any real zone.
// ----------------------------------------------------------------------------
export const UNKNOWN_AREA_LABEL = "Unknown Bengaluru Area";

export interface ResolvedLocation {
  area_label: string;
  location_text: string;
  latitude: number;
  longitude: number;
}

export function resolveLocation(input: {
  zone_key?: string | null;
  area_label?: string | null;
  location_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): ResolvedLocation {
  const zone =
    (input.zone_key ? zoneByKey(input.zone_key) : undefined) ??
    (input.area_label ? zoneByLabel(input.area_label) : undefined);

  if (zone) {
    const lat = typeof input.latitude === "number" ? input.latitude : zone.lat;
    const lng = typeof input.longitude === "number" ? input.longitude : zone.lng;
    return {
      area_label: zone.label,
      location_text: input.location_text?.trim() || zone.label,
      latitude: roundCoord(lat),
      longitude: roundCoord(lng),
    };
  }

  // Unknown area — never silently snap to a real zone like Koramangala.
  const lat = typeof input.latitude === "number" ? input.latitude : BLR_CENTER.lat;
  const lng = typeof input.longitude === "number" ? input.longitude : BLR_CENTER.lng;
  return {
    area_label: UNKNOWN_AREA_LABEL,
    location_text: input.location_text?.trim() || UNKNOWN_AREA_LABEL,
    latitude: roundCoord(lat),
    longitude: roundCoord(lng),
  };
}
