import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { listLibraryDocuments, openDocument, documentError, type LibraryDocument } from '../../api/documents.api';
import { submitKyb, type KybFiles } from '../../api/company.api';
import { api } from '../../api/client';
import './documents.css';

const categories = [['all', 'All documents'], ['project', 'Project documents'], ['contract', 'Signed contracts'], ['invoice', 'Invoices'], ['verification', 'Company verification']] as const;
const verificationFields = [['doc1', 'Registration certificate'], ['doc2', 'Tax document'], ['doc3', 'Owner ID'], ['doc4', 'Proof of address']] as const;
const label = (text: string) => text === 'verifying' ? 'Pending review' : text.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
export default function DocumentsPage() {
  const [items, setItems] = useState<LibraryDocument[]>([]); const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all'); const [search, setSearch] = useState('');
  const [project, setProject] = useState(new URLSearchParams(window.location.search).get('project') || '');
  const [status, setStatus] = useState(''); const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState('');
  const [files, setFiles] = useState<KybFiles>({ doc1: null, doc2: null, doc3: null, doc4: null }); const [uploadKey, setUploadKey] = useState(0);
  async function load() { setLoading(true); try { setItems(await listLibraryDocuments()); setError(''); } catch (error) { setError(documentError(error)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const projects = useMemo(() => Array.from(new Map(items.filter(i => i.projectId).map(i => [i.projectId!, i.projectName])).entries()), [items]);
  const visible = useMemo(() => items.filter(item => (category === 'all' || item.category === category) && (!project || item.projectId === project) && (!status || item.status === status) && (!from || item.uploadedAt.slice(0, 10) >= from) && (!to || item.uploadedAt.slice(0, 10) <= to) && [item.fileName, item.companyName, item.projectName, item.workerName].join(' ').toLowerCase().includes(search.toLowerCase())), [items, category, project, status, from, to, search]);
  async function download(item: LibraryDocument, view: boolean) { if (busy) return; setBusy(item._id); setError(''); try { await openDocument(item, view); } catch (error) { setError(documentError(error)); } finally { setBusy(''); } }
  async function upload(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy('verification'); setError(''); setMessage('');
    try { await submitKyb(files); setFiles({ doc1: null, doc2: null, doc3: null, doc4: null }); setUploadKey(k => k + 1); await load(); setMessage('Verification files submitted for review.'); window.dispatchEvent(new Event('dechub:notifications-refresh')); }
    catch (error) { setError(documentError(error)); } finally { setBusy(''); }
  }
  async function replace(item: LibraryDocument, file?: File) {
    if (!file || busy) return; setBusy(item._id); setError('');
    try { const form = new FormData(); form.append('document', file); await api.post(`/documents/${item._id}/replace`, form, { headers: { 'Content-Type': 'multipart/form-data' } }); await load(); setMessage('Replacement uploaded. Dechub will review it.'); }
    catch (error) { setError(documentError(error)); } finally { setBusy(''); }
  }
  return <div className="db-page docs-page">
    <div className="db-page-header"><div><h1 className="db-page-title">Documents</h1><p className="db-page-sub">Company and project files, signed agreements, and invoices in one place.</p></div><button className="db-btn-secondary" disabled={loading || Boolean(busy)} onClick={() => void load()}>Refresh</button></div>
    {error && <p className="docs-error" role="alert">{error}</p>}{message && <p className="docs-success" role="status">{message}</p>}
    <div className="docs-tabs" aria-label="Document categories">{categories.map(([value, title]) => <button type="button" key={value} aria-pressed={category === value} className={category === value ? 'selected' : ''} onClick={() => setCategory(value)}>{title} <span>{items.filter(i => value === 'all' || i.category === value).length}</span></button>)}</div>
    <section className="db-card docs-filters" aria-label="Filter documents">
      <label>Search<input className="db-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="File, project, company, or talent" /></label>
      <label>Project<select className="db-input" value={project} onChange={e => setProject(e.target.value)}><option value="">All projects</option>{projects.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>Status<select className="db-input" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option>{Array.from(new Set(items.map(i => i.status))).sort().map(s => <option key={s} value={s}>{label(s)}</option>)}</select></label>
      <label>From<input className="db-input" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></label><label>To<input className="db-input" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></label>
      <button className="db-btn-secondary" onClick={() => { setSearch(''); setProject(''); setStatus(''); setFrom(''); setTo(''); }}>Clear filters</button>
    </section>
    {category === 'verification' && <section className="db-card docs-upload"><h2>Company verification</h2><p>Maximum 2 MB per file. Only Dechub admins can open verification documents. Upload PDF, PNG, or JPEG files. Selected document types replace earlier versions; other files are kept.</p><form onSubmit={upload} key={uploadKey}><div className="docs-upload-grid">{verificationFields.map(([key, title]) => <label key={key}>{title}<input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={Boolean(busy)} onChange={e => setFiles(previous => ({ ...previous, [key]: e.target.files?.[0] || null }))} /></label>)}</div><button className="db-btn-primary" disabled={Boolean(busy) || !Object.values(files).some(Boolean)}>{busy === 'verification' ? 'Submitting...' : 'Submit for review'}</button></form></section>}
    <p className="db-page-sub" role="status">{loading ? 'Loading documents...' : `${visible.length} document${visible.length === 1 ? '' : 's'}`}</p>
    {!loading && !visible.length && <div className="db-card db-empty"><h2>No documents found</h2><p>Signed contracts, admin-sent invoices, and uploaded files will appear here.</p></div>}
    <div className="docs-grid">{visible.map(item => <article key={item._id} data-update-resource={'document:'+item._id} className="db-card docs-document" id={'document-' + item._id}>
      <div className="docs-document-top"><span>{categories.find(([key]) => key === item.category)?.[1]}</span><span className={`docs-status ${['paid', 'signed', 'approved', 'available'].includes(item.status) ? 'positive' : ['rejected', 'replacement_requested'].includes(item.status) ? 'negative' : ''}`}>{label(item.status)}</span></div>
      <h2>{item.fileName}</h2><dl><div><dt>Company</dt><dd>{item.companyName}</dd></div>{item.projectName && <div><dt>Project</dt><dd>{item.projectName}</dd></div>}{item.workerName && <div><dt>Talents</dt><dd>{item.workerName}</dd></div>}<div><dt>Added</dt><dd>{new Date(item.uploadedAt).toLocaleDateString()}</dd></div><div><dt>Uploaded by</dt><dd>{item.uploadedBy}</dd></div></dl>
      {item.replacementReason && <p className="docs-error">{item.replacementReason}</p>}
      <div className="docs-actions">{item.adminOnly || item.category === 'verification' ? <p className="db-page-sub">Submitted securely. File access is restricted to Dechub admins.</p> : <><button className="db-btn-secondary" disabled={Boolean(busy)} onClick={() => void download(item, true)}>View</button><button className="db-btn-primary" disabled={Boolean(busy)} onClick={() => void download(item, false)}>{busy === item._id ? 'Please wait...' : 'Download'}</button></>}{item.status === 'replacement_requested' && <label className="docs-replace">Replace PDF<input type="file" accept="application/pdf,.pdf" disabled={Boolean(busy)} onChange={e => void replace(item, e.target.files?.[0])} /></label>}</div>
    </article>)}</div>
  </div>;
}
