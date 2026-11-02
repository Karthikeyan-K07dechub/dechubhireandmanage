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
  readNoticeIds?: Set<string>;
}): PendingAction[] {
  const actions: PendingAction[] = [];
  const unread = (id: string) => !data.readNoticeIds?.has(id);
  const add = (action: PendingAction) => { if (action.count > 0) actions.push(action); };
  add({ id: 'contracts', count: data.contracts.filter(c => c.status === 'worker_signed' && !c.companySigned && unread('contract:' + c._id + ':' + c.status)).length, title: 'Contracts awaiting your signature', description: 'The worker has signed. Review and countersign the agreement.', href: '/dashboard?tab=contracts', linkLabel: 'Review contracts' });
  add({ id: 'project-signing', count: data.projects.filter(p => p.status === 'contract_sent' && !p.clientAcceptedAt && unread('project-contract:' + p._id)).length, title: 'Project contracts to sign', description: 'Review the scope, budget, and terms before accepting.', href: '/dashboard?tab=contracts', linkLabel: 'Review contracts' });
  add({ id: 'requests', count: data.requests.filter(r => r.status === 'shortlisted_sent' && !r.clientSelectionSubmittedAt && unread('request:' + r._id + ':' + r.status + ':' + (r.shortlistSentAt || ''))).length, title: 'Hiring requests need your attention', description: 'Review shortlisted workers and submit your choices.', href: '/dashboard?tab=hiring&hiringView=requests', linkLabel: 'Manage requests' });
  add({ id: 'invoices', count: data.invoices.filter(i => i.status === 'submitted' && unread('invoice:' + i._id + ':' + i.status)).length, title: 'Invoices awaiting approval', description: 'Review submitted invoices and approve or dispute them.', href: '/dashboard?tab=invoices', linkLabel: 'Review invoices' });
  add({ id: 'workers', count: data.workers.filter(w => unread('worker:' + w._id + ':' + w.status + ':' + w.kycStatus) && !['terminated', 'inactive'].includes(w.status) && (['invited', 'kyc_pending'].includes(w.status) || w.kycStatus === 'pending' || w.kycStatus === 'rejected')).length, title: 'Worker onboarding to review', description: 'Check pending invitations and incomplete verification.', href: '/dashboard?tab=workers', linkLabel: 'Review workers' });
  add({ id: 'setup', count: data.signupStep !== null && data.signupStep < 7 && unread('setup:' + data.signupStep) ? 1 : 0, title: 'Complete company setup', description: 'Finish your company profile, verification, and billing setup.', href: '/company/onboarding', linkLabel: 'Continue setup' });
  return actions;
}
