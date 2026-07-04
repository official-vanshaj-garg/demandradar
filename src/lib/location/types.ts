import type { LocationProvider, ResolvedLocation } from "@/domain/demand";

export interface LocationResolveInput {
  zone_key?: string | null;
  area_label?: string | null;
  location_text?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationProviderAdapter {
  provider: LocationProvider;
  resolve(input: LocationResolveInput): ResolvedLocation;
}
