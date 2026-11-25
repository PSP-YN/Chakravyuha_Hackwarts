# Data Model and Security

## Conventions
UUID keys; Supabase Auth UUID identity; integer paise for money; numeric quantity with explicit unit; UTC timestamps; constrained statuses; created_at and updated_at.

## MVP entities
### market_listings
id, owner_id, category (produce/machinery/byproduct), title, description, quantity, unit, price_paise, location, quality, metadata JSONB, status, created_at, updated_at. Critical authorization fields never live only in JSONB.

### market_offers
id, listing_id, buyer_id, owner_id, offered_price_paise, accepted_quantity, transport_cost_paise, handling_cost_paise, commission_cost_paise, other_cost_paise, message, status, timestamps. Insert policy verifies owner_id against the actual listing owner.

## RLS model
- Active listings discoverable; owner can read own inactive listings.
- Authenticated user inserts/updates/deletes own listings only.
- Offers readable by buyer or listing owner only.
- Buyer creates offer only for an active listing owned by another user.
- Listing owner updates offer status.
- UPDATE policy must include USING and WITH CHECK.
- Never use user-editable user_metadata for authorization.
- Avoid SECURITY DEFINER as a permission workaround.

## Supabase Data API
Supabase changed defaults in 2026: new public tables may not be automatically exposed. Migration explicitly grants only required table privileges and enables RLS. Verify Data API settings and live access after migration.

## Threat model
| Threat | Control |
|---|---|
| IDOR | RLS with auth.uid() predicates |
| Owner spoofing | RLS verifies ownership |
| Offer visibility leak | Buyer/seller-only SELECT |
| Malicious content | Length constraints and output escaping |
| Price tampering | Integer paise and constraints |
| Secret exposure | No secret key in browser or git |
| Spam | Rate limiting and moderation roadmap |
| Admin escalation | No client-controlled admin role |
| Stale market prices | Source and observed/retrieved timestamps |

## Privacy
Collect minimum data. Do not collect Aadhaar, bank credentials, land records, precise location, government Farmer ID or sensitive identity documents for MVP. Publish privacy, retention, support and account-deletion policies before real-user onboarding.

## Hardening before pilot
Rate limiting, moderation, account export/deletion, dispute workflow, audit trail, backup/restore exercise, dependency/secret scanning and two-user RLS review.
