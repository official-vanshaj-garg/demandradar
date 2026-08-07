import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Radar, Map, ArrowRight, type LucideIcon } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About / DemandRadar" },
      {
        name: "description",
        content:
          "DemandRadar is a local-demo demand intelligence product for hyperlocal India, starting with Bengaluru.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-primary">About</div>
      <h1 className="mt-1 font-display text-4xl font-semibold leading-tight sm:text-5xl">
        We&apos;re building the <span className="text-gradient">demand graph</span> for hyperlocal
        India.
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        DemandRadar turns local gaps into structured Demand Cards and shows how a future demand
        intelligence product could make unmet needs easier to inspect.
      </p>

      <Section title="What DemandRadar is" icon={Radar}>
        <p>
          A local demo for structuring missing-service reports into typed Demand Cards with
          category, urgency, signal strength, confidence, and a recommended actor.
        </p>
      </Section>

      <Section title="Why demand intelligence" icon={Sparkles}>
        <p>
          Google Maps shows what exists. DemandRadar explores how structured demand signals can
          reveal what is missing. The current product uses hand-authored sample data alongside
          reports saved in each browser.
        </p>
      </Section>

      <Section title="How this demo works" icon={Map}>
        <ol className="space-y-2 text-muted-foreground">
          <li>
            <span className="text-primary font-mono">01</span> &nbsp;Anyone can describe a missing
            service in plain language. No account is required.
          </li>
          <li>
            <span className="text-primary font-mono">02</span> &nbsp;A deterministic demo classifier
            structures the report into a typed Demand Card.
          </li>
          <li>
            <span className="text-primary font-mono">03</span> &nbsp;The report is saved in that
            browser and appears alongside sample data on the map, dashboard, and insights pages.
          </li>
          <li>
            <span className="text-primary font-mono">04</span> &nbsp;Insights use deterministic
            area-and-category clustering for this demo.
          </li>
        </ol>
      </Section>

      <Section title="Local storage and privacy" icon={ShieldCheck}>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>No account is required for this local demo.</li>
          <li>Coordinates are rounded to approximately 110m before storage.</li>
          <li>
            Supported phone, email, and long-ID patterns are redacted before new reports are saved.
          </li>
          <li>Reports and support state are saved only in the current browser.</li>
        </ul>
      </Section>

      <Section title="Current classifier" icon={Sparkles}>
        <p>
          The current classifier is deterministic and runs in-process. No production AI model is
          connected. The <span className="font-mono text-primary">classify(input)</span> boundary
          keeps future model work separate from the UI and location fields.
        </p>
      </Section>

      <Section title="Future product vision" icon={Radar}>
        <p>
          DemandRadar&apos;s thesis is to build the demand graph for hyperlocal India. Future
          product work may explore shared, verified demand intelligence once the required
          infrastructure and operating model are approved.
        </p>
      </Section>

      <div className="mt-12 rounded-2xl border border-primary/30 bg-primary/[0.05] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
              Local demo
            </div>
            <div className="mt-1 font-display text-xl">Explore demand signals in Bengaluru.</div>
          </div>
          <div className="flex gap-2">
            <Link
              to="/report"
              className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Report a Need
            </Link>
            <Link
              to="/dashboard"
              className="rounded-md border border-border-strong bg-glass px-4 py-2 text-sm glass"
            >
              See dashboard <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">{title}</h2>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}
