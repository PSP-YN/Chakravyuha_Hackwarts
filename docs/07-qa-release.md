# QA and Release Strategy

## Automated checks

- `npm run typecheck`: strict TypeScript validation.
- `npm test`: eight domain tests covering paise arithmetic, net realisation, FPO allocation rules, transport state transitions, storage condition scoring and role-appropriate offers.
- `npm run build`: optimized Next.js production build.
- `npm audit --audit-level=high`: dependency vulnerability gate.
- `git diff --check`: whitespace and patch integrity.

## Integration validation performed during the build phase

- PostgreSQL 17 temporary test database: FPO aggregate-lot RPC, member attribution snapshots, direct FPO produce-listing denial, transport offer role checks, accepted-offer-to-job creation, transporter/requester state transitions, transport event/notification creation, municipality district-scoped enquiry/response/timeline/notification and signup policy-consent trigger.
- Chrome and Firefox local-browser smoke tests: landing, login, signup, workspace, storage route, virtual hardware simulator, privacy, terms, favicon, robots and sitemap routes; seven signup roles; Kannada legal/workspace text; Storage Guardian and simulator Kannada audio playback; 390px mobile layouts without horizontal overflow; self-hosted fonts; no console or failed-network errors after serializing Supabase auth initialization.
- Self-hosted font assets are used to avoid runtime dependence on Google Fonts requests.
- Deno checks pass for the Storage Guardian Edge Function (type check, lint and format). A local Deno server returned the expected CORS preflight, method rejection, malformed-JSON rejection, missing user/device authentication rejection and oversized-body rejection. This is not a successful Supabase-backed device-registration test.
- ESP32 PlatformIO targets are built separately for Wokwi simulation and physical certificate-validated firmware. The physical target compiles with telemetry enabled and a compile-time guard; Wokwi telemetry remains disabled. This is a compile check, not proof of a connected physical device.

## Not yet verified

- Real magic-link delivery and redirect completion with a new email account.
- Two-account buyer/seller commercial transaction and all RLS denial cases against the live Supabase project after the new migrations are applied.
- Real farmer/transporter accepted job and private evidence upload/download against the live project.
- Real FPO member aggregate lot and municipality district account workflow against the live project.
- Storage Guardian physical ESP32/DHT22/DS18B20 sensor readings, live Wi-Fi telemetry and device-key revocation on hardware.
- Backup restore drill, approved retention schedule, incident-response exercise and fluent-speaker Kannada review.

## Security acceptance matrix

| Test | Expected result |
|---|---|
| Anonymous active listing read | Allowed |
| Anonymous offer insert | Denied |
| User reads another participant's paused listing | Denied |
| User updates another participant's listing | Denied |
| Buyer reads unrelated offer | Denied |
| Buyer spoofs listing owner | Denied |
| Buyer role bids on machinery listing | Denied by role trigger |
| Transporter bids on another transport listing | Denied by role trigger |
| Buyer/trader requests transport listing | Allowed when profile is complete |
| FPO directly inserts an unattributed produce lot | Denied |
| FPO aggregate contribution does not equal listing quantity | Denied by RPC |
| FPO contribution exceeds lot total | Denied by trigger |
| Transporter skips pickup states | Denied |
| Transporter confirms delivery as receiver | Denied |
| Requester advances transport before delivery | Denied |
| Unverified municipality account reads/responds to enquiry | Denied |
| Verified municipality user from another district reads enquiry | Denied |
| Participant submits enquiry to a different district contact | Denied |
| Requester changes enquiry details after submission | Denied |
| Missing/stale terms consent at signup | Auth user creation denied |
| Participant edits own role or consent record | Denied |
| Invalid device key / revoked device | Telemetry denied |
| Device exceeds telemetry rate | HTTP 429 |

## Financial example

Offer ₹2,400/quintal × 8 quintals = ₹19,200 gross. Farmer-borne costs ₹1,250. Expected net = ₹17,950; expected net per quintal = ₹2,243.75. This is an estimate, not settled proceeds.

## Release gates

- Typecheck, tests, build and dependency audit pass.
- All pending migrations apply to a clean test database and are reviewed against production schema.
- Supabase RLS and role restrictions are verified with two real accounts.
- Magic-link delivery, redirects and profile onboarding pass.
- Chrome, Firefox, mobile and keyboard/accessibility checks pass.
- Hardware simulation and physical firmware build pass; real hardware test is documented separately.
- Backup/restore, privacy/retention, support and incident procedures are approved.
- No critical/high security finding remains.

## Current release classification

Build work is being completed on `feature/complete-platform`. New feature migrations and code are not yet applied to the production Supabase project or deployed to the production Vercel alias. Do not call the new build production-ready until the not-yet-verified items above are completed.
