import type { ContractorInvoice } from './types/contractor.types';
import { useEffect, useState } from 'react';
import { getTeamMemberProjects, type DeliveryProject } from '../api/projects.api';
import './completed-project-invoices.css';
export default function CompletedProjectsForInvoicing({ onSend, readOnly, invoices }: { invoices: ContractorInvoice[]; onSend: (project: DeliveryProject) => void; readOnly: boolean }) {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [loading, setLoading] = useState(!readOnly); const [error, setError] = useState('');
  useEffect(() => {
    if (readOnly) return;
    let active = true;
    const refresh = () => { void getTeamMemberProjects().then(items => { if (active) { setProjects(items.filter(project => project.contractorCompletedAt && project.contractorAcceptedAt)); setError(''); } }).catch(() => { if (active) setError('Unable to load completed projects. Please refresh to try again.'); }).finally(() => { if (active) setLoading(false); }); };
    refresh(); const timer = window.setInterval(refresh, 15000); window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [readOnly]);
  return <section className="cpi-section" aria-labelledby="cpi-heading"><h2 id="cpi-heading">Completed projects</h2><p>Select a completed project to send its invoice to Dechub for review.</p>{error && <p role="alert">{error}</p>}{loading ? <p>Loading completed projects...</p> : !projects.length ? <div className="cd-card cpi-empty">Your completed projects will appear here once you finish delivery in Projects.</div> : <div className="cpi-grid">{projects.map(project => <article className="cd-card cpi-card" key={project._id}><div className="cpi-title"><h3>{project.title}</h3><span>Completed</span></div><p>{project.companyDetails?.name || 'Company details not provided'}</p><p>{project.assignedRole || 'Assigned contractor'}</p><p>Completed on {new Date(project.contractorCompletedAt!).toLocaleDateString()}</p>{invoices.some(invoice => invoice.projectId === project._id && invoice.status !== 'disputed' && invoice.status !== 'draft') ? <p className="cpi-invoice-sent" role="status">Invoice sent to Dechub</p> : <button type="button" className="cp-btn-primary" disabled={readOnly} onClick={() => onSend(project)}>Send invoice</button>}</article>)}</div>}</section>;
}
