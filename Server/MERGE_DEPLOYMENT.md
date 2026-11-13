# AI and Stripe integration checkpoint

The local merge combines `c0bf842` (AI Assistant updation - 1) with `08c8599` (monthly Stripe invoice payments). Recovery branches:

- `backup/stripe-before-ai-20261111`: original local commit before the Stripe checkpoint.
- `backup/stripe-checkpoint-20261111`: committed Stripe implementation before the AI merge.

The merge automatically combined `Server/.env.example`. No source conflicts required choosing one implementation over another. The AI controller/routes/models, contractor changes and email utility were retained from the teammate's commit. Stripe services, raw-body webhook route and monthly invoice payment UI were retained. Private environment files remain ignored and unchanged.

## Hosting configuration

The repository deploys the Vite **client** from `Client` on Vercel. The Express **server** needs its own backend hosting environment; `Client/vercel.json` only supplies SPA rewrites. Configure private values on that backend, not in the browser bundle.

Vercel client build variables:

- `VITE_API_URL`: deployed backend base URL.
- `VITE_ELEVENLABS_VISITOR_AGENT_ID`: public ElevenLabs agent identifier, if the visitor assistant is enabled.

Backend variables required by the application:

- `CLIENT_URL`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` for Google authentication.
- `EMAIL_FROM` and either `RESEND_API_KEY` or all of `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (with `SMTP_PORT` as needed).
- `DECHUB_ADMIN_EMAILS`, `DECHUB_ADMIN_PASSWORD` for existing admin features.
- `SUPABASE_URL`, `SUPABASE_SECRET_KEY`; bucket settings `SUPABASE_CONTRACTOR_KYC_BUCKET`, `SUPABASE_CLIENT_KYB_BUCKET`, `SUPABASE_INVOICE_BUCKET` have defaults. KYC, KYB and invoice buckets must remain private.
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` for hosted invoice payment linking and verified payment events. See `STRIPE_SETUP.md`; deployed and CLI signing secrets differ.
- `AI_TOOL_SECRET`, `ELEVENLABS_WEBHOOK_SECRET` for the assistant's protected server tools and webhook. `AI_TALENT_REQUIRE_VERIFIED` is optional and defaults to `false`; choose deliberately whether AI searches require approved KYC.
- Preserve any existing `GOOGLE_SHEETS_ENABLED`, `GOOGLE_SHEETS_WEBHOOK_URL`, DocuSign and operational settings used by your deployment.

Never prefix backend secrets with `VITE_`. No hosting settings were changed by this merge.

At validation time, the local backend lacked `AI_TOOL_SECRET` and `ELEVENLABS_WEBHOOK_SECRET`; the client lacked `VITE_ELEVENLABS_VISITOR_AGENT_ID`. `AI_TALENT_REQUIRE_VERIFIED` was absent and uses its default. An absent `RESEND_API_KEY` is acceptable when SMTP is configured. Existing Stripe and Supabase values were present; their validity and live external services were not exercised.

## Validation limits

Offline tests cover Stripe invoice matching, signature validation, paid-state synchronization, duplicate events and client/admin email retry progress; AI talent matching and KYC filtering; signup consent/Google redirect behavior; contractor monthly invoice rules; private invoice and KYC/KYB storage behavior using mocked requests.

Do not run the existing `test:ai` command against production as a passive health check: it creates lead/search records and may send notification emails. Actual ElevenLabs calls, Stripe payments and forwarding, Google OAuth sign-in, Supabase service access, SMTP delivery and production deployment require controlled integration testing. These offline checks cannot guarantee every existing feature works with production services.

The configured server lint script currently cannot run because ESLint is not installed/configured by the server package. The client has no lint script. No unrelated lint tooling was added during this merge.

Local validation results on November 11, 2026:

- Server `npm run build`: passed.
- Focused TypeScript checks for the contractor/monthly invoice and Stripe/client billing screens: passed.
- Separate Vite production bundle: passed, with the existing large-bundle warning (about 10 MB before compression).
- Stripe payment and receipt tests plus `Server/tests/aiMerge.test.cjs`: passed.
- Existing offline signup/Google consent, contractor monthly invoice, invoice storage and KYC/KYB storage checks: passed. Older storage fixtures were corrected locally to supply the required MIME type and exit after assertions; application storage logic was unchanged.
- Full client `npm run build`: the TypeScript project build was stopped after more than ten minutes without a result. This remains an unresolved full-project validation limitation; do not treat focused checks as a full TypeScript build pass.
- A pre-existing duplicate Mongoose `conversationId` index warning appeared during the AI test.
- `.env` integrity and staged secret-pattern scans: passed.

## Push after review

After the merge commit and local checks, review `git status` and `git log`, then use a normal push:

```powershell
git status
git fetch origin
git log --oneline HEAD..origin/main
# If the command above shows new commits, merge and test them before continuing.
git push origin main
```

No force push is needed. Pushing may trigger connected hosting deployments, so do this only when approved and the hosting environments are configured.
