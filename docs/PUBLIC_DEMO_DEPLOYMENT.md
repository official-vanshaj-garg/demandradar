# Public Demo Deployment

DemandRadar's first public demo runs as a TanStack Start SSR application on Cloudflare Workers. It is not a Cloudflare Pages static deployment.

## Public-demo configuration

Use the SVG map renderer for every public-demo build:

```powershell
$env:VITE_DEMANDRADAR_MAP_PROVIDER='svg'
bun run build
```

`VITE_*` values are bundled for the browser and must be treated as public. Do not place private credentials in `VITE_*` variables. The public demo does not require `VITE_MAPPLS_STATIC_KEY` and does not activate Mappls.

`.env.local` is local-only and ignored by Git. Build output may create `dist/server/.dev.vars` for local preview; it is preview-only output and must not be manually uploaded or published.

## Local Worker preview

```powershell
$env:VITE_DEMANDRADAR_MAP_PROVIDER='svg'
bun run build
bunx wrangler dev --local
```

The repository's `vite preview` path is not the deployment verification command for this SSR Worker. Use the local Wrangler runtime instead.

## Deploy

After local validation and review, deploy with the same explicit SVG setting:

```powershell
$env:VITE_DEMANDRADAR_MAP_PROVIDER='svg'
bun run build
bunx wrangler deploy
```

Cloudflare Workers' `workers.dev` URL is sufficient for the first public demo. Do not invent or configure a custom domain in this runbook.

## Release checks

1. Run `bun test`, `bun run validate`, and `git diff --check`.
2. Inspect `curl.exe -I https://<workers-dev-url>/` for CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`, and `X-Robots-Tag`.
3. Confirm `<meta name="robots" content="noindex, nofollow">` is present in the document.
4. Open `/`, `/report`, `/dashboard`, `/map`, `/insights`, and `/about`; refresh each route directly.
5. Confirm the SVG map renders, no Mappls request occurs, browser-local reports and support still work, and optional browser geolocation can prompt without requiring a grant.
6. Check desktop and mobile layouts plus the browser console for CSP, hydration, or other critical errors.

The demo contains sample Bengaluru scenarios and reports saved in the current browser. There is no shared backend, database, or public account system.

## Rollback

Use the Cloudflare dashboard or Wrangler's deployment/version controls to restore the previously known-good Worker version. Re-run the release checks against the restored `workers.dev` URL before announcing it.
