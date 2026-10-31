import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { getCompanyProjectNotifications, markCompanyProjectNotificationRead } from '../../api/projects.api';
import { listCompanyTalentRequests } from '../../api/talentRequests.api';
import { getContracts, getInvoices, getWorkers, getDocuments, getDashboardStats } from '../api/dashboard.api';
import { getMyCompany } from '../../api/company.api';
import './dashboard-notifications.css';

type Notice = { id: string; title: string; message: string; href: string; read: boolean; serverId?: string };
const label = (status: string) => status.replace(/_/g, ' ');
export default function DashboardNotifications() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const seen = useRef(new Set<string>());
  const read = useRef(new Set<string>());
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
        try { read.current = new Set(JSON.parse(localStorage.getItem(storageKey.current) || '[]')); } catch { /* Keep in-memory read state. */ }
        try { seen.current = new Set([...seen.current, ...JSON.parse(sessionStorage.getItem(storageKey.current + ':shown') || '[]')]); } catch { /* Keep in-memory popup state. */ }
        const results = await Promise.allSettled([getCompanyProjectNotifications(), listCompanyTalentRequests(), getInvoices(), getContracts(), getWorkers(), getDocuments(), getDashboardStats()]);
        if (!active) return;
        const [events, requests, invoices, contracts, workers, documents, stats] = results;
        const items: Notice[] = [];
        if (events.status === 'fulfilled') items.push(...events.value.map(item => ({ id: 'event:' + item._id, serverId: item._id, title: item.title, message: item.message, href: item.title === 'Project contract ready for review' ? (item.actionUrl || '/dashboard?tab=contracts').replace('tab=projects', 'tab=contracts') : item.actionUrl?.startsWith('/dashboard') ? item.actionUrl : '/dashboard?tab=home', read: Boolean(item.readAt) })));
        if (requests.status === 'fulfilled') items.push(...requests.value.map(item => ({ id: 'request:' + item._id + ':' + item.status + ':' + (item.shortlistSentAt || ''), title: item.status === 'shortlisted_sent' ? 'Shortlisted workers ready for review' : 'Hiring request: ' + label(item.status), message: (item.projectName || item.projectType) + '. ' + (item.reviewNotes || (item.status === 'shortlisted_sent' ? 'Accept or reject the candidates and submit your selections.' : 'View the latest request status and next steps.')), href: '/dashboard?tab=hiring&hiringView=requests#talent-request-' + item._id, read: false })));
        if (invoices.status === 'fulfilled') items.push(...invoices.value.map(item => ({ id: 'invoice:' + item._id + ':' + item.status, title: 'Invoice ' + label(item.status), message: item.invoiceNumber + ' - ' + item.workerName + ': ' + item.currency + ' ' + item.amountGross.toLocaleString(), href: '/dashboard?tab=invoices', read: false })));
        if (contracts.status === 'fulfilled') items.push(...contracts.value.map(item => ({ id: 'contract:' + item._id + ':' + item.status, title: 'Contract ' + label(item.status), message: item.workerName + ': review the agreement and signature status.', href: '/dashboard?tab=contracts', read: false })));
        if (workers.status === 'fulfilled') items.push(...workers.value.map(item => ({ id: 'worker:' + item._id + ':' + item.status + ':' + item.kycStatus, title: 'Worker ' + label(item.status), message: item.firstName + ' ' + item.lastName + ' - verification ' + label(item.kycStatus), href: '/dashboard?tab=workers', read: false })));
        if (documents.status === 'fulfilled') items.push(...documents.value.map(item => ({ id: 'document:' + item._id, title: 'Document available', message: item.fileName + (item.workerName ? ' - ' + item.workerName : ''), href: '/dashboard?tab=documents', read: false })));
        if (stats.status === 'fulfilled' && stats.value.nextPayrollDate) items.push({ id: 'payroll:' + stats.value.nextPayrollDate, title: 'Upcoming payroll', message: 'Next payroll: ' + new Date(stats.value.nextPayrollDate).toLocaleDateString(), href: '/dashboard?tab=payroll', read: false });
        if (company.company.kybStatus) items.push({ id: 'verification:' + String(company.company.kybStatus), title: 'Company verification ' + String(company.company.kybStatus), message: 'Review your company verification status and any remaining setup steps.', href: '/company/onboarding', read: false });
        if (company.user.signupStep < 7) items.push({ id: 'setup:' + company.user.signupStep, title: 'Complete your company setup', message: 'Finish your company profile, verification, and billing setup.', href: '/company/onboarding', read: false });
        const resolved = items.map(item => ({ ...item, read: item.read || read.current.has(item.id) }));
        const fresh = resolved.some(item => !item.read && !seen.current.has(item.id));
        resolved.forEach(item => seen.current.add(item.id));
        try { sessionStorage.setItem(storageKey.current + ':shown', JSON.stringify([...seen.current].slice(-1000))); } catch { /* Keep in-memory popup state. */ }
        setNotices(resolved);
        setError(results.some(result => result.status === 'rejected') ? 'Some notifications could not be loaded. They will refresh automatically.' : '');
        if (fresh) setOpen(true);
      } catch { if (active) setError('Unable to load notifications. Please try again shortly.'); }
      finally { busy = false; if (active) setLoading(false); }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', focus); };
  }, []);
  async function markRead(items: Notice[]) {
    for (const item of items) read.current.add(item.id);
    try { localStorage.setItem(storageKey.current, JSON.stringify([...read.current].slice(-1000))); } catch { /* Storage may be unavailable. */ }
    setNotices(previous => previous.map(item => read.current.has(item.id) ? { ...item, read: true } : item));
    await Promise.allSettled(items.filter(item => item.serverId).map(item => markCompanyProjectNotificationRead(item.serverId!)));
  }
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
        <div className="db-notification-list">{loading ? <p>Loading notifications...</p> : notices.length === 0 ? <p>No notifications yet.</p> : [...notices].sort((a, b) => Number(a.read) - Number(b.read)).map(item => <a key={item.id} href={item.href} className={'db-notification-item' + (item.read ? '' : ' unread')} onClick={event => { event.preventDefault(); void markRead([item]).finally(() => window.location.assign(item.href)); }}><strong>{item.title}</strong><span>{item.message}</span><small>{item.read ? 'Read' : 'Unread'} - Open section</small></a>)}</div>
      </section>
    </div>, document.body)}
  </>;
}
