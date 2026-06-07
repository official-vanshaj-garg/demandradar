import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Radar, Activity, MapPin, Sparkles, ShieldCheck, GraduationCap, Building2, Users, Landmark, Lightbulb, Briefcase } from "lucide-react";
import { RadarHero } from "@/components/radar/RadarHero";
import { LiveSignalFeed } from "@/components/feed/LiveSignalFeed";
import { AIBadge } from "@/components/layout/AIBadge";
import { CATEGORY_META } from "@/lib/ai/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DemandRadar — Reveal what your community needs" },
      { name: "description", content: "DemandRadar turns scattered local gaps into structured Demand Cards. Pilot live in Bengaluru. AI signal engine ready." },
      { property: "og:title", content: "DemandRadar — Hyperlocal Demand Intelligence" },
      { property: "og:description", content: "Building the demand graph for hyperlocal India." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <AIBadge />
            <h1 className="mt-5 font-display font-semibold leading-[1.05] tracking-tight" style={{ fontSize: "clamp(2rem, 7vw, 3.75rem)" }}>
              Reveal what your community
              <br className="hidden sm:inline" />{" "}
              <span className="text-gradient">needs before anyone</span> sees it.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              DemandRadar turns scattered demand signals, group chats and local frustrations into
              <span className="text-foreground"> structured Demand Cards</span> — geo-tagged,
              privacy-safe, and ranked by signal strength.
            </p>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Building the demand graph for hyperlocal India. Pilot live in <span className="text-primary">Bengaluru</span>.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link to="/report" className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-secondary to-primary px-5 py-3 font-medium text-primary-foreground glow-teal transition hover:brightness-110 sm:w-auto">
                Report a Need <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/map" className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-strong bg-glass px-5 py-3 font-medium glass hover:border-primary/50 sm:w-auto">
                <MapPin className="h-4 w-4" /> Explore Demand Map
              </Link>
              <Link to="/about" className="inline-flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground hover:text-primary">
                Pilot DemandRadar in your area <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-3">
              <Stat label="Signals" value="40+" />
              <Stat label="Zones" value="10" />
              <Stat label="Categories" value="14" />
            </div>
          </div>

          <div className="relative mx-auto flex aspect-square w-full max-w-[420px] items-center justify-center sm:max-w-[520px]">
            <RadarHero size={520} />
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="rounded-2xl border border-border bg-glass p-6 glass">
          <div className="grid gap-6 md:grid-cols-3">
            <Problem icon={Activity} title="Demand is invisible" body="Frustrations live in WhatsApp groups, Reddit threads, Google reviews — never reaching the people who can act." />
            <Problem icon={Radar} title="Surveys come too late" body="By the time a council or operator commissions research, the gap has been hurting residents for months." />
            <Problem icon={Sparkles} title="The signal is scattered" body="No common structure, no priority, no actor. Just noise — until now." />
          </div>
        </div>
      </section>

      {/* LIVE FEED */}
      <section className="mx-auto mt-16 grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
        <LiveSignalFeed limit={6} />
        <div className="rounded-2xl border border-border bg-glass p-6 glass">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Categories tracked</div>
          <h3 className="mt-1 font-display text-xl font-semibold">14 hyperlocal demand categories</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(CATEGORY_META).slice(0, 10).map(([k, m]) => (
              <div key={k} className="flex items-center gap-2 rounded-md border border-border bg-surface/40 px-2.5 py-1.5 text-xs">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
                <span className="truncate">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="How it works" title="From a sentence to a Demand Card in seconds" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Step n={1} title="Report" body="Anyone can describe a missing local service in plain language. No login. No PII." />
          <Step n={2} title="Structure" body="The intelligence layer structures reports into typed Demand Cards with category, urgency, signal strength, and confidence." />
          <Step n={3} title="Act" body="Demand Cards cluster on the map and surface in the Intelligence Dashboard with recommended actors and actions." />
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Before vs After" title="Scattered signals → Structured demand intelligence" />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/40 p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Before</div>
            <h3 className="mt-1 font-display text-lg">Noise across channels</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <Bubble>"library shuts at 8 ugh"</Bubble>
              <Bubble>"any 24x7 medical near BTM??"</Bubble>
              <Bubble>"streetlight broken on koramangala 6th"</Bubble>
              <Bubble>"need cheap tiffin near acharya"</Bubble>
              <Bubble>"last bus from ITPL is impossible"</Bubble>
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 glow-teal">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">After</div>
            <h3 className="mt-1 font-display text-lg">Demand Cards · ranked, located, actionable</h3>
            <div className="mt-4 space-y-2">
              <CardRow title="24-hour study space needed in Koramangala" cat="Study Space" sig={84} pri="High" color="oklch(0.82 0.16 195)" />
              <CardRow title="24x7 pharmacy gap in BTM 2nd Stage" cat="Pharmacy" sig={78} pri="Critical" color="oklch(0.68 0.22 25)" />
              <CardRow title="Improve street lighting · Koramangala 6th" cat="Women's Safety" sig={89} pri="Critical" color="oklch(0.70 0.22 15)" />
              <CardRow title="Affordable thali near Acharya College" cat="Food" sig={72} pri="Medium" color="oklch(0.80 0.17 70)" />
              <CardRow title="Late-night feeder shuttle from ITPL" cat="Transport" sig={91} pri="High" color="oklch(0.75 0.18 220)" />
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <SectionHeading kicker="Who it's for" title="One signal layer · five audiences" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <UseCase icon={GraduationCap} label="Students" body="Get the spaces, food and services your campus skipped." />
          <UseCase icon={Briefcase} label="Local businesses" body="See validated, geo-tagged demand before opening." />
          <UseCase icon={Users} label="NGOs" body="Find underserved zones for high-impact intervention." />
          <UseCase icon={Landmark} label="Civic bodies" body="Privacy-safe priority signals from real residents." />
          <UseCase icon={Lightbulb} label="Local entrepreneurs" body="Spot opportunity gaps your neighborhood is asking for." />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-secondary/15 via-background to-primary/15 p-6 glow-teal sm:p-10">
          <div className="grid gap-6 md:grid-cols-[1.5fr_1fr] md:items-center">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">Pilot DemandRadar</div>
              <h3 className="mt-2 font-display text-2xl font-semibold leading-tight sm:text-3xl">
                Bring DemandRadar to your area.
              </h3>
              <p className="mt-2 max-w-xl text-muted-foreground">
                We're piloting in Bengaluru. Next: your campus, your ward, your city.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:justify-end">
              <Link to="/report" className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-secondary to-primary px-5 py-3 font-medium text-primary-foreground">Report a Need</Link>
              <Link to="/dashboard" className="inline-flex items-center justify-center rounded-md border border-border-strong bg-glass px-5 py-3 font-medium glass">Open Dashboard</Link>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, oklch(0.82 0.16 195 / 0.35), transparent 70%)" }} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-glass p-3 glass">
      <div className="font-display text-2xl font-semibold">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Problem({ icon: Icon, title, body }: { icon: any; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface/40 p-4">
      <div className="flex items-center gap-2 text-primary"><Icon className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.18em]">Problem</span></div>
      <h4 className="mt-2 font-display text-base font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{kicker}</div>
      <h2 className="mt-2 font-display text-3xl font-semibold leading-tight sm:text-4xl">{title}</h2>
    </div>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-glass p-6 glass">
      <div className="absolute right-4 top-3 font-display text-6xl font-bold text-primary/15">{n}</div>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Step {n}</div>
      <h3 className="mt-2 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-xl rounded-tl-sm border border-border bg-muted/30 px-3 py-2 text-foreground/80 italic">
      {children}
    </li>
  );
}

function CardRow({ title, cat, sig, pri, color }: { title: string; cat: string; sig: number; pri: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 p-3">
      <span className="h-2 w-2 rounded-full anim-signal-blink" style={{ background: color }} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{cat} · {pri}</div>
      </div>
      <div className="font-mono text-xs text-primary">{sig}</div>
    </div>
  );
}

function UseCase({ icon: Icon, label, body }: { icon: any; label: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-glass p-4 transition hover:border-primary/40 glass">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary"><Icon className="h-4 w-4" /></div>
      <div className="mt-3 font-display text-sm font-semibold">{label}</div>
      <p className="mt-1 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
