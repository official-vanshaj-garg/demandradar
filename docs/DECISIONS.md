# DemandRadar Engineering Decisions

## Decision 001 — Startup-first product

DemandRadar is a startup-first product. Hackathon submissions are secondary packaging paths.

## Decision 002 — Product positioning

DemandRadar is not a complaint app.

Positioning:
Google Maps shows what exists. DemandRadar reveals what is missing.

## Decision 003 — Build one layer at a time

We will complete one layer properly before starting the next.

Current plan:

- Layer 0: Product lock
- Layer 1: UI shell audit and cleanup
- Layer 2: DemandRadar domain model
- Layer 3: Local end-to-end core loop
- Layer 4: Supabase/database persistence
- Layer 5: AI Signal Engine
- Layer 6: Clustering + opportunity score
- Layer 7: Dashboard insights
- Layer 8: Deployment + hackathon packaging

## Decision 004 — Lovable UI shell is a starting point only

The paid Lovable-generated UI shell gives us a strong visual foundation, but we will clean and harden the codebase ourselves.

## Decision 005 — No backend, database, or AI in Layer 1

Layer 1 is only for frontend shell cleanup and repo hygiene.

## Decision 006 — Location is app-owned

Location fields must be controlled by app-owned location logic such as resolveLocation().

AI/classify() must never return or overwrite:

- area_label
- location_text
- latitude
- longitude

## Decision 007 — Keep Bun as package manager

We will keep Bun as the package manager for now.

Reason:

- The Lovable-generated project already included bun.lock.
- Installing Bun is a smaller change than migrating to npm.
- The local dev server works with bun run dev.
- Avoiding package-manager migration keeps Layer 1 focused and reduces unnecessary risk before de-Lovable extraction.

## Decision 008 — Map provider config stays app-owned

The active map renderer remains the SVG renderer.

The provider config exists only to protect a future Mappls integration from leaking into routes, domain logic, or the SVG renderer.
Missing, empty, invalid, or unsupported provider config falls back to SVG.

**Note on Mappls SDK Prototype:**

- Mappls renderer is placed securely behind the provider config boundary.
- SVG remains the strict fallback.
- The frontend will only load a domain-restricted browser-safe Mappls public key/token.
- Mappls `client_secret` must never be placed in frontend environment files.
- Backend token generation is deferred until a backend exists.
