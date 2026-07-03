// DemandRadar AI types — shared between the demo classifier and any future
// model provider plugged into `lib/ai/index.ts → classify()`.

export type DemandCategory =
  | "study_space"
  | "food"
  | "fitness"
  | "pharmacy"
  | "pg_hostel"
  | "printing"
  | "transport"
  | "laundry"
  | "mental_health"
  | "grocery"
  | "womens_safety"
  | "daycare"
  | "atm"
  | "other";

export type AffectedGroup =
  | "students"
  | "working_women"
  | "seniors"
  | "families"
  | "commuters"
  | "tech_workers"
  | "general";

export type RecommendedActor =
  | "local_business"
  | "government"
  | "ngo"
  | "community"
  | "transport_authority";

export type ImpactPriority = "low" | "medium" | "high" | "critical";
export type PrivacyStatus = "clean" | "redacted";
export type DemandStatus = "new" | "reviewing" | "acknowledged";

export interface ClassifyInput {
  raw_text: string;
  location_context?: {
    area_label?: string;
    city?: string;
    micro_area?: string;
  };
}

export interface ClassifyOutput {
  clean_text: string;
  title: string;
  need_summary: string;
  category: DemandCategory;
  sub_category: string;
  affected_group: AffectedGroup;
  urgency: number;            // 1-5
  signal_strength: number;    // 0-100
  impact_priority: ImpactPriority;
  privacy_status: PrivacyStatus;
  confidence_score: number;   // 0-100
  recommended_actor: RecommendedActor;
  suggested_action: string;
  similar_reports_count: number;
}

export interface DemandReport extends ClassifyOutput {
  id: string;
  created_at: string;
  reporter_session: string;
  raw_text: string;
  location_text: string;
  area_label: string;
  latitude: number;
  longitude: number;
  status: DemandStatus;
  upvotes: number;
}

export const CATEGORY_META: Record<DemandCategory, { label: string; icon: string; color: string }> = {
  study_space:    { label: "Study Space",        icon: "BookOpen",   color: "oklch(0.82 0.16 195)" },
  food:           { label: "Affordable Food",    icon: "UtensilsCrossed", color: "oklch(0.80 0.17 70)" },
  fitness:        { label: "Fitness / Gym",      icon: "Dumbbell",   color: "oklch(0.75 0.16 145)" },
  pharmacy:       { label: "Pharmacy / Health",  icon: "Pill",       color: "oklch(0.68 0.22 25)" },
  pg_hostel:      { label: "PG / Hostel",        icon: "Building2",  color: "oklch(0.68 0.18 250)" },
  printing:       { label: "Printing / Copy",    icon: "Printer",    color: "oklch(0.72 0.13 280)" },
  transport:      { label: "Transport",          icon: "Bus",        color: "oklch(0.75 0.18 220)" },
  laundry:        { label: "Laundry",            icon: "Shirt",      color: "oklch(0.78 0.13 165)" },
  mental_health:  { label: "Mental Health",      icon: "HeartPulse", color: "oklch(0.78 0.15 320)" },
  grocery:        { label: "Grocery",            icon: "ShoppingBasket", color: "oklch(0.78 0.16 110)" },
  womens_safety:  { label: "Women's Safety",     icon: "ShieldAlert",color: "oklch(0.70 0.22 15)" },
  daycare:        { label: "Daycare",            icon: "Baby",       color: "oklch(0.80 0.13 50)" },
  atm:            { label: "ATM / Finance",      icon: "Landmark",   color: "oklch(0.78 0.10 90)" },
  other:          { label: "Other",              icon: "Sparkles",   color: "oklch(0.70 0.04 250)" },
};

export const ACTOR_LABEL: Record<RecommendedActor, string> = {
  local_business: "Local Business",
  government: "Government / Civic Body",
  ngo: "NGO",
  community: "Community Group",
  transport_authority: "Transport Authority",
};

