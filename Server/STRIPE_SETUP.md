# Monthly client invoice payments

Set backend-only values in `Server/.env` (and the server hosting environment):

```dotenv
STRIPE_SECRET_KEY=your_Stripe_secret_or_restricted_key
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
```

For this flow, a restricted key needs Invoices Read. No publishable key or change to `PAYMENT_PROVIDER` is required. Never commit actual keys.

1. Create and finalize the invoice in Stripe for the client's billing/account email.
2. In Bridge Admin → Invoices, select the billing month and project, upload the PDF and enter its invoice number, amount, currency and Stripe invoice ID (`in_...`). Sending verifies these against Stripe. The PDF alone does not identify the Stripe payment.
3. The client receives the document and a Pay invoice button linking to Stripe's hosted invoice page.
4. Stripe payment status updates the linked monthly invoice. The client dashboard refreshes every 10 seconds and on window focus; admins refresh every 15 seconds. A one-minute reconciliation worker backs up webhook delivery. Paid confirmations are queued for the billing recipient and `DECHUB_ADMIN_EMAILS`, with persistent per-recipient progress and retries. As with other SMTP delivery, a crash between acceptance and recording delivery can cause a duplicate email.

## Local test

Use a Stripe sandbox/test key and a test invoice. Install Stripe CLI, then run:

```powershell
stripe login
stripe listen --events invoice.paid,invoice.payment_failed,invoice.voided,invoice.marked_uncollectible,invoice.updated --forward-to localhost:4000/api/stripe/webhook
```

Copy the listener's `whsec_...` into `STRIPE_WEBHOOK_SECRET`, restart the backend, then upload/link your test invoice and pay it using Stripe test payment details. The CLI listener must remain running. A generic `stripe trigger invoice.paid` creates an unrelated invoice, so it will not mark your uploaded invoice paid.

For deployment, register `https://YOUR_BACKEND/api/stripe/webhook` with the same events, using snapshot payloads. Use that destination's signing secret in the deployed environment; it differs from the CLI secret. Match test/live invoice mode to your API key.

An already sent invoice cannot be relinked. For a replacement Stripe invoice, void the old invoice in Stripe and send an additional invoice in Bridge so the payment records remain separate. Manual payment verification is disabled for linked invoices. Voided/uncollectible invoices cannot be paid through Bridge.

## Verification

```powershell
node Server/node_modules/typescript/bin/tsc -p Server/tsconfig.json
node Server/tests/monthlyStripe.test.cjs
```

These tests mock Stripe/database operations and verify matching, payment state, signature validation and duplicate deliveries without charging or emailing anyone.
