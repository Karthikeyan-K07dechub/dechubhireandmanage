import type { Contract, Invoice, Worker } from '../types/dashboard.type';
import type { DeliveryProject } from '../../api/projects.api';
import type { CompanyTalentRequestItem } from '../../api/talentRequests.api';

interface PendingAction {
  id: string;
  count: number;
  title: string;
  description: string;
  href: string;
  linkLabel: string;
}

export function buildPendingActions(data: {
  contracts: Contract[];
  projects: DeliveryProject[];
  requests: CompanyTalentRequestItem[];
  invoices: Invoice[];
  workers: Worker[];
  signupStep: number | null;
  contractsExpiring: number;
}): PendingAction[] {
  const actions: PendingAction[] = [];
  const add = (action: PendingAction) => { if (action.count > 0) actions.push(action); };
  add({ id: 'contracts', count: data.contracts.filter(c => c.status === 'worker_signed' && !c.companySigned).length, title: 'Contracts awaiting your signature', description: 'The worker has signed. Review and countersign the agreement.', href: '/dashboard?tab=contracts', linkLabel: 'Review contracts' });
  add({ id: 'project-signing', count: data.projects.filter(p => p.status === 'contract_sent').length, title: 'Project contracts to sign', description: 'Review the scope, budget, and terms before accepting.', href: '/dashboard?tab=contracts', linkLabel: 'Review contracts' });
  add({ id: 'requests', count: data.requests.filter(r => ['shortlisted_sent', 'alternative_suggested', 'approved', 'candidate_selected', 'hire_started'].includes(r.status) && !(r.clientSelectionSubmittedAt && r.status === 'candidate_selected')).length, title: 'Hiring requests need your attention', description: 'Review suggested profiles or continue an approved hire.', href: '/dashboard?tab=hiring&hiringView=requests', linkLabel: 'Manage requests' });
  add({ id: 'requests-review', count: data.requests.filter(r => r.status === 'pending_review' || (r.clientSelectionSubmittedAt && r.status === 'candidate_selected')).length, title: 'Requests awaiting admin review', description: 'Your brief or candidate selections are with the Dechub team. Track progress here.', href: '/dashboard?tab=hiring&hiringView=requests', linkLabel: 'Track requests' });
  add({ id: 'invoices', count: data.invoices.filter(i => i.status === 'submitted').length, title: 'Invoices awaiting approval', description: 'Review submitted invoices and approve or dispute them.', href: '/dashboard?tab=invoices', linkLabel: 'Review invoices' });
  add({ id: 'approved-invoices', count: data.invoices.filter(i => i.status === 'approved').length, title: 'Approved invoices awaiting payment', description: 'Review the approved invoices and their payment status.', href: '/dashboard?tab=invoices', linkLabel: 'View invoices' });
  add({ id: 'expiring', count: data.contractsExpiring, title: 'Contracts expiring soon', description: 'Review contracts ending within the next 30 days.', href: '/dashboard?tab=contracts', linkLabel: 'Review contracts' });
  add({ id: 'workers', count: data.workers.filter(w => !['terminated', 'inactive'].includes(w.status) && (['invited', 'kyc_pending'].includes(w.status) || w.kycStatus === 'pending' || w.kycStatus === 'rejected')).length, title: 'Worker onboarding to review', description: 'Check pending invitations and incomplete verification.', href: '/dashboard?tab=workers', linkLabel: 'Review workers' });
  add({ id: 'setup', count: data.signupStep !== null && data.signupStep < 7 ? 1 : 0, title: 'Complete company setup', description: 'Finish your company profile, verification, and billing setup.', href: '/company/onboarding', linkLabel: 'Continue setup' });
  return actions;
}
