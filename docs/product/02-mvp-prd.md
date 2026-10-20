# MVP Product Requirements Document

## 1. MVP name

Dechub-Bridge Managed Workforce Operations MVP.

## 2. MVP objective

Convert an interested company into an active, supported workforce engagement without losing information between sales, operations, the client, and the worker.

## 3. MVP success criteria

- Every inbound or outbound lead has a single owner, stage, next action, and complete communication timeline.
- A qualified lead can become a company and an operations case without re-entering core information.
- A Dechub Admin can see every open case and its operational blockers.
- A Company Admin can see workers, engagement status, contracts, documents, invoices, and support requests for its company.
- A worker can complete onboarding and understand their required next action.
- The product does not claim automated payment, EOR, visa, or compliance outcomes that do not exist.

## 4. Primary users and jobs

| User | Job to be done |
| --- | --- |
| Founder or HR lead | Find and engage suitable global talent without building a fragmented process. |
| Finance lead | Know what is due, approved, paid, and pending for each engagement. |
| Dechub Admin | Move a lead through qualification and manage each operational case without spreadsheets and inbox searching. |
| Worker | Complete onboarding, contract, documents, payout details, and ongoing requirements in one place. |

## 5. In scope

### CRM and lead management

- Create leads from Book a Demo, manual entry, CSV import, referral, newsletter, and outreach.
- Store company, contacts, source, owner, stage, notes, next task, consent, and communication timeline.
- Stages: `New`, `Contacted`, `Replied`, `Demo booked`, `Qualified`, `Proposal sent`, `Won`, `Lost`, `Nurture`.
- Send email from the lead record and log outbound/inbound activity.
- Prepare WhatsApp integration only after consent, template, and official API requirements are met.

### Operations cases

- Create a case from a qualified lead or a signed-up company.
- Case types: `Talent`, `Contractor engagement`, `Managed payroll`, `Compliance`, `Visa/mobility`, `Equipment`, `IT access`.
- Capture country, service scope, worker count, worker type, start date, budget, client entity, owner, status, required documents, and operational tasks.
- Case stages: `Discovery`, `Solution design`, `Client onboarding`, `Worker selection`, `Contracting`, `Onboarding`, `Active`, `Paused`, `Completed`, `Cancelled`.

### Managed worker lifecycle

- Worker profile and country/engagement details.
- Invite, worker onboarding, KYC/document collection, payment details, contract, company countersignature, and active status.
- Worker-level operational checklist for onboarding, IT, equipment, compliance, and mobility requirements.
- Contract renewals, amendments, and offboarding must be supported as separate engagement events.

### Client workspace

- Dashboard, active workers, contracts, invoices, document center, case progress, notifications, and support requests.
- One Company Admin role in V1.

### Internal workspace

- Lead queue, case queue, worker queue, document review queue, activity feed, assigned work, and simple reporting.
- One Dechub Admin role in V1.

## 6. Out of scope for MVP

- Automated global payroll calculations and statutory filing.
- Automatic cross-border payouts.
- Full leave, attendance, benefits, performance, or HRIS functionality.
- Direct device procurement and logistics network.
- A customer self-serve EOR checkout.
- Full multi-role permissions, partner portal, or public API.

## 7. Functional requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| CRM-01 | Admin can create, import, assign, search, and update leads. | P0 |
| CRM-02 | Lead has activity history, notes, tasks, stage, source, and consent status. | P0 |
| CRM-03 | Qualified lead converts into Company and Operations Case. | P0 |
| CASE-01 | Admin can create and manage service cases. | P0 |
| CASE-02 | Case shows checklist, tasks, documents, owner, status, and client communication. | P0 |
| ENG-01 | Worker supports global country, engagement type, and lifecycle status. | P0 |
| ENG-02 | One worker can have multiple historical contracts. | P0 |
| DOC-01 | Documents are private, role-authorized, versioned, and expiry-aware. | P0 |
| PAY-01 | Admin can track payment or payroll coordination status. | P1 |
| MOB-01 | Admin can track visa or mobility case status and required documents. | P1 |
| IT-01 | Admin can track equipment and access requests. | P1 |
| HR-01 | Admin can record workforce lifecycle events and support requests. | P2 |

## 8. Non-functional requirements

- Protect all personal, financial, identity, and contract documents with private storage and signed access URLs.
- Record audit events for case-stage, contract, document, and payment-status changes.
- Validate ownership on every company and worker request.
- Use idempotent webhook processing for payments and signature events.
- Encrypt secrets; never store payment-card data or unencrypted credentials.
- Support backups, error monitoring, and a production deployment plan before onboarding real clients.

## 9. Metrics

- Lead response time.
- Lead-to-demo and demo-to-qualified conversion.
- Qualified-to-signed-client conversion.
- Time from approved candidate to active worker.
- Percentage of onboarding checklists completed on time.
- Open cases by type, owner, country, and ageing.
- Contract, document, payment, and support blockers.
