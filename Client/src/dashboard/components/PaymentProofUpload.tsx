import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/client';
import { getCompanyProjects, type DeliveryProject } from '../../api/projects.api';
import { documentError } from '../../api/documents.api';
export default function PaymentProofUpload() {
  const successDialog = useRef<HTMLDialogElement>(null);

  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [projectId, setProjectId] = useState(''); const [mode, setMode] = useState('bank_transfer');
  const [reference, setReference] = useState(''); const [file, setFile] = useState<File>();
  const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [inputKey, setInputKey] = useState(0);
  useEffect(() => {
    const dialog = successDialog.current;
    if (message && dialog && !dialog.open) dialog.showModal();
    if (!message && dialog?.open) dialog.close();
  }, [message]);
  useEffect(() => { let cancelled = false; getCompanyProjects().then(items => { if (!cancelled) setProjects(items.filter(p => ['active', 'payment_submitted', 'completed'].includes(p.status))); }).catch(error => { if (!cancelled) setError(documentError(error)); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (busy) return; setError(''); setMessage('');
    if (!file || !projectId) { setError('Select a project and payment proof.'); return; }
    if (!file.size || file.size > 2 * 1024 * 1024 || !/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) { setError('Choose a PDF, PNG, JPEG, or WebP file up to 2 MB.'); return; }
    setBusy(true);
    try { const form = new FormData(); form.append('paymentMode', mode); form.append('paymentReference', reference.trim()); form.append('proof', file); await api.post('/company/projects/' + projectId + '/payment-proof', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }); setMessage('Payment proof submitted. Admin will verify your payment.'); setFile(undefined); setInputKey(k => k + 1); setReference(''); }
    catch (error) { setError(documentError(error)); } finally { setBusy(false); }
  }
  return <section className="db-card" style={{ padding: 24, marginBottom: 24 }}><h2 className="db-card-title">Submit payment proof</h2><p style={{ color: '#64748b', fontSize: 13 }}>Choose your project and payment mode, then upload your receipt for admin review.</p>{error && <p role="alert" style={{ color: '#b91c1c' }}>{error}</p>}<dialog ref={successDialog} className="db-payment-success-dialog" aria-labelledby="payment-proof-success-title" aria-describedby="payment-proof-success-message" onClose={() => setMessage('')}><button type="button" className="db-payment-success-close" aria-label="Close payment confirmation" onClick={() => { successDialog.current?.close(); setMessage(''); }}><span aria-hidden="true">{'\u00d7'}</span></button><h2 id="payment-proof-success-title">Payment proof submitted</h2><p id="payment-proof-success-message">Admin will verify your payment.</p></dialog>{loading ? <p>Loading projects...</p> : !projects.length ? <p>No projects currently eligible for payment submission.</p> : <form onSubmit={event => void submit(event)} className="db-payment-proof-form"><label>Project<select required value={projectId} onChange={e => setProjectId(e.target.value)}><option value="">Select project</option>{projects.map(p => <option key={p._id} value={p._id}>{p.title}{p.status === 'payment_submitted' ? ' - proof submitted; upload to replace' : ''}</option>)}</select></label><label>Payment mode<select value={mode} onChange={e => setMode(e.target.value)}><option value="bank_transfer">Bank transfer</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option></select></label><label>Transaction reference<input required minLength={3} maxLength={240} value={reference} onChange={e => setReference(e.target.value)} placeholder="Transaction ID / bank reference" /></label><label>Payment proof<input key={inputKey} type="file" required accept="application/pdf,image/png,image/jpeg,image/webp" onChange={e => setFile(e.target.files?.[0])} /><small>PDF, PNG, JPEG, or WebP. Maximum 2 MB.</small></label><button className="db-btn-primary" disabled={busy}>{busy ? 'Uploading...' : 'Upload payment proof'}</button></form>}</section>;
}
