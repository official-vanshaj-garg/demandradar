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
  {
    key: "yelahanka",
    label: "Yelahanka",
    lat: 13.1,
    lng: 77.594,
    x: 50,
    y: 14,
    tags: ["students", "affordable"],
  },
  { key: "hebbal", label: "Hebbal", lat: 13.036, lng: 77.597, x: 53, y: 27, tags: ["commuters"] },
  {
    key: "rajajinagar",
    label: "Rajajinagar",
    lat: 12.991,
    lng: 77.555,
    x: 36,
    y: 42,
    tags: ["families"],
  },
  {
    key: "indiranagar",
    label: "Indiranagar",
    lat: 12.971,
    lng: 77.641,
    x: 70,
    y: 46,
    tags: ["working_women", "tech_workers"],
  },
  {
    key: "koramangala",
    label: "Koramangala",
    lat: 12.935,
    lng: 77.614,
    x: 60,
    y: 58,
    tags: ["students", "tech_workers"],
  },
  {
    key: "jayanagar",
    label: "Jayanagar",
    lat: 12.928,
    lng: 77.583,
    x: 46,
    y: 60,
    tags: ["families", "seniors"],
  },
  {
    key: "btm_layout",
    label: "BTM Layout",
    lat: 12.916,
    lng: 77.61,
    x: 58,
    y: 65,
    tags: ["students"],
  },
  {
    key: "banashankari",
    label: "Banashankari",
    lat: 12.918,
    lng: 77.556,
    x: 38,
    y: 67,
    tags: ["families"],
  },
  {
    key: "whitefield",
    label: "Whitefield",
    lat: 12.969,
    lng: 77.749,
    x: 88,
    y: 50,
    tags: ["tech_workers", "commuters"],
  },
  {
    key: "electronic_city",
    label: "Electronic City",
    lat: 12.844,
    lng: 77.671,
    x: 72,
    y: 86,
    tags: ["tech_workers", "commuters"],
  },
];

export function zoneByKey(key: string): BlrZone | undefined {
  return BLR_ZONES.find((z) => z.key === key);
}

export function zoneByLabel(label: string): BlrZone | undefined {
  return BLR_ZONES.find((z) => z.label.toLowerCase() === label.toLowerCase());
}

// Map a real lat/lng to our radar canvas (0–100 each).
// Uses a simple linear projection over the Bengaluru bounding box.
const BBOX = { minLat: 12.8, maxLat: 13.13, minLng: 77.5, maxLng: 77.8 };

export function projectToCanvas(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100;
  const y = (1 - (lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

// Round lat/lng to ~110m for privacy.
export function roundCoord(n: number) {
  return Math.round(n * 1000) / 1000;
}

// ----------------------------------------------------------------------------
// Bengaluru pilot geo helpers.
//
// BLR_ZONES and projectToCanvas remain here because they power the current
// custom SVG radar/map UI. Runtime location resolution now lives in
// src/lib/location.
// ----------------------------------------------------------------------------
