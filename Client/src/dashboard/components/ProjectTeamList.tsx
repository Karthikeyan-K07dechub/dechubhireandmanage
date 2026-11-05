import { consumeChatLink } from '../../components/chatNavigation';
import { useEffect, useState } from 'react';
import TaskConversation from '../../components/TaskConversation';
import type { ReactNode } from 'react';
import type { DeliveryProject } from '../../api/projects.api';

export default function ProjectTeamList({ project, renderWorkerTasks }: { project: DeliveryProject; renderWorkerTasks?: (workerId: string) => ReactNode }) {
  const [chat, setChat] = useState<{workerId:string;name:string}|null>(null);
  useEffect(()=>{const id=new URLSearchParams(window.location.search).get('chatWorker');const worker=project.teamAccess?.find(worker=>worker.workerId===id);if(worker){setChat({workerId:worker.workerId,name:worker.name});consumeChatLink('chatWorker');}},[project._id]);
  return <section className="db-project-section">
    <h3>Assigned workers</h3>
    <p className="db-page-sub">Delivery team assigned to {project.title}.</p>
    {project.teamAccess?.length ? <div className="db-team-access-list">
      {project.teamAccess.map(member => <article key={member.workerId} className={`db-team-access-card db-worker-chat-row ${member.accountStatus !== 'kyc_pending' ? 'has-account' : ''}`}>
        <div><strong>{member.name}</strong><span>{member.role}</span><small>{member.email}</small>{member.country && <span>{member.country}</span>}</div>
        {member.accountStatus !== 'kyc_pending' && <div><small>Account</small><strong className={`db-team-state ${member.accountStatus}`}>{member.accountStatus.replace(/_/g, ' ')}</strong></div>}
        <div><small>Last login</small><strong>{member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleString() : 'Not signed in yet'}</strong></div>
        <div><small>Project access</small><strong className="db-team-state">{project.status === 'contract_sent' ? 'Pending client acceptance' : ['active', 'payment_submitted'].includes(project.status) ? (project.contractorAcceptances?.some(acceptance => acceptance.workerId === member.workerId) ? 'Active' : 'Pending contractor acceptance') : project.status.replace(/_/g, ' ')}</strong></div>
        <div><small>Tasks</small><strong>{member.taskSummary.completed}/{member.taskSummary.total} completed</strong><span>{member.taskSummary.inProgress} in progress</span></div>
        <div className="db-worker-message-action"><button type="button" className="db-btn-secondary db-btn-sm" onClick={()=>setChat({workerId:member.workerId,name:member.name})}>Message</button></div>
        {renderWorkerTasks && <div style={{ gridColumn: '1 / -1', width: '100%' }}>{renderWorkerTasks(member.workerId)}</div>}
      </article>)}
    </div> : <p className="db-page-sub">Worker details are not available yet.</p>}
    {chat&&<TaskConversation taskId={chat.workerId} peer={{projectId:project._id,workerId:chat.workerId}} title={chat.name} status="chat" onClose={()=>setChat(null)} onUpdate={()=>{}}/>}
  </section>;
}
