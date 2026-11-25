# QA and Release Strategy

## Unit tests
Net-realisation arithmetic, paise conversion/formatting, input validation, status transitions and category labels.

## Integration tests
Auth, listing insert/read/update, offer insert/seller decision, RLS with two users, database constraints and invalid writes.

## End-to-end journey
Farmer A publishes produce listing → Buyer B sees it → Buyer B submits offer → Farmer A accepts → Buyer B cannot see unrelated offer or update listing → Farmer A marks completed after fulfilment → economic summary updates.

Repeat with machinery and by-product categories.

## Security matrix
| Test | Expected |
|---|---|
| Anonymous SELECT active listing | Allowed only intended public rows |
| Anonymous INSERT | Denied |
| User A reads User B paused listing | Denied |
| User A updates User B listing | Denied |
| Buyer A reads unrelated offer | Denied |
| Buyer submits spoofed owner_id | Denied |
| Seller reassigns offer owner | Denied |
| Negative price/cost/quantity | Constraint failure |

## Financial test
Offer ₹2,400/quintal × 8 quintals = ₹19,200 gross. Farmer costs ₹1,250. Expected net = ₹17,950; expected net per quintal = ₹2,243.75. Label as estimate, not settled proceeds.

## Release gates
Typecheck and build pass; migration applies to clean project; RLS tests pass; core browser journey passes; mobile and keyboard access reviewed; env correctly scoped; production smoke test complete; no critical/high security issue.

## Known limitations
Email delivery depends on Auth SMTP configuration. Accepted offer is not payment settlement. Completion is participant-reported. Machinery schedule conflict prevention, reference-price ingestion, Kannada review, disputes and moderation require further implementation.
