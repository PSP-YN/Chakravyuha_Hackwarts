# CTO Charter — KRISHI CONNECT 360

**Owner:** CTO / Engineering Lead  
**Version:** 1.0 — 25 November 2026  
**Status:** Baseline source of truth

## Executive definition
KRISHI CONNECT 360 is a Karnataka-first, mobile-first agricultural coordination platform connecting farmers, buyers/traders, machinery owners, waste processors, transporters, municipalities and FPOs through shared listings, structured offers, bookings, enquiries and participant history. Storage Guardian is an optional ESP32 sensor add-on.

It is a coordination and transparency product. It is not a guaranteed buyer, logistics operator, lender, insurer, government-verification service or replacement for e-NAM or public market infrastructure.

## Product thesis
Fragmented supply, information asymmetry, machinery access friction and uncoordinated by-product flows create transaction costs. The platform tests whether structured discovery and transparent farmer-side economics can improve coordination.

1. Show expected net realisation, not just headline price.
2. Structure machinery/service discovery around operation scope and total cost.
3. Coordinate by-product recovery and transport with explicit quality, quantity, route and collection constraints.
4. Attribute FPO aggregate lots to active members and their contributed quantities.
5. Provide district-scoped municipality enquiries and a source-linked contact directory.
6. Measure completed outcomes, separating transaction value, proceeds, savings and net benefit.

## Modules
| Module | Job | MVP |
|---|---|---|
| KrishiMarket 360 | Produce discovery and trade | Listings, offers, net-realisation comparison |
| KrishiShare | Machinery and service coordination | Service listings and structured enquiries |
| FarmLoop | By-product exchange | Material listings, processor acceptance and quality records |
| KrishiTransit | Transport coordination | Transport listings, accepted jobs, delivery confirmation and evidence |
| FPO workspace | Collective operations | Member register and attributed aggregate lots |
| Municipality coordination | Local waste-service enquiries | Official directory and district-scoped response workflow |
| Storage Guardian | Optional hardware add-on | ESP32 sensor telemetry and advisory storage indicator |
| Economic Impact Engine | Outcome visibility | Offer outcomes and participant-reported proceeds |

The impact engine is a shared platform capability, not a fourth marketplace.

## Users and permissions
- Farmer: produce/by-product listings, machinery/transport requests, waste-service enquiries and transaction history.
- Buyer/trader: produce offers and transport requests.
- Machinery owner: machinery listings, bookings and evidence.
- Waste processor: FarmLoop acceptance proposals and quality records.
- Municipality/local-body contact: district-scoped waste-service enquiries and responses.
- Transporter: transport listings and accepted-job lifecycle.
- FPO/cooperative: member register and member-attributed aggregate lots.
- Platform operator: restricted moderation and directory administration; never a client-controlled role flag.

Supabase Auth proves control of an email/phone channel only. It does not prove farmer status, land ownership, FPO membership or government eligibility.

## Architecture decisions
- Next.js App Router, React, TypeScript strict.
- Supabase Postgres and Auth.
- RLS on every exposed public table.
- Vercel hosting.
- Browser uses publishable key only.
- Money stored as integer paise; quantities always carry units.
- No AI/ML model is used in the current pilot; all financial and storage calculations are explicit rules.
- Payments are outside the current pilot; accepted offer does not mean settled payment.
- Reference prices are separate from buyer offers.

## Non-negotiable principles
1. No fabricated live data, partners, verification or prices.
2. Simulated records must be visibly labelled DEMO / SIMULATED.
3. All writes are authenticated, validated and RLS-protected.
4. Database verifies ownership; never trust submitted owner_id alone.
5. Store money as integer paise and quantity with explicit unit.
6. Separate reference price, asking price, buyer offer, accepted terms and settlement.
7. Important transitions must be auditable.
8. Mobile and low-bandwidth use are first-class.
9. Build, typecheck, migration, RLS and browser flows must be verified.
10. Never commit or expose service-role/secret keys.

## Release definition
A credible pilot release requires working auth, create/read/update listing flows, buyer offer and seller decision flows, transparent net-realisation calculation, two-user RLS tests, responsive mobile UI, error/loading/empty states, production env configuration, deployed smoke test and known-limitations documentation.

A deployed URL alone is not proof of a working product.

## Product boundaries
No guarantee of price, quality, supply, delivery, payment, crop yield, emissions reduction or income uplift. No government identity or scheme eligibility verification. Public claims require measured outcomes, named data sources and methodology.

## Decision log
| ID | Decision | Reason |
|---|---|---|
| ADR-001 | Monolith-first | Avoid premature distributed complexity |
| ADR-002 | RLS is mandatory | Database-enforced isolation |
| ADR-003 | Integer paise | Avoid floating-point currency errors |
| ADR-004 | No payment integration in MVP | Settlement/refund/KYC/dispute complexity |
| ADR-005 | No AI dependency in core flows | Reliability and explainability |
| ADR-006 | Karnataka pilot cluster first | Validate operations before expansion |

## Implementation status
The repository started empty. Features not backed by successful live tests remain pending, regardless of code presence.
