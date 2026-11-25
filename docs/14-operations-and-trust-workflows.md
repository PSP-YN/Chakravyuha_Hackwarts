# Operations and Trust Workflows

This document describes how to operate the KRISHI CONNECT 360 pilot. It is an operating procedure, not a claim that every external control is independently certified.

## Authentication and roles

- Authentication uses Supabase email magic links. The redirect target is the configured site URL; after authentication the landing page routes signed-in participants to /workspace.
- Participant type (farmer, buyer, provider, processor, fpo, other) is self-declared and is used for workflow presentation. It is not accreditation.
- Verification state is controlled by platform administrators. A participant cannot promote their own verification status.
- Administrator authorization reads app_metadata.role from the signed JWT. Do not use editable user_metadata for authorization.

### Assign the first platform administrator

1. Sign in to the Supabase Dashboard for project zimgkzfahqmenqlfzyqi.
2. Open Authentication → Users and select the intended operator account.
3. Edit Raw App Meta Data and add the JSON property "role": "admin" (preserve any other app metadata already present).
4. Save the user, then sign out and sign back in so the new JWT contains the updated app metadata.
5. Confirm the Administration section appears in the workspace. Do not grant this role to a participant or an untrusted account.

The role is not set from the public profile form. Only a trusted Supabase project administrator should assign it.

## Marketplace and trust workflow

- Listing creation, offer insertion and offer status changes are enforced by Postgres RLS and database triggers.
- A participant report is visible to its reporter and platform administrators.
- A dispute is available to the parties of an accepted or completed offer and to platform administrators.
- Administrators can triage reports and disputes, record resolution notes and moderate listing visibility (active, paused, closed) with a reason recorded in an append-only moderation history table.
- Machinery offer acceptance creates a booking record. Provider schedule conflicts are checked against active bookings across the provider's listings.
- Booking state transitions are recorded in an append-only event table. Providers can reschedule, start and complete a job; either party can cancel before the job starts with a reason.
- Booking evidence is stored in a private Storage bucket. Only the booking parties and administrators can read evidence through authenticated access.
- FarmLoop processor requests are explicit proposals. The listing owner accepts or rejects; the processor may withdraw while pending.
- Quality records begin as pending. A platform administrator can mark a submitted record verified or rejected after reviewing its attached report. This is a platform review, not a laboratory accreditation or government certificate.

## Data and privacy boundaries

- Do not publish exact farm/home coordinates. The current listing form rounds provider coordinates before storing them.
- Do not store Aadhaar numbers, bank credentials, passwords, OTPs or unrelated identity documents in listing descriptions or evidence.
- Evidence uploads accept PDF/JPEG/PNG/WebP up to 10 MB. Private signed URLs expire quickly; do not paste them into public channels.
- Participant-reported completed offers are not proof of payment or settlement.
- AGMARKNET prices are reference observations and are not guaranteed buyer offers.

## Monitoring

- Vercel deployment and runtime logs are the first check for application errors.
- GET /api/health performs a lightweight read-only Supabase Data API check. HTTP 200 means the database read succeeded; HTTP 503 means the dependency is unavailable or unconfigured. It does not certify all workflows.
- Review Supabase Logs for Auth, Postgres and Storage errors.
- Review Supabase Security Advisors after schema or policy changes.
- Market-price route failures should be checked separately because the public AGMARKNET portal can rate-limit or change its response.

## Backup, restore and retention

- Confirm the current Supabase plan's backup frequency and retention in the project dashboard before accepting live pilot data. Do not assume point-in-time recovery is enabled.
- Before a schema release, keep the migration in version control and verify it is recorded in Supabase migration history.
- Schedule a restore drill into a non-production project before unrestricted onboarding. A successful backup indicator is not a restore test.
- Retention periods for participant reports, disputes and uploaded evidence require approval against the pilot's legal and operational obligations. Until that policy is approved, do not promise automatic deletion or indefinite retention.
- Account deletion requests must be handled by an authorized project operator and coordinated with related offers, disputes, reports and evidence so that legal and operational records are not silently destroyed.

## Incident response

1. Record the UTC time, affected route/table, deployment SHA and a minimal reproduction. Do not copy secrets or full participant records into issue trackers.
2. For suspected account compromise, revoke the affected user's sessions in Supabase Auth, disable the account as appropriate, and rotate any exposed credentials.
3. For a data exposure, restrict the affected RLS policy or Storage access first; preserve relevant logs; identify affected records and participants.
4. Roll back the Vercel deployment if the application release caused the incident. Database rollback must be planned separately; do not assume a code rollback reverses a migration.
5. Notify affected participants and relevant authorities when required by the applicable policy and law.
6. Record remediation, verification steps and follow-up actions before reopening the affected workflow.

## Release gates before broad public rollout

- Two-account buyer/seller transaction tests in Chrome and Firefox, including RLS denial cases.
- Admin-role assignment and report/dispute/quality review test.
- Booking create, overlap rejection, reschedule, cancel, start, complete and evidence access test.
- FarmLoop processor request, listing-owner decision and quality-report review test.
- Backup/restore drill, approved retention policy and incident-response exercise.
- Kannada review by fluent speakers and field usability testing with pilot participants.
