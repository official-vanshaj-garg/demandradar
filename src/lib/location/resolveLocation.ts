import { internalBengaluruProvider, UNKNOWN_AREA_LABEL } from "./providers";
import type { LocationResolveInput } from "./types";
import type { ResolvedLocation } from "@/domain/demand";

export { UNKNOWN_AREA_LABEL };

export function resolveLocation(input: LocationResolveInput): ResolvedLocation {
  return internalBengaluruProvider.resolve(input);
}
