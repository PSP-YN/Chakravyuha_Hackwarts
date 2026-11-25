# Product UI, UX and Full-Stack Audit — KRISHI CONNECT 360

**Date:** 25 November 2026
**Scope:** Existing Next.js/Supabase/Vercel prototype, product workflows, interface architecture, data handling, database security posture, responsive behaviour and release validation.
**Decision:** Replace the editorial landing-page experience with a task-oriented agricultural workspace. Preserve the existing backend contracts and public AGMARKNET integration.

## 1. Product audit

### Product definition
KRISHI CONNECT 360 is a farmer-first coordination platform. It is not a guaranteed buyer, payment processor, logistics operator, government verification system or price guarantee.

The interface is organised around three participant jobs:

- **KrishiMarket 360:** discover produce, compare participant offers and estimate farmer net realisation.
- **KrishiShare:** find machinery and farm services using operation, equipment, availability, location, operator, fuel and booking-duration details.
- **FarmLoop:** list and discover by-products using material type, moisture, contamination, quantity, collection radius and deadline.
- **Economic Impact Engine:** shared reporting across the modules, not a separate marketplace.

### Prior experience findings
| Area | Finding | Design decision |
|---|---|---|
| Information architecture | Previous screen behaved like a brand/marketing landing page before exposing marketplace actions | Move to an application workspace with persistent navigation and direct module entry |
| Primary actions | Discovery, listing, activity and impact were separated by long scroll sections | Keep module switching, listing creation, refresh, activity and impact accessible from the workspace |
| Data credibility | The product has no production seed inventory | Keep real database counts, explicit empty states and no fabricated cards or KPI values |
| Mandi data | Reference price and buyer offer are different data classes | Keep AGMARKNET prices in a separately attributed section and label them as reference prices |
| Machinery | A generic equipment card hides important matching constraints | Surface operation, HP, implement, minimum duration, operator, fuel, availability and distance |
| By-products | Generic listings can imply material compatibility without evidence | Surface material and measured quality fields; avoid automatic compatibility claims |
| Economics | Asking price is not farmer net realisation | Retain offer × accepted quantity − participant-entered costs, with estimated/participant-reported wording |
| Account state | Authenticated actions must be distinct from public discovery | Keep sign-in state visible and gate create/respond/manage actions |
| Mobile | Long forms and wide market tables need deliberate responsive handling | Collapse grids, keep controls full-width and allow table scrolling within its container |

## 2. New interface system

- Dark forest navigation rail with a light, high-contrast working canvas.
- Warm green, leaf, lime, amber and restrained clay accents; no generic blue/purple gradient.
- Dashboard hierarchy: workspace header → real metrics → module selection → public mandi data → participant listings → activity/economics → account access.
- Consistent controls, compact metadata, status chips, responsive cards and accessible focus states.
- Modal offer workflow supports Escape, explicit close and backdrop dismissal.
- Reduced-motion preference is respected.
- Mobile navigation becomes a compact horizontal module rail; listing and form grids collapse to one column.

## 3. Full-stack architecture review

| Layer | Current implementation | Audit result |
|---|---|---|
| Frontend | Next.js 15 App Router, React 19, TypeScript | Build and typecheck pass |
| Application state | React state/hooks, Supabase session listener | Functional in the current prototype; no dedicated state/query cache |
| Auth | Supabase email magic link | Client integration present; actual delivery and two-account journey still require live verification |
| Database | Supabase Postgres 17 | RLS and transition guards are represented in versioned migrations |
| Marketplace | market_listings, market_offers | Produce, machinery and by-product records share a listing/offer core |
| Market data | Server-side Next.js route proxies public AGMARKNET 2.0 endpoints | No browser-held secret/API key; cached public GET requests |
| Hosting | Vercel production | Existing production deployment is connected to GitHub main |
| Currency | Integer paise | Correct storage direction; quantities retain explicit units |
| Testing | Node test runner and TypeScript | Four domain tests pass; browser visual smoke performed against a local production build |

## 4. Security and data integrity review