export const PRIORITY_RANK: Record<ImpactPriority, number> = {
  low: 1, medium: 2, high: 3, critical: 4,
};

// --- LAYER 2: NEW DOMAIN SCHEMA ---

export type SubmissionInputMethod = "text" | "voice" | "whatsapp_forward";
export type LocationSource = "browser_gps" | "manual_area" | "manual_pin" | "typed_address" | "mappls_geocode" | "mappls_reverse_geocode" | "internal_bengaluru_zone" | "unknown";
export type LocationProvider = "internal" | "browser" | "mappls" | "google_maps" | "none";
export type LocationPrecision = "exact" | "approximate" | "micro_area" | "area_level" | "city_level" | "unknown";

export interface ResolvedLocation {
  latitude: number | null;
  longitude: number | null;
  location_text: string;
  area_label: string;
  micro_area?: string;
  landmark_text?: string;
  pincode?: string;
  city: string;
  region?: string;
  country: string;
  source: LocationSource;
  provider: LocationProvider;
  precision: LocationPrecision;
  accuracy_meters?: number;
  user_confirmed: boolean;
  captured_at: string;
  is_sensitive_location?: boolean;
  privacy_fuzz_meters?: number;
}

export type SubmissionIntentType = "new_demand" | "support_existing_demand" | "evidence_addition" | "service_search_query" | "feedback_about_app" | "spam_or_irrelevant" | "safety_or_emergency";
export type DemandNature = "missing_service" | "poor_quality" | "overpriced" | "inaccessible" | "capacity_gap" | "timing_gap" | "safety_gap";
export type EffortSignal = "wish" | "searched" | "tried_failed" | "workaround";
export type DemandRecurrence = "daily" | "weekly" | "rare" | "one_time";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "night" | "any";
export type DemandSeasonality = "monsoon" | "summer" | "winter" | "all_year";

export interface DemandIntentClassification {
  intent_type: SubmissionIntentType;
  nature: DemandNature;
  category: DemandCategory;
  sub_category: string;
  urgency: number;
  affected_group: AffectedGroup;
  recommended_actor: RecommendedActor;
  recurrence?: DemandRecurrence;
  time_of_day?: TimeOfDay;
  seasonality?: DemandSeasonality;
  effort_signal?: EffortSignal;
  effort_narrative?: string;
  confidence_score?: number;
  tags?: string[];
}

export interface DemandEvidence {
  id: string;
  type: "photo" | "screenshot" | "link" | "voice_note" | "text_note" | "document";
  local_preview_url?: string;
  storage_url?: string;
  external_url?: string;
  caption?: string;
  transcript?: string;
  ocr_text?: string;
  is_sensitive?: boolean;
  status: "local_only" | "pending_upload" | "uploaded" | "flagged";
}

export interface DemandQualityFlag {
  flag_type: "spam" | "profanity" | "vague" | "duplicate";
  severity: "low" | "high";
  reason: string;
}

export interface InterestSignal {
  session_id: string;
  type: "co_sign" | "would_use" | "would_pay";
  willingness_to_pay_inr?: number;
  expected_frequency?: "daily" | "weekly" | "monthly" | "occasionally";
  created_at: string;
}

export interface DemandSubmission {
  id: string;
  created_at: string;
  reporter_session: string;
  input_method: SubmissionInputMethod;
  raw_text: string;
  location: ResolvedLocation;
  evidence: DemandEvidence[];
}

export interface DemandCard {
  id: string;
  submission_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  need_summary: string;
  status: DemandStatus;
  
  submission: DemandSubmission;
  location: ResolvedLocation;
  classification: DemandIntentClassification;
  evidence: DemandEvidence[];
  interest_signals?: InterestSignal[];
  quality_flags: DemandQualityFlag[];
  
  co_sign_count: number;
  similar_reports_count: number;
  
  signal_strength: number;
  impact_priority: ImpactPriority;
  privacy_status: PrivacyStatus;
  confidence_score: number;
  suggested_action: string;
}
