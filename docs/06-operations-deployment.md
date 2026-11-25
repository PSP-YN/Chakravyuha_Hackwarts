# Operations and Deployment Runbook

## Environments
Local uses developer credentials and test data. Preview uses isolated test credentials. Production uses a dedicated Supabase project and Vercel project; do not reuse unrelated app credentials.

## Environment
~~~env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
~~~
Only publishable key in browser. Never put service_role/secret in NEXT_PUBLIC or Git.

## Local setup
1. Node.js 20.9+ and npm.
2. Clone repository and run npm install.
3. Copy .env.example to .env.local and configure URL/key.
4. Apply migration under supabase/migrations to dedicated project.
5. Configure Supabase Auth email redirect URLs for localhost and production.
6. Run npm run dev, npm run typecheck and npm run build.

## Supabase
Create dedicated project in approved organisation and ap-south-1. Wait ACTIVE_HEALTHY. Apply migration. Verify Data API grants and RLS. Retrieve URL and publishable key. Configure Auth redirects. Test with two accounts.

## Vercel
Link project to PSP-YN/Chakravyuha_Hackwarts; root directory is repository root; framework Next.js. Add public env variables to Preview and Production. Deploy main. Wait for build; inspect logs; smoke-test URL. Configure custom domain only after DNS ownership is confirmed.

## Release checklist
- Main contains reviewed code.
- Migration applied and verified.
- RLS tested with two accounts.
- Auth redirect allowlist includes production.
- Vercel env configured.
- Build passes.
- Production URL returns 200.
- Auth, listing, offer and net calculation flows pass.
- Mobile at 360px checked.
- No secret in repository or client bundle.
- Known limitations documented.

## Rollback
Revert to last known-good Vercel deployment. Do not run destructive schema rollback without backup and tested forward migration. Preserve transaction data. Disable writes only when integrity/security requires it.

## Incident response
Record time, route and SHA; classify data exposure/integrity/availability/UX; rotate exposed credentials; inspect logs; preserve minimal evidence; deploy reviewed fix; write post-incident review.
