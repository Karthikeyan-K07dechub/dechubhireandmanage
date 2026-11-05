import type { DeliveryProject } from '../../api/projects.api';
import './dashboard-project-overview.css';

export default function DashboardProjectOverview({ projects, unavailable }: { projects: DeliveryProject[]; unavailable: boolean }) {
  const active = projects.filter(p => ['active', 'payment_submitted'].includes(p.status) && !p.deliveryCompletedAt && !p.contractorCompletedAt);
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const matches = (value?: string | null) => {
      if (!value) return false;
      const event = new Date(value);
      return event.getFullYear() === date.getFullYear() && event.getMonth() === date.getMonth();
    };
    return {
      label: date.toLocaleDateString('en-US', { month: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      started: projects.filter(p => p.status !== 'cancelled' && matches(p.contractorAcceptedAt)).length,
      completed: projects.filter(p => matches(p.deliveryCompletedAt || p.contractorCompletedAt || p.completedAt)).length,
    };
  });
  const max = Math.max(1, ...months.flatMap(m => [m.started, m.completed]));
  const dateLabel = (value: string | null) => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString() : 'Not set';
  return <div className="db-project-overview">
    <section className="db-card" aria-labelledby="active-projects-heading">
      <div className="db-card-header"><h2 className="db-card-title" id="active-projects-heading">Active projects <span className="db-project-count">{unavailable ? '?' : active.length}</span></h2><a className="db-btn-secondary db-btn-sm" href="/dashboard?tab=projects">View all</a></div>
      {unavailable ? <p className="db-project-empty" role="status">Projects could not be loaded. Refresh Pending actions to retry.</p> : active.length === 0 ? <p className="db-project-empty">No projects currently in progress.</p> : <div className="db-active-projects">{active.map(p => {
        const summary = p.teamAccess?.reduce((total, member) => ({ total: total.total + member.taskSummary.total, completed: total.completed + member.taskSummary.completed }), { total: 0, completed: 0 });
        const percent = summary?.total ? Math.round(summary.completed / summary.total * 100) : null;
        return <article key={p._id} className="db-active-project"><div className="db-active-project-heading"><a href={'/dashboard?tab=projects&project=' + encodeURIComponent(p._id)}>{p.title}</a><span>In progress</span></div><p>{new Set(p.teamMembers.map(m => m.workerId)).size} assigned workers | Due {dateLabel(p.targetEndDate)}</p>{percent !== null ? <><div className="db-project-progress" role="progressbar" aria-label={p.title + ' task completion'} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}><span style={{ width: percent + '%' }} /></div><small>{percent}% of assigned task completions</small></> : <small>No task progress available yet</small>}</article>;
      })}</div>}
    </section>
    <section className="db-card" aria-labelledby="monthly-progress-heading"><div className="db-card-header"><h2 className="db-card-title" id="monthly-progress-heading">Monthly project progress</h2><a className="db-btn-secondary db-btn-sm" href="/dashboard?tab=analytics">View all analytics</a></div><div className="db-project-chart-body"><p>Projects started and delivery completed over the last six months.</p>{unavailable ? <p role="status">Project chart unavailable. Refresh to retry.</p> : <><div className="db-project-chart-legend"><span>Started</span><span>Delivery completed</span></div><svg className="db-project-chart" viewBox="0 0 600 225" role="img" aria-labelledby="project-chart-title"><title id="project-chart-title">Monthly project starts and delivery completions</title>{(max > 1 ? [0, 0.5, 1] : [0, 1]).map(t => <g key={t}><line x1="35" x2="590" y1={185 - t * 150} y2={185 - t * 150} stroke="#e2e8f0" /><text x="25" y={189 - t * 150} textAnchor="end">{Math.ceil(max * t)}</text></g>)}{months.map((m, i) => <g key={m.fullLabel}><title>{m.fullLabel + ': ' + m.started + ' started, ' + m.completed + ' delivery completed'}</title><rect x={55 + i * 90} y={185 - m.started / max * 150} width="24" height={m.started / max * 150} rx="3" fill="#6d4aff" /><rect x={83 + i * 90} y={185 - m.completed / max * 150} width="24" height={m.completed / max * 150} rx="3" fill="#0d9488" /><text x={81 + i * 90} y="210" textAnchor="middle">{m.label}</text></g>)}</svg><details className="db-project-chart-data"><summary>View monthly counts</summary><table><thead><tr><th>Month</th><th>Started</th><th>Delivery completed</th></tr></thead><tbody>{months.map(m => <tr key={m.fullLabel}><th>{m.fullLabel}</th><td>{m.started}</td><td>{m.completed}</td></tr>)}</tbody></table></details></>}</div></section>
  </div>;
}
