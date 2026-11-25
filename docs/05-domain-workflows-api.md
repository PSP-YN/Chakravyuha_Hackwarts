# Domain Workflows and API Contracts

## Vocabulary
- Reference price: external observation, not an offer.
- Asking price: seller's indicative price.
- Buyer offer: counterparty's proposed terms.
- Accepted offer: accepted terms, not proof of payment.
- Completed transaction: participant-reported fulfilment.
- Expected net realisation: estimate after farmer-borne costs.
- Actual net proceeds: reported result after actual quantity/costs and settlement.

## Calculation
Gross = offered price per unit × accepted quantity.  
Expected net = gross − transport − handling − commission − other farmer-borne costs.

Validate non-negative price/costs, positive quantity, quantity not exceeding listing quantity unless partial/multiple sale policy permits, and matching units. Use integer paise; financial settlement must use decimal-safe arithmetic.

## Listing lifecycle
draft (client only) → active ↔ paused; active → closed. Active listings are discoverable; inactive listings are owner-only. Archive rather than hard-delete after offers exist.

## Offer lifecycle
pending → accepted → completed; pending → rejected; buyer withdrawal is future scope. Mark completed only after fulfilment. MVP completion is participant-reported.

## Table contracts
market_listings: SELECT active or own; INSERT authenticated with owner_id = auth.uid(); UPDATE/DELETE owner only.  
market_offers: SELECT buyer or owner; INSERT buyer_id = auth.uid(), owner_id differs, listing active and owner matches; UPDATE owner only.

## Error contract
Auth required → request sign-in. Validation → field-specific correction. Permission denied → refresh and verify account. Network error → preserve form and retry. Conflict → refresh state; do not blindly retry a state-changing operation. Unknown error → safe message and support route; never expose SQL internals.

## Future server API
Use Zod schemas and verified server-side identity. Never trust submitted user_id/owner_id without comparing to verified claims. Use idempotency keys for non-repeatable operations.

## External adapters
Every imported record stores provider, source record ID/URL, published/observed/retrieved timestamps, geography, commodity/material, grade, unit, value, licence/attribution, parser version and freshness. Never mix reference prices and live buyer offers without clear labels.
