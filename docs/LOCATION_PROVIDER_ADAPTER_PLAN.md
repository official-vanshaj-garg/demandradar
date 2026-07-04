# Layer 2C: Location Provider Adapter Foundation

## Strategy
Refactor `src/lib/location` to use an adapter pattern to prepare for Mappls/Google Maps integration.
- **`LocationProviderAdapter`**: Standard interface that all providers must conform to.
- **`internalBengaluruProvider`**: Implements the legacy pilot logic as the default internal adapter.
- **`resolveLocation`**: A thin delegator that passes input to the active adapter.

This ensures that the runtime architecture is ready to swap in a network provider (Mappls) asynchronously in Layer 3 without redesigning the core boundary.
