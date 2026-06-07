import { Link } from "@tanstack/react-router";
import { Radar } from "lucide-react";

export function AppFooter() {
  return (
    <footer className="mt-20 border-t border-border bg-background/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/40">
              <Radar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold">DemandRadar</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            Building the demand graph for hyperlocal India. Pilot: Bengaluru.
          </p>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Product</div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><Link to="/report" className="hover:text-primary">Report a Need</Link></li>
            <li><Link to="/map" className="hover:text-primary">Demand Map</Link></li>
            <li><Link to="/dashboard" className="hover:text-primary">Intelligence Dashboard</Link></li>
            <li><Link to="/insights" className="hover:text-primary">Insights</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Company</div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><span className="text-muted-foreground">Pilot: Bengaluru</span></li>
            <li><span className="text-muted-foreground">Demo · AI model adapter ready</span></li>
          </ul>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Privacy</div>
          <p className="mt-3 text-sm text-muted-foreground">
            Anonymous reporting. No PII collected. Coordinates rounded to ~110m. Personal contacts auto-redacted.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DemandRadar · Reveal what your community needs before anyone else sees it.
      </div>
    </footer>
  );
}
