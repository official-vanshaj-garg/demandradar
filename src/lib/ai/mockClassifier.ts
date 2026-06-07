// DemandRadar — Demo classifier (deterministic, in-process).
// TODO: Replace with a real model provider for demo
// builds, or a hosted LLM in production. Keep `mockClassify`'s ClassifyInput/
// ClassifyOutput signature so a real provider can be dropped in behind
// `lib/ai/index.ts → classify()` with no UI/DB changes.

import type {
  AffectedGroup,
  ClassifyInput,
  ClassifyOutput,
  DemandCategory,
  ImpactPriority,
  RecommendedActor,
} from "./types";

const KEYWORDS: Array<{ cat: DemandCategory; sub: string; words: string[] }> = [
  { cat: "study_space", sub: "24h study library", words: ["study", "library", "quiet", "exam", "wifi", "coworking"] },
  { cat: "food", sub: "Affordable meals < ₹100", words: ["food", "meal", "thali", "tiffin", "mess", "canteen", "lunch", "dinner", "breakfast"] },
  { cat: "fitness", sub: "Affordable gym", words: ["gym", "fitness", "workout", "yoga", "zumba", "trainer"] },
  { cat: "pharmacy", sub: "24x7 pharmacy", words: ["pharmacy", "medicine", "chemist", "medical", "prescription", "tablet"] },
  { cat: "pg_hostel", sub: "PG / hostel listing", words: ["pg", "hostel", "room", "rent", "accommodation", "stay"] },
  { cat: "printing", sub: "Cheap photocopy / printing", words: ["print", "xerox", "photocopy", "scan", "binding"] },
  { cat: "transport", sub: "Last-mile transport", words: ["bus", "auto", "metro", "transport", "shuttle", "commute", "ride"] },
  { cat: "laundry", sub: "Affordable laundry", words: ["laundry", "wash", "ironing", "dryclean"] },
  { cat: "mental_health", sub: "Counselling access", words: ["stress", "anxiety", "therapy", "counsell", "mental", "depress"] },
  { cat: "grocery", sub: "Local kirana / grocery", words: ["grocery", "vegetable", "kirana", "supermarket", "fruits"] },
  { cat: "womens_safety", sub: "Safe streets / lighting", words: ["safety", "unsafe", "harass", "lighting", "dark street", "women"] },
  { cat: "daycare", sub: "Childcare / creche", words: ["daycare", "creche", "child", "kid", "toddler"] },
  { cat: "atm", sub: "Working ATM", words: ["atm", "cash", "bank"] },
];

const REDACT_RE = /(\+?\d[\d\s-]{7,}\d|\b[\w.+-]+@[\w-]+\.[\w.-]+\b|\b\d{12}\b)/g;

function redact(text: string): { text: string; changed: boolean } {
  let changed = false;
  const out = text.replace(REDACT_RE, () => { changed = true; return "[redacted]"; });
  return { text: out, changed };
}

function pickCategory(text: string): { cat: DemandCategory; sub: string; score: number } {
  const t = text.toLowerCase();
  let best = { cat: "other" as DemandCategory, sub: "Emerging local need", score: 0 };
  for (const k of KEYWORDS) {
    const hits = k.words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (hits > best.score) best = { cat: k.cat, sub: k.sub, score: hits };
  }
  return best;
}

function pickAffectedGroup(text: string, cat: DemandCategory): AffectedGroup {
  const t = text.toLowerCase();
  if (/student|college|exam|hostel|pg/.test(t)) return "students";
  if (/women|girl|safety|harass/.test(t)) return "working_women";
  if (/senior|elder|old age/.test(t)) return "seniors";
  if (/child|kid|family|parent/.test(t)) return "families";
  if (/commute|office|work|tech|it park|whitefield|electronic city/.test(t)) return "commuters";
  if (cat === "study_space" || cat === "pg_hostel" || cat === "printing") return "students";
  if (cat === "transport") return "commuters";
  return "general";
}

function pickActor(cat: DemandCategory): RecommendedActor {
  switch (cat) {
    case "transport": return "transport_authority";
    case "womens_safety": return "government";
    case "mental_health": return "ngo";
    case "daycare": return "ngo";
    case "study_space":
    case "food":
    case "fitness":
    case "pharmacy":
    case "pg_hostel":
    case "printing":
    case "laundry":
    case "grocery":
    case "atm":
      return "local_business";
    default: return "community";
  }
}

