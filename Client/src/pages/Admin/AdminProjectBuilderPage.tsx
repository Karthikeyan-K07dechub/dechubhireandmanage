import { useEffect, useMemo, useRef, useState } from 'react';
import { getTalentRequest, listMarketplaceCandidatesForAdmin, type AdminMarketplaceCandidateItem, type TalentRequestItem } from '../../api/admin.api';
import { createAdminProject, sendAdminProjectContract } from '../../api/projects.api';
import './admin-project-builder.css';

interface AdminProjectBuilderPageProps { requestId: string; onBack: () => void; }
const parseBudget = (value: string) => Number(value.replace(/[^0-9.]/g, '')) || 0;

export default function AdminProjectBuilderPage({ requestId, onBack }: AdminProjectBuilderPageProps) {
  const saving = useRef(false);
  const [savedProjectId, setSavedProjectId] = useState('');
  const [contractSent, setContractSent] = useState(false);
  const [request, setRequest] = useState<TalentRequestItem | null>(null);
  const [candidates, setCandidates] = useState<AdminMarketplaceCandidateItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [contractorAmounts, setContractorAmounts] = useState<Record<string, string>>({});
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [scope, setScope] = useState('');
  const [budget, setBudget] = useState(''); const [currency, setCurrency] = useState<'USD' | 'INR' | 'AED'>('USD'); const [paymentTerms, setPaymentTerms] = useState('Payment due after project completion and approval.');
  const [deliverables, setDeliverables] = useState(''); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false); const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  useEffect(() => { let active = true; void Promise.all([getTalentRequest(requestId), listMarketplaceCandidatesForAdmin({ requestId, perPage: 24 })]).then(([detail, result]) => { if (!active) return; setRequest(detail); setCandidates(result.items); setTitle(detail.projectName || detail.projectType || `${detail.companyName} project`); setDescription(detail.projectDescription || ''); setScope(detail.projectDescription || ''); setBudget(detail.budget || ''); const preselected = detail.clientSelectionSubmittedAt ? (detail.clientDecisions ?? []).filter(decision => decision.decision === 'accepted').map(decision => decision.workerId) : detail.workerId ? [detail.workerId] : (detail.shortlistedTalentProfiles ?? []).map((profile) => profile.workerId); setSelectedIds(preselected); }).catch((reason: Error) => active && setError(reason.message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [requestId]);
  const selectedCandidates = useMemo(() => candidates.filter((candidate) => selectedIds.includes(candidate.workerId)), [candidates, selectedIds]);
  const toggleCandidate = (id: string) => { if (request?.clientSelectionSubmittedAt && !request.clientDecisions?.some(decision => decision.workerId === id && decision.decision === 'accepted')) return; setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]); };
  const save = async (sendNow: boolean) => {
    if (saving.current || contractSent) return;
    setError(''); setSuccess('');
    const lines = deliverables.split('\n').map(item => item.trim()).filter(Boolean);
    if (!savedProjectId) {
      const problems: string[] = [];
      if (title.trim().length < 3 || title.trim().length > 180) problems.push('Project title must contain between 3 and 180 characters.');
      if (!description.trim()) problems.push('Enter a description.');
      if (!scope.trim()) problems.push('Enter the scope of work.');
      if (paymentTerms.trim().length < 3 || paymentTerms.trim().length > 1200) problems.push('Payment terms must contain between 3 and 1200 characters.');
      if (!lines.length || lines.length > 50 || lines.some(line => line.length > 600)) problems.push('Add between 1 and 50 deliverables, each up to 600 characters.');
      if (!selectedIds.length) problems.push('Select at least one delivery team member.');
      if (selectedIds.some(id => !contractorAmounts[id]?.trim() || !Number.isFinite(Number(contractorAmounts[id])) || Number(contractorAmounts[id]) <= 0)) problems.push('Enter an agreed amount greater than zero for each contractor.');
      if (!Number.isFinite(parseBudget(budget))) problems.push('Enter a valid budget.');
      if (problems.length) { setError(problems.join(' ')); return; }
    }
    saving.current = true; setWorking(true);
    try {
      let projectId = savedProjectId;
      if (!projectId) {
        const project = await createAdminProject({ talentRequestId: requestId,
          startDate: request?.expectedStartDate ? new Date(request.expectedStartDate).toISOString() : undefined,
          targetEndDate: request?.expectedEndDate ? new Date(request.expectedEndDate).toISOString() : undefined,
          title: title.trim(), description: description.trim(), scope: scope.trim(), budget: parseBudget(budget), currency,
          paymentTerms: paymentTerms.trim(), deliverables: lines,
          teamMembers: selectedIds.map(workerId => ({workerId, role: candidates.find(candidate => candidate.workerId === workerId)?.role || 'Delivery team member', agreedAmount: Number(contractorAmounts[workerId])})),
        });
        projectId = project._id; setSavedProjectId(projectId);
      }
      if (sendNow) { await sendAdminProjectContract(projectId); setContractSent(true); setSuccess('Contract is available in the client dashboard. Email delivery is queued.'); }
      else setSuccess('Draft saved. Select Send saved contract when ready.');
    } catch (reason) {
      const failure = reason as {message?: string; fields?: Record<string,string>};
      setError([failure.message || 'Unable to save the project.', ...Object.values(failure.fields || {})].join(' '));
    } finally { saving.current = false; setWorking(false); }
  };
  if (loading) return <main className="apb-root"><div className="apb-card">Loading project builder...</div></main>;
  return <main className="apb-root"><header className="apb-header"><button type="button" onClick={onBack}>Back to request</button><div><span>Dechub Admin</span><h1>Build delivery project</h1><p>{request?.companyName || 'Client company'}: create the contract and delivery team before client acceptance.</p></div></header>{error ? <div className="apb-alert error">{error}</div> : null}{success ? <div className="apb-alert success">{success}</div> : null}<fieldset className="apb-form-fields" disabled={working || Boolean(savedProjectId)}><div className="apb-grid"><section className="apb-card"><h2>Project contract</h2>{(request?.expectedStartDate || request?.expectedEndDate) && <p>Client expected dates: <strong>{request.expectedStartDate ? new Date(request.expectedStartDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</strong> to <strong>{request.expectedEndDate ? new Date(request.expectedEndDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</strong>. These dates will be included in the project.</p>}<label>Project title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Client-facing description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Scope of work<textarea value={scope} onChange={(event) => setScope(event.target.value)} /></label><div className="apb-row"><label>Budget<input value={budget} onChange={(event) => setBudget(event.target.value)} inputMode="decimal" /></label><label>Currency<select value={currency} onChange={(event) => setCurrency(event.target.value as 'USD' | 'INR' | 'AED')}><option>USD</option><option>INR</option><option>AED</option></select></label></div><label>Payment terms<textarea value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} /></label><label>Deliverables, one per line<textarea value={deliverables} onChange={(event) => setDeliverables(event.target.value)} placeholder="Discovery and planning&#10;Design and development&#10;Final handover" /></label></section><section className="apb-card"><h2>Delivery team</h2><p>Each selected person receives project access and task notifications after client acceptance.</p><div className="apb-team-list">{(request?.clientSelectionSubmittedAt ? selectedCandidates : candidates).map(candidate => <div key={candidate.workerId} className={`apb-team-member ${selectedIds.includes(candidate.workerId) ? 'selected' : ''}`}><div className="apb-member-identity"><strong>{candidate.name}</strong><small>{candidate.role} | {candidate.location}</small></div>{!request?.clientSelectionSubmittedAt && <button type="button" onClick={()=>toggleCandidate(candidate.workerId)}>{selectedIds.includes(candidate.workerId) ? 'Remove' : 'Add'}</button>}{selectedIds.includes(candidate.workerId) && <label className="apb-contractor-amount">Agreed amount ({currency})<input type="number" min="0.01" step="0.01" inputMode="decimal" required value={contractorAmounts[candidate.workerId] || ''} onChange={event=>setContractorAmounts(current=>({...current,[candidate.workerId]:event.target.value}))} placeholder="Enter amount"/></label>}</div>)}</div>{selectedCandidates.length === 0 ? <p className="apb-warning">Select one or more profiles for this project.</p> : <p className="apb-selected-count">{selectedCandidates.length} delivery team member{selectedCandidates.length === 1 ? '' : 's'} selected</p>}</section></div></fieldset><div className="apb-action-feedback" aria-live="polite">{error && <div role="alert" className="apb-alert error">{error}</div>}{success && <div role="status" className="apb-alert success">{success}</div>}</div><footer className="apb-actions"><button type="button" disabled={working} onClick={onBack}>Cancel</button><button type="button" disabled={working || Boolean(savedProjectId)} onClick={() => void save(false)}>{savedProjectId ? 'Draft saved' : working ? 'Saving...' : 'Save draft'}</button><button type="button" className="primary" disabled={working || contractSent} onClick={() => void save(true)}>{working ? 'Saving and sending...' : contractSent ? 'Contract sent' : savedProjectId ? 'Send saved contract' : 'Create and send contract'}</button></footer></main>;
}
