import '../../components/contract-activity.css';
import { useEffect, useRef, useState } from 'react';
import { acceptProjectContract, getCompanyProjects, recordContractActivity, type DeliveryProject } from '../../api/projects.api';
import {observeVisibleUpdates} from '../../components/updateVisibility';
import ProjectTeamList from './ProjectTeamList';

const LABELS: Record<DeliveryProject['status'], string> = {
  draft: 'Preparing', contract_sent: 'Awaiting your approval', active: 'Accepted',
  payment_submitted: 'Payment under review', completed: 'Completed', cancelled: 'Cancelled',
};

export default function ProjectContractsSection() {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState('');
  const [revision, setRevision] = useState(0);
  const viewed=useRef(new Set<string>());
  const [changeProject,setChangeProject]=useState<DeliveryProject|null>(null);
  const [changeNote,setChangeNote]=useState('');
  const [requesting,setRequesting]=useState(false);
  useEffect(()=>{if(loading)return;return observeVisibleUpdates(element=>{
    const id=element.getAttribute('data-contract-view');const project=projects.find(p=>p._id===id);if(!project)return;
    const key=id+':'+(project.contractVersion||0);if(viewed.current.has(key))return;viewed.current.add(key);
    void recordContractActivity(project._id,{event:'viewed',version:project.contractVersion||0}).then(result=>setProjects(items=>items.map(p=>p._id===id&&p.contractVersion===project.contractVersion?{...p,contractActivity:result.activity}:p))).catch(()=>viewed.current.delete(key));
  },'[data-contract-view]');},[loading,projects]);
  const requestChanges=async()=>{if(!changeProject||requesting||!changeNote.trim())return;setRequesting(true);setError('');try{
    const result=await recordContractActivity(changeProject._id,{event:'changes_requested',version:changeProject.contractVersion||0,note:changeNote.trim()});
    setProjects(items=>items.map(p=>p._id===changeProject._id?{...p,contractActivity:result.activity}:p));setChangeProject(null);setChangeNote('');
  }catch(e){setError((e as Error).message);}finally{setRequesting(false);}};
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
      const updated = await acceptProjectContract(project._id, project.contractVersion||0);
      setProjects(items => items.map(item => item._id === updated._id ? { ...item, ...updated, teamAccess: updated.teamAccess ?? item.teamAccess } : item));
    } catch (reason) { setError((reason as Error).message); }
    finally { setAccepting(''); }
  };

  return <section className="db-project-contracts" aria-labelledby="project-contracts-heading">
    <div className="db-page-header"><div><h2 id="project-contracts-heading" className="db-card-title">Project contracts</h2><p className="db-page-sub">Review agreements, accept project contracts, and manage payment details.</p></div><button type="button" className="db-btn-secondary" disabled={loading} onClick={() => setRevision(value => value + 1)}>Refresh</button></div>
    {error && <p className="db-project-error" role="alert">{error}</p>}
    {loading ? <p className="db-page-sub">Loading project contracts...</p> : projects.length === 0 ? <div className="db-card db-empty">No project contracts to review yet.</div> : projects.map(project => <article key={project._id} data-update-resource={'project:'+project._id} id={`project-contract-${project._id}`} className="db-card db-project-detail db-project-contract-card">
      <div className="db-contract-header"><div><div className="db-contract-title-row"><h3 data-contract-view={project._id}>{project.title}</h3><span className={`db-project-status ${project.status}`}>{LABELS[project.status]}</span></div><p>{project.description}</p></div><div className="db-contract-header-actions"><strong>{project.currency} {project.budget.toLocaleString()} <small className="db-budget-service-note">+ service charges</small></strong><a className="db-card-link" href={`/dashboard?tab=projects&project=${encodeURIComponent(project._id)}`}>Explore project</a></div></div>
      <div className="db-project-info"><div><small>Scope</small><p>{project.scope}</p></div>{!!project.deliverables?.length && <div><small>Deliverables</small><ul>{project.deliverables.map(item => <li key={item}>{item}</li>)}</ul></div>}{!!project.paymentTerms?.trim() && <div><small>Payment terms</small><p>{project.paymentTerms}</p></div>}</div>
      {!!project.contractVersions?.length && <details><summary>Contract history (current version {project.contractVersion})</summary>{project.contractVersions.map(v=><section key={v.version} className="db-card" style={{marginTop:12,padding:16}}><strong>Version {v.version} | {v.acceptedAt?'Accepted':'Sent'}</strong><p>{v.title} | {v.currency} {v.budget.toLocaleString()}</p><p>{v.description}</p><p>{v.scope}</p>{v.paymentTerms&&<p>{v.paymentTerms}</p>}<small>Sent {new Date(v.sentAt).toLocaleString()}{v.acceptedAt?' | Accepted '+new Date(v.acceptedAt).toLocaleString():''}</small></section>)}</details>}
      <ProjectTeamList project={project} />
      {(project.startDate || project.targetEndDate) && <div className="db-task-project-dates"><span><strong>Start date:</strong> {project.startDate ? new Date(project.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</span><span><strong>End date:</strong> {project.targetEndDate ? new Date(project.targetEndDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</span></div>}
      {project.status === 'contract_sent' && (
        <div className="db-project-action db-contract-review-callout">
          <p>Review the agreed scope, budget, and payment terms before starting delivery.</p>
          <div className="db-contract-review-actions">
            <button type="button" className="db-btn-primary" disabled={Boolean(accepting)} onClick={() => void accept(project)}>{accepting === project._id ? 'Accepting...' : 'Accept contract'}</button>
            <button type="button" className="db-btn-secondary" disabled={Boolean(accepting)} onClick={() => { setChangeProject(project); setChangeNote(''); }}>Request changes</button>
          </div>
        </div>
      )}
      
      
    </article>)}
    {changeProject&&<div className="contract-change-overlay"><section role="dialog" aria-modal="true" aria-labelledby="contract-change-title" className="contract-change-dialog"><h3 id="contract-change-title">Request contract changes</h3><p>{changeProject.title} | Version {changeProject.contractVersion||0}</p><label htmlFor="contract-change-note">What needs to change?</label><textarea autoFocus id="contract-change-note" maxLength={2000} value={changeNote} onChange={e=>setChangeNote(e.target.value)} placeholder="Describe the changes you need"/>{error&&<p role="alert">{error}</p>}<footer><button type="button" className="db-btn-secondary" disabled={requesting} onClick={()=>setChangeProject(null)}>Cancel</button><button type="button" className="db-btn-primary" disabled={requesting||!changeNote.trim()} onClick={()=>void requestChanges()}>{requesting?'Submitting...':'Submit request'}</button></footer></section></div>}
  </section>;
}
