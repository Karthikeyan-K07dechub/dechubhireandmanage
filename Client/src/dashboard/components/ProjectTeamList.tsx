import type { DeliveryProject } from '../../api/projects.api';

export default function ProjectTeamList({ project }: { project: DeliveryProject }) {
  return <section className="db-project-section">
    <h3>Assigned workers</h3>
    <p className="db-page-sub">Delivery team assigned to {project.title}.</p>
    {project.teamAccess?.length ? <div className="db-team-access-list">
      {project.teamAccess.map(member => <article key={member.workerId} className="db-team-access-card">
        <div><strong>{member.name}</strong><span>{member.role}</span><small>{member.email}</small>{member.country && <span>{member.country}</span>}</div>
        <div><small>Account</small><strong className={`db-team-state ${member.accountStatus}`}>{member.accountStatus.replace(/_/g, ' ')}</strong></div>
        <div><small>Last login</small><strong>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : 'Not signed in yet'}</strong></div>
        <div><small>Project access</small><strong className="db-team-state">{project.status === 'active' ? 'Active' : project.status === 'contract_sent' ? 'Pending client acceptance' : project.status.replace(/_/g, ' ')}</strong></div>
        <div><small>Tasks</small><strong>{member.taskSummary.completed}/{member.taskSummary.total} completed</strong><span>{member.taskSummary.inProgress} in progress</span></div>
      </article>)}
    </div> : <p className="db-page-sub">Worker details are not available yet.</p>}
  </section>;
}