function urgencyFromText(text: string, cat: DemandCategory): number {
  const t = text.toLowerCase();
  let u = 2;
  if (/urgent|asap|immediately|critical|emergency|dangerous|unsafe/.test(t)) u += 2;
  if (/no\s+\w+\s+nearby|nothing nearby|no\s+\w+\s+available/.test(t)) u += 1;
  if (cat === "womens_safety" || cat === "pharmacy" || cat === "mental_health") u += 1;
  return Math.max(1, Math.min(5, u));
}

function priorityFromUrgency(u: number, cat: DemandCategory): ImpactPriority {
  if (cat === "womens_safety" && u >= 3) return "critical";
  if (u >= 5) return "critical";
  if (u >= 4) return "high";
  if (u >= 3) return "medium";
  return "low";
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

function makeTitle(cat: DemandCategory, sub: string, area?: string): string {
  const base = titleCase(sub);
  return area ? `${base} needed in ${area}` : `${base} needed nearby`;
}

function makeSummary(cat: DemandCategory, sub: string, area?: string): string {
  const where = area ? ` in ${area}` : "";
  return `Residents are flagging unmet demand for ${sub.toLowerCase()}${where}. Multiple signals indicate a gap worth investigating.`;
}

function makeAction(cat: DemandCategory, actor: RecommendedActor, area?: string): string {
  const where = area ? ` near ${area}` : "";
  if (cat === "study_space") return `Open a 24-hour quiet study space${where}.`;
  if (cat === "food") return `Set up an affordable thali / tiffin service${where}.`;
  if (cat === "fitness") return `Launch a budget gym or fitness micro-studio${where}.`;
  if (cat === "pharmacy") return `Add a 24x7 pharmacy${where} or stock essentials at existing kirana.`;
  if (cat === "pg_hostel") return `List verified PG / hostel inventory${where}.`;
  if (cat === "printing") return `Add a printing / photocopy point${where}.`;
  if (cat === "transport") return `Add a feeder shuttle${where} during peak hours.`;
  if (cat === "laundry") return `Open a laundry pick-up / drop point${where}.`;
  if (cat === "mental_health") return `Run weekly low-cost counselling sessions${where}.`;
  if (cat === "grocery") return `Map and onboard local kirana to delivery${where}.`;
  if (cat === "womens_safety") return `Improve street lighting and patrol routes${where}.`;
  if (cat === "daycare") return `Open a verified daycare / creche${where}.`;
  if (cat === "atm") return `Service or install a working ATM${where}.`;
  return `Investigate the demand pattern${where} and route to the right ${actor.replace("_"," ") }.`;
}

// Deterministic small hash → 0..1 (so signal_strength/confidence vary but are stable)
function h(s: string): number {
  let n = 0;
  for (let i = 0; i < s.length; i++) n = (n * 31 + s.charCodeAt(i)) >>> 0;
  return (n % 1000) / 1000;
}

export function mockClassify(input: ClassifyInput): ClassifyOutput {
  const raw = input.raw_text || "";
  const { text: clean, changed } = redact(raw.trim().replace(/\s+/g, " "));
  const { cat, sub, score } = pickCategory(clean);
  const affected = pickAffectedGroup(clean, cat);
  const actor = pickActor(cat);
  const urgency = urgencyFromText(clean, cat);
  const priority = priorityFromUrgency(urgency, cat);

  const lengthBoost = Math.min(20, Math.floor(clean.length / 20));
  const keywordBoost = Math.min(25, score * 8);
  const noiseSeed = h(clean + (input.area_label || ""));
  const signal = Math.max(35, Math.min(95, 50 + lengthBoost + keywordBoost + Math.floor(noiseSeed * 15)));
  const confidence = Math.max(55, Math.min(96, 70 + keywordBoost + Math.floor(noiseSeed * 10) - (cat === "other" ? 15 : 0)));
  const similar = Math.max(1, Math.min(28, Math.floor(2 + noiseSeed * 18 + (signal - 50) / 6)));

  const area = input.area_label;
  return {
    clean_text: clean,
    title: makeTitle(cat, sub, area),
    need_summary: makeSummary(cat, sub, area),
    category: cat,
    sub_category: sub,
    affected_group: affected,
    urgency,
    signal_strength: signal,
    impact_priority: priority,
    privacy_status: changed ? "redacted" : "clean",
    confidence_score: confidence,
    recommended_actor: actor,
    suggested_action: makeAction(cat, actor, area),
    similar_reports_count: similar,
  };
}
