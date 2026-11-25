# KRISHI CONNECT 360

**One Platform. Three Agricultural Connections.**

A farmer-first agricultural coordination network for Karnataka. KRISHI CONNECT 360 connects produce sellers and buyers, machinery providers and users, and agricultural by-product processors through three participant-led workflows.

Production: https://krishi-connect-360.vercel.app

## Product modules

- **KrishiMarket 360** — produce listings, participant offers, cost-aware net-realisation estimates and official AGMARKNET mandi reference prices.
- **KrishiShare** — machinery/service discovery by operation, tractor HP, implement, location, service radius, availability, operator and fuel terms; accepted requests create bookings with provider conflict checks.
- **FarmLoop** — agricultural by-product listings, processor acceptance proposals, material specifications and participant-submitted quality reports.
- **Shared Economic Impact Engine** — expected farmer net, participant-reported completed activity and reference prices are kept distinct. No settlement is inferred.

## Current application capabilities

- Supabase passwordless email sign-in; participant profiles and English/Kannada language preference.
- Supabase Postgres, Row Level Security, database triggers and private Storage buckets.
- Listing creation and owner status management; offers, seller decisions and buyer withdrawal.
- Machinery booking lifecycle: confirmation, provider rescheduling, cancellation, job start/completion, event history and private evidence.
- FarmLoop processor acceptance, pending quality records and administrator review.
- Participant reports, transaction disputes and administrator listing moderation with reasoned action history.
- Public AGMARKNET 2.0 market-price lookup through a server-side proxy; no market-data API key is required.
- Responsive landing page, desktop workspace navigation and mobile bottom navigation.

## Design system

- **Visual direction:** calm, earthy-premium, light-first interface with generous spacing and restrained card depth.
- **Core palette:** forest #214A36, deep forest #163626, leaf #6F8D4E, lime #D7ED76, paper #F7F8F3, white surface #FFFFFF, muted text #758074, border #E1E7DC.
- **Module accents:** KrishiMarket amber, KrishiShare warm ochre, FarmLoop sage/green. No more than two accent colours dominate a screen.
- **Typography:** DM Sans for English UI, Noto Sans Kannada for Kannada UI, DM Mono for compact data labels. Currency uses Indian rupee formatting and integer paise internally.
- **Controls:** visible focus states, keyboard-dismissable offer dialog, responsive forms and mobile navigation. Reduced-motion preferences are respected.
- **Language:** the English/Kannada toggle persists in local browser storage; participant preference can also be saved to the Supabase profile.

## Technology

- Next.js App Router 15 + React 19 + TypeScript
- Supabase Postgres 17, Auth, Row Level Security and private Storage
- Vercel production deployment
- AGMARKNET 2.0 public portal endpoints via a cached Next.js server route
- Native CSS design system; no runtime UI framework or payment SDK

## Local development

1. Install Node.js 22 and dependencies: npm ci.
2. Copy .env.example to .env.local and set the Supabase project URL and publishable key.
3. Run npm run dev.
4. Run validation with npm run typecheck, npm test, npm run build and npm audit --audit-level=high.

See docs/06-operations-deployment.md, docs/07-qa-release.md and docs/14-operations-and-trust-workflows.md.

## Trust and data boundaries

- AGMARKNET mandi prices are reference observations, not guaranteed buyer offers.
- Expected net realisation is an estimate from entered offer and farmer-borne costs; it is not proof of payment or settlement.
- Participant type is self-declared. Administrative verification is not government identity, land or laboratory accreditation.
- Quality data is participant-submitted until reviewed. Review is not independent certification.
- No payments, AI, government integrations, delivery fulfilment or verified settlement are included.
- Kannada UI copy is implemented but still requires fluent-speaker review and field usability testing before broad rollout.
- Real two-account transaction validation, backup/restore drills, approved retention policy, incident-response exercise and production SMTP delivery validation remain release gates.

## License

MIT
