import TaskFileDownload from '../components/TaskFileDownload';
import { consumeChatLink } from '../components/chatNavigation';
import TaskConversation from '../components/TaskConversation';
import { useEffect, useState } from 'react';
import { acceptTeamMemberProjectContract, getTeamMemberProjects, getTeamMemberProjectTasks, type DeliveryProject, type DeliveryTask } from '../api/projects.api';
import './project-contracts.css';
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided';
export default function ProjectTasksPage({ contracts = false, readOnly = false, onNavigate }: { contracts?: boolean; readOnly?: boolean; onNavigate?: (tab: 'projects' | 'contract' | 'invoices', projectId: string) => void }) {
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [selectedId, setSelectedId] = useState(new URLSearchParams(window.location.search).get('project') || '');
  const [peerChat, setPeerChat] = useState<{projectId:string;workerId:string;name:string;client?:boolean}|null>(null);
  const [chatMode,setChatMode]=useState<'message'|'submit'>('message');
  const [chatTask, setChatTask] = useState<DeliveryTask | null>(null);
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
  useEffect(()=>{const params=new URLSearchParams(window.location.search);const task=tasks.find(task=>task._id===params.get('task'));if(task){setChatTask(task);consumeChatLink('task');}const peer=params.get('chatPeer');if(selected&&peer==='client'){setPeerChat({projectId:selected._id,workerId:'client',name:selected.companyDetails?.name||'Client',client:true});consumeChatLink('chatPeer');}else{const member=selected?.teamDirectory?.find(member=>member.workerId===peer&&!member.isSelf);if(selected&&member){setPeerChat({projectId:selected._id,workerId:member.workerId,name:member.name});consumeChatLink('chatPeer');}}},[selected?._id,tasks.length]);
  async function accept() {
    if (!selected || !agreed || working || readOnly) return;
    const id = selected._id; setWorking('accept'); setError('');
    try { const updated = await acceptTeamMemberProjectContract(id); setProjects(items => items.map(item => item._id === id ? updated : item)); setSuccess('Contract accepted. Dechub has been notified.'); }
    catch (reason) { setError((reason as Error).message); } finally { setWorking(''); }
  }
  const go = (tab: 'projects' | 'contract' | 'invoices', id: string) => onNavigate ? onNavigate(tab, id) : window.location.assign('/contractor/dashboard?tab=' + tab + '&project=' + encodeURIComponent(id));
  return <main className="cd-page"><h2 className="cd-page-title">{contracts ? 'Project contracts' : 'Projects'}</h2><p className="cd-page-sub">{contracts ? 'Review and accept project contracts approved by the client.' : 'Review assigned companies, project dates, and delivery tasks.'}</p>
    {error && <p className="ctp-error" role="alert">{error}</p>}{success && <p className="ctp-success" role="status">{success}</p>}
    {loading ? <p>Loading projects...</p> : !projects.length ? <div className="cd-card ctp-card">{contracts ? 'No project contracts are ready. Contracts appear here after client approval.' : 'No client-approved projects have been assigned to you yet.'}</div> : <div className="ctp-layout"><aside>{projects.map(project => <button type="button" className={selected?._id === project._id ? 'selected' : ''} key={project._id} onClick={() => setSelectedId(project._id)}>{project.title}<small>{project.contractorAcceptedAt ? 'Contract accepted' : 'Your approval needed'}</small></button>)}</aside>
      {selected && <section className="cd-card ctp-card"><h3>{selected.title}</h3>{selected.status==='completed'&&<p className="ctp-completed-label">Project completed</p>}{selected.contractorCompletedAt && <p className="ctp-completed-label">Your tasks approved - eligible to submit invoice</p>}<p>{selected.description}</p><div className="ctp-details"><div><small>Your project role</small><strong>{selected.assignedRole || 'Not provided'}</strong></div><div><small>Company</small><strong>{selected.companyDetails?.name || 'Not provided'}</strong></div><div><small>Country</small><strong>{selected.companyDetails?.country || 'Not provided'}</strong></div><div><small>Company website</small><span>{selected.companyDetails?.website || 'Not provided'}</span></div><div><small>Company address</small><span>{selected.companyDetails?.address || 'Not provided'}</span></div><div><small>Start date</small><strong>{date(selected.startDate)}</strong></div><div><small>End date</small><strong>{date(selected.targetEndDate)}</strong></div></div>
        {!contracts && <section className="ctp-team-directory"><h4>Project team</h4><article><div><strong>{selected.companyDetails?.name || 'Client company'}</strong><p>Client</p></div><button type="button" disabled={readOnly} onClick={()=>setPeerChat({projectId:selected._id,workerId:'client',name:selected.companyDetails?.name || 'Client company',client:true})}>Message client</button></article>{selected.teamDirectory?.some(member => !member.isSelf) ? selected.teamDirectory.filter(member => !member.isSelf).map(member=><article key={member.workerId}><div><strong>{member.name}</strong><p>{member.role}</p></div><span>{member.status}</span>{!member.isSelf&&<button type="button" disabled={readOnly || !selected.contractorAcceptedAt} onClick={()=>setPeerChat({projectId:selected._id,workerId:member.workerId,name:member.name})}>Message</button>}</article>):<p>No other contractors are assigned to this project.</p>}</section>}
        <h4>Scope of work</h4><p>{selected.scope}</p><h4>Deliverables</h4><ul>{selected.deliverables.map((item, index) => <li key={index}>{item}</li>)}</ul>
        {contracts ? <><h4>{selected.contractorAcceptedAt ? 'Your agreed contract amount' : 'Your proposed contract amount'}</h4><p>{selected.agreedAmount == null ? 'Not set. Contact Dechub to confirm your amount.' : selected.currency + ' ' + selected.agreedAmount.toLocaleString()}</p><h4>Payment terms</h4><p>{selected.paymentTerms}</p><p>Client approved: {date(selected.clientAcceptedAt)}</p>
          {selected.contractorAcceptedAt ? <p className="ctp-success">You accepted this contract on {date(selected.contractorAcceptedAt)}.</p> : selected.status !== 'completed' && <div className="ctp-accept"><label><input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)} />I have reviewed and agree to the project scope, dates, deliverables, and payment terms.</label><button type="button" disabled={!agreed || Boolean(working) || readOnly} onClick={() => void accept()}>{working === 'accept' ? 'Accepting...' : 'Accept project contract'}</button></div>}
          <button type="button" onClick={() => go('projects', selected._id)}>Explore project</button></> : <>
          {!selected.contractorAcceptedAt && <div className="ctp-accept"><p>Accept your project contract in Contracts before updating delivery tasks.</p><button type="button" onClick={() => go('contract', selected._id)}>Review contract</button></div>}
          <h4>My tasks</h4>{!tasks.length ? <p>No tasks are assigned to you yet.</p> : tasks.map(task => <div key={task._id} className="ctp-task"><div className="db-task-title-row"><strong>{task.title}</strong><TaskFileDownload contractor taskId={task._id} name={task.attachmentName}/></div><p>{task.description}</p><small>Status: {task.status === 'submitted' ? 'Awaiting client review' : task.status === 'completed' ? 'Approved by client' : 'Awaiting submission'}</small><div className="ctp-task-chat-footer"><span>Have any questions? Message the client.</span><button type="button" disabled={readOnly || !selected.contractorAcceptedAt} onClick={()=>{setChatMode('message');setChatTask(task);}}>Message client</button><button type="button" disabled={readOnly || !selected.contractorAcceptedAt || task.status === 'completed'} onClick={()=>{setChatMode('submit');setChatTask(task);}}>{task.status === 'submitted' ? 'Update submission' : 'Submit task'}</button></div></div>)}<section className="ctp-task-invoice-section" aria-labelledby="task-invoice-heading"><h4 id="task-invoice-heading">Invoice</h4><p className={selected.contractorCompletedAt ? 'ctp-invoice-approved' : 'ctp-invoice-wait'}>{selected.contractorCompletedAt ? 'The client approved your assigned work. You can now submit your invoice.' : 'Wait until client completion approval to send your invoice.'}</p><button type="button" disabled={readOnly || !selected.contractorCompletedAt} onClick={() => go('invoices', selected._id)}>Go to invoices</button></section></>}
      </section>}
    </div>}
  {chatTask&&<TaskConversation contractor mode={chatMode} taskId={chatTask._id} title={chatTask.title} status={tasks.find(t=>t._id===chatTask._id)?.status||chatTask.status} onClose={()=>setChatTask(null)} onUpdate={()=>{if(selected)void Promise.all([getTeamMemberProjectTasks(selected._id),getTeamMemberProjects()]).then(([items,list])=>{setTasks(items);setProjects(list);});}}/>}
  {peerChat&&<TaskConversation contractor peer={{projectId:peerChat.projectId,workerId:peerChat.workerId,client:peerChat.client}} taskId={peerChat.workerId} title={peerChat.name} status="chat" onClose={()=>setPeerChat(null)} onUpdate={()=>{}}/>}
  </main>;
}
