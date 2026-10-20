# Roadmap and Decisions

## 1. Delivery phases

### Phase 0: Make the current MVP safe and truthful

- Protect KYC and uploaded documents with private storage and signed URLs.
- Fix e-signature webhook endpoint and signature verification.
- Support contract renewal, amendment, and re-engagement history.
- Replace static or misleading payroll and payment copy with accurate status.
- Add error monitoring, backups, and audit logs.

### Phase 1: CRM foundation

- Lead, contact, activity, task, owner, source, and stage models.
- Internal lead list, details, assignment, search, filters, notes, and follow-ups.
- Book a Demo creates a CRM lead.
- Email send/logging from the CRM.
- Import existing lead lists with consent/source fields.

### Phase 2: Operations case foundation

- Convert qualified leads to company plus operations case.
- Case types, checklist, internal task, documents, and case status.
- Company-facing case progress and notifications.
- Generalize worker country and engagement types.

### Phase 3: Managed workforce operations

- Engagement model and contract lifecycle.
- Worker onboarding checklist and document center.
- Compliance record and expiry tracking.
- Support requests and internal operational work queue.

### Phase 4: Payroll coordination

- Payroll periods, review workflow, payroll items, approval, payment references, and payslips.
- Begin with Bridge-managed workers and manual/provider-assisted settlement.
- Add country-level operating rules only after legal and delivery confirmation.

### Phase 5: Expanded services

- Existing-workforce payroll onboarding.
- Visa/mobility cases.
- Equipment, asset management, and IT access requests.
- HR lifecycle workflows.
- Company team roles and permissions.

### Phase 6: Scale

- Partner portal for agencies and providers.
- Analytics, SLAs, automation, integrations, and public API.
- Country expansion based on actual demand and provider coverage.

## 2. Decisions required from leadership

| Decision | Why it matters | Recommended default |
| --- | --- | --- |
| Do we manage payroll for client-existing workers? | Determines a second onboarding, payroll, and compliance product. | No for initial MVP; focus on Bridge-managed workers. |
| Are EOR and visa services operated directly or through partners? | Determines legal claims, contracts, pricing, responsibility, and workflow. | Partner-assisted until Dechub has direct country capability. |
| Which countries are operationally supported today? | Marketing and cases must match real delivery. | UAE, India, and US only when each has a confirmed process. |
| What does “60 minutes” mean? | It must be a measurable promise, not a universal guarantee. | Suitable candidate profile response, subject to role and availability. |
| Who owns each client after conversion? | Prevents lost handoffs between sales and operations. | Assign one Dechub Admin owner in V1. |
| Which payment providers are ready? | Prevents payment screens implying executed payouts. | Record and coordinate payments until provider integration is validated. |

## 3. Definition of ready to sell

A service can be sold only when all of these are true:

1. There is a named internal owner or verified partner.
2. The service scope, exclusions, country coverage, and expected timeline are documented.
3. The contract, compliance, data, billing, and support process is defined.
4. Client and worker communications are approved.
5. The platform accurately records the service status, even if delivery involves manual operations.

## 4. Immediate next sprint

1. Review and approve the six leadership decisions above.
2. Implement Phase 0 security and contract-flow fixes.
3. Implement CRM models and a minimal internal CRM workspace.
4. Introduce the Operations Case model before adding more client dashboard pages.

## 5. Product guardrail

Every new feature must answer these questions before development:

- Which customer problem does it solve?
- Which service case uses it?
- Who owns the operational work?
- What country, worker type, and legal constraints apply?
- What data is sensitive?
- Is it client-visible, worker-visible, internal-only, or partner-visible?
- What is the truthful status: live, manual-assisted, pilot, planned, or unavailable?
