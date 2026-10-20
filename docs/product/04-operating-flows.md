# Operating Flows

## 1. Lead to active client

```mermaid
flowchart TD
  A[Lead from outreach, referral, event, or website] --> B[CRM: New]
  B --> C[Assigned Dechub Admin]
  C --> D[Personalized outreach]
  D --> E{Reply or meeting?}
  E -->|No| F[Follow-up or nurture]
  E -->|Yes| G[Demo and discovery]
  G --> H{Qualified need?}
  H -->|No| I[Lost or nurture with reason]
  H -->|Yes| J[Create operations case]
  J --> K[Solution, pricing, and proposal]
  K --> L{Client approves?}
  L -->|No| I
  L -->|Yes| M[Company onboarding and commercial setup]
  M --> N[Case moves to delivery]
```

## 2. Managed workforce flow - V1

```mermaid
flowchart TD
  A[Client requirement] --> B[Operations case: Discovery]
  B --> C[Dechub designs delivery model]
  C --> D[Talent sourced or proposed]
  D --> E[Client reviews and approves]
  E --> F[Worker engagement created]
  F --> G[Contract and required documents]
  G --> H[Worker onboarding]
  H --> I[Equipment, access, compliance checklist]
  I --> J[Active worker]
  J --> K[Invoice/payroll coordination and support]
  K --> L[Renewal, amendment, or offboarding]
```

## 3. Existing-workforce operations flow - later

```mermaid
flowchart TD
  A[Client requests payroll or HR support] --> B[Operations case]
  B --> C[Entity, country, and worker data review]
  C --> D[Confirm delivery capability and partner]
  D --> E[Import workers and documents]
  E --> F[Payroll/HR setup and parallel review]
  F --> G[Client approval]
  G --> H[Managed payroll or HR operations]
```

Do not build this path until leadership confirms that Dechub-Bridge will operate payroll for workers not sourced by Dechub.

## 4. CRM communication flow

1. A lead enters through a website form, manual entry, import, referral, or outreach list.
2. The system records source, owner, company, contact, consent, and initial context.
3. The owner sends a short personalized message, not a product brochure.
4. All sent messages, replies, calls, tasks, demo dates, notes, and next steps appear in the lead timeline.
5. Once discovery confirms an actual need, the lead becomes qualified.
6. A qualified lead creates a company and operations case; the CRM history remains connected.
7. Won leads become active client accounts. Lost/nurture leads remain available for compliant future follow-up.

## 5. Worker onboarding flow

1. Dechub Admin or Company Admin creates an engagement and invites the worker.
2. Worker verifies identity, completes personal data, adds payment details, and supplies required documents.
3. Dechub reviews requirements and marks checklist items complete or blocked.
4. Worker signs the contract; Company Admin countersigns where required.
5. The engagement becomes active only after required approvals are complete.
6. The client and worker see only information appropriate to their role.

## 6. Payroll coordination flow

1. Admin creates a payroll period for a company/country.
2. Eligible active engagements enter the draft run.
3. Admin adds approved pay components, invoices, reimbursements, and adjustments.
4. Client reviews and approves the run.
5. Dechub coordinates payment using a supported provider or records manual payment status.
6. System stores payout reference, payslip/document, and reconciliation status.

This is the target flow. The current application does not yet execute it.

## 7. Visa, equipment, and access flow

1. A service case or worker engagement requests mobility, equipment, or system access.
2. Dechub Admin creates required checklist items, assigns an internal owner or partner, and collects documents.
3. Progress, approvals, dispatch/reference numbers, expiry dates, and blockers are visible in the case.
4. On offboarding, access is revoked and equipment return is tracked.
