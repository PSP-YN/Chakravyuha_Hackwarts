# Data Model and Security

## Conventions

UUID identity; Supabase Auth UUID foreign keys; integer paise for money; numeric quantities with explicit units; UTC timestamps; constrained status values; immutable event rows where history matters.

## Core data

- `user_profiles`: participant type, profile fields, language preference, verification state and immutable policy-consent versions.
- `market_listings`, `market_offers`: produce, machinery, by-product and transport listings; buyer/seller offers; requested times and cost components.
- `machinery_bookings`, `machinery_booking_events`, `machinery_booking_evidence`: provider/customer bookings, lifecycle and private evidence.
- `farmloop_processor_acceptances`, `material_quality_checks`: processor proposals and quality submissions/reviews.
- `transport_jobs`, `transport_job_events`: accepted transport offers, immutable route/vehicle snapshot, pickup-to-delivery lifecycle and private evidence.
- `fpo_members`, `fpo_lot_contributions`: FPO member register and aggregate lot attribution snapshots. The aggregate quantity must equal the sum of member contributions.
- `municipality_contacts`, `municipality_service_enquiries`, `municipality_service_enquiry_events`: source-linked contacts, district-scoped requests and shared status history.
- `participant_notifications`, `participant_reports`, `market_disputes`, `listing_moderation_actions`, `platform_audit_events`: participant updates, trust and audit.
- `storage_guardian_devices`, `storage_guardian_device_keys`, `storage_guardian_readings`: device ownership, hashed credentials, sensor values and advisory assessment.

## Role-specific listing boundaries

- Farmer: produce and agricultural by-product listings; may request machinery and transport.
- Buyer/trader: may offer on produce and transport services; cannot publish listings or bid on machinery.
- Machinery owner: may publish machinery services and offer on produce/transport.
- Waste processor: uses FarmLoop acceptance workflows; cannot publish general listings or submit generic market offers.
- Municipality: administrator-verified district-scoped service enquiries and responses; cannot publish commercial listings.
- Transporter: may publish transport services and progress accepted jobs; cannot bid on another transport listing.
- FPO/cooperative: by-product listings and member-attributed aggregate produce lots; may request machinery/transport.

These constraints are enforced by database triggers and RLS as well as the UI.

## RLS and database invariants

- Active listings are discoverable; owners can read their inactive listings.
- Listing inserts require a complete profile, caller ownership and a role permitted for that category.
- FPO produce listings are created through the aggregate-lot workflow; member quantities must be unique, positive, active-member attributed and sum exactly to the lot quantity.
- Offers are visible only to buyer and listing owner. Buyer identity, active listing, owner relationship and role/category compatibility are checked.
- New offers cannot be inserted directly in accepted/completed states. Seller acceptance and buyer withdrawal are constrained by database triggers.
- Accepted quantities cannot exceed listing quantity; listing-row locking serializes acceptance checks.
- Machinery acceptance checks availability and rejects overlapping booking windows.
- Transport offers require a future pickup time within provider availability. Accepted offers create a transport job exactly once. Only the transporter can advance pickup/transit states; only the requester can confirm delivery. Cancellation is limited to pre-pickup states and requires a reason.
- Transport evidence is stored in a private bucket; object paths and reads are scoped to the two job participants.
- Municipality requests are visible to the requester, administrators and verified municipality profiles in the matching district. The requester district must match the selected contact district at insertion. Only the requester can withdraw a submitted request; verified district-matched municipality users can respond.
- Participant notification and event tables are read-scoped to the involved parties.
- User participant type and policy-consent records cannot be changed by the participant after registration.
- Device credentials are stored as SHA-256 hashes. Revocation disables the device and revokes its key. Telemetry is rate-limited.
- UPDATE policies include USING and WITH CHECK. Admin privileges are server-controlled.

## Threat model

| Threat | Control |
|---|---|
| IDOR | RLS with `auth.uid()` and participant relationship checks |
| Owner/buyer spoofing | RLS and database triggers validate caller and listing owner |
| Role escalation | Immutable participant type; database role/category guards |
| Offer state injection | Pending-only insert and transition triggers |
| Over-acceptance | Listing-row lock and quantity bounds |
| Machinery double-booking | Accepted-window overlap guard |
| Transport status forgery | Actor-specific state machine and immutable booking fields |
| Evidence leakage | Private bucket, participant-scoped path and read policy |
| FPO quantity misattribution | Atomic aggregate RPC, unique member allocation, immutable snapshots and total guard |
| Municipality cross-district access | District-matched RLS and transition trigger |
| Device key exposure | Hash-only storage, one-time display, revocation, TLS certificate validation |
| Telemetry spam | Five-second minimum interval and rolling hourly limit |
| Admin escalation | No client-controlled admin role |
| Stale mandi data | Source attribution, observation time and cache expiry |

## Privacy and release requirements

Do not collect Aadhaar, bank credentials, OTPs, land records or unrelated identity documents. Device location and participant-entered addresses should be minimised. A formal retention schedule, account export/deletion flow, production SMTP validation, backup/restore drill, incident response and independent security review are release gates.
