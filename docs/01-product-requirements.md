# Product Requirements Document

## Problem
Farmers and rural service providers coordinate produce sales, machinery access, by-product recovery, transport and local waste-service enquiries through fragmented channels. A headline price can hide transport, handling, commission and other farmer-borne costs. Machinery discovery may not expose a comparable complete-service quote. By-products differ by material, moisture, contamination, quantity, distance and collection window.

## Goals
- Compare produce offers using expected farmer net realisation.
- Structure machinery/service enquiries around operation and total cost.
- Make by-product listings quality-aware and connect processor acceptance.
- Coordinate transport requests through delivery confirmation and evidence.
- Attribute FPO aggregate produce lots to active members.
- Route district-scoped waste-service enquiries to municipality accounts.
- Offer optional ESP32 storage monitoring with advisory, clearly labelled readings.
- Provide traceable offers, bookings, events and transaction history.
- Work on mobile devices and constrained connections in English and Kannada.

## Non-goals
Payments/escrow, lending, insurance, government verification, guaranteed buyer liquidity, nationwide mandi coverage, automated dispatch, satellite analytics, crop prediction, emissions certification, native apps and AI/ML recommendations are outside the current pilot.

## Personas
Farmer, buyer/trader, machinery owner, waste processor, municipality/local-body contact, transporter and FPO/cooperative.

## Core journeys
### Produce
Sign in → publish commodity/grade/quantity/unit/location/asking price → buyer submits offer → seller compares offer and costs → seller accepts/rejects → participants report fulfilment.

### Machinery
Provider publishes equipment, operation, service radius, availability and rate basis → farmer filters by locality/operation → structured request → parties confirm operator, fuel, mobilisation, minimum duration, cancellation and total cost. Scheduling conflict prevention is not enabled until database-level concurrency checks exist.

### By-product
Supplier records material, quantity, moisture/quality/contamination and collection constraints → processor submits an acceptance proposal → owner accepts/rejects → parties coordinate collection. Quality status is not independent certification.

### Transport
Transporter publishes vehicle, capacity, route and availability → requester submits pickup time, locations and loading/unloading responsibilities → transporter accepts → job progresses through pickup, transit and delivery → requester confirms receipt. Evidence is private to job participants.

### FPO
FPO registers members → marks membership active/inactive → creates aggregate produce lot with unique member quantities → database verifies the member total equals the lot quantity → contributions retain member identity snapshots.

### Municipality
Participant selects a source-linked official contact → submits district-matched waste-service enquiry → municipality account acknowledges, provides information, refers or closes → requester sees the shared event timeline. This is not a confirmed pickup booking.

### Storage Guardian
Owner registers an ESP32 device → copies a one-time device key → DHT22 and DS18B20 send readings → backend records source-labelled telemetry and advisory score → owner can revoke the device key. Simulation data is not physical sensor data.

## Functional requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Email authentication | P0 |
| FR-002 | Create and manage own listings | P0 |
| FR-003 | Browse active listings | P0 |
| FR-004 | Submit buyer offers | P0 |
| FR-005 | Seller accepts/rejects offers | P0 |
| FR-006 | Expected net-realisation calculation | P0 |
| FR-007 | Responsive mobile UI | P0 |
| FR-008 | Explicit listing/offer states | P0 |
| FR-009 | Typed machinery terms | P1 |
| FR-010 | By-product quality and collection fields | P1 |
| FR-011 | Kannada localisation | P1 |
| FR-012 | Group pooling | P2 |
| FR-013 | Reference-price ingestion | P2 |
| FR-014 | Moderation and disputes | P2 |
| FR-015 | Transport job lifecycle and private delivery evidence | P1 |
| FR-016 | FPO member register and attributed aggregate lots | P1 |
| FR-017 | District-scoped municipality service enquiries | P1 |
| FR-018 | Device-keyed Storage Guardian telemetry and revocation | P1 |
| FR-019 | Explicit Terms of Use and Privacy Notice consent | P0 |
| FR-020 | Full English/Kannada text and audio instruction controls | P1 |

## Net realisation
Expected net = (buyer offer per unit × accepted quantity) − farmer-borne costs. Itemise transport, handling/packaging, commission and other agreed deductions. Do not subtract buyer-paid costs. Price and quantity must share a normalised unit. Rejected/downgraded quantity and payment terms must be explicit. This is an estimate until actual quantity and costs are known; actual net proceeds after settlement are a separate reported result.

## Acceptance criteria
- User cannot create a listing with another user's owner ID.
- User cannot read offers unrelated to them.
- Listing owner can only update their own listing.
- Offer insert checks listing ownership and active status.
- Invalid category/status, negative money and invalid quantity are rejected.
- Money uses integer paise; quantity has explicit unit.
- UI has loading, empty, error and retry states.
- No silent demo-data fallback.
