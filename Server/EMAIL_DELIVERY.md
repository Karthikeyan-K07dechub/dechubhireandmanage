# Responsive requests and email delivery

Request handlers for IT access, equipment, invitations, project/task notifications, candidate shortlists, newsletters, password reset and verification enqueue email in MongoDB instead of waiting for the email provider. Invoice-review emails use the same queue. Existing demo, monthly billing, Stripe receipt and IT reply workers retain their background delivery flows.

`EmailJob` records are claimed with a five-minute lease and processed by the running backend. The queue starts from `server.ts`; no additional credentials or external queue service are required. Each recipient's successful delivery is recorded, so a failed recipient can retry without repeating already-recorded deliveries. Retries stop after five attempts, with increasing delays. Equipment, initial IT request and invoice email status fields are updated after delivery, rather than being marked sent when merely queued.

Verification and password-reset emails have higher priority. SMTP uses pooled connections and bounded connection/greeting/socket timeouts; Resend requests have a 15-second timeout. Provider acceptance and inbox delivery times remain outside the application's control.

Delivered job HTML and attachments are cleared. Queue records normally expire after 24 hours through a TTL index; verification/reset template jobs have a shorter delivery deadline and expired jobs are not sent. As with SMTP generally, a crash between provider acceptance and recording delivery can produce a duplicate. Failed queue entries require attention after retry exhaustion; existing equipment/invoice retry actions remain available.

The client displays a persisted chat message directly from the send response. It does not hold the Send button while waiting for a separate list/detail refresh. Task/project and IT chat polling runs every two seconds while the page is visible; overlapping reads are avoided. These chats follow the latest sent message and support Enter to send, Shift+Enter for a newline, and IME composition without accidental sends. Request descriptions and work-submission forms retain multiline Enter behavior.

Authentication, permission checks, database persistence, and file uploads are still completed before success is shown. A slow database or upload can therefore still affect response time; these changes do not guarantee an end-to-end latency bound.

Verification:

```powershell
node Server/node_modules/typescript/bin/tsc -p Server/tsconfig.json
node Server/tests/emailQueue.test.cjs
node Server/tests/itAccessChat.test.cjs
node Server/tests/itAccessRequestNotification.test.cjs
```

Queue tests block the mock email provider and verify that durable enqueue returns first, then exercise partial delivery and retry. Browser checks use mocked APIs, long histories and blocked refreshes to verify send responsiveness, keyboard behavior and scroll position without sending real messages.
