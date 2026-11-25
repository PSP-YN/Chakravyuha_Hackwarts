# Product Requirements Document

## Problem
Farmers and rural service providers coordinate produce sales, machinery access and by-product disposal through fragmented channels. A headline price can hide transport, handling, commission and other farmer-borne costs. Machinery discovery may not expose a comparable complete-service quote. By-products differ by material, moisture, contamination, quantity, distance and collection window.

## Goals
- Compare produce offers using expected farmer net realisation.
- Structure machinery/service enquiries around operation and total cost.
- Make by-product listings quality-aware.
- Provide traceable offers and transaction state.
- Work on mobile devices and constrained connections.

## Non-goals
Payments/escrow, lending, insurance, government verification, guaranteed buyer liquidity, nationwide mandi coverage, automated dispatch, satellite analytics, crop prediction, emissions certification, native apps and opaque AI recommendations.

## Personas
Farmer/supplier, produce buyer, machinery provider, by-product processor and future FPO/group coordinator.

## Core journeys
### Produce
Sign in → publish commodity/grade/quantity/unit/location/asking price → buyer submits offer → seller compares offer and costs → seller accepts/rejects → participants report fulfilment.

### Machinery
Provider publishes equipment, operation, service radius, availability and rate basis → farmer filters by locality/operation → structured request → parties confirm operator, fuel, mobilisation, minimum duration, cancellation and total cost. Scheduling conflict prevention is not enabled until database-level concurrency checks exist.

### By-product
Supplier records material, quantity, moisture/quality/contamination and collection constraints → processor submits demand/offer → parties agree collection and price. Pooling is allowed only for compatible material and collection windows.

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