### Existing controls confirmed in migration source
- RLS is enabled on market_listings, market_offers and market_price_observations.
- Public users can read active listings; listing writes require authentication and owner identity.
- Offer reads are limited to the buyer and seller.
- New offers must begin in pending, the buyer must match auth.uid(), the seller cannot bid on their own listing, and the listing must be active with sufficient quantity.
- Offer transitions are constrained: buyer withdrawal, seller accept/reject, seller completion after acceptance.
- Acceptance checks active listing state and prevents accepted/completed quantities from exceeding the listing quantity.
- Machinery acceptance requires a requested service window, respects listing availability dates and rejects overlapping accepted bookings.
- Listing status changes are constrained to active → paused/closed and paused → active/closed.
- Module-specific required fields and numeric/date/location checks exist.
- Browser environment uses the Supabase publishable key; no service-role key is required by the browser.

### Remaining security/reliability work
- Complete a two-real-account integration test for listing ownership, offer privacy, seller decisions, buyer withdrawal and machinery overlap using separate authenticated sessions.
- Add abuse controls for listing/offer spam and moderation/reporting before opening a broad public pilot.
- Define retention, deletion and incident-response procedures for participant data.
- Review public exposure of owner identifiers and approximate coordinates before onboarding real participants.
- Add server-side observability for AGMARKNET upstream failures, cache behaviour and request rates.
- The current public market-price route relies on an upstream portal endpoint rather than a formal uptime-guaranteed API contract; it can change or rate-limit requests.

## 5. Product and workflow gaps

These are not represented as complete merely because fields or UI controls exist:

1. **Identity/trust:** email sign-in is not farmer, land, FPO, buyer or provider verification.
2. **Settlement:** accepted/completed offer states do not prove money changed hands. There is no payment or settlement evidence flow.
3. **Disputes/moderation:** no admin moderation queue, participant reporting, dispute handling or appeals.
4. **Machinery operations:** booking requests and overlap checks exist, but no provider calendar UI, dispatch, live tracking, job completion evidence or cancellation policy workflow.
5. **FarmLoop compatibility:** current filters and structured attributes do not certify processor compatibility or lab quality.
6. **Market price persistence:** a market-price observation table exists in migrations, but the current live AGMARKNET connector proxies and caches responses; it does not persist each report into that table.
7. **Location:** browser geolocation and approximate coordinates support distance ordering; there is no geocoding, address validation or routing service.
8. **Localization/offline:** Kannada-reviewed copy, multilingual content and offline/PWA workflows remain unimplemented.
9. **End-to-end validation:** no automated two-user browser suite is currently configured.
10. **Operational readiness:** moderation, support, data retention, monitoring/alerting, backups/restore drills and incident playbooks need completion before a public production rollout.

## 6. Verification performed for this redesign

- npm run typecheck — passed.
- npm test — 4/4 passed.
- npm run build — passed; Next.js production build generated static / and dynamic /api/market-prices.
- npm audit --audit-level=high — 0 vulnerabilities reported.
- git diff --check — passed before the final documentation changes.
- Local production server started successfully on port 3217.
- Chrome headless desktop screenshot captured at 1440 × 1200 and visually reviewed.
- Production URL returned HTTP 200 during smoke check.
- Supabase/AGMARKNET live data remains dependent on the previously configured production environment and upstream availability.

## 7. Release classification

**Current classification: redesigned pilot prototype / controlled beta.**

This release improves the application shell and preserves working data workflows. It is not yet defensible to label the entire service production-ready for unrestricted public use until the remaining identity, moderation, two-account integration, operations and settlement-evidence gates are completed.

## 8. Next release gates

1. Run real-account auth and transaction tests in Chrome and Firefox.
2. Add moderation/reporting and support operations.
3. Add auditable participant verification without implying government verification.
4. Add provider calendar and booking cancellation/rescheduling.
5. Add explicit FarmLoop processor acceptance/quality workflows.
6. Add market-price persistence with provenance/freshness fields, or formally remove the unused persistence table from the architecture.
7. Add monitoring, backup/restore verification, privacy/retention policy and incident response.
8. Complete Kannada-reviewed mobile usability testing with pilot participants.
