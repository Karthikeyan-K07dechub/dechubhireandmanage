import { useEffect, useState } from 'react';
import { api, unwrapApiData } from '../../api/client';
import './admin-invoice-review.css';
type ReviewInvoice = { _id: string; invoiceNumber: string; companyName: string; projectName: string; workerName: string; workerRole: string; description: string; periodStart: string; periodEnd: string; currency: string; amountGross: number; serviceCharge: number; clientTotal: number | null; status: string; clientSentAt: string | null; adminEmailSentAt: string | null; adminEmailError: string | null; clientEmailSentAt: string | null; clientEmailError: string | null };
export default function AdminInvoiceReview({ projectId }: { projectId?: string } = {}) {
  const [items, setItems] = useState<ReviewInvoice[]>([]); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); const [working, setWorking] = useState('');
  const [files, setFiles] = useState<Record<string, File>>({});
  async function load() { try { setItems(unwrapApiData((await api.get('/admin/invoices', { params: { projectId } })).data)); setError(''); } catch { setError('Unable to load invoices for review.'); } finally { setLoading(false); } }
  useEffect(() => { if (window.location.hash === '#admin-invoice-review') { const panel = document.getElementById('admin-invoice-review') as HTMLDetailsElement | null; if (panel) { panel.open = true; panel.scrollIntoView({ block: 'start' }); } } void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [projectId]);
  async function act(item: ReviewInvoice, action: 'send' | 'pdf' | 'admin' | 'client') {
    if (working) return; setWorking(item._id + action); setError(''); setMessage('');
    try {
      if (action === 'pdf') {
        const result = await api.get('/admin/invoices/' + item._id + '/pdf', { responseType: 'blob' });
        const url = URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = item.invoiceNumber + '.pdf'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else if (action === 'send') {
        const file = files[item._id];
        if (!file || file.size > 10 * 1024 * 1024) throw new Error('Choose a PDF up to 10 MB.');
        const form = new FormData(); form.append('invoice', file);
        await api.post('/admin/invoices/' + item._id + '/send-to-client', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(item.invoiceNumber + ' is now available to the client. The client email is queued.'); await load();
      } else {
        await api.post('/admin/invoices/' + item._id + '/retry-email', { recipient: action }); setMessage('Invoice PDF email sent to ' + action + '.'); await load();
      }
    } catch (reason) { const failure = reason as { message?: string; response?: { data?: { error?: { message?: string } } } }; setError(failure.response?.data?.error?.message || failure.message || 'Invoice action failed.'); }
    finally { setWorking(''); }
  }
  const pending = items.filter(item => !item.clientSentAt && ['pending_admin', 'submitted'].includes(item.status)).length;
  return <details className="air-panel" id={projectId ? undefined : "admin-invoice-review"} open={projectId ? true : undefined}><summary>Invoice review <span>{pending} awaiting admin review</span></summary><div className="air-content"><p>Select the final invoice PDF to send to the client. PDF files up to 10 MB are supported.</p>{error && <p className="air-error" role="alert">{error}</p>}{message && <p className="air-success" role="status">{message}</p>}{loading ? <p>Loading invoices...</p> : !items.length ? <p>No invoices have been submitted.</p> : items.map(item => <article className="air-invoice" key={item._id}><header><div><strong>{item.invoiceNumber}</strong><h3>{item.projectName || 'Project not provided'}</h3><p>Client company: {item.companyName}</p><p>{item.workerName} - {item.workerRole}</p></div><strong>{item.clientSentAt ? 'Sent to client' : ['pending_admin', 'submitted'].includes(item.status) ? 'Awaiting admin review' : item.status}</strong></header><p>{item.description}</p><p>Period: {new Date(item.periodStart).toLocaleDateString()} to {new Date(item.periodEnd).toLocaleDateString()}</p><p>Contractor amount: <strong>{item.currency} {item.amountGross.toFixed(2)}</strong></p><p>Admin PDF email: {item.adminEmailSentAt ? 'Sent' : item.adminEmailError ? 'Failed - retry below' : 'Pending'}</p>{item.clientSentAt && <><p>Service charge: {item.currency} {item.serviceCharge.toFixed(2)}</p><p>Client total: <strong>{item.currency} {(item.clientTotal ?? item.amountGross).toFixed(2)}</strong></p><p>Client PDF email: {item.clientEmailSentAt ? 'Sent' : item.clientEmailError ? 'Failed - retry below' : 'Pending'}</p></>}
      {!item.clientSentAt && ['pending_admin', 'submitted'].includes(item.status) && <div className="air-review"><input type="file" id={'invoice-file-' + (projectId || 'all') + item._id} accept="application/pdf,.pdf" hidden onChange={event => { const file = event.target.files?.[0]; if (file) setFiles(previous => ({ ...previous, [item._id]: file })); }} /><button type="button" disabled={Boolean(working)} onClick={() => document.getElementById('invoice-file-' + (projectId || 'all') + item._id)?.click()}>Select PDF</button>{files[item._id] && <><p>{files[item._id].name}</p><button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'send')}>Upload &amp; send invoice</button></>}</div>}
      <div className="air-actions"><button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'pdf')}>Download PDF</button>{!item.adminEmailSentAt && <button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'admin')}>Retry admin email</button>}{item.clientSentAt && !item.clientEmailSentAt && <button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'client')}>Retry client email</button>}{working.startsWith(item._id) && <span role="status">Processing...</span>}</div>
    </article>)}</div></details>;
}
