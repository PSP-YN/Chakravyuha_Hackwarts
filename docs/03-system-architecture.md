# System Architecture

## Logical architecture
Browser (mobile/desktop) → Next.js App Router on Vercel → Supabase Auth + Postgres Data API → RLS-protected tables.

## Stack
| Layer | Technology |
|---|---|
| Web | Next.js App Router |
| Language | TypeScript strict |
| UI | React and lightweight CSS |
| Auth/data | Supabase Auth + Supabase JS |
| Database | PostgreSQL |
| Hosting | Vercel |
| CI | GitHub Actions |
| Maps | Deferred; OpenStreetMap can be added later |
| AI | Optional, never required for core transactions |

## Trust boundaries
Browser input is untrusted. Identity comes from Supabase Auth. Ownership is checked again in RLS. Active listing fields are intentionally discoverable. Offers are visible only to buyer and listing owner. Admin capabilities cannot be inferred from editable user metadata. External data carries source and observation timestamp.

## Data flow
1. User authenticates.
2. Browser creates caller-scoped Supabase client using publishable key.
3. RLS filters reads.
4. Writes carry caller ID and RLS checks it against auth.uid().
5. Constraints validate category, status, units and monetary ranges.
6. UI refreshes only after confirmed write response.
7. Transaction completion remains participant-reported unless a verification process is introduced.

## Scale path
Pilot: one Next.js app and dedicated Supabase project in ap-south-1. Growth: server-side domain services for sensitive transitions, audit events, background ingestion, rate limiting and observability. Scale: queues, read models, search and analytics only when measured needs justify them.

## Reliability
Paginate listings, index discovery and ownership queries, preserve form values on network errors, use request timeouts and visible retry. Add idempotency keys for future payment/booking operations. Backups and restore drills precede commercial scale.

## ADRs
Monolith-first; Postgres RLS for isolation; integer paise; no payment in MVP; no LLM dependency for financial calculations.
