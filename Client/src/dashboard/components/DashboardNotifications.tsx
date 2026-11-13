import AttentionDot from '../../components/AttentionDot';
import {observeVisibleUpdates,updateResource} from '../../components/updateVisibility';
import { api } from '../../api/client';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { getCompanyProjects, getCompanyProjectNotifications, markCompanyProjectNotificationRead } from '../../api/projects.api';
import { listCompanyTalentRequests } from '../../api/talentRequests.api';
import { getContracts, getInvoices, getWorkers, getDocuments, getDashboardStats } from '../api/dashboard.api';
import { getMyCompany } from '../../api/company.api';
import './dashboard-notifications.css';

type Notice = { id: string; title: string; message: string; href: string; read: boolean; serverId?: string };
const label = (status: string) => status.replace(/_/g, ' ').replace(/\bworker\b/gi,'talent');
function noticeSection(notice: Notice) {
  const url = new URL(notice.href, window.location.origin);
  return url.pathname === '/company/onboarding' ? 'settings' : (url.searchParams.get('tab')==='dashboard'?'home':url.searchParams.get('tab')) || 'home';
}
export default function DashboardNotifications({ onCountsChange, activeSection }: { onCountsChange?: (counts: Record<string, number>) => void; activeSection: string }) {
  const sectionRef = useRef(activeSection);
  sectionRef.current = activeSection;
  const [projectUpdateCount,setProjectUpdateCount]=useState(0);
  const [taskAttentionCount,setTaskAttentionCount]=useState(0);
  const [equipmentCount,setEquipmentCount]=useState(0);
  useEffect(()=>{
    let active=true;let busy=false;
    async function refreshAttention(){
      if(busy)return;busy=true;
      try{const results=await Promise.allSettled([api.get('/company/task-attention'),api.get('/company/equipment-requests'),api.get('/company/work-updates/projects')]);if(active){if(results[2].status==='fulfilled')setProjectUpdateCount(results[2].value.data.data.reduce((n:number,p:{unreadCount:number})=>n+p.unreadCount,0));if(results[0].status==='fulfilled')setTaskAttentionCount(results[0].value.data.data.length);if(results[1].status==='fulfilled')setEquipmentCount(results[1].value.data.data.filter((item:{status:string;deliveryUpdatedAt?:string;clientDeliveryReadAt?:string|null})=>item.status==='pending'||(item.deliveryUpdatedAt&&!item.clientDeliveryReadAt)).length);}}catch{/* Preserve the last count and retry. */}finally{busy=false;}
    }
    void refreshAttention();
    const timer=window.setInterval(()=>void refreshAttention(),5000);
    const refresh=()=>void refreshAttention();window.addEventListener('focus',refresh);window.addEventListener('task-attention-changed',refresh);window.addEventListener('project-updates-read',refresh);
    return()=>{active=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('task-attention-changed',refresh);window.removeEventListener('project-updates-read',refresh);};
  },[]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const notice of notices) {
      if (notice.read) continue;
      const section = noticeSection(notice);
      if(section==='equipment')continue;
      if(section==='projects' && new URL(notice.href,window.location.origin).searchParams.has('task'))continue;
      counts[section] = (counts[section] || 0) + 1;
    }
    counts.projects=(counts.projects||0)+taskAttentionCount;
    counts.equipment=equipmentCount;
    counts.home=(counts.home||0)+projectUpdateCount;
    onCountsChange?.(counts);
  }, [notices, onCountsChange, taskAttentionCount,equipmentCount,projectUpdateCount]);
  const seen = useRef(new Set<string>());
  const read = useRef(new Set<string>());
  const dismissed = useRef(new Set<string>());
  const storageKey = useRef('');
  const bell = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); bell.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', escape); };
  }, [open]);
  useEffect(() => {
    let active = true;
    let busy = false;
    async function refresh() {
      if (busy) return;
      busy = true;
      try {
        const company = await getMyCompany();
        if (!active) return;
        storageKey.current = 'dechub_notification_reads:' + company.user.email;
        try { dismissed.current = new Set(JSON.parse(localStorage.getItem(storageKey.current + ':dismissed') || '[]')); } catch { /* Keep in-memory dismissals. */ }
        try { read.current = new Set(JSON.parse(localStorage.getItem(storageKey.current) || '[]')); } catch { /* Keep in-memory read state. */ }
        try { seen.current = new Set([...seen.current, ...JSON.parse(sessionStorage.getItem(storageKey.current + ':shown') || '[]')]); } catch { /* Keep in-memory popup state. */ }
        const results = await Promise.allSettled([getCompanyProjectNotifications(), listCompanyTalentRequests(), getInvoices(), getContracts(), getWorkers(), getDocuments(), getDashboardStats(), getCompanyProjects()]);
        if (!active) return;
        const [events, requests, invoices, contracts, workers, documents, stats, projects] = results;
        const items: Notice[] = [];
        if (events.status === 'fulfilled') items.push(...events.value.map(item => ({ id: 'event:' + item._id, serverId: item._id, title: item.title, message: item.message, href: item.title === 'Project contract ready for review' ? (item.actionUrl || '/dashboard?tab=contracts').replace('tab=projects', 'tab=contracts') : item.actionUrl?.startsWith('/dashboard') ? item.actionUrl : '/dashboard?tab=home', read: Boolean(item.readAt) })));
        if (requests.status === 'fulfilled') items.push(...requests.value.filter(item => item.status === 'shortlisted_sent' && !item.clientSelectionSubmittedAt).map(item => ({ id: 'request:' + item._id + ':' + item.status + ':' + (item.shortlistSentAt || ''), title: item.status === 'shortlisted_sent' ? 'Shortlisted talents ready for review' : 'Hiring request: ' + label(item.status), message: (item.projectName || item.projectType) + '. ' + (item.reviewNotes || (item.status === 'shortlisted_sent' ? 'Accept or reject the candidates and submit your selections.' : 'View the latest request status and next steps.')), href: '/dashboard?tab=hiring&hiringView=requests#talent-request-' + item._id, read: false })));
        if (invoices.status === 'fulfilled') items.push(...invoices.value.map(item => ({ id: 'invoice:' + item._id + ':' + item.status, title: 'Invoice ' + label(item.status), message: item.invoiceNumber + ' - ' + item.workerName + ': ' + item.currency + ' ' + item.amountGross.toLocaleString(), href: '/dashboard?tab=invoices', read: false })));
        if (contracts.status === 'fulfilled') items.push(...contracts.value.map(item => ({ id: 'contract:' + item._id + ':' + item.status, title: 'Contract ' + label(item.status), message: item.workerName + ': review the agreement and signature status.', href: '/dashboard?tab=contracts', read: false })));
        if (workers.status === 'fulfilled') items.push(...workers.value.filter(item => item.status !== 'kyc_pending').map(item => ({ id: 'worker:' + item._id + ':' + item.status + ':' + item.kycStatus, title: 'Talent ' + label(item.status), message: item.firstName + ' ' + item.lastName, href: '/dashboard?tab=workers', read: false })));
        if (documents.status === 'fulfilled') items.push(...documents.value.map(item => ({ id: 'document:' + item._id + ':' + item.uploadedAt, title: 'Document available', message: item.fileName + (item.workerName ? ' - ' + item.workerName : ''), href: '/dashboard?tab=documents', read: false })));
        if (stats.status === 'fulfilled' && stats.value.nextPayrollDate) items.push({ id: 'payroll:' + stats.value.nextPayrollDate, title: 'Upcoming payroll', message: 'Next payroll: ' + new Date(stats.value.nextPayrollDate).toLocaleDateString(), href: '/dashboard?tab=payroll', read: false });
        if (company.company.kybStatus) items.push({ id: 'verification:' + String(company.company.kybStatus), title: 'Company verification ' + String(company.company.kybStatus), message: 'Review your company verification status and any remaining setup steps.', href: '/company/onboarding', read: false });
        if (company.user.signupStep < 7) items.push({ id: 'setup:' + company.user.signupStep, title: 'Complete your company setup', message: 'Finish your company profile, verification, and billing setup.', href: '/company/onboarding', read: false });
        if (projects.status === 'fulfilled') projects.value.filter(item => item.status === 'contract_sent' && !item.clientAcceptedAt).forEach(item => {
          const id = 'project-contract:' + item._id;
          items.push({ id, title: 'Project contract awaiting acceptance', message: item.title, href: '/dashboard?tab=contracts#project-contract-' + item._id, read: false });
        });
        const resolved = items.filter(item => !dismissed.current.has(item.id)).map(item => ({ ...item, read: item.read || read.current.has(item.id) }));
        const fresh = resolved.some(item => !item.read && noticeSection(item) !== sectionRef.current && !seen.current.has(item.id));
        resolved.forEach(item => seen.current.add(item.id));
        try { sessionStorage.setItem(storageKey.current + ':shown', JSON.stringify([...seen.current].slice(-1000))); } catch { /* Keep in-memory popup state. */ }
        setNotices(resolved.filter(item => !dismissed.current.has(item.id)));
        setError(results.some(result => result.status === 'rejected') ? 'Some notifications could not be loaded. They will refresh automatically.' : '');
        if (fresh) setOpen(true);
      } catch { if (active) setError('Unable to load notifications. Please try again shortly.'); }
      finally { busy = false; if (active) setLoading(false); }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    const interceptor = api.interceptors.response.use(response => {
      if (response.config.method && !['get', 'head', 'options'].includes(response.config.method.toLowerCase())) void refresh();
      return response;
    });
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', focus); api.interceptors.response.eject(interceptor); };
  }, []);
  function dismiss(item: Notice) {
    dismissed.current.add(item.id);
    try { localStorage.setItem(storageKey.current + ':dismissed', JSON.stringify([...dismissed.current])); } catch { /* Keep in-memory dismissals. */ }
    void markRead([item]);
    setNotices(previous => previous.filter(notice => notice.id !== item.id));
  }
  async function markRead(items: Notice[]) {
    for (const item of items) read.current.add(item.id);
    try { localStorage.setItem(storageKey.current, JSON.stringify([...read.current].slice(-1000))); } catch { /* Storage may be unavailable. */ }
    window.dispatchEvent(new CustomEvent('dechub:notification-reads', { detail: [...read.current] }));
    setNotices(previous => previous.map(item => read.current.has(item.id) ? { ...item, read: true } : item));
    await Promise.allSettled(items.filter(item => item.serverId).map(item => markCompanyProjectNotificationRead(item.serverId!)));
  }
  useEffect(()=>observeVisibleUpdates(element=>{const noticeId=element.dataset.updateNotice,resource=element.dataset.updateResource;const viewed=notices.filter(item=>!item.read&&(noticeId===item.id||noticeSection(item)===activeSection&&!!resource&&((updateResource(item.href)===resource)||(item.id.split(':').slice(0,2).join(':')===resource))));if(viewed.length&&storageKey.current)void markRead(viewed);}),[activeSection,notices]);
  const unread = notices.filter(item => !item.read);
  return <>
    <button ref={bell} type="button" className="db-icon-btn" aria-label={unread.length + ' unread notifications'} aria-haspopup="dialog" onClick={() => setOpen(true)}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></svg>{unread.length > 0 && <span className="db-notif-dot" />}
    </button>
    {open && createPortal(<div className="db-notification-overlay" onClick={close}>
      <section className="db-notification-dialog" role="dialog" aria-modal="true" aria-labelledby="db-notification-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]');
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <header><div><h2 id="db-notification-title">Notifications</h2><p>{unread.length} unread alerts and updates</p></div><button ref={closeButton} type="button" className="db-btn-secondary" aria-label="Close notifications" onClick={close}>X</button></header>
        {error && <p role="alert">{error}</p>}
        {unread.length > 0 && <button type="button" className="db-btn-primary" onClick={() => void markRead(unread)}>Mark all as read</button>}
        <div className="db-notification-list">{loading ? <p>Loading notifications...</p> : notices.length === 0 ? <p>No notifications yet.</p> : [...notices].sort((a, b) => Number(a.read) - Number(b.read)).map(item => <div key={item.id} data-update-notice={item.id} className="db-notification-row"><a href={item.href} className={'db-notification-item' + (item.read ? '' : ' unread')} onClick={event => { event.preventDefault(); void markRead([item]).finally(() => window.location.assign(item.href)); }}><strong>{item.title}{!item.read&&<AttentionDot label="Unread update"/>}</strong><span>{item.message}</span><small>{item.read ? 'Read' : 'Unread'} - Open section</small></a><button type="button" className="db-notification-dismiss" aria-label={'Delete notification: ' + item.title} onClick={() => dismiss(item)}><span aria-hidden="true">{'\u00d7'}</span></button></div>)}</div>
      </section>
    </div>, document.body)}
  </>;
}
