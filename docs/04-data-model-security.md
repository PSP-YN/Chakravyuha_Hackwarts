# Data Model and Security

## Conventions
UUID keys; Supabase Auth UUID identity; integer paise for money; numeric quantity with explicit unit; UTC timestamps; constrained statuses; created_at and updated_at.

## MVP entities
### market_listings
Core fields: id, owner_id, category (produce/machinery/byproduct), title, description, quantity, unit, price_paise, location, quality, status, created_at and updated_at.

Machinery-specific fields: operation, minimum/maximum HP, implement, operator included, fuel responsibility, minimum booking duration and availability dates.

By-product-specific fields: material type, moisture percentage, contamination percentage, collection radius and availability deadline. One material stream per listing; compatibility is not independently certified.

### market_offers
Core fields: id, listing_id, buyer_id, owner_id, offered_price_paise, accepted_quantity, transport_cost_paise, handling_cost_paise, commission_cost_paise, other_cost_paise, status and timestamps. Machinery offers may include requested_start_at and requested_duration_hours.

## RLS and database invariants
- Active listings are discoverable; owners can read their own inactive listings.
- Authenticated users can insert only active listings under their own identity; owners can manage their own listings.
- Offers are readable only by the buyer and listing owner.
- Buyer inserts are restricted to pending offers on active listings owned by another user; buyer identity and owner/listing relationship are checked.
- Buyers can withdraw only their own pending offers. Sellers can accept/reject pending offers and mark accepted offers completed.
- New offers cannot be inserted directly in accepted/completed states.
- Offer status transitions are enforced by database triggers, not only UI logic.
- Accepted quantities cannot exceed listing quantity; listing-row locking serializes acceptance checks.
- Machinery acceptance requires a requested time/duration within availability dates and rejects overlapping accepted/completed booking windows.
- Listing state transitions are restricted to active → paused/closed and paused → active/closed.
- Offer UPDATE privilege is granted only on the status column. Listing access is owner-scoped by RLS.
- UPDATE policies include USING and WITH CHECK.
- Never use user-editable user_metadata for authorization. Avoid SECURITY DEFINER as a permission workaround.

## Supabase Data API
The migrations explicitly grant only required table privileges and enable RLS. Anonymous access is read-only for active listings; anonymous offer insertion is denied at the table-grant boundary. Authenticated users have scoped row access. Verify Data API settings and live access after migration.

## Threat model
| Threat | Control |
|---|---|
| IDOR | RLS with auth.uid() predicates |
| Owner/buyer spoofing | RLS and insert trigger verify identity/ownership |
| Offer visibility leak | Buyer/seller-only SELECT |
| Offer state injection | Pending-only insert policy and trigger |
| Over-acceptance | Listing-row lock and accepted-quantity guard |
| Machinery double-booking | Accepted-window overlap guard |
| Malicious content | Length constraints and output escaping |
| Price tampering | Integer paise and non-negative constraints |
| Secret exposure | No secret key in browser or git |
| Spam | Rate limiting and moderation roadmap |
| Admin escalation | No client-controlled admin role |
| Stale market prices | No reference price feed in this prototype |

## Privacy
Collect minimum data. Do not collect Aadhaar, bank credentials, land records, precise location, government Farmer ID or sensitive identity documents for MVP. Publish privacy, retention, support and account-deletion policies before real-user onboarding.

## Hardening before pilot
Rate limiting, moderation, account export/deletion, dispute workflow, audit trail, backup/restore exercise, dependency/secret scanning, verified email delivery and two-user RLS review.
