# Operations and Deployment Runbook

## Release principle

Complete implementation and validation on `feature/complete-platform` first. Do not push unfinished work to `main` or trigger a production deployment during the build phase. Production release is the final phase after code review, migration validation, browser tests and the real-account acceptance gate.

## Environments and secrets

Web application environment:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only the publishable key belongs in browser-visible variables. Never expose `service_role`, database passwords, SMTP credentials or device keys through `NEXT_PUBLIC_*`, Git or client bundles.

Supabase Edge Functions use platform-provided `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`. Do not copy the service-role key into `.env.local` or the ESP32 firmware.

ESP32 secrets are local-only in `hardware/krishi-guard/secrets.h`; the file is ignored by Git. The firmware uses the publishable key as the API gateway key and a per-device key for device authentication. The full device key is shown only once at registration.

## Local setup

1. Use Node.js 22 and run `npm ci`.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, publishable key and local site URL.
3. Run `npm run dev`.
4. Run `npm run typecheck`, `npm test`, `npm run build` and `npm audit --audit-level=high`.
5. Supabase CLI configuration is in `supabase/config.toml`; migrations are versioned in `supabase/migrations`.
6. Use an isolated local/test Supabase stack for destructive schema tests. Do not point `supabase db reset` at production.

## Production release sequence (only after build is signed off)

1. **Freeze code:** confirm feature branch HEAD, clean working tree, passing tests and reviewed diff.
2. **Backup:** verify current Supabase backup state and take an approved pre-release backup/export. A backup indicator is not a restore drill.
3. **Apply database migrations:** apply the pending migrations in timestamp order to project `zimgkzfahqmenqlfzyqi` in `ap-south-1`. Confirm every migration appears in Supabase migration history and query the created tables, policies, triggers and indexes.
4. **Deploy Edge Function:** deploy `storage-guardian` with `verify_jwt = false` as declared in `supabase/config.toml`. The function validates Supabase user JWTs itself for register/simulate/revoke and validates the per-device key for physical telemetry. Confirm function secrets are platform-managed and missing/invalid credentials are rejected.
5. **Verify Supabase configuration:** check Auth Site URL and exact redirect allowlist for `https://krishi-connect-360.vercel.app` and approved localhost URLs; verify email magic-link delivery; verify private Storage bucket policies and RLS advisors.
6. **Merge and push application:** merge the reviewed feature branch to `main` only after the preceding steps pass. This is the final web deployment trigger.
7. **Inspect Vercel:** wait for production deployment state READY, inspect build logs, confirm aliases and commit SHA.
8. **Smoke test:** landing, login, signup, workspace, role dashboard, market-price proxy, municipality directory/enquiry, transport, FPO, storage route, audio assets, `robots.txt`, `sitemap.xml` and health endpoint.
9. **Two-account acceptance:** perform buyer/seller, farmer/transporter, FPO member attribution and farmer/municipality enquiry journeys with separate real test accounts. Confirm negative RLS cases.
10. **Release decision:** classify as public pilot only after email, RLS, restore, support, retention and field-language gates are accepted. Otherwise label it controlled beta and publish blockers.

## Vercel configuration

- Repository: `PSP-YN/Chakravyuha_Hackwarts`
- Framework: Next.js
- Root directory: repository root
- Production domain: `https://krishi-connect-360.vercel.app`
- Region: Mumbai (`bom1`)
- Required web variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Do not deploy a feature branch to production. Preview deployments may be used for review only after database compatibility is handled.

## Rollback

Revert to the last known-good Vercel deployment if the application release causes a regression. Database rollback is separate: do not delete participant records or run destructive schema rollback without a backup and tested forward migration. Disable writes only when data integrity or security requires it.

## Incident response

1. Record UTC time, route/table, deployment SHA and minimal reproduction; never copy secrets or full participant records into issue trackers.
2. For account compromise, revoke sessions and rotate exposed credentials.
3. For data exposure, restrict the affected RLS policy or Storage access first, preserve relevant logs and identify affected participants.
4. For a hardware key leak, revoke the device in Storage Guardian and register a replacement.
5. Notify affected participants and authorities where required by policy and applicable law.
6. Record remediation, verification and follow-up actions before reopening the workflow.
