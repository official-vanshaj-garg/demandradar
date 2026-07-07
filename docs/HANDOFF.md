# DemandRadar — Engineering Handoff

## 1. Product overview

DemandRadar is a hyperlocal demand intelligence platform. Residents report
missing local services (study spaces, pharmacies, transport, daycare, ...),
and the system structures each report into a typed **Demand Card** that is
ranked, geo-tagged, and routed to the right actor (local business, civic
body, NGO, transport authority, community group).

Pilot: Bengaluru (10 zones, 14 categories). The current build is a
front-end-only MVP with deterministic in-process AI for fast, reproducible
demos. The codebase is architected so a real model provider (e.g. Gemma 4
for hackathon builds, or any hosted LLM in production) drops in behind a
single adapter without touching UI or storage.

## 2. App structure

```text
src/
  routes/                  TanStack Start file-based routes
    __root.tsx             Shell + providers
    index.tsx              Landing
    report.tsx             4-step report wizard
    dashboard.tsx          Intelligence dashboard (KPIs, matrix, leaderboards)
    map.tsx                Demand radar map
    insights.tsx           Clustered opportunities
    about.tsx              Vision + roadmap
  components/
    layout/                Header, footer, AI badge, ambient grid
    radar/                 RadarHero (SVG)
    map/                   DemandRadarMap (SVG, SSR-safe)
    feed/                  LiveSignalFeed
    demand/                DemandCard, drawer, indicators
    ui/                    shadcn primitives
  lib/
    ai/                    Model adapter (single swap point)
      index.ts             classify() — public entry
      mockClassifier.ts    Demo deterministic classifier
      types.ts             ClassifyInput / ClassifyOutput / DemandReport
    geo/
      bengaluru.ts         Zones, centroids, projection, resolveLocation()
    data/
      seed.ts              40 seed Demand Cards across pilot zones
      store.ts             localStorage-backed store + useDemands hook
  styles.css               Design tokens (oklch), radar animations
docs/                      This handoff + integration plan + test checklist
```

## 3. Main routes / pages

| Route        | Purpose                                                      |
| ------------ | ------------------------------------------------------------ |
| `/`          | Landing — radar hero, problem, live feed, before/after, CTAs |
| `/report`    | 4-step wizard: Describe → Locate → Preview → Submit          |
| `/dashboard` | KPIs, area×category matrix, leaderboards, live feed          |
| `/map`       | Custom SVG radar map of all signals                          |
| `/insights`  | Auto-clusters and opportunity scorecards                     |
| `/about`     | Product thesis, privacy, model-ready architecture            |

## 4. Data flow

1. **Seed** (`lib/data/seed.ts`) — 40 pre-generated Demand Reports across 10
   Bengaluru zones, loaded once and merged with user submissions.
2. **Store** (`lib/data/store.ts`) — `localStorage`-backed list. User reports
   are prepended; `useDemands()` is the React hook every page uses.
3. **AI adapter** (`lib/ai/index.ts → classify()`) — turns raw text into a
   structured Demand Card (category, urgency, signal strength, recommended
   actor, ...). Today: deterministic mock. Tomorrow: real model.
4. **Reads** — Dashboard, Map, Insights all read stored fields directly from
   `useDemands()` and never recompute area/coordinates from raw text.

## 5. Report submission flow

```text
Step 1  Describe
Step 2  Pick zone (BLR_ZONES)            ── zoneKey, locText
Step 3  classify(input) → ClassifyOutput  ── card preview
Step 4  submit():
          loc = resolveLocation({ zone, locText, jittered lat/lng })
          report = { ...card, ...loc, id, status, upvotes, ... }
          addDemand(report)               ── store + emit
```

Key invariant: `card` (AI output) is spread FIRST, then location fields are
written LAST, so AI can never overwrite location.

## 6. Location resolution flow

`resolveLocation()` in `lib/geo/bengaluru.ts` is the single source of truth.

```text
zone known?            → use zone.label, zone.lat/lng (or user coords)
coords given, no zone  → keep coords, label "Unknown Bengaluru Area"
nothing                → BLR_CENTER, label "Unknown Bengaluru Area"
```

The fallback is **never** a real zone like Koramangala — that was the bug
we fixed. Coordinates are rounded to ~110 m for privacy. User submissions
get ±~1 km deterministic jitter so pins don't stack on the centroid.

## 7. Mock AI / classifier flow

`mockClassifier.ts` does keyword scoring → category, sub-category, affected
group, recommended actor. Urgency is rule-based on text + category; signal
strength and confidence are deterministic hashes so the same input always
yields the same card.

The mock **never returns** `area_label`, `location_text`, `latitude`, or
`longitude` — `ClassifyOutput` doesn't include those keys.

## 8. Where future model integration goes

Single file: `src/lib/ai/index.ts`. Replace the `mockClassify(input)` call
with an HTTP call to your model provider, parse the response into
`ClassifyOutput`, and **strip any location keys** the model emits.

See `docs/AI_INTEGRATION_PLAN.md` for the full contract.

## 9. Known limitations

- No backend. All data is local (`localStorage` + seed).
- No auth. Reports are anonymous via an opaque session id.
- No real geocoding. Location is restricted to 10 hard-coded pilot zones.
- No real map tiles. Map is a custom SVG radar — by design for the demo.
- AI is deterministic mock; no embeddings, no real clustering.
- No payments, admin panel, business onboarding, newsletters.

## 10. Next engineering tasks (Antigravity)

1. Wire a real model provider into `lib/ai/index.ts` (see integration plan).
2. Move the data layer from `localStorage` to Lovable Cloud (Postgres + RLS).
3. Add a server route for ingestion so reports survive across devices.
4. Add real clustering (server-side) for the Insights page.
5. Add a tiles-based map (only when leaving demo mode).
6. Add admin moderation queue (separate from public UI).
