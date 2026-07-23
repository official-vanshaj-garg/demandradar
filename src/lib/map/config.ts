export type MapProviderType = "svg" | "mappls";

export const DEFAULT_MAP_PROVIDER: MapProviderType = "svg";

export function isSupportedMapProvider(value: unknown): value is MapProviderType {
  return value === "svg" || value === "mappls";
}

export function getConfiguredMapProvider(): MapProviderType {
  const configuredProvider = import.meta.env.VITE_DEMANDRADAR_MAP_PROVIDER;

  if (typeof configuredProvider !== "string") {
    return DEFAULT_MAP_PROVIDER;
  }

  const normalizedProvider = configuredProvider.trim().toLowerCase();

  if (isSupportedMapProvider(normalizedProvider)) {
    return normalizedProvider;
  }

  return DEFAULT_MAP_PROVIDER;
}

export function getMapplsStaticKey(): string | undefined {
  const key = import.meta.env.VITE_MAPPLS_STATIC_KEY;
  if (typeof key !== "string") return undefined;
  const trimmed = key.trim();
  return trimmed === "" ? undefined : trimmed;
}
