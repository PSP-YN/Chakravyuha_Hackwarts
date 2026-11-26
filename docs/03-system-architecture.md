# System Architecture

## Logical architecture

```text
Browser (desktop/mobile)
  └─ Next.js App Router (Vercel, bom1)
       ├─ Supabase Auth (email magic link)
       ├─ Supabase Postgres + RLS + database triggers
       ├─ Supabase private Storage (evidence)
       ├─ Supabase Edge Function (Storage Guardian device registration / telemetry)
       └─ AGMARKNET public portal (server-side cached proxy)

ESP32 + DHT22 + DS18B20
  └─ HTTPS telemetry + per-device key
       └─ Storage Guardian Edge Function
            └─ Postgres readings + advisory condition score
```

## Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Web UI | Next.js 15, React 19, TypeScript | Landing, onboarding, role dashboards, forms and history |
| Identity | Supabase Auth | Email magic links and authenticated identity |
| Application data | PostgreSQL 17 | Listings, offers, bookings, jobs, enquiries, members and events |
| Authorization | RLS + database triggers | Participant isolation, role boundaries and legal state transitions |
| Evidence | Supabase private Storage | Booking, transport and review evidence |
| Device API | Supabase Edge Function (Deno) | Device registration, key verification, telemetry, simulation and revocation |
| External data | AGMARKNET 2.0 | Public mandi reference observations through a cached server route |
| Hardware | ESP32, DHT22, DS18B20 | Ambient and grain-core sensor readings; local alarm |
| Hosting | Vercel + Supabase ap-south-1 | Web runtime and managed data services |

## Domain boundaries

- KrishiMarket: produce listings, offers, farmer-borne costs and reference market prices.
- KrishiShare: machinery listings, availability, compatibility, bookings and event history.
- FarmLoop: by-product listings, processor acceptance and quality records.
- KrishiTransit: transport offers become jobs only when accepted; the receiver confirms delivery.
- FPO: member attribution is created atomically with aggregate produce lots.
- Municipality: district-scoped service enquiries are distinct from confirmed municipal pickup bookings.
- Storage Guardian: hardware telemetry is separate from commercial transactions. Its score is a prototype heuristic.

## Trust boundaries

Browser input is untrusted. Identity comes from Supabase Auth. RLS checks ownership and participant relationships. Role types are immutable after registration and database triggers enforce which roles may publish each listing category or submit offers. Admin permissions are not inferred from editable user metadata. Evidence objects are private and paths are scoped to job participants. Device keys are stored as hashes and are not returned after registration.

## Data flow

1. User authenticates through Supabase Auth.
2. The browser creates a caller-scoped Supabase client with the publishable key.
3. RLS filters reads and validates writes against `auth.uid()`.
4. Database triggers validate role, state transitions, quantity limits, booking overlaps and immutable event records.
5. The UI refreshes only after a confirmed write response.
6. Accepted offers and completed jobs remain participant records; no payment settlement is inferred.
7. Storage Guardian verifies device key hashes and records source-labelled sensor readings; simulation readings are marked as simulated.

## Reliability and scale

The pilot uses a monolith-first design and indexed Postgres queries. AGMARKNET results are cached but the public endpoint has no formal SLA. Storage telemetry enforces a minimum interval and hourly request limit. Future scale work may add queues, search read models and analytics only when measured needs justify them. Backups, restore drills, retention policy and monitoring are required before commercial scale.

## Architecture decisions

- Postgres RLS and constraints are the primary authorization boundary.
- Integer paise is used for money; quantities carry explicit units.
- No payment processor or AI model is part of the current pilot.
- Storage Guardian is an optional sensor add-on; the web platform remains usable without hardware.
- Physical firmware validates the server certificate. Insecure TLS is restricted to the Wokwi simulation build.
