# DemandRadar — AI Integration Plan

## Current state: demo classifier

`src/lib/ai/index.ts` exposes the only public AI entry point:

```ts
export async function classify(input: ClassifyInput): Promise<ClassifyOutput>;
```

Today it delegates to `mockClassify()` (deterministic, in-process, ~450 ms
simulated latency). All UI flows — Report, Dashboard, Map, Insights — go
through this one function.

## Schema

```ts
interface ClassifyInput {
  raw_text: string;
  // Location is passed in for context only (e.g. to bias category priors).
  // It MUST NOT round-trip out — see "Hard rule" below.
  location_text?: string;
  area_label?: string;
  latitude?: number;
  longitude?: number;
}

interface ClassifyOutput {
  clean_text: string;
  title: string;
  need_summary: string;
  category: DemandCategory; // 14 enums, see types.ts
  sub_category: string;
  affected_group: AffectedGroup;
  urgency: number; // 1–5
  signal_strength: number; // 0–100
  impact_priority: "low" | "medium" | "high" | "critical";
  privacy_status: "clean" | "redacted";
  confidence_score: number; // 0–100
  recommended_actor: RecommendedActor;
  suggested_action: string;
  similar_reports_count: number;
}
```

Note: `ClassifyOutput` deliberately omits `area_label`, `location_text`,
`latitude`, `longitude`. Location is owned by the caller (`resolveLocation()`
in `lib/geo/bengaluru.ts`) and merged after classification.

## Replacing the mock with a real provider

1. Add a server function (TanStack Start `createServerFn`) that proxies the
   request to your model endpoint. Read the API key from `process.env`
   inside `.handler()`. Never expose keys in the client bundle.
2. Validate the model response with Zod against `ClassifyOutput`.
3. **Strip any location-shaped keys** before returning (`area_label`,
   `location_text`, `latitude`, `longitude`, `lat`, `lng`, `coords`, ...).
4. Replace the body of `classify()` in `lib/ai/index.ts` with a call to that
   server function. Flip `AI_MODE` from `"mock"` to `"remote"`.

Suggested skeleton:

```ts
// src/lib/ai/remoteClassifier.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { ClassifyInputSchema, ClassifyOutputSchema } from "./schemas";

export const remoteClassify = createServerFn({ method: "POST" })
  .inputValidator((d) => ClassifyInputSchema.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.MODEL_API_KEY!;
    const res = await fetch(MODEL_URL, {
      /* ... prompt + data ... */
    });
    const raw = await res.json();
    const parsed = ClassifyOutputSchema.parse(raw);
    // Defensive strip of any location keys the model hallucinated.
    delete (parsed as any).area_label;
    delete (parsed as any).location_text;
    delete (parsed as any).latitude;
    delete (parsed as any).longitude;
    return parsed;
  });
```

## Gemma 4 hackathon notes

For a Gemma 4-powered demo:

- Host a small inference proxy (Cloud Run, Worker, or any HTTPS endpoint)
  in front of the Gemma 4 endpoint and put the auth there.
- Prompt template should request strict JSON conforming to `ClassifyOutput`.
- Include the 14-category enum and 5-actor enum in the system prompt to
  constrain outputs.
- Keep the simulated 450 ms latency floor in `classify()` so the UI feels
  consistent across mock/remote modes.
- Leave `AI_MODE` in the badge so reviewers can see when remote inference
  is active.

## Hard rule

> The model output must NEVER override user-selected location fields:
> `area_label`, `location_text`, `latitude`, `longitude`.
>
> Location is resolved by `resolveLocation()` and merged AFTER the AI output
> in `report.tsx → submit()`. If a future model returns these keys, strip
> them in the adapter before returning. This is enforced by code review and
> by the spread order in `submit()` (location fields written last).
