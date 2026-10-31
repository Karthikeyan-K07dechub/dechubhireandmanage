import type { Worker } from '../types/dashboard.type';
import type { DeliveryProject, ProjectStatus } from '../../api/projects.api';

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Preparing', contract_sent: 'Awaiting signature', active: 'In Progress',
  payment_submitted: 'In Progress', completed: 'Completed', cancelled: 'Cancelled',
};

export type WorkerListEntry = Pick<Worker, '_id' | 'firstName' | 'lastName' | 'email' | 'roleTitle' | 'status'> & Partial<Worker>;

// Project delivery teams can belong to the marketplace rather than the client's worker roster.
export function mergeProjectWorkers(workers: WorkerListEntry[], projects: DeliveryProject[]): WorkerListEntry[] {
  const byId = new Map(workers.map(worker => [worker._id, worker]));
  for (const project of projects) {
    for (const member of project.teamAccess ?? []) {
      if (byId.has(member.workerId)) continue;
      const [firstName, ...lastName] = member.name.trim().split(/\s+/);
      byId.set(member.workerId, {
        _id: member.workerId,
        firstName: member.firstName || firstName || 'Team member',
        lastName: member.lastName ?? lastName.join(' '),
        email: member.email,
        roleTitle: member.role,
        country: member.country,
        track: member.track,
        kycStatus: member.kycStatus,
        status: member.accountStatus,
        canManage: false,
      });
    }
  }
  return [...byId.values()];
}

export function buildWorkerAssignments(workers: WorkerListEntry[], projects: DeliveryProject[]) {
  return workers.flatMap(worker => {
    const assignments = projects.filter(project => project.teamMembers.some(member => member.workerId === worker._id));
    return (assignments.length ? assignments : [null]).map(project => ({
      key: `${worker._id}:${project?._id ?? 'unassigned'}`,
      worker,
      project,
      role: project?.teamMembers.find(member => member.workerId === worker._id)?.role || worker.roleTitle,
      startDate: project ? project.startDate : worker.startDate,
      endDate: project ? project.targetEndDate : worker.endDate,
      status: project ? PROJECT_STATUS_LABELS[project.status] : 'Not assigned',
    }));
  });
}
