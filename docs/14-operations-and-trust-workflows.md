# Operations and Trust Workflows

This is an operating procedure for the KRISHI CONNECT 360 pilot. It is not a claim of government accreditation, independent quality certification or legal compliance certification.

## Authentication, consent and roles

- Authentication uses Supabase email magic links. New signups must accept the current Terms of Use and Privacy Notice; policy version and consent timestamp are stored in the participant profile.
- Participant type is selected at registration and immutable for the participant. It is self-declared, not accreditation.
- Profile completion requires name, phone, district, taluk and village. Municipality and FPO profiles also require an organisation name.
- Verification state is controlled by platform administrators. Participants cannot promote their own verification status.
- Administrator authorization reads trusted `app_metadata.role` from the signed JWT. Never use editable `user_metadata` for authorization.

### Assign the first platform administrator

1. Sign in to the Supabase Dashboard for project `zimgkzfahqmenqlfzyqi`.
2. Open Authentication → Users and select the intended operator account.
3. Edit Raw App Metadata and add `"role": "admin"`, preserving any other app metadata.
4. Sign out and sign back in so the new JWT includes the updated metadata.
5. Confirm the Administration section appears. Do not grant this role to a participant or an untrusted account.

## Marketplace and machinery

- Listing creation, offer insertion and offer status changes are enforced by Postgres RLS and triggers.
- Listing category is tied to participant role: farmer/FPO produce and by-product, machinery owner machinery, transporter transport. FPO produce must use member-attributed aggregation.
- Offers are role/category restricted. Buyer/trader may offer on produce and transport; farmers/FPOs may request machinery and transport; waste processors use FarmLoop acceptance.
- Participant reports are visible to their reporter and platform administrators.
- Disputes are available to the parties of an accepted/completed offer and administrators.
- Administrators triage reports/disputes, record resolution notes and moderate listing visibility with a reason.
- Machinery acceptance creates a booking. Provider overlap is checked across accepted bookings. Booking events are append-only; evidence is private to booking parties and authorized administrators.

## FarmLoop and quality

- Processor requests are proposals. Listing owner accepts/rejects; processor may withdraw while pending.
- Material type, moisture, contamination and collection details are participant-supplied unless explicitly reviewed.
- Quality records begin pending. Administrative review is not laboratory accreditation or a government certificate.
- Do not recommend open burning or unsafe disposal. Farm reuse/composting is conditional on material type and safe local practice.

## KrishiTransit

- Transport listings require vehicle type, capacity, origin and destination and must be published by a transporter account.
- An accepted offer creates one job with a snapshot of route, vehicle, capacity, pickup time and loading/unloading responsibilities.
- Transporter progresses pickup-ready, picked-up, in-transit and delivered-pending-confirmation. Requester confirms completion.
- Cancellation is allowed only before pickup and requires a reason.
- Evidence uploads are private; signed links expire. The job timeline records state changes and evidence references.

## FPO/cooperative operations

- Register each member and mark inactive members inactive rather than deleting historical relationships.
- Publish aggregate produce through the FPO aggregate-lot workflow. Each active member's quantity must be unique and the sum must equal the aggregate lot quantity.
- Member identity snapshots preserve historical attribution if the member's profile details change later.
- Do not publish an FPO produce lot through the generic listing form.

## Municipality and waste-service enquiries

- Published directory entries must include official source URL and verification date. Only platform administrators can publish or change directory contacts.
- Participants submit a district-matched enquiry with material, quantity if known, pickup location and details.
- Only platform-admin-verified municipality accounts see enquiries for their district and may acknowledge, provide information, refer or close. New municipality accounts begin unverified. A participant may request review; only an administrator can mark the account verified. The requester may withdraw while the enquiry is submitted.
- An enquiry is not a confirmed municipal pickup booking or emergency response. Confirm service availability and rules directly with the local body.

## Storage Guardian hardware

- Device registration returns a random key once; only its hash is stored. Keep the key in local `secrets.h` and never commit it.
- Physical ESP32 firmware validates the server certificate. Insecure TLS is allowed only for the Wokwi simulation build.
- Device revocation disables ingestion and revokes the credential. Register a replacement device if the key is lost.
- Telemetry has a five-second minimum interval and a rolling 150-reading hourly limit.
- Condition score is advisory and uses ambient relative humidity, grain-to-air temperature difference and recent grain-core temperature trend. It is not a spoilage probability, moisture measurement, quality certificate or substitute for inspection/lab testing.

## Privacy and evidence

- Do not publish home addresses or exact private farm coordinates.
- Do not upload Aadhaar, bank credentials, OTPs, passwords or unrelated identity documents.
- Evidence uploads are private and limited by bucket policy; do not share signed URLs publicly.
- Participant completion is not proof of payment or settlement. The pilot does not process payments or use AI-generated decisions.
- A formal retention schedule and self-service deletion flow are not yet configured. Do not promise automatic deletion or indefinite retention.

## Monitoring and release

- Vercel deployment/runtime logs are the first check for web errors.
- `GET /api/health` is a lightweight dependency check, not an end-to-end certification.
- Review Supabase Auth, Postgres, Storage and Edge Function logs. Run Security Advisors after policy changes.
- AGMARKNET may rate-limit or change its public portal; market-price failures must be reported separately from core marketplace health.
- Verify backup frequency and run a restore drill in non-production before broad onboarding.
- Two-account role/RLS tests, magic-link delivery, mobile/keyboard review, Kannada field review and physical hardware acceptance remain release gates.
