# Implementation Roadmap

## Phase 0 — Foundation
- [x] CTO documentation, Next.js app shell, design system, Supabase schema/RLS and CI.
- [x] Dedicated Supabase project and environment configuration.

## Phase 1 — Closed MVP
- [x] Email magic-link auth integration (delivery and two-user journey still require live account verification).
- [x] Shared listing model, public active-listing discovery and filters.
- [x] Listing creation and owner pause/reactivate/close lifecycle.
- [x] Buyer offers, seller accept/reject, buyer withdrawal and seller completion.
- [x] Net-realisation calculation with explicit estimate/settlement caveats.

## Phase 2 — Pilot prototype workflows
- [x] Category-specific machinery fields: operation, HP range, implement, operator, fuel, minimum hours and availability dates.
- [x] Machinery service requests with start time/duration and database-enforced accepted-booking overlap prevention.
- [x] By-product material type, moisture, contamination, collection radius and availability deadline.
- [x] KrishiTransit accepted-job lifecycle, delivery confirmation, evidence and notifications.
- [x] FPO member register and member-attributed aggregate produce lots.
- [x] District-scoped municipality enquiries, official response and shared timeline.
- [x] Storage Guardian ESP32 firmware, sensor model, telemetry API, simulator and key revocation.
- [x] Role-specific database listing/offer constraints, terms consent and English/Kannada UI/audio.
- [ ] Two-account RLS and complete browser journey against real user accounts.
- [ ] Production SMTP delivery, backup/restore drill, retention policy and incident response.
- [ ] Kannada copy review, field validation with local farmers, low-connectivity testing and physical hardware acceptance.

## Phase 3 — External integrations (future)
- More robust AGMARKNET/data.gov.in ingestion and provenance; authorised public-system integrations; verified local-body service catalogues; route/vehicle data; sensor calibration and optional device fleet management.

## Phase 4 — Commercial readiness (not in this prototype)
- Pricing tests, KYC/legal/refund/dispute design, partner SLAs, security review, backup/restore drill and measured geographic expansion.

## Explicit exclusions
- No payment collection, wallet, escrow or settlement automation.
- No AI/ML recommendations or automated valuation.
- No claim of guaranteed market prices, farmer income uplift, verified emissions reduction or government/partner endorsement.

## Prioritisation
P0 = safe core workflow. P1 = pilot readiness. P2 = scale. Do not add AI, blockchain, complex analytics or native apps ahead of workflow reliability.
