# KRISHI CONNECT 360

A Karnataka-first agricultural coordination platform connecting farmers, produce buyers, machinery providers, farmer groups and agricultural by-product processors.

## Product modules

- **KrishiMarket 360** — produce discovery, buyer offers and farmer net-realisation comparison.
- **KrishiShare** — machinery/service discovery and structured operation coordination.
- **FarmLoop** — quality-aware agricultural by-product and residue exchange.
- **Economic Impact Engine** — transparent tracking of proceeds, savings and completed transactions.

## Status

Greenfield implementation. The repository is being built from an empty state. Product and engineering decisions, system boundaries, security requirements, data model, operations and release criteria are documented in [docs/](./docs/).

## Technology

- Next.js App Router + TypeScript
- Supabase Postgres, Auth and Row Level Security
- Vercel deployment
- Responsive, low-bandwidth-aware web application

## Local development

See [docs/06-operations-deployment.md](./docs/06-operations-deployment.md) and `.env.example`.

## Important

Demo records, when enabled, must be visibly identified as simulated. Market reference prices are not buyer offers. Net-realisation estimates are not guaranteed sale proceeds. No payment, government verification or logistics fulfilment is implied unless explicitly integrated and tested.

## License

MIT


## Prototype scope

The current prototype includes three participant-led workflows: produce listings/offers, machinery service listings with requested booking windows, and agricultural by-product listings with typed quality/collection attributes. Owners can manage listing status; buyers can withdraw pending offers; sellers can accept/reject and mark accepted offers completed. Database triggers enforce offer transitions, accepted quantity limits and non-overlapping accepted machinery bookings.

**Explicitly not included:** payments, AI, government integrations, verified market prices, verified settlement, Kannada-reviewed copy, dispute resolution, live machinery calendar, logistics or external partner integrations. See [the roadmap](docs/12-roadmap.md) and [QA/release gates](docs/07-qa-release.md).
