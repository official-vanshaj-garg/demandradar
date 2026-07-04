import { BLR_CENTER, roundCoord, zoneByKey, zoneByLabel } from "@/lib/geo/bengaluru";
import type { ResolvedLocation } from "@/domain/demand/types";

export const UNKNOWN_AREA_LABEL = "Unknown Bengaluru Area";

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
      city: "Bengaluru",
      country: "India",
      source: "internal_bengaluru_zone",
      provider: "internal",
      precision: "area_level",
      user_confirmed: true,
      captured_at: new Date().toISOString(),
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
    city: "Bengaluru",
    country: "India",
    source: input.location_text ? "typed_address" : "unknown",
    provider: "internal",
    precision: input.location_text ? "area_level" : "unknown",
    user_confirmed: true,
    captured_at: new Date().toISOString(),
  };
}
