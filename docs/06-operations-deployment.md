# Operations and Deployment Runbook

## Environments
Local uses developer credentials and test data. Preview uses isolated test credentials. Production uses a dedicated Supabase project and Vercel project; do not reuse unrelated app credentials.

## Environment
~~~env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~
Only publishable key in browser. Never put service_role/secret in NEXT_PUBLIC or Git.

## Local setup
1. Node.js 20.9+ and npm.
2. Clone repository and run npm install.
3. Copy .env.example to .env.local and configure URL/key.
4. Apply migration under supabase/migrations to dedicated project.
5. Set Supabase Auth Site URL to the canonical production URL and allow exact production plus localhost redirect URLs. The application sends magic-link callbacks to NEXT_PUBLIC_SITE_URL.
6. Run npm run dev, npm run typecheck and npm run build.

## Supabase
Create dedicated project in approved organisation and ap-south-1. Wait ACTIVE_HEALTHY. Apply migration. Verify Data API grants and RLS. Retrieve URL and publishable key. Configure Auth redirects. Test with two accounts.

## Vercel
Link project to PSP-YN/Chakravyuha_Hackwarts; root directory is repository root; framework Next.js. Add NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and NEXT_PUBLIC_SITE_URL to Preview, Production and Development. Git integration is connected to PSP-YN/Chakravyuha_Hackwarts. Production domain: https://krishi-connect-360.vercel.app. Push reviewed commits to main; inspect build logs and smoke-test the URL. Configure custom domain only after DNS ownership is confirmed.

## Release checklist
- Main contains reviewed code.
- Migration applied and verified.
- RLS tested with two accounts.
- Auth Site URL and redirect allowlist include production.
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
