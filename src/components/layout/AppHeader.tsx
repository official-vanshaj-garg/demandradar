import { Link, useRouterState } from "@tanstack/react-router";
import { Radar, Menu, X } from "lucide-react";
import { useState } from "react";
import { AIBadge } from "./AIBadge";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/report", label: "Report" },
  { to: "/map", label: "Demand Map" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/insights", label: "Insights" },
  { to: "/about", label: "About" },
] as const;

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/30 to-primary/30 ring-1 ring-primary/40 glow-teal">
            <Radar className="h-5 w-5 text-primary" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary anim-signal-blink" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="truncate font-display text-base font-semibold tracking-tight">
              DemandRadar
            </div>
            <div className="hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:block">
              Hyperlocal Intel
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "rounded-md px-3 py-1.5 text-sm transition-colors " +
                  (active
                    ? "bg-glass text-foreground glass"
                    : "text-muted-foreground hover:bg-muted/40 hover:text-foreground")
                }
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <AIBadge compact />
          <Link
            to="/report"
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground glow-teal transition hover:brightness-110"
          >
            Report a Need
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
          className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-md border border-border md:hidden"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-background/90 px-4 py-3 md:hidden">
          <div className="mb-3">
            <AIBadge compact />
          </div>
          <div className="grid gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/report"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Report a Need
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
