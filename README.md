# KRISHI CONNECT 360

**Four agricultural connections. One operating network. Plus smart storage monitoring.**

A farmer-first agricultural coordination platform for Karnataka. The pilot connects farmers, buyers and traders, machinery owners, waste processors, transporters, municipalities and FPOs through shared listings, offers, bookings, enquiries and activity history.

Production URL: https://krishi-connect-360.vercel.app

## Product modules

- **KrishiMarket 360** — produce listings, buyer offers, accepted quantities, participant transaction history, farmer-borne cost tracking and expected net-realisation estimates. AGMARKNET prices are clearly labelled as public mandi reference observations, not offers or guaranteed prices.
- **KrishiShare** — machinery and field-service listings, compatibility details, availability, booking requests, overlap protection, provider status updates, event history and private evidence.
- **FarmLoop** — agricultural by-product exchange, processor acceptance proposals, moisture/contamination disclosures and quality records. Participant-submitted values are not independent certification.
- **KrishiTransit** — transport service listings and requests, vehicle capacity, pickup and destination, loading/unloading responsibilities, accepted-job lifecycle, delivery confirmation, cancellation and private evidence.
- **FPO workspace** — member register, active/inactive membership, aggregate produce lots and an immutable member-quantity attribution ledger. Aggregate produce lots are created through the FPO workflow, not generic listing forms.
- **Municipal coordination** — 23 source-linked contacts across Bengaluru Urban, Mysuru and Tumakuru; district-scoped waste-service enquiries, verified municipality responses and a participant-visible timeline. Missing phone/email values remain blank. An enquiry is not a confirmed municipal collection booking.
- **Storage Guardian (hardware add-on)** — ESP32 + DHT22 ambient temperature/humidity + DS18B20 grain-core temperature, authenticated HTTPS telemetry, offline local alerts, advisory condition scoring and a Wokwi simulator. The score is a transparent prototype heuristic, not a spoilage probability or grain-moisture measurement.

## Participant roles

1. Farmer
2. Buyer / trader
3. Machinery owner
4. Waste processor
5. Municipality / local-body contact
6. Transporter
7. FPO / cooperative

Role selection is stored in the participant profile. Database triggers and RLS enforce role-specific listing and offer boundaries; hiding a button is not the security boundary.

## Shared capabilities

- Separate sign-in and sign-up routes; email magic-link authentication and profile onboarding.
- English/Kannada UI, per-user language preference, role instruction audio and a storage-specific audio guide.
- Persistent listings, offers, bookings, transport jobs, municipal enquiries, notifications, event timelines and activity records.
- Participant reports, disputes, moderation actions and private evidence storage.
- Municipality directory records retain official source links and verification dates; no contact details are fabricated by the application.
- Responsive desktop/mobile layouts, accessibility states, privacy notice and terms of use.

## Technology

- Next.js 15 App Router, React 19, TypeScript
- Supabase Auth, PostgreSQL 17, Row Level Security, private Storage and Edge Functions
- Vercel hosting, Mumbai region
- AGMARKNET public portal through a cached server-side Next.js route
- ESP32 Arduino / PlatformIO firmware and Wokwi simulator
- Self-hosted DM Sans, DM Mono and Noto Sans Kannada fonts

## Local development

1. Use Node.js 22 and install dependencies: `npm ci`.
2. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
3. Run `npm run dev`.
4. Validate with `npm run typecheck`, `npm test`, `npm run build`, `npm audit --audit-level=high`.
5. Supabase schema changes are versioned in `supabase/migrations`. Do not apply production migrations or deploy the production app until the release gate in `docs/06-operations-deployment.md` is approved.

## Storage Guardian hardware

See [`hardware/krishi-guard/README.md`](hardware/krishi-guard/README.md) for the bill of materials, wiring, PlatformIO environments, secrets handling, certificate validation, simulator steps and firmware build instructions. Never commit `secrets.h` or a real device key.

## Trust and data boundaries

- The pilot does **not** process payments, verify settlement or use AI-generated decisions.
- Accepted offers record participant agreement; they are not proof of payment, delivery, weighment or settlement.
- Expected net realisation is an estimate from entered offer value and farmer-borne costs.
- AGMARKNET values are reference observations and may be delayed or unavailable.
- Participant type is self-declared. Administrative review is not government identity, land or laboratory accreditation.
- Municipality enquiries are not pickup bookings or emergency services.
- Storage condition indicators are advisory. They do not certify grain quality, diagnose contamination or measure grain moisture.
- A formal retention schedule, self-service account deletion, production SMTP validation, backup/restore drill and physical hardware acceptance test remain release gates.
- Kannada copy requires fluent-speaker review and field usability testing before broad public rollout.

## License

MIT
