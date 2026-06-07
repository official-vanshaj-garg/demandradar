// DemandRadar — AI Signal Engine entry point.
// All AI-derived fields flow through this single function.
//
// This is the single swap point ("model adapter") for any future provider.
// TODO: Replace mock classifier with a real model provider (e.g. Gemma 4 for
//       hackathon/demo builds, or any hosted LLM in production). Keep the
//       ClassifyInput/ClassifyOutput contract intact so UI + DB don't change.

import { mockClassify } from "./mockClassifier";
import type { ClassifyInput, ClassifyOutput } from "./types";

export type { ClassifyInput, ClassifyOutput } from "./types";

export const AI_MODE: "mock" | "remote" = "mock";

export async function classify(input: ClassifyInput): Promise<ClassifyOutput> {
  // Simulate a tiny inference latency to make the UI feel real.
  await new Promise((r) => setTimeout(r, 450));
  // NOTE: ClassifyOutput intentionally does NOT include location fields
  // (area_label / location_text / latitude / longitude). Location is owned
  // by the caller (the report form, via resolveLocation()) and merged AFTER
  // classification, so the AI layer can never accidentally relocate a user's
  // report (e.g. snap it to Koramangala). When swapping in a real provider,
  // strip any location-shaped keys from its output before returning here.
  return mockClassify(input);
}
