import { useEffect, useState } from 'react';
import { acceptProjectContract, getCompanyProjects, type DeliveryProject } from '../../api/projects.api';
import ProjectTeamList from './ProjectTeamList';

const LABELS: Record<DeliveryProject['status'], string> = {
  draft: 'Preparing', contract_sent: 'Awaiting your signature', active: 'Accepted',
  payment_submitted: 'Payment under review', completed: 'Completed', cancelled: 'Cancelled',
};

export default function ProjectContractsSection() {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void getCompanyProjects().then(items => {
      if (active) setProjects(items.filter(project => project.status !== 'draft'));
    }).catch(reason => { if (active) setError((reason as Error).message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    if (loading) return;
    const target = window.location.hash.slice(1);
    if (target.startsWith('project-contract-')) document.getElementById(target)?.scrollIntoView({ block: 'start' });
  }, [loading, projects]);

  const accept = async (project: DeliveryProject) => {
    setAccepting(project._id); setError('');
    try {
      const updated = await acceptProjectContract(project._id);
      setProjects(items => items.map(item => item._id === updated._id ? { ...item, ...updated, teamAccess: updated.teamAccess ?? item.teamAccess } : item));
    } catch (reason) { setError((reason as Error).message); }
    finally { setAccepting(''); }
  };

  return <section className="db-project-contracts" aria-labelledby="project-contracts-heading">
    <div className="db-page-header"><div><h2 id="project-contracts-heading" className="db-card-title">Project contracts</h2><p className="db-page-sub">Review agreements, accept project contracts, and manage payment details.</p></div><button type="button" className="db-btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</button></div>
    {error && <p className="db-project-error" role="alert">{error}</p>}
    {loading ? <p className="db-page-sub">Loading project contracts...</p> : projects.length === 0 ? <div className="db-card db-empty">No project contracts to review yet.</div> : projects.map(project => <article key={project._id} data-update-resource={'project:'+project._id} id={`project-contract-${project._id}`} className="db-card db-project-detail db-project-contract-card">
      <div className="db-contract-header"><div><div className="db-contract-title-row"><h3>{project.title}</h3><span className={`db-project-status ${project.status}`}>{LABELS[project.status]}</span></div><p>{project.description}</p></div><div className="db-contract-header-actions"><strong>{project.currency} {project.budget.toLocaleString()} <small className="db-budget-service-note">+ service charges</small></strong><a className="db-card-link" href={`/dashboard?tab=projects&project=${encodeURIComponent(project._id)}`}>Explore project</a></div></div>
      <div className="db-project-info"><div><small>Scope</small><p>{project.scope}</p></div><div><small>Deliverables</small><ul>{project.deliverables.map(item => <li key={item}>{item}</li>)}</ul></div><div><small>Payment terms</small><p>{project.paymentTerms}</p></div></div>
      <ProjectTeamList project={project} />
      {(project.startDate || project.targetEndDate) && <div className="db-task-project-dates"><span><strong>Start date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</span><span><strong>End date:</strong> {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</span></div>}
      {project.status === 'contract_sent' && <div className="db-project-action db-contract-review-callout"><p>Review the agreed scope, budget, and payment terms before starting delivery.</p><button type="button" className="db-btn-primary" disabled={Boolean(accepting)} onClick={() => void accept(project)}>{accepting === project._id ? 'Accepting...' : 'Accept & sign project contract'}</button></div>}
      
      
    </article>)}
  </section>;
}
