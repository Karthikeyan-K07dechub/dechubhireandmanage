import { useEffect, useState } from 'react';
import { acceptTeamMemberProjectContract, getTeamMemberProjects, getTeamMemberProjectTasks, updateTeamMemberProjectTask, type DeliveryProject, type DeliveryTask, type ProjectTaskStatus } from '../api/projects.api';
import './project-contracts.css';
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided';
export default function ProjectTasksPage({ contracts = false, readOnly = false, onNavigate }: { contracts?: boolean; readOnly?: boolean; onNavigate?: (tab: 'projects' | 'contract', projectId: string) => void }) {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [selectedId, setSelectedId] = useState(new URLSearchParams(window.location.search).get('project') || '');
  const [tasks, setTasks] = useState<DeliveryTask[]>([]);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true); const [working, setWorking] = useState('');
  const [agreed, setAgreed] = useState(false);
  const selected = projects.find(project => project._id === selectedId) ?? projects[0];
  useEffect(() => {
    if (readOnly) { setLoading(false); return; }
    let active = true;
    const refresh = () => { void getTeamMemberProjects().then(items => { if (active) { setProjects(items); setError(''); } }).catch((reason: Error) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); }); };
    refresh(); const timer = window.setInterval(refresh, 15000); window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [readOnly]);
  useEffect(() => {
    let active = true; setTasks([]); setAgreed(false); setSuccess('');
    if (selected && !contracts && !readOnly) void getTeamMemberProjectTasks(selected._id).then(items => { if (active) setTasks(items); }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [selected?._id, contracts, readOnly]);
  async function accept() {
    if (!selected || !agreed || working || readOnly) return;
    const id = selected._id; setWorking('accept'); setError('');
    try { const updated = await acceptTeamMemberProjectContract(id); setProjects(items => items.map(item => item._id === id ? updated : item)); setSuccess('Contract accepted. Dechub has been notified.'); }
    catch (reason) { setError((reason as Error).message); } finally { setWorking(''); }
  }
  async function setTaskStatus(task: DeliveryTask, status: ProjectTaskStatus) {
    if (working || readOnly) return; setWorking(task._id); setError('');
    try { const updated = await updateTeamMemberProjectTask(task._id, { status }); setTasks(items => items.map(item => item._id === updated._id ? updated : item)); }
    catch (reason) { setError((reason as Error).message); } finally { setWorking(''); }
  }
  const go = (tab: 'projects' | 'contract', id: string) => onNavigate ? onNavigate(tab, id) : window.location.assign('/contractor/dashboard?tab=' + tab + '&project=' + encodeURIComponent(id));
  return <main className="cd-page"><h2 className="cd-page-title">{contracts ? 'Project contracts' : 'Projects'}</h2><p className="cd-page-sub">{contracts ? 'Review and accept project contracts approved by the client.' : 'Review assigned companies, project dates, and delivery tasks.'}</p>
    {error && <p className="ctp-error" role="alert">{error}</p>}{success && <p className="ctp-success" role="status">{success}</p>}
    {loading ? <p>Loading projects...</p> : !projects.length ? <div className="cd-card ctp-card">{contracts ? 'No project contracts are ready. Contracts appear here after client approval.' : 'No client-approved projects have been assigned to you yet.'}</div> : <div className="ctp-layout"><aside>{projects.map(project => <button type="button" className={selected?._id === project._id ? 'selected' : ''} key={project._id} onClick={() => setSelectedId(project._id)}>{project.title}<small>{project.contractorAcceptedAt ? 'Contract accepted' : 'Your approval needed'}</small></button>)}</aside>
      {selected && <section className="cd-card ctp-card"><h3>{selected.title}</h3><p>{selected.description}</p><div className="ctp-details"><div><small>Your project role</small><strong>{selected.assignedRole || 'Not provided'}</strong></div><div><small>Company</small><strong>{selected.companyDetails?.name || 'Not provided'}</strong></div><div><small>Country</small><strong>{selected.companyDetails?.country || 'Not provided'}</strong></div><div><small>Company website</small><span>{selected.companyDetails?.website || 'Not provided'}</span></div><div><small>Company address</small><span>{selected.companyDetails?.address || 'Not provided'}</span></div><div><small>Start date</small><strong>{date(selected.startDate)}</strong></div><div><small>End date</small><strong>{date(selected.targetEndDate)}</strong></div></div>
        <h4>Scope of work</h4><p>{selected.scope}</p><h4>Deliverables</h4><ul>{selected.deliverables.map((item, index) => <li key={index}>{item}</li>)}</ul>
        {contracts ? <><h4>Project budget</h4><p>{selected.currency} {selected.budget.toLocaleString()}</p><h4>Payment terms</h4><p>{selected.paymentTerms}</p><p>Client approved: {date(selected.clientAcceptedAt)}</p>
          {selected.contractorAcceptedAt ? <p className="ctp-success">You accepted this contract on {date(selected.contractorAcceptedAt)}.</p> : selected.status !== 'completed' && <div className="ctp-accept"><label><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} />I have reviewed and agree to the project scope, dates, deliverables, and payment terms.</label><button type="button" disabled={!agreed || Boolean(working) || readOnly} onClick={() => void accept()}>{working === 'accept' ? 'Accepting...' : 'Accept project contract'}</button></div>}
          <button type="button" onClick={() => go('projects', selected._id)}>Explore project</button></> : <>
          {!selected.contractorAcceptedAt && <div className="ctp-accept"><p>Accept your project contract in Contracts before updating delivery tasks.</p><button type="button" onClick={() => go('contract', selected._id)}>Review contract</button></div>}
          <h4>My tasks</h4>{!tasks.length ? <p>No tasks are assigned to you yet.</p> : tasks.map(task => <div key={task._id} className="ctp-task"><strong>{task.title}</strong><p>{task.description}</p><div className="ctp-task-actions">{(['todo', 'in_progress', 'completed'] as ProjectTaskStatus[]).map(status => <button type="button" key={status} disabled={Boolean(working) || readOnly || !selected.contractorAcceptedAt || task.status === status || selected.status !== 'active'} onClick={() => void setTaskStatus(task, status)}>{status.replace(/_/g, ' ')}</button>)}</div><small>Status: {task.status.replace(/_/g, ' ')}</small></div>)}</>}
      </section>}
    </div>}
  </main>;
}
