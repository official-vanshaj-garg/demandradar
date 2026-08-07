import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, MapPin, Sparkles, Check } from "lucide-react";
import { classify } from "@/lib/ai";
import type { ClassifyOutput, DemandReport } from "@/domain/demand";
import { ACTOR_LABEL, CATEGORY_META } from "@/domain/demand";
import { BLR_ZONES, projectToCanvas } from "@/lib/geo/bengaluru";
import { resolveLocation } from "@/lib/location";
import { addDemand, getSessionId } from "@/lib/data/store";
import {
  ConfidenceBar,
  ImpactPriorityTag,
  SignalStrengthMeter,
  UrgencyChip,
} from "@/components/demand/Indicators";
import { AIBadge } from "@/components/layout/AIBadge";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a Need / DemandRadar" },
      {
        name: "description",
        content:
          "Tell DemandRadar what your area is missing. We turn it into a structured Demand Card in seconds.",
      },
    ],
  }),
  component: ReportPage,
});

const EXAMPLES = [
  "We need a 24-hour study library near our college. PG rooms are too noisy.",
  "No 24x7 pharmacy nearby. Night-time emergencies are scary.",
  "Auto refusals after 10pm leave women stranded at the metro station.",
  "Affordable thali under ₹100 is impossible to find in this area.",
];

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          className={"h-1.5 w-8 rounded-full " + (step >= n ? "bg-primary" : "bg-muted")}
        />
      ))}
    </div>
  );
}

function ReportPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [text, setText] = useState("");
  const [zoneKey, setZoneKey] = useState<string | null>(null);
  const [locText, setLocText] = useState<string>("");
  const [running, setRunning] = useState(false);
  const [card, setCard] = useState<ClassifyOutput | null>(null);
  const [submitted, setSubmitted] = useState<DemandReport | null>(null);
  const [locationLock, setLocationLock] = useState<{
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "locating" | "locked" | "failed">(
    "idle",
  );
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const zone = useMemo(
    () => (zoneKey ? (BLR_ZONES.find((z) => z.key === zoneKey) ?? null) : null),
    [zoneKey],
  );

  function pickZone(key: string) {
    if (key !== zoneKey) {
      setZoneKey(key);
      // Invalidate any stale Demand Card built against the previous zone.
      if (card) setCard(null);
    }
  }

  // Deterministic jitter so user submissions don't stack on the exact zone centroid.
  function jitter(n: number, seed: string, salt: number) {
    let h = salt;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const r = (h % 10000) / 10000 - 0.5; // -0.5..0.5
    return n + r * 0.018; // ~±1km
  }

  function requestLocationLock() {
    if (!navigator.geolocation) {
      setLocationStatus("failed");
      setLocationMessage("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("locating");
    setLocationMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy =
          Number.isFinite(pos.coords.accuracy) && pos.coords.accuracy > 0
            ? pos.coords.accuracy
            : undefined;

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setLocationLock({
            latitude: lat,
            longitude: lng,
            accuracy_meters: accuracy,
          });
          setLocationStatus("locked");
          setLocationMessage("Location locked. Please keep or adjust the area below.");
        } else {
          setLocationStatus("failed");
          setLocationMessage("Invalid coordinates received.");
        }
      },
      () => {
        setLocationStatus("failed");
        setLocationMessage(
          "Could not access current location. You can continue by selecting an area manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  async function runClassify() {
    if (!zone) return;
    setRunning(true);
    try {
      const out = await classify({
        raw_text: text,
        location_context: { area_label: locText || zone.label },
      });
      setCard(out);
      setStep(3);
    } finally {
      setRunning(false);
    }
  }

  function submit() {
    if (!card || !zone) return;
    const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Resolve location from the user's selection - single source of truth.
    // resolveLocation guarantees: zone-derived centroid fallback if no coords,
    // and "Unknown Bengaluru Area" instead of any real zone if area is unknown.
    const loc = resolveLocation({
      zone_key: zone.key,
      area_label: zone.label,
      location_text: locText,
      // Apply +/-~1km deterministic jitter so manual pins don't stack on the centroid.
      latitude: locationLock?.latitude ?? jitter(zone.lat, id, 1),
      longitude: locationLock?.longitude ?? jitter(zone.lng, id, 7),
      accuracy_meters: locationLock?.accuracy_meters,
    });
    if (
      loc.latitude == null ||
      loc.longitude == null ||
      !Number.isFinite(loc.latitude) ||
      !Number.isFinite(loc.longitude)
    ) {
      return;
    }
    // IMPORTANT: spread `card` FIRST, then location fields LAST so the AI
    // output can never overwrite area_label / location_text / lat / lng.
    const report: DemandReport = {
      id,
      created_at: new Date().toISOString(),
      reporter_session: getSessionId(),
      raw_text: card.clean_text,
      status: "new",
      upvotes: 0,
      ...card,
      location_text: loc.location_text,
      area_label: loc.area_label,
      latitude: loc.latitude,
      longitude: loc.longitude,
    };
    addDemand(report);
    setSubmitted(report);
    setStep(4);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">
            Report a Need
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold sm:text-4xl">
            Tell DemandRadar what's missing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            No account required. Saved reports are local to this browser.
          </p>
        </div>
        <AIBadge />
      </div>

      <div className="mb-6 flex items-center gap-3">
        <StepDots step={step} />
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Step {step} of 4
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-border bg-glass p-6 glass">
          {step === 1 && (
            <div>
              <h2 className="font-display text-xl font-semibold">1. Describe the need</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Plain language is fine. Phone numbers and emails are auto-redacted.
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder="e.g. There's no 24-hour study library near our college. PG rooms are too noisy during exams."
                className="mt-4 w-full resize-none rounded-xl border border-border bg-background/50 p-4 text-sm outline-none focus:border-primary/60"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setText(ex)}
                    className="rounded-full border border-border bg-surface/40 px-3 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                  >
                    {ex.slice(0, 38)}…
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  disabled={text.trim().length < 12}
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Next: Location <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-xl font-semibold">2. Where in Bengaluru?</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Coordinates are rounded to ~110m for privacy.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={requestLocationLock}
                  disabled={locationStatus === "locating"}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-50"
                >
                  {locationStatus === "locating" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                  Use my current location
                </button>
                {locationMessage && (
                  <span
                    className={
                      "text-xs " +
                      (locationStatus === "failed" ? "text-destructive" : "text-primary")
                    }
                  >
                    {locationMessage}
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {BLR_ZONES.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => pickZone(z.key)}
                    className={
                      "rounded-xl border px-3 py-2 text-left text-sm transition " +
                      (zoneKey === z.key
                        ? "border-primary bg-primary/10 text-foreground glow-teal"
                        : "border-border bg-surface/30 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-primary" />{" "}
                      <span className="font-medium text-foreground">{z.label}</span>
                    </div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                      {z.lat.toFixed(3)}, {z.lng.toFixed(3)}
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-4">
                <label className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Specific landmark (optional)
                </label>
                <input
                  value={locText}
                  onChange={(e) => setLocText(e.target.value)}
                  placeholder={`e.g. Near landmark in ${zone?.label ?? "your area"}`}
                  className="mt-1 w-full rounded-md border border-border bg-background/50 p-2.5 text-sm outline-none focus:border-primary/60"
                />
              </div>
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={runClassify}
                  disabled={running || !zone}
                  title={!zone ? "Pick a zone first" : undefined}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Demand Card
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && card && zone && (
            <div>
              <h2 className="font-display text-xl font-semibold">3. Preview Demand Card</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Structured by the deterministic demo classifier.
              </p>
              <DemandPreview card={card} area={zone.label} location={locText || zone.label} />
              <div className="mt-6 flex justify-between">
                <button
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={submit}
                  className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  <Check className="h-4 w-4" /> Submit Signal
                </button>
              </div>
            </div>
          )}

          {step === 4 && submitted && (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/15 text-primary glow-teal">
                <Check className="h-8 w-8" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold">
                Signal received in {submitted.area_label}.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your Demand Card is saved in this browser and appears on this browser's dashboard,
                map, and insights.
              </p>
              <div className="mx-auto mt-6 max-w-md rounded-xl border border-primary/30 bg-primary/5 p-4 text-left">
                <div className="font-mono text-[10px] uppercase tracking-widest text-primary">
                  {CATEGORY_META[submitted.category].label}
                </div>
                <div className="mt-1 text-sm font-semibold">{submitted.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {submitted.area_label} / signal {submitted.signal_strength} /{" "}
                  {submitted.impact_priority} impact
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  to="/dashboard"
                  className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  View dashboard
                </Link>
                <Link to="/map" className="rounded-md border border-border px-4 py-2 text-sm">
                  See on map
                </Link>
                <button
                  onClick={() => {
                    setStep(1);
                    setText("");
                    setCard(null);
                    setSubmitted(null);
                  }}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Report another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side context panel */}
        <aside className="rounded-2xl border border-border bg-glass p-5 glass">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pilot zone
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold">
            {zone?.label ?? "Pick a zone"}
          </h3>
          <div className="mt-3 aspect-square rounded-xl border border-border bg-[oklch(0.14_0.025_250)] p-2">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              {BLR_ZONES.map((z) => {
                const active = z.key === zoneKey;
                const p = projectToCanvas(z.lat, z.lng);
                return (
                  <g key={z.key}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active ? 3.6 : 1.8}
                      fill={active ? "oklch(0.82 0.16 195)" : "oklch(0.7 0.04 240 / 0.5)"}
                      style={{
                        filter: active ? "drop-shadow(0 0 3px oklch(0.82 0.16 195))" : undefined,
                      }}
                    />
                    {active && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={3.6}
                        fill="none"
                        stroke="oklch(0.82 0.16 195)"
                        strokeWidth="0.4"
                        className="anim-radar-pulse"
                        style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
            <li>No account required</li>
            <li>Coordinates rounded for privacy</li>
            <li>
              Supported phone, email, and long-ID patterns are redacted before new reports save
            </li>
            <li>Recommended actor derived by the deterministic demo classifier</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function DemandPreview({
  card,
  area,
  location,
}: {
  card: ClassifyOutput;
  area: string;
  location: string;
}) {
  const meta = CATEGORY_META[card.category];
  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/[0.04] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: meta.color }}
          >
            {meta.label} / {card.sub_category}
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold leading-snug">{card.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{card.need_summary}</p>
        </div>
        <SignalStrengthMeter value={card.signal_strength} size={76} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <UrgencyChip value={card.urgency} />
        <ImpactPriorityTag value={card.impact_priority} />
        <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          Affected: {card.affected_group.replace("_", " ")}
        </span>
        <span className="rounded-md bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
          Privacy: {card.privacy_status}
        </span>
      </div>
      <div className="mt-4">
        <ConfidenceBar value={card.confidence_score} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Field label="Location">
          {location} / {area}
        </Field>
        <Field label="Recommended actor">{ACTOR_LABEL[card.recommended_actor]}</Field>
        <Field label="Suggested action">{card.suggested_action}</Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-background/40 p-2.5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
