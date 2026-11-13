import useAdminUpdateAttention from '../../components/useAdminUpdateAttention';
import MonthlyInvoices from './MonthlyInvoices';
import AttentionDot from '../../components/AttentionDot';
import {api,unwrapApiData} from '../../api/client';
import EquipmentSection from '../../components/EquipmentSection';
import { useEffect, useRef, useState } from 'react';
import { listTalentRequests, unreadCount, type TalentRequestItem } from '../../api/admin.api';
import './admin-talent-requests.css';

interface TalentRequestsPageProps {
  onLogout: () => void;
  onOpenRequest: (id: string) => void;
}

export default function TalentRequestsPage({ onLogout, onOpenRequest }: TalentRequestsPageProps) {
  const [showInvoices,setShowInvoices]=useState(new URLSearchParams(window.location.search).has('invoices'));
  const [showEquipment,setShowEquipment]=useState(new URLSearchParams(window.location.search).has('equipment'));
  const [items, setItems] = useState<TalentRequestItem[]>([]);
  const [badge, setBadge] = useState(0);
  const [loading,setLoading]=useState(true);
  const [loadError,setLoadError]=useState('');
  const fetching=useRef(false);
  const [equipmentUnread,setEquipmentUnread]=useState(false);
  const invoiceUpdates=useAdminUpdateAttention();
  const [projectUnread,setProjectUnread]=useState<Record<string,number>>({});
  useEffect(()=>{let active=true;const load=()=>{if(document.hidden)return;void api.get('/admin/work-updates/projects').then(r=>{if(active)setProjectUnread(Object.fromEntries(r.data.data.map((p:{_id:string;unreadCount:number})=>[p._id,p.unreadCount])));}).catch(()=>{});};load();const timer=setInterval(load,15000);window.addEventListener('project-updates-read',load);return()=>{active=false;clearInterval(timer);window.removeEventListener('project-updates-read',load);};},[]);

  const statusTone: Record<string, string> = {
    pending_review: 'new',
    shortlisted_sent: 'discussion',
    candidate_selected: 'contacted',
    hire_started: 'contacted',
    approved: 'contacted',
    alternative_suggested: 'discussion',
    rejected: 'closed',
    hired: 'contacted',
    talent_hired: 'contacted',
  };

  async function load() {
    if(fetching.current)return;
    fetching.current=true;
    await Promise.allSettled([
      listTalentRequests({perPage:50}).then(data=>{
        setItems(data.items||[]);
        setLoadError('');
      }).catch(()=>setLoadError('Unable to load talent requests. Check your connection or sign in again if your session has expired.')).finally(()=>setLoading(false)),
      unreadCount().then(data=>setBadge(data.unread||0)),
      api.get('/admin/equipment-requests').then(response=>{
        const equipment=unwrapApiData<Array<{adminReadAt?:string;reviewedAt?:string;createdAt:string}>>(response.data);
        setEquipmentUnread(equipment.some(row=>!row.adminReadAt||new Date(row.adminReadAt)<new Date(row.reviewedAt||row.createdAt)));
      }),
    ]);
    fetching.current=false;
  }

  useEffect(() => {
    load();
    const refresh = () => { void load(); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    window.addEventListener('equipment-attention-changed',refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('equipment-attention-changed',refresh); };
  }, []);

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Unknown');
  const formatStatus = (value?: string) => (value ? value.replace(/_/g, ' ') : 'unknown');
  const pendingCount = items.filter((item) => item.status === 'pending_review').length;
  const isHired = (item: TalentRequestItem) => Boolean(['hired', 'talent_hired'].includes(item.status) || (item.clientContractApprovedAt && item.contractorContractApproved) || item.projectCompleted);
  const approvedCount = items.filter((item) => !isHired(item) && ['approved', 'candidate_selected', 'hire_started'].includes(item.status)).length;
  const hiredCount = items.filter(isHired).length;

  if(showInvoices)return <div className="atr-root"><header className="atr-hero"><div className="atr-hero-copy"><span className="atr-kicker">Admin cockpit</span><h1>Invoices</h1><p>Monthly client billing across your projects.</p></div><div className="atr-hero-actions"><button className="atr-logout" onClick={()=>{setShowInvoices(false);window.history.replaceState({},'','/admin/talent-requests');}}>Back to talent requests</button><button className="atr-logout" onClick={onLogout}>Logout</button></div></header><main className="atr-main"><MonthlyInvoices unreadUpdates={invoiceUpdates}/></main></div>;
  if(showEquipment)return <div className="atr-root"><header className="atr-hero"><div className="atr-hero-copy"><span className="atr-kicker">Admin cockpit</span><h1>Equipment</h1></div><div className="atr-hero-actions"><button className="atr-logout" type="button" onClick={()=>{setShowEquipment(false);const params=new URLSearchParams(window.location.search);params.delete('equipment');window.history.replaceState({},'','/admin/talent-requests'+(params.size?'?'+params.toString():''));}}>Back to talent requests</button><button className="atr-logout" onClick={onLogout}>Logout</button></div></header><main className="atr-main"><EquipmentSection role="admin"/></main></div>;
  return (
    <div className="atr-root">
      <div className="atr-background" aria-hidden="true">
        <span className="atr-orb atr-orb-one" />
        <span className="atr-orb atr-orb-two" />
        <span className="atr-grid" />
      </div>

      <header className="atr-hero">
        <div className="atr-hero-copy">
          <span className="atr-kicker">Admin cockpit</span>
          <h1>Talent requests{(badge>0||Object.values(projectUnread).some(count=>count>0))&&<AttentionDot/>}</h1>
          <p>
            Review incoming hiring demand, track pipeline movement, and respond quickly with a cleaner
            premium workspace.
          </p>
        </div>

        <div className="atr-hero-actions">
          <div className="atr-badge-card">
            <span className="atr-badge-label">Unread queue</span>
            <strong>{badge}</strong>
          </div>
          <button className="atr-logout" type="button" onClick={()=>{setShowInvoices(true);window.history.replaceState({},'','/admin/talent-requests?invoices=all');}}>Invoices{invoiceUpdates.length>0&&<AttentionDot label="Unread invoice updates"/>}</button><button className="atr-logout" type="button" onClick={()=>{setShowEquipment(true);window.history.replaceState({},'','/admin/talent-requests?equipment=all');}}>Equipment{equipmentUnread&&<AttentionDot label="New equipment request or client decision"/>}</button><button className="atr-logout" onClick={onLogout}>Logout</button>
        </div>
      </header>
      <section className="atr-stats" aria-label="Summary">
        <article className="atr-stat-card">
          <span>Total requests</span>
          <strong>{items.length}</strong>
          <small>Last 50 submissions</small>
        </article>
        <article className="atr-stat-card">
          <span>Pending Review</span>
          <strong>{pendingCount}</strong>
          <small>Needs admin decision</small>
        </article>
        <article className="atr-stat-card">
          <span>Approved</span>
          <strong>{approvedCount}</strong>
          <small>Ready for company action</small>
        </article>
        <article className="atr-stat-card">
          <span>Hired</span>
          <strong>{hiredCount}</strong>
          <small>Contracts accepted by both parties</small>
        </article>
      </section>

      <main className="atr-main">
        <section className="atr-list">
          <div className="atr-panel-header">
            <div>
              <h2>Request stream</h2>
              <p>Review availability, suggest alternatives, and unlock hiring only after approval.</p>
            </div>
          </div>

          {loadError&&<p role="alert">{loadError} <button className="atr-btn" type="button" onClick={()=>void load()}>Retry</button></p>}
          <div className="atr-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Project</th>
                  <th>Talent</th>
                  <th>Company</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length===0&&<tr><td colSpan={7}>{loading?'Loading talent requests?':loadError?'Requests could not be loaded.':'No talent requests yet.'}</td></tr>}
                {items.map((it) => (
                  <tr
                    key={it._id}
                    className={it.unread ? 'unread' : ''}
                  >
                    <td>
                      <div className="atr-request-cell">
                        <button className="atr-request-trigger" onClick={() => onOpenRequest(it._id)}>
                          {it._id.slice(-8)}
                        </button>
                        <span>{it.email}</span>
                      </div>
                    </td>
                    <td><div className="atr-person-cell"><strong>{it.projectName?.trim() || it.deliveryProject?.title || 'Project name not provided'}{(it.unread||!!projectUnread[it.deliveryProject?._id||''])&&<AttentionDot label="Unread request or task updates"/>}</strong></div></td>
                    <td>
                      <div className="atr-person-cell">
                        <strong>{it.workerName}</strong>
                        <span>{it.workerRole || 'Talent profile'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="atr-person-cell">
                        <strong>{it.companyName}</strong>
                        <span>{it.contactFirstName || 'Company contact'}</span>
                      </div>
                    </td>
                    <td>{formatDate(it.createdAt)}</td>
                    <td>
                      <span className={`atr-status-pill ${it.projectCompleted ? 'project-completed' : statusTone[it.status] || 'new'}`}>
                        {it.projectCompleted ? 'Project completed' : it.clientContractApprovedAt && it.contractorContractApproved ? <span className="atr-contract-approvals"><span>&#9745; Client approved</span><span>&#9745; Contractor approved</span></span> : it.clientContractApprovedAt ? 'Contract approved by client' : it.clientSelectionSubmittedAt && it.status === 'candidate_selected' ? 'Worker list updated' : formatStatus(it.status)}
                      </span>
                    </td>
                    <td>
                      <div className="atr-actions">
                        <button className="atr-btn atr-btn-primary" onClick={() => onOpenRequest(it._id)}>View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
