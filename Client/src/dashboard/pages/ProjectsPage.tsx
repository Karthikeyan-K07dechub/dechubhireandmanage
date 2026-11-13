import CloseProject from '../components/CloseProject';
import TaskFileDownload from '../../components/TaskFileDownload';
import { consumeChatLink } from '../../components/chatNavigation';
import { api } from '../../api/client';
import TaskConversation from '../../components/TaskConversation';
import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectTeamList from '../components/ProjectTeamList';
import LandingTalentRequestModal from '../../components/common/LandingTalentRequestModal';
import { createCompanyProjectTask, getCompanyProjectTasks, getCompanyProjects, type DeliveryProject, type DeliveryTask } from '../../api/projects.api';

const STATUS_LABEL: Record<DeliveryProject['status'], string> = { draft: 'Preparing contract', contract_sent: 'Awaiting your acceptance', active: 'Active', payment_submitted: 'Payment under review', completed: 'Completed', cancelled: 'Cancelled' };

export default function ProjectsPage({ onRequestCreated }: { onRequestCreated: () => void }) {
  const [chatTask, setChatTask] = useState<DeliveryTask | null>(null);
  const [attention,setAttention]=useState<Array<{taskId:string;projectId:string;unread:number;submitted:boolean}>>([]);
  const refreshAttention=useCallback(async()=>{try{const response=await api.get('/company/task-attention');setAttention(response.data.data);window.dispatchEvent(new Event('task-attention-changed'));}catch{/* Retry on the next refresh. */}},[]);
  useEffect(()=>{void refreshAttention();const timer=window.setInterval(()=>void refreshAttention(),5000);return()=>window.clearInterval(timer);},[refreshAttention]);
  const [assignee, setAssignee] = useState('');
  const [taskFiles,setTaskFiles]=useState<Record<string,File|undefined>>({});
  const [fileInputKey,setFileInputKey]=useState(0);
  const [requestOpen, setRequestOpen] = useState(false);

  const closeRequest = useCallback(() => setRequestOpen(false), []);
  const [projects, setProjects] = useState<DeliveryProject[]>([]); const [selected, setSelected] = useState<DeliveryProject | null>(null);
  const [tasks, setTasks] = useState<DeliveryTask[]>([]); const [loading, setLoading] = useState(true); const [working, setWorking] = useState(false);
  const submittingTask = useRef(false);
  const selectedProjectId = useRef<string | null>(null);
  selectedProjectId.current = selected?._id ?? null;
  const [taskMessage, setTaskMessage] = useState('');
  const [error, setError] = useState(''); const [taskTitle, setTaskTitle] = useState(''); const [taskDescription, setTaskDescription] = useState('');
  useEffect(() => { void getCompanyProjects().then(items => { setProjects(items); setSelected(items.find(item => item._id === new URLSearchParams(window.location.search).get('project')) ?? items[0] ?? null); }).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    let active = true;
    setTasks([]);
    setTaskMessage('');
    if (selected) void getCompanyProjectTasks(selected._id).then(items => { if (active) setTasks(current => [...current, ...items.filter(item => !current.some(existing => existing._id === item._id))]); }).catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [selected?._id]);
  useEffect(()=>{
    if(!selected?._id)return;
    const id=selected._id;let active=true;
    const timer=window.setInterval(()=>{if(document.visibilityState!=='visible')return;void getCompanyProjectTasks(id).then(items=>{if(active)setTasks(items);}).catch(()=>{});},5000);
    return()=>{active=false;window.clearInterval(timer);};
  },[selected?._id]);
  const completeTask = async (task: DeliveryTask) => {
    if (working || task.status === 'completed') return;
    setWorking(true); setError(''); setAssignee(task.assigneeWorkerIds[0] || '');
    try { await api.post('/company/project-tasks/' + task._id + '/review', { decision: 'approve' });
      if (selected) { const [items, list] = await Promise.all([getCompanyProjectTasks(selected._id), getCompanyProjects()]); setTasks(items); setProjects(list); setSelected(list.find(p => p._id === selected._id) || null); void refreshAttention(); }
    } catch (error) { setError((error as Error).message); } finally { setWorking(false); }
  };
  useEffect(()=>{const id=new URLSearchParams(window.location.search).get('task');const task=tasks.find(task=>task._id===id);if(task){setChatTask(task);consumeChatLink('task');}},[selected?._id,tasks.length]);
  const addTaskForWorker = async (event: React.FormEvent, workerId: string) => {
    event.preventDefault();
    if (!selected || !workerId || !taskTitle.trim() || submittingTask.current) return;
    const projectId = selected._id;
    const attachment=taskFiles[workerId];
    if(attachment&&(!attachment.size||attachment.size>10*1024*1024)){setError('Choose a file up to 10 MB.');return;}
    submittingTask.current = true;
    setWorking(true);
    setError('');
    setTaskMessage('');
    try {
      const task = await createCompanyProjectTask(projectId, {
        title: taskTitle.trim(), description: taskDescription.trim(),
        assigneeWorkerIds: [workerId], priority: 'medium',
      }, attachment);
      if (selectedProjectId.current === projectId) {
        setTasks(items => [task, ...items.filter(item => item._id !== task._id)]);
        setTaskTitle('');
        setTaskDescription('');
        setTaskFiles(current=>({...current,[workerId]:undefined}));setFileInputKey(key=>key+1);
        setTaskMessage('Task assigned successfully.');
        setSelected(current => current?._id === projectId ? {
          ...current,
          deliveryCompletedAt: null,
          teamAccess: current.teamAccess?.map(member => task.assigneeWorkerIds.includes(member.workerId) ? {
            ...member, taskSummary: { ...member.taskSummary, total: member.taskSummary.total + 1, todo: member.taskSummary.todo + 1 },
          } : member),
        } : current);
      }
    } catch (reason) {
      if (selectedProjectId.current === projectId) setError((reason as Error).message);
    } finally {
      submittingTask.current = false;
      setWorking(false);
    }
  };

  useEffect(() => {
    if (!selected) return;
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'projects'); params.set('project', selected._id);
    window.history.replaceState({}, '', '/dashboard?' + params.toString());
  }, [selected?._id]);
  if (loading) return <div className="db-page"><div className="db-empty">Loading your projects...</div></div>;
  return <div className="db-page"><div className="db-page-header"><div><div className="db-page-title">Projects</div><div className="db-page-sub">Manage project delivery, assign tasks, and track your team?s progress.</div></div><button type="button" className="db-btn-primary" onClick={() => setRequestOpen(true)}>Create project</button></div><LandingTalentRequestModal isOpen={requestOpen} onClose={closeRequest} variant="project" onSuccess={onRequestCreated} />{error ? <div className="db-project-error">{error}</div> : null}{projects.length === 0 ? <div className="db-card"><div className="db-empty"><div className="db-empty-title">No projects are ready yet</div><div className="db-empty-sub">Your Dechub-Bridge team will add the agreed delivery plan after your project discussion.</div></div></div> : <div className="db-project-layout"><aside className="db-project-list">{projects.map((project) => <button key={project._id} type="button" onClick={() => setSelected(project)} className={`db-project-list-item ${selected?._id === project._id ? 'active' : ''}`}><strong>{project.title}{attention.some(item=>item.projectId===project._id)&&<i className="db-attention-dot" aria-label="Unread message or task awaiting review"/>}</strong><span>{STATUS_LABEL[project.status]}</span>{attention.some(item=>item.projectId===project._id&&item.submitted)?<small className="db-attention-copy">Submission awaiting review</small>:attention.some(item=>item.projectId===project._id&&item.unread>0)?<small className="db-attention-copy">New message</small>:null}</button>)}</aside>{selected ? <section data-update-resource={'project:'+selected._id} className="db-card db-project-detail"><div className="db-project-topline"><span className={`db-project-status ${selected.status}`}>{STATUS_LABEL[selected.status]}</span><strong>{selected.currency} {selected.budget.toLocaleString()} <small className="db-budget-service-note">+ service charges</small></strong></div><h2 data-update-resource={'project:'+selected._id}>{selected.title}</h2><p>{selected.description}</p><div className="db-project-info"><div><small>Scope</small><p>{selected.scope}</p></div><div><small>Delivery team</small><p>{selected.teamMembers.map((member) => member.role).join(', ')}</p></div></div>{selected.status === 'contract_sent' && <div className="db-project-action"><p>Accept the project contract in Contracts to start assigning delivery tasks.</p><a className="db-card-link" href={`/dashboard?tab=contracts#project-contract-${selected._id}`}>Review contract</a></div>}<ProjectTeamList project={selected} renderWorkerTasks={workerId => { const member = selected.teamMembers.find(member => member.workerId === workerId); if (!member) return null; const worker = selected.teamAccess?.find(w => w.workerId === member.workerId); const assigned = tasks.filter(t => t.assigneeWorkerIds.includes(member.workerId)); return <details className="db-worker-tasks" key={member.workerId}><summary>{worker?.name || member.role} - {assigned.length} tasks{assigned.some(task=>attention.some(item=>item.taskId===task._id))&&<i className="db-attention-dot" aria-label="Task messages or reviews need your attention"/>}</summary>{selected.deliveryMode!=='bridge_managed'&&['active','payment_submitted'].includes(selected.status) && <form className="db-project-form" onSubmit={event => {setAssignee(member.workerId); void addTaskForWorker(event,member.workerId);}}><h4>Assign task to {worker?.name || member.role}</h4><input className="db-input" value={assignee===member.workerId?taskTitle:''} onChange={e=>{setAssignee(member.workerId);setTaskTitle(e.target.value);}} placeholder="Task title" maxLength={240} required/><textarea className="db-textarea" value={assignee===member.workerId?taskDescription:''} onChange={e=>{setAssignee(member.workerId);setTaskDescription(e.target.value);}} placeholder="Task details" maxLength={5000}/><label className="db-task-upload"><span className="db-task-upload-title">Task attachment <span>(optional)</span></span><input aria-label="Choose task attachment" key={fileInputKey} type="file" disabled={working} onChange={event=>{setAssignee(member.workerId);setTaskFiles(current=>({...current,[member.workerId]:event.target.files?.[0]}));}}/><small>Any file up to 10 MB. Only shared with this talent.</small></label><button className="db-btn-primary" disabled={working}>{working ? 'Assigning...' : 'Assign task'}</button>{assignee===member.workerId&&error&&<p role="alert" className="db-project-error">{error}</p>}{assignee===member.workerId&&taskMessage&&<p role="status">{taskMessage}</p>}</form>}{assigned.length?assigned.map(task=><div className="db-project-task" key={task._id}><div className="db-task-title-row"><strong>{task.title}{attention.some(item=>item.taskId===task._id)&&<i className="db-attention-dot" aria-label="Unread message or submission awaiting review"/>}</strong><TaskFileDownload taskId={task._id} name={task.attachmentName}/><button type="button" className={'db-btn-secondary db-task-complete' + (task.status === 'completed' ? ' is-completed' : '')} disabled={working || task.status === 'completed' || !['active','payment_submitted'].includes(selected.status)} title={task.status === 'completed' ? 'Approved by client' : 'Approve this task as completed after reviewing the work'} onClick={()=>void completeTask(task)}>{task.status === 'completed' ? 'Completed' : 'Mark completed'}</button></div><small className={attention.some(item=>item.taskId===task._id)?'db-attention-copy':''}>{attention.some(item=>item.taskId===task._id&&item.submitted)?'Submitted - awaiting your review':attention.some(item=>item.taskId===task._id&&item.unread>0)?'New message':task.status==='submitted'?'Submitted - awaiting your review':task.status==='completed'?'Completed':task.status==='todo'?'Awaiting submission':task.status.replace(/_/g,' ')}</small><p>{task.description}</p><button type="button" className="db-btn-secondary" onClick={()=>setChatTask(task)}>{attention.some(item=>item.taskId===task._id&&item.submitted)||task.status==='submitted'?'Review submission':'Message / review'}</button></div>):<p>No tasks assigned to this talent.</p>}</details>;}} /><CloseProject key={selected._id} project={selected} tasks={tasks} onClosed={()=>{void getCompanyProjects().then(list=>{setProjects(list);setSelected(list.find(p=>p._id===selected._id)||null);});}} /></section> : null}</div>}{chatTask&&<TaskConversation taskId={chatTask._id} title={chatTask.title} status={tasks.find(t=>t._id===chatTask._id)?.status||chatTask.status} onClose={()=>{setChatTask(null);void refreshAttention();}} onUpdate={()=>{void refreshAttention();if(selected)void Promise.all([getCompanyProjectTasks(selected._id),getCompanyProjects()]).then(([items,list])=>{setTasks(items);setProjects(list);setSelected(list.find(p=>p._id===selected._id)||null);});}}/>}</div>;
}
