import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppFooter } from "@/components/layout/AppFooter";
import { AmbientGrid } from "@/components/layout/AmbientGrid";

function NotFoundComponent() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientGrid />
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          Signal lost
        </div>
        <h1 className="mt-2 font-display text-7xl font-bold text-gradient">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          No signal in this sector. Try the Demand Map or head home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Link
            to="/"
            className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go home
          </Link>
          <Link to="/map" className="rounded-md border border-border px-4 py-2 text-sm">
            Demand Map
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AmbientGrid />
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A signal interference occurred. Try again.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-gradient-to-r from-secondary to-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          <a href="/" className="rounded-md border border-border px-4 py-2 text-sm">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "dark" },
      { name: "robots", content: "noindex, nofollow" },
      { title: "DemandRadar / Hyperlocal Demand Intelligence" },
      {
        name: "description",
        content:
          "Reveal what your community needs before anyone else sees it. DemandRadar is building the demand graph for hyperlocal India.",
      },
      { property: "og:title", content: "DemandRadar / Hyperlocal Demand Intelligence" },
      {
        property: "og:description",
        content: "Reveal what your community needs before anyone else sees it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative flex min-h-screen flex-col">
        <AmbientGrid />
        <AppHeader />
        <main className="relative flex-1">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </QueryClientProvider>
  );
}
