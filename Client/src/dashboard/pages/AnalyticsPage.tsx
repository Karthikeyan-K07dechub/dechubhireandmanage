import { AreaChart, StackedChart, DonutChart, FunnelChart, WorkerWorldMap, recentMonths } from '../components/AnalyticsCharts';
import { useEffect, useMemo, useState } from 'react';
import { getWorkers, getInvoices, getContracts } from '../api/dashboard.api';
import { getCompanyProjects, getCompanyProjectTasks, type DeliveryProject, type DeliveryTask } from '../../api/projects.api';
import { listCompanyTalentRequests, type CompanyTalentRequestItem } from '../../api/talentRequests.api';
import { listLibraryDocuments, type LibraryDocument } from '../../api/documents.api';
import type { Worker, Invoice, Contract } from '../types/dashboard.type';
import './analytics.css';

export const ANALYTICS_VIEWS = [['overview', 'Analytics overview'], ['projects', 'Projects & team'], ['finance', 'Invoices & payments'], ['reports', 'Reports']] as const;
export type AnalyticsView = typeof ANALYTICS_VIEWS[number][0];
export function getAnalyticsView(): AnalyticsView {
  const value = new URLSearchParams(window.location.search).get('analyticsView');
  return ANALYTICS_VIEWS.find(([key]) => key === value)?.[0] || 'overview';
}
const readable = (s: string) => s === 'workers' ? 'Talents' : s.replace(/_/g, ' ').replace(/\bworker\b/gi,'talent').replace(/^./, c => c.toUpperCase());
const projectLabel = (p: DeliveryProject) => p.status === 'completed' ? 'Payment completed' : p.deliveryCompletedAt ? 'Delivery completed' : p.status === 'contract_sent' ? 'Awaiting client approval' : readable(p.status);
export function csvCell(value: unknown) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}
function Bars({ rows, href }: { rows: [string, number][]; href: string }) {
  const max = Math.max(1, ...rows.map(r => r[1]));
  return <div className="an-bars">{rows.length ? rows.map(([name, value]) => <a href={href} key={name} className="an-bar-row"><span>{name}</span><strong>{value.toLocaleString()}</strong><div className="an-bar-track"><div style={{ width: `${value / max * 100}%` }} /></div></a>) : <p>No records in this period.</p>}</div>;
}
function Card({ title, value, href, note }: { title: string; value: number; href: string; note?: string }) {
  return <a className="db-card an-stat" href={href}><span>{title}</span><strong>{value.toLocaleString()}</strong><small>{note || 'View records'}</small></a>;
}
export default function AnalyticsPage({ view, onView }: { view: AnalyticsView; onView: (view: AnalyticsView) => void }) {
  const [data, setData] = useState<{ projects: DeliveryProject[]; workers: Worker[]; invoices: Invoice[]; contracts: Contract[]; requests: CompanyTalentRequestItem[]; documents: LibraryDocument[]; tasks: DeliveryTask[] }>({ projects: [], workers: [], invoices: [], contracts: [], requests: [], documents: [], tasks: [] });
  const [loading, setLoading] = useState(true); const [failures, setFailures] = useState<string[]>([]); const [loadedAt, setLoadedAt] = useState('');
  const [projectId, setProjectId] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState(''); const [currency, setCurrency] = useState('USD');
  const [trend, setTrend] = useState<'invoices' | 'hiring' | 'completed'>('invoices');
  const [report, setReport] = useState<'projects' | 'invoices' | 'workers' | 'contracts'>('projects');
  async function load() {
    setLoading(true);
    const results = await Promise.allSettled([getCompanyProjects(), getWorkers(), getInvoices(), getContracts(), listCompanyTalentRequests(), listLibraryDocuments()] as const);
    const projects = results[0].status === 'fulfilled' ? results[0].value : [];
    const tasks: DeliveryTask[] = []; const errors = results.flatMap((r, i) => r.status === 'rejected' ? [['Projects', 'Talents', 'Invoices', 'Contracts', 'Hiring requests', 'Documents'][i]] : []);
    // Limit simultaneous requests for larger workspaces.
    for (let index = 0; index < projects.length; index += 4) {
      const batch = await Promise.allSettled(projects.slice(index, index + 4).map(p => getCompanyProjectTasks(p._id)));
      batch.forEach(r => { if (r.status === 'fulfilled') tasks.push(...r.value); else if (!errors.includes('Tasks')) errors.push('Tasks'); });
    }
    setData({ projects, workers: results[1].status === 'fulfilled' ? results[1].value : [], invoices: results[2].status === 'fulfilled' ? results[2].value : [], contracts: results[3].status === 'fulfilled' ? results[3].value : [], requests: results[4].status === 'fulfilled' ? results[4].value : [], documents: results[5].status === 'fulfilled' ? results[5].value : [], tasks });
    setFailures(errors); setLoadedAt(new Date().toLocaleTimeString()); setLoading(false);
  }
  useEffect(() => { void load(); }, []);
  const within = (date?: string | null) => !from && !to || Boolean(date && (!from || date.slice(0, 10) >= from) && (!to || date.slice(0, 10) <= to));
  const projects = data.projects.filter(p => (!projectId || p._id === projectId) && within(p.createdAt));
  const selectedProject = data.projects.find(p => p._id === projectId);
  const assignedIds = new Set(projects.flatMap(p => p.teamMembers.map(w => w.workerId)));
  const workers = data.workers.filter(w => !projectId && !from && !to || assignedIds.has(w._id));
  const invoices = data.invoices.filter(i => (!projectId || (i as Invoice & { projectId?: string }).projectId === projectId) && within(i.submittedAt));
  const contracts = data.contracts.filter(c => (!projectId || selectedProject?.teamMembers.some(m => m.workerId === c.workerId)) && within(c.createdAt));
  const requests = data.requests.filter(r => (!projectId || r._id === selectedProject?.talentRequestId) && within(r.createdAt));
  const tasks = data.tasks.filter(t => projects.some(p => p._id === t.projectId));
  const docs = data.documents.filter(d => (!projectId || d.projectId === projectId) && within(d.uploadedAt));
  const currencies = Array.from(new Set(['USD', ...data.invoices.map(i => i.currency), ...data.projects.map(p => p.currency)]));
  const moneyInvoices = invoices.filter(i => i.currency === currency);
  const money = (value: number) => currency + ' ' + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const recordedTotal = moneyInvoices.reduce((sum, i) => sum + i.amountGross, 0);
  const paidTotal = moneyInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amountGross, 0);
  const monthly = useMemo(() => {
    const values = new Map<string, number>();
    moneyInvoices.forEach(i => { const month = i.submittedAt?.slice(0, 7); if (month) values.set(month, (values.get(month) || 0) + i.amountGross); });
    return [...values.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data.invoices, projectId, from, to, currency]);
  const grouped = (values: string[]): [string, number][] => [...values.reduce((m, v) => m.set(v, (m.get(v) || 0) + 1), new Map<string, number>()).entries()].sort((a, b) => b[1] - a[1]);
  const projectRows = projects.map(p => [p.title, projectLabel(p), p.teamMembers.length, p.currency, p.budget, p.createdAt?.slice(0, 10), p._id]);
  const invoiceRows = invoices.map(i => [i.invoiceNumber, i.projectName || '', i.workerName, readable(i.status), i.currency, i.amountGross, i.submittedAt?.slice(0, 10), i._id]);
  const workerRows = workers.map(w => [w.firstName + ' ' + w.lastName, w.roleTitle, w.country || 'Not provided', readable(w.status), w._id]);
  const contractRows = contracts.map(c => [c.workerName, c.workerRole, readable(c.status), c.companySigned ? 'Approved' : 'Pending', c.workerSigned ? 'Approved' : 'Pending', c._id]);
  const reportData = { projects: { headings: ['Project', 'Status', 'Talents', 'Currency', 'Budget', 'Created', 'ID'], rows: projectRows }, invoices: { headings: ['Invoice', 'Project', 'Talent', 'Status', 'Currency', 'Recorded amount', 'Submitted', 'ID'], rows: invoiceRows }, workers: { headings: ['Talent', 'Role', 'Country', 'Status', 'ID'], rows: workerRows }, contracts: { headings: ['Talent', 'Role', 'Status', 'Client approval', 'Contractor approval', 'ID'], rows: contractRows } }[report];
  function exportCsv() {
    const csv = '\uFEFF' + [reportData.headings, ...reportData.rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); const a = document.createElement('a'); a.href = url; a.download = `bridge-${report==='workers'?'talents':report}-report.csv`; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const fillMonths = (values: Map<string, number>): [string, number][] => Array.from({ length: 3 }, (_, index) => {
    const anchor = to ? new Date(to + 'T12:00:00') : new Date();
    const date = new Date(anchor.getFullYear(), anchor.getMonth() - 2 + index, 1);
    const key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    return [key, values.get(key) || 0];
  });
  const invoiceTrend = fillMonths(new Map(monthly));
  const invoiceQuarter = invoiceTrend;
  const activity = new Map<string, number>();
  if (trend === 'hiring') requests.forEach(r => { const month = r.createdAt.slice(0, 7); activity.set(month, (activity.get(month) || 0) + 1); });
  if (trend === 'completed') projects.forEach(p => { const date = p.deliveryCompletedAt || p.completedAt; if (date) { const month = date.slice(0, 7); activity.set(month, (activity.get(month) || 0) + 1); } });
  const stackLabels = ['In progress / awaiting approval', 'Delivery completed', 'Payment completed', 'Cancelled'];
  const stackMap = new Map<string, number[]>();
  projects.forEach(p => { const month = p.createdAt.slice(0, 7); const values = stackMap.get(month) || [0, 0, 0, 0]; const index = p.status === 'cancelled' ? 3 : p.status === 'completed' ? 2 : p.deliveryCompletedAt ? 1 : 0; values[index]++; stackMap.set(month, values); });
  const stackRows = recentMonths([...stackMap.keys()]).map(month => ({ month, values: stackMap.get(month) || [0, 0, 0, 0] }));
  const requestProjects = (requestId: string) => projects.filter(p => p.talentRequestId === requestId);
  const funnel: [string, number][] = [
    ['Requests submitted', requests.length],
    ['Profiles shortlisted', requests.filter(r => r.shortlistSentAt).length],
    ['Candidates accepted', requests.filter(r => r.clientDecisions?.some(d => d.decision === 'accepted')).length],
    ['Contracts approved', requests.filter(r => requestProjects(r._id).some(p => p.clientAcceptedAt && p.teamMembers.length > 0 && p.teamMembers.every(m => p.contractorAcceptances?.some(a => a.workerId === m.workerId)))).length],
    ['Work started', requests.filter(r => requestProjects(r._id).some(p => tasks.some(t => t.projectId === p._id && ['in_progress', 'completed'].includes(t.status)))).length],
  ];
  const destination = (tab: string) => `/dashboard?tab=${tab}${projectId ? '&project=' + encodeURIComponent(projectId) : ''}${tab === 'hiring' ? '&hiringView=requests' : ''}`;
  return <div className="db-page an-page"><div className="db-page-header"><div><h1 className="db-page-title">{ANALYTICS_VIEWS.find(([key]) => key === view)?.[1]}</h1><p className="db-page-sub">Company performance across projects, hiring, contracts, and payments.</p></div><button className="db-btn-secondary" disabled={loading} onClick={() => void load()}>{loading ? 'Loading...' : 'Refresh'}</button></div>
    <nav className="an-tabs" aria-label="Analytics views">{ANALYTICS_VIEWS.map(([key, name]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => onView(key)} aria-pressed={view === key}>{name}</button>)}</nav>
    <section className="db-card an-filters"><label>Project<select className="db-input" value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">All projects</option>{data.projects.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}</select></label><label>From<input className="db-input" type="date" max={to || undefined} value={from} onChange={e => setFrom(e.target.value)} /></label><label>To<input className="db-input" type="date" min={from || undefined} value={to} onChange={e => setTo(e.target.value)} /></label><label>Currency<select className="db-input" value={currency} onChange={e => setCurrency(e.target.value)}>{currencies.map(c => <option key={c}>{c}</option>)}</select></label><button className="db-btn-secondary" onClick={() => { setProjectId(''); setFrom(''); setTo(''); }}>Clear filters</button></section>
    <p className="an-note">Dates filter projects, contracts, and requests by creation date; invoices by submission date; documents by upload date. Talent and task counts follow the selected projects. Currency applies to financial charts.</p>
    {failures.length > 0 && <p className="an-warning" role="alert">Could not load {failures.join(', ')}. Affected figures are incomplete. Use Refresh to retry.</p>}
    {loading ? <p role="status">Loading company analytics...</p> : <>
      {(view === 'overview' || view === 'projects') && <WorkerWorldMap workers={workers} />}
      {view === 'overview' && <div className="an-panels"><section className="db-card an-panel"><div className="an-report-heading"><h2>Monthly activity</h2><label>Show<select className="db-input" value={trend} onChange={e => setTrend(e.target.value as typeof trend)}><option value="invoices">Invoice amounts ({currency})</option><option value="hiring">Hiring requests</option><option value="completed">Completed deliveries</option></select></label></div><AreaChart rows={trend === 'invoices' ? invoiceTrend : fillMonths(activity)} unit={trend === 'invoices' ? currency : ''} label="Monthly activity trend" /><p className="an-note">Last 3 months, including months with no activity. Invoice figures use recorded values; completed deliveries use recorded completion dates.</p></section><section className="db-card an-panel"><h2>Monthly project progress</h2><StackedChart rows={stackRows} labels={stackLabels} /><p className="an-note">Projects grouped by creation month, with their current status. This is not a historical status snapshot.</p></section></div>}

      {view === 'overview' && <><div className="an-stats"><Card title="Projects" value={projects.length} href={destination('projects')} /><Card title="Unique talents" value={workers.length} href={destination('workers')} note="Counted once across projects" /><Card title="Delivery completed" value={projects.filter(p => p.deliveryCompletedAt || p.status === 'completed').length} href={destination('projects')} /><Card title="Invoices awaiting payment" value={invoices.filter(i => i.status === 'approved').length} href={destination('invoices')} /><Card title="Client contract approvals pending" value={projects.filter(p => p.status === 'contract_sent' && !p.clientAcceptedAt).length + contracts.filter(c => !c.companySigned && !['draft', 'rejected', 'terminated'].includes(c.status)).length} href={destination('contracts')} /><Card title="Documents needing replacement" value={docs.filter(d => ['rejected', 'replacement_requested'].includes(d.status)).length} href={destination('documents')} /></div>
      <div className="an-panels"><section className="db-card an-panel"><h2>Project progress</h2><DonutChart rows={grouped(projects.map(projectLabel))} label="Project statuses" /></section><section className="db-card an-panel"><h2>Hiring progress</h2><p className="an-note">Milestones reached by requests created in the selected period.</p><FunnelChart rows={funnel} /></section></div></>}
      {view === 'projects' && <><div className="an-stats"><Card title="Tasks completed" value={tasks.filter(t => t.status === 'completed').length} href={destination('projects')} /><Card title="Tasks in progress" value={tasks.filter(t => t.status === 'in_progress').length} href={destination('projects')} /><Card title="Overdue tasks" value={tasks.filter(t => t.status !== 'completed' && t.dueDate && new Date(t.dueDate).getTime() < Date.now()).length} href={destination('projects')} /></div><div className="an-panels"><section className="db-card an-panel"><h2>Talents by role</h2><Bars rows={grouped(workers.map(w => w.roleTitle || 'Not provided'))} href={destination('workers')} /></section><section className="db-card an-panel"><h2>Talents by country</h2><Bars rows={grouped(workers.map(w => w.country || 'Not provided'))} href={destination('workers')} /></section></div><section className="db-card an-panel"><h2>Project delivery and approvals</h2><div className="an-table-wrap"><table className="an-table"><thead><tr><th>Project</th><th>Progress</th><th>Client</th><th>Contractors</th><th>Tasks completed</th></tr></thead><tbody>{projects.map(p => <tr key={p._id}><td><a href={`/dashboard?tab=projects&project=${p._id}`}>{p.title}</a></td><td>{projectLabel(p)}</td><td>{p.clientAcceptedAt ? 'Approved' : 'Pending'}</td><td>{p.teamAccess?.length ? p.teamAccess.map(w => `${w.name}: ${w.projectAccess}`).join(', ') : 'Review in Contracts'}</td><td>{tasks.filter(t => t.projectId === p._id && t.status === 'completed').length} / {tasks.filter(t => t.projectId === p._id).length}</td></tr>)}</tbody></table></div>{!projects.length && <p>No projects match these filters.</p>}</section></>}
      {view === 'finance' && <><div className="an-money"><section className="db-card an-panel"><span>Recorded invoice total</span><h2>{money(recordedTotal)}</h2></section><section className="db-card an-panel"><span>Recorded paid amount</span><h2>{money(paidTotal)}</h2></section><section className="db-card an-panel"><span>Project budgets</span><h2>{money(projects.filter(p => p.currency === currency).reduce((sum, p) => sum + p.budget, 0))}</h2></section></div><p className="an-warning">Amounts reflect stored invoice values. Charges added only inside an uploaded PDF are not included. Only invoices released to your company by admin are shown; payment status reflects admin confirmation.</p><div className="an-panels"><section className="db-card an-panel"><h2>Monthly invoice amounts ({currency})</h2><AreaChart rows={invoiceQuarter} unit={currency} label="Monthly recorded invoice amounts for the last three months" /></section><section className="db-card an-panel"><h2>Invoice status ({currency})</h2><DonutChart rows={grouped(moneyInvoices.map(i => readable(i.status)))} label="Invoice payment statuses" /></section></div></>}
      {view === 'reports' && <section className="db-card an-panel"><div className="an-report-heading"><h2>Reports</h2><label>Report type<select className="db-input" value={report} onChange={e => setReport(e.target.value as typeof report)}>{['projects', 'invoices', 'workers', 'contracts'].map(key => <option key={key} value={key}>{readable(key)}</option>)}</select></label><button className="db-btn-primary" disabled={!reportData.rows.length || failures.length > 0} onClick={exportCsv}>Download CSV</button></div><p className="an-note">Exports include the filtered records below. Invoice reports retain each record’s currency.</p><div className="an-table-wrap"><table className="an-table"><thead><tr>{reportData.headings.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{reportData.rows.map((row, index) => <tr key={index}>{row.map((cell, index) => <td key={index}>{cell ?? '—'}</td>)}</tr>)}</tbody></table></div>{!reportData.rows.length && <p>No records match these filters.</p>}</section>}
      <p className="an-note" role="status">Last refreshed: {loadedAt}. Refresh to include recent changes.</p>
    </>}
  </div>;
}
