# QA and Release Strategy

## Automated checks implemented
- `npm test`: paise conversion, invalid money inputs, INR formatting and net-realisation arithmetic.
- `npm run typecheck`: strict TypeScript check.
- `npm audit --audit-level=high`: dependency vulnerability gate.
- `npm run build`: optimized Next.js production build.

## Live checks performed
- Supabase public listing Data API read returned HTTP 200.
- Anonymous offer insert returned HTTP 401 / permission denied (expected; anon has no INSERT grant).
- New machinery and by-product columns are present in the live database.
- Supabase security advisor returned no findings after the pilot migrations.
- Chrome headless viewport checks at 360, 390, 580, 768, 1024, 1440 and 1920 px showed no horizontal overflow; all three module names rendered and no JavaScript exceptions were captured. Firefox is not installed in the current laptop environment, so this iteration did not include a fresh Firefox run.

## Integration tests still required with two real accounts
- User A publishes produce listing → User B sees it → User B submits offer → User A accepts → User B cannot access unrelated offer or update listing → User A marks completed.
- Repeat with machinery booking request and overlapping accepted time windows.
- Repeat with by-product quality requirements.
- Verify buyer withdrawal, seller reject, listing pause/reactivation/closure, and accepted quantity caps.
- Verify magic-link delivery, redirect URL allowlist and session persistence.

## Security matrix
| Test | Expected |
|---|---|
| Anonymous SELECT active listing | Allowed |
| Anonymous INSERT offer | Denied by table grants |
| User A reads User B paused listing | Denied |
| User A updates User B listing | Denied |
| Buyer A reads unrelated offer | Denied |
| Buyer submits spoofed owner_id | Denied by RLS and listing ownership check |
| Buyer changes offer status other than pending -> withdrawn | Denied by trigger |
| Buyer inserts an offer already marked accepted/completed | Denied by pending-only INSERT policy and trigger |
| Seller reassigns offer owner | Denied by column-level UPDATE grant |
| Negative price/cost/quantity | Constraint failure |
| Accepted offers exceed listing quantity | Denied by trigger under listing-row lock |
| Overlapping accepted machinery bookings | Denied by trigger under listing-row lock |
| Accept offer against paused/closed listing | Denied by trigger |

## Financial test
Offer ₹2,400/quintal × 8 quintals = ₹19,200 gross. Farmer costs ₹1,250. Expected net = ₹17,950; expected net per quintal = ₹2,243.75. Label as estimate, not settled proceeds.

## Release gates
Typecheck and build pass; migration applies to clean project; RLS tests pass; core browser journey passes; mobile and keyboard access reviewed; env correctly scoped; production smoke test complete; no critical/high security issue.

## Known limitations
- Auth email delivery and two-user RLS workflows are not yet verified with real user accounts.
- Vercel GitHub integration and production deployment are pending secure Vercel authentication.
- Machinery scheduling is a requested time window with overlap protection after seller acceptance; it is not a live calendar or automatic booking confirmation.
- By-product compatibility is represented by typed listing attributes and participant search; no laboratory verification or automated processor certification exists.
- No Kannada-reviewed copy, dispute resolution, moderation, external price feed, logistics integration, payments or AI.
- Accepted offer is not payment settlement. Completion is participant-reported.
