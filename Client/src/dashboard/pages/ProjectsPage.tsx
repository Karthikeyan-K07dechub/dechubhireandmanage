import { useCallback, useEffect, useRef, useState } from 'react';
import ProjectTeamList from '../components/ProjectTeamList';
import LandingTalentRequestModal from '../../components/common/LandingTalentRequestModal';
import { createCompanyProjectTask, getCompanyProjectTasks, getCompanyProjects, type DeliveryProject, type DeliveryTask } from '../../api/projects.api';

const STATUS_LABEL: Record<DeliveryProject['status'], string> = { draft: 'Preparing contract', contract_sent: 'Awaiting your acceptance', active: 'Active', payment_submitted: 'Payment under review', completed: 'Completed', cancelled: 'Cancelled' };

export default function ProjectsPage({ onRequestCreated }: { onRequestCreated: () => void }) {
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
  const addTask = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected || !taskTitle.trim() || submittingTask.current) return;
    const projectId = selected._id;
    submittingTask.current = true;
    setWorking(true);
    setError('');
    setTaskMessage('');
    try {
      const task = await createCompanyProjectTask(projectId, {
        title: taskTitle.trim(), description: taskDescription.trim(),
        assigneeWorkerIds: [...new Set(selected.teamMembers.map(member => member.workerId))], priority: 'medium',
      });
      if (selectedProjectId.current === projectId) {
        setTasks(items => [task, ...items.filter(item => item._id !== task._id)]);
        setTaskTitle('');
        setTaskDescription('');
        setTaskMessage('Task assigned successfully.');
        setSelected(current => current?._id === projectId ? {
          ...current,
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
  return <div className="db-page"><div className="db-page-header"><div><div className="db-page-title">Projects</div><div className="db-page-sub">Manage project delivery, assign tasks, and track your team?s progress.</div></div><button type="button" className="db-btn-primary" onClick={() => setRequestOpen(true)}>Create project</button></div><LandingTalentRequestModal isOpen={requestOpen} onClose={closeRequest} variant="project" onSuccess={onRequestCreated} />{error ? <div className="db-project-error">{error}</div> : null}{projects.length === 0 ? <div className="db-card"><div className="db-empty"><div className="db-empty-title">No projects are ready yet</div><div className="db-empty-sub">Your Dechub-Bridge team will add the agreed delivery plan after your project discussion.</div></div></div> : <div className="db-project-layout"><aside className="db-project-list">{projects.map((project) => <button key={project._id} type="button" onClick={() => setSelected(project)} className={`db-project-list-item ${selected?._id === project._id ? 'active' : ''}`}><strong>{project.title}</strong><span>{STATUS_LABEL[project.status]}</span></button>)}</aside>{selected ? <section className="db-card db-project-detail"><div className="db-project-topline"><span className={`db-project-status ${selected.status}`}>{STATUS_LABEL[selected.status]}</span><strong>{selected.currency} {selected.budget.toLocaleString()}</strong></div><h2>{selected.title}</h2><p>{selected.description}</p><div className="db-project-info"><div><small>Scope</small><p>{selected.scope}</p></div><div><small>Deliverables</small><ul>{selected.deliverables.map((item) => <li key={item}>{item}</li>)}</ul></div><div><small>Delivery team</small><p>{selected.teamMembers.map((member) => member.role).join(', ')}</p></div></div><ProjectTeamList project={selected} />{selected.status === 'contract_sent' && <div className="db-project-action"><p>Accept the project contract in Contracts to start assigning delivery tasks.</p><a className="db-card-link" href={`/dashboard?tab=contracts#project-contract-${selected._id}`}>Review contract</a></div>}{selected.status === 'active' ? <><div className="db-project-section"><h3>Assign delivery task</h3><p className="db-page-sub">New tasks are sent to the assigned delivery team.</p><form onSubmit={addTask} className="db-project-form"><input className="db-input" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" maxLength={240} required /><textarea className="db-textarea" value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Task details" maxLength={5000} /><button type="submit" className="db-btn-primary" disabled={working || !taskTitle.trim()}>{working ? 'Assigning?' : 'Assign task'}</button>{taskMessage && <p role="status" className="db-page-sub">{taskMessage}</p>}</form></div></> : null}<div className="db-project-section"><h3>Task status</h3>{(selected.startDate || selected.targetEndDate) && <div className="db-task-project-dates"><span><strong>Project start date:</strong> {selected.startDate ? new Date(selected.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not set'}</span><span><strong>Project end date:</strong> {selected.targetEndDate ? new Date(selected.targetEndDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not set'}</span></div>}{tasks.length === 0 ? <p className="db-page-sub">No tasks have been assigned yet.</p> : <div className="db-project-task-list">{tasks.map((task) => <div key={task._id} className="db-project-task"><strong>{task.title}</strong><span>{task.status.replace('_', ' ')}</span><p>{task.description}</p></div>)}</div>}</div></section> : null}</div>}</div>;
}
