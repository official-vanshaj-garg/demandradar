# DemandRadar — Manual Testing Checklist

Run through this before any demo or merge to main.

## Smoke

- [ ] Landing page (`/`) loads without console errors
- [ ] Header AI Signal Engine badge shows "running in demo mode"
- [ ] Live Signal Feed renders at least 6 cards on the landing page
- [ ] All nav links work: Report, Dashboard, Map, Insights, About

## Report flow

- [ ] `/report` loads at Step 1
- [ ] Step 1 → Next is disabled until 12+ chars are entered
- [ ] Step 2 zone tiles all render; no zone is preselected
- [ ] "Generate Demand Card" is disabled until a zone is picked
- [ ] Step 3 Demand Card preview shows category, urgency, signal, action
- [ ] Editing the zone in Step 2 invalidates the preview (must regenerate)

## Location integrity (regression for the Koramangala bug)

- [ ] Submit a report for **Yelahanka** → success screen says Yelahanka
- [ ] That report appears under Yelahanka in `/dashboard` matrix
- [ ] That report's pin appears in the Yelahanka area on `/map`
- [ ] Submit a report for **BTM Layout** → stays BTM Layout everywhere
- [ ] Submit a report for **Koramangala** → stays Koramangala everywhere
- [ ] Submit a report for **Whitefield** → stays Whitefield everywhere
- [ ] Submitting two reports in the same zone produces two distinct pins
      (jitter is working — they don't perfectly overlap)

## Dashboard

- [ ] KPIs update after a new submission (total signals increments)
- [ ] Area × Category matrix reflects the new submission
- [ ] Leaderboards reorder if the new submission's signal is high enough

## Map

- [ ] `/map` loads (no SSR / hydration error)
- [ ] All seed pins render
- [ ] New user submissions appear as fresh pins in the correct area
- [ ] Hovering / clicking a pin opens the Demand Card drawer

## Insights

- [ ] `/insights` loads
- [ ] Cluster cards render with opportunity scores
- [ ] New submissions affect cluster counts in their area+category

## Mobile responsiveness

- [ ] Landing hero stacks correctly at 375 px width
- [ ] Header collapses into mobile menu; AI badge still visible inside menu
- [ ] Report wizard is usable on mobile (zone tiles wrap, 2 columns)
- [ ] Dashboard matrix scrolls horizontally if needed
- [ ] Map fills viewport without overflow

## Demo mode fallback

- [ ] With `AI_MODE = "mock"`, classify() still returns within ~500 ms
- [ ] Badge reads "AI Signal Engine · running in demo mode"
- [ ] No network calls to external AI providers in DevTools
- [ ] Refreshing the page preserves user submissions (localStorage)
- [ ] Clearing localStorage restores only the seed reports
