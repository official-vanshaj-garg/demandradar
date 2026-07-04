# Layer 2B: Location Resolver

## Objective
Establish a clean, provider-neutral location resolver boundary.
- **src/lib/location**: The app runtime infrastructure responsible for adapting user location input into the Layer 2A `ResolvedLocation` domain shape.
- **src/lib/geo/bengaluru.ts**: Retained purely as the data source for the custom SVG UI mock (`BLR_ZONES`, `projectToCanvas`), decoupling domain logic from the pilot UI.

## Architecture
`resolveLocation` intercepts all incoming coordinates and text, normalizing it to `ResolvedLocation` before it enters the submission flow or AI engine. This guarantees:
1. **App Ownership:** Coordinates are strictly sourced from verified user input/fallback, never hallucinated by AI.
2. **Provider Agnostic:** `provider: "internal"` allows future integration of Mappls or Google Maps transparently.
