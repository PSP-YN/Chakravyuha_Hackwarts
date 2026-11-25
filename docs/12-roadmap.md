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
- [x] Database constraints for required category details and offer capacity.
- [ ] Two-account RLS and complete browser journey against real user accounts.
- [ ] Kannada copy review, field validation with local farmers, low-connectivity testing and moderation/dispute handling.

## Phase 3 — Integrations (not in this prototype)
- AGMARKNET/data.gov.in adapters with provenance, FPO workspace, transport quotes, notifications and authorised public-system integrations.

## Phase 4 — Commercial readiness (not in this prototype)
- Pricing tests, KYC/legal/refund/dispute design, partner SLAs, security review, backup/restore drill and measured geographic expansion.

## Explicit exclusions
- No payment collection, wallet, escrow or settlement automation.
- No AI/ML recommendations or automated valuation.
- No claim of guaranteed market prices, farmer income uplift, verified emissions reduction or government/partner endorsement.

## Prioritisation
P0 = safe core workflow. P1 = pilot readiness. P2 = scale. Do not add AI, blockchain, complex analytics or native apps ahead of workflow reliability.
