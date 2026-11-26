# Domain Workflows and API Contracts

## Shared commercial vocabulary

- Reference price: external observation, not an offer.
- Asking price: seller's indicative price.
- Buyer offer: counterparty's proposed terms.
- Accepted offer: accepted participant terms, not proof of payment.
- Completed activity: participant-reported fulfilment unless separately evidenced.
- Expected net realisation: gross offer value minus farmer-borne costs.
- Actual settled proceeds: not available in this no-payment pilot unless separately recorded with evidence.

## Farmer net-realisation estimate

`Gross = offered price per unit × accepted quantity`

`Expected net = gross − transport − handling − commission − other farmer-borne costs`

Use integer paise for money and explicit units for quantities. Validate positive quantities, non-negative costs and unit consistency. A net estimate can be negative; do not clamp it to zero. It is an estimate, not a settlement record.

## Listing lifecycle

Draft is client-side only. Persisted listing states: active, paused and closed. Owners may pause/reactivate/close according to database transition rules. Active listings are discoverable; inactive listings are owner-only.

Role/category constraints are enforced in Postgres:

- Farmer: produce and by-product.
- Buyer/trader: no commercial listing publication.
- Machinery owner: machinery services.
- Waste processor: FarmLoop acceptance workflow, not general listings.
- Municipality: service enquiries, not commercial listings.
- Transporter: transport services.
- FPO: by-product listings; produce lots through member-attributed aggregation.

## Offer lifecycle

`pending → accepted → completed`

`pending → rejected` or `pending → withdrawn` (buyer withdrawal)

The buyer identity, listing owner, listing status and participant role are checked at insertion. Seller acceptance is a database transition. Accepted quantities cannot exceed listing quantity. By-product processor proposals use FarmLoop acceptance, not generic market offers.

## Machinery booking lifecycle

Accepted machinery offers create a booking with provider, requester, requested service time and duration. The database checks listing availability and overlapping accepted booking windows. Provider reschedule/start/complete and participant cancellation actions create immutable events. Evidence is private to the booking parties and authorized administrators.

## KrishiTransit lifecycle

An accepted transport offer creates one transport job. The job stores a snapshot of pickup, destination, vehicle, capacity, scheduled pickup and loading/unloading responsibility.

`confirmed → pickup_ready → picked_up → in_transit → delivered_pending_confirmation → completed`

Only the transporter advances pickup/transit/delivery states. Only the requester confirms completion. Either party can cancel before pickup with a reason. Evidence files are private and job-scoped. Transport availability dates and future pickup time are checked by the database.

## FarmLoop lifecycle

A farmer/FPO publishes a material listing with quantity, moisture/contamination disclosures, location and collection conditions. A processor submits an acceptance proposal with requested quantity/price. The owner accepts/rejects; the processor may withdraw while pending. Quality values are labelled as self-declared, pending, reviewed, verified or rejected according to the recorded workflow. No automatic certification is implied.

## FPO aggregation

The FPO registers members and marks them active/inactive. Aggregate produce lots are created by a single database workflow that validates unique active member allocations, locks the lot and requires the sum of member quantities to equal the listing quantity. Each contribution stores a member-name/village/district snapshot so later member edits do not rewrite historical attribution.

## Municipality enquiry lifecycle

A participant selects an active official directory contact and submits material type, optional quantity, pickup location and details. The enquiry is visible to the requester, administrators and municipality profiles in the contact's district. Municipality users can acknowledge, provide information, refer or close; the requester can withdraw while submitted. All status changes create a shared timeline and notifications. An enquiry is not a confirmed collection booking.

## Storage Guardian device API

- `register`: authenticated participant registers a device; a one-time random key is returned and only its SHA-256 hash is stored.
- `simulate`: authenticated participant submits clearly labelled simulated readings.
- `revoke`: authenticated owner disables the device and revokes the key.
- `telemetry`: physical ESP32 sends HTTPS readings with the device key; certificate validation is enabled for physical builds.

Sensor values are range-checked. The endpoint enforces a five-second minimum interval and a rolling hourly limit. The condition score is a transparent prototype heuristic using ambient humidity, grain-to-air temperature difference and recent grain-core temperature trend. It is not a probability, direct moisture measurement or certification. Simulation readings are not physical readings.

## Error contract

Authentication required → sign in. Validation error → field correction. Permission denied → refresh and verify participant role. Conflict → refresh current state; do not blindly retry state-changing operations. Network error → preserve form values and retry. Never expose SQL internals, device keys or service-role secrets.

## External data

AGMARKNET records must retain provider/source URL, market, commodity, grade, unit, price and observation date. Label missing/stale data honestly. Public endpoint changes or rate limits must not be represented as a guaranteed feed.
