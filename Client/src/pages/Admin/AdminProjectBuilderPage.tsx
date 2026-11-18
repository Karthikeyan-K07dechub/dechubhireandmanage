import ContractActivity from '../../components/ContractActivity';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getTalentRequest, listMarketplaceCandidatesForAdmin, type AdminMarketplaceCandidateItem, type TalentRequestItem } from '../../api/admin.api';
import { createAdminProject, getAdminProjects, sendAdminProjectContract } from '../../api/projects.api';
import './admin-project-builder.css';

interface AdminProjectBuilderPageProps { requestId: string; onBack: () => void; }
const parseBudget = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0;

export default function AdminProjectBuilderPage({ requestId, onBack }: AdminProjectBuilderPageProps) {
  const saving = useRef(false);
  const [savedProjectId, setSavedProjectId] = useState('');
  const [contractSent, setContractSent] = useState(false);
  const [contractVersion,setContractVersion]=useState(0);
  const [resending,setResending]=useState(false);
  const [activity,setActivity]=useState<import('../../components/ContractActivity').ContractActivityItem[]>([]);
  const [history,setHistory]=useState<import('../../api/projects.api').DeliveryProject['contractVersions']>([]);
  const [request, setRequest] = useState<TalentRequestItem | null>(null);
  const [candidates, setCandidates] = useState<AdminMarketplaceCandidateItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [scope, setScope] = useState('');
  const [budget, setBudget] = useState(''); const [currency, setCurrency] = useState<'USD' | 'INR' | 'AED'>('USD'); const [paymentTerms, setPaymentTerms] = useState('');
  const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { let active = true; void Promise.all([getTalentRequest(requestId), listMarketplaceCandidatesForAdmin({ requestId, perPage: 24 }), getAdminProjects(requestId)]).then(([detail, result, projects]) => { if (!active) return; setRequest(detail); setCandidates(result.items); setTitle(detail.projectName || detail.projectType || `${detail.companyName} project`); setDescription(detail.projectDescription || ''); setScope(detail.projectDescription || ''); setBudget(detail.budget || ''); const preselected = detail.clientSelectionSubmittedAt ? (detail.clientDecisions ?? []).filter(decision => decision.decision === 'accepted').map(decision => decision.workerId) : detail.workerId ? [detail.workerId] : (detail.shortlistedTalentProfiles ?? []).map((profile) => profile.workerId); setSelectedIds(preselected); const existing=projects.find(p=>p.talentRequestId===requestId); if(existing){setSavedProjectId(existing._id);setContractSent(Boolean(existing.contractSentAt));setContractVersion(existing.contractVersion||0);setHistory(existing.contractVersions||[]);setActivity(existing.contractActivity||[]);setTitle(existing.title);setDescription(existing.description);setScope(existing.scope);setBudget(String(existing.budget));setCurrency(existing.currency);setPaymentTerms(existing.paymentTerms);setSelectedIds(existing.teamMembers.map(m=>m.workerId));} }).catch((reason: Error) => active && setError(reason.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [requestId]);
  const selectedCandidates = useMemo(() => candidates.filter((candidate) => selectedIds.includes(candidate.workerId)), [candidates, selectedIds]);
  const toggleCandidate = (id: string) => { if (request?.clientSelectionSubmittedAt && !request.clientDecisions?.some(decision => decision.workerId === id && decision.decision === 'accepted')) return; setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]); };
  useEffect(()=>{if(!success)return;const timer=setTimeout(()=>setSuccess(''),10000);return()=>clearTimeout(timer);},[success]);
  const save = async (sendNow: boolean) => {
    if (saving.current || (contractSent && !resending)) return;
    setError(''); setSuccess('');
    if (!savedProjectId || resending) {
      const problems: string[] = [];
      if (title.trim().length < 3 || title.trim().length > 180) problems.push('Project title must contain between 3 and 180 characters.');
      if (!description.trim()) problems.push('Enter a description.');
      if (!scope.trim()) problems.push('Enter the scope of work.');
      if (paymentTerms.trim().length > 1200) problems.push('Payment terms must contain at most 1200 characters.');
      if (!selectedIds.length) problems.push('Select at least one delivery team member.');
      if (!Number.isFinite(parseBudget(budget))) problems.push('Enter a valid budget.');
      if (problems.length) { setError(problems.join(' ')); return; }
    }
    saving.current = true; setWorking(true);
    try {
      let projectId = savedProjectId;
      if (!projectId) {
        const project = await createAdminProject({ talentRequestId: requestId, manualTalentContracts:true,
          startDate: request?.expectedStartDate ? new Date(request.expectedStartDate).toISOString() : undefined,
          targetEndDate: request?.expectedEndDate ? new Date(request.expectedEndDate).toISOString() : undefined,
          title: title.trim(), description: description.trim(), scope: scope.trim(), budget: parseBudget(budget), currency,
          paymentTerms: paymentTerms.trim(), deliverables: [],
          teamMembers: selectedIds.map(workerId => ({workerId, role: candidates.find(candidate => candidate.workerId === workerId)?.role || 'Delivery team member'})),
        });
        projectId = project._id; setSavedProjectId(projectId);
      }
      if (sendNow) { const sent=await sendAdminProjectContract(projectId,resending?{version:contractVersion,title:title.trim(),description:description.trim(),scope:scope.trim(),budget:parseBudget(budget),currency,paymentTerms:paymentTerms.trim()}:undefined); setContractVersion(sent.contractVersion||0);setHistory(sent.contractVersions||[]);setActivity(sent.contractActivity||[]);setResending(false);setContractSent(true); setSuccess('Contract is available in the client dashboard. Email delivery is queued.'); }
      else setSuccess('Draft saved. Select Send saved contract when ready.');
    } catch (reason) {
      const failure = reason as {message?: string; fields?: Record<string,string>};
      setError([failure.message || 'Unable to save the project.', ...Object.entries(failure.fields||{}).map(([field,message])=>field.startsWith('deliverables')?'Deliverables are no longer required. Refresh this page to load the updated form.':field.startsWith('teamMembers')?'Select at least one talent for this project.':message)].join(' '));
    } finally { saving.current = false; setWorking(false); }
  };
  if (loading) return <main className="apb-root"><div className="apb-card">Loading project builder...</div></main>;
  return <main className="apb-root"><header className="apb-header"><button type="button" onClick={onBack}>Back to request</button><div><span>Dechub Admin</span><h1>Build delivery project</h1><p>{request?.companyName || 'Client company'}: create the contract and delivery team before client acceptance.</p></div></header>{error ? <div className="apb-alert error">{error}</div> : null}{success ? <div role="status" className="apb-alert success">{success}</div> : null}<fieldset className="apb-form-fields" disabled={working || (Boolean(savedProjectId) && !resending)}><div className="apb-grid"><section className="apb-card"><h2>Project contract</h2>{(request?.expectedStartDate || request?.expectedEndDate) && <p>Client expected dates: <strong>{request.expectedStartDate ? new Date(request.expectedStartDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</strong> to <strong>{request.expectedEndDate ? new Date(request.expectedEndDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</strong>. These dates will be included in the project.</p>}<label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Client-facing description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Scope of work<textarea value={scope} onChange={(event) => setScope(event.target.value)} /></label><div className="apb-row"><label>Budget<input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" /></label><label>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as 'USD' | 'INR' | 'AED')}><option>USD</option><option>INR</option><option>AED</option></select></label></div><label>Payment terms (optional)<textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} /></label></section><section className="apb-card"><h2>Delivery team</h2><p>This contract is sent only to the client. Send individual talent contracts separately from Send contract &gt; Talents.</p><div className="apb-team-list">{(request?.clientSelectionSubmittedAt ? selectedCandidates : candidates).map(candidate => <div key={candidate.workerId} className={`apb-team-member ${selectedIds.includes(candidate.workerId) ? 'selected' : ''}`}><div className="apb-member-identity"><strong>{candidate.name}</strong><small>{candidate.role} | {candidate.location}</small></div>{!request?.clientSelectionSubmittedAt && <button type="button" disabled={Boolean(savedProjectId)} onClick={()=>toggleCandidate(candidate.workerId)}>{selectedIds.includes(candidate.workerId) ? 'Remove' : 'Add'}</button>}</div>)}</div>{selectedCandidates.length === 0 ? <p className="apb-warning">Select one or more profiles for this project.</p> : <p className="apb-selected-count">{selectedCandidates.length} delivery team member{selectedCandidates.length === 1 ? '' : 's'} selected</p>}</section></div></fieldset><div className="apb-action-feedback" aria-live="polite">{error && <div role="alert" className="apb-alert error">{error}</div>}</div>{!!history?.length && <details className="apb-card"><summary>Contract version history</summary>{history.map(v=><div key={v.version} style={{padding:12,borderBottom:'1px solid #e2e8f0'}}><strong>Version {v.version} | {v.title}</strong><p>{v.scope}</p><p>{v.currency} {v.budget} | {v.paymentTerms||'No payment terms'}</p><small>Sent {new Date(v.sentAt).toLocaleString()} | {v.acceptedAt?'Accepted '+new Date(v.acceptedAt).toLocaleString():'Not accepted'}</small></div>)}</details>}{!!savedProjectId&&<div className="apb-card"><button type="button" onClick={()=>{void getAdminProjects(requestId).then(items=>{const project=items.find(p=>p._id===savedProjectId);if(project)setActivity(project.contractActivity||[]);}).catch(e=>setError((e as Error).message));}}>Refresh activity</button><ContractActivity items={activity}/></div>}<footer className="apb-actions"><button type="button" disabled={working} onClick={onBack}>Cancel</button><button type="button" disabled={working || Boolean(savedProjectId)} onClick={() => void save(false)}>{savedProjectId ? 'Draft saved' : working ? 'Saving...' : 'Save draft'}</button><button type="button" className="primary" disabled={working} onClick={() => {if(contractSent&&!resending){setResending(true);setSuccess('Edit the contract below, then send the revised version for client acceptance.');return;}void save(true);}}>{working ? 'Saving and sending...' : resending ? 'Send revised contract' : contractSent ? 'Resend contract' : savedProjectId ? 'Send saved contract' : 'Create and send contract'}</button></footer></main>;
}
