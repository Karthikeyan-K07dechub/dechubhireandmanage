import AttentionDot from '../../components/AttentionDot';
import ContractorPaymentProof from '../../components/ContractorPaymentProof';
import { useEffect, useState } from 'react';
import { api, unwrapApiData } from '../../api/client';
import './admin-invoice-review.css';
type ReviewInvoice = { billingMonth?:string; contractorPaymentApprovedAt?:string|null; contractorPaymentProofSentAt?:string|null; adminReviewStatus?: string; adminReviewReason?: string; _id: string; invoiceNumber: string; companyName: string; projectName: string; workerName: string; workerRole: string; description: string; periodStart: string; periodEnd: string; currency: string; amountGross: number; serviceCharge: number; clientTotal: number | null; status: string; clientSentAt: string | null; adminEmailSentAt: string | null; adminEmailError: string | null; clientEmailSentAt: string | null; clientEmailError: string | null };
export default function AdminInvoiceReview({ projectId, reviewOnly=false }: { projectId?: string; reviewOnly?:boolean } = {}) {
  return <><AdminInvoicePanel projectId={projectId} mode="review" />{!reviewOnly&&<AdminInvoicePanel projectId={projectId} mode="send" />}</>;
}
function AdminInvoicePanel({ projectId, mode }: { projectId?: string; mode: 'review' | 'send' }) {
  const [items, setItems] = useState<ReviewInvoice[]>([]); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true); const [working, setWorking] = useState('');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [reviewReasons,setReviewReasons]=useState<Record<string,string>>({});
  async function review(item:ReviewInvoice,decision:'approve'|'changes'){if(working)return;setWorking(item._id+'review');setError('');setMessage('');try{await api.post('/admin/invoices/'+item._id+'/review',{decision,reason:reviewReasons[item._id]||undefined});setMessage(decision==='approve'?'Contractor invoice approved. No invoice was sent to the client.':'Changes requested. The contractor can submit a corrected invoice.');await load();}catch(error){const failure=error as {message?:string;response?:{data?:{error?:{message?:string}}}};setError(failure.response?.data?.error?.message||failure.message||'Invoice review failed.');}finally{setWorking('');}}
  async function load() { try { setItems(unwrapApiData((await api.get('/admin/invoices', { params: { projectId } })).data)); setError(''); } catch { setError('Unable to load invoices for review.'); } finally { setLoading(false); } }
  useEffect(() => { if (mode === 'review' && window.location.hash === '#admin-invoice-review') { const panel = document.getElementById('admin-invoice-review') as HTMLDetailsElement | null; if (panel) { panel.open = true; panel.scrollIntoView({ block: 'start' }); } } void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [projectId, mode]);
  async function act(item: ReviewInvoice, action: 'send' | 'pdf' | 'admin' | 'client') {
    if (working) return; setWorking(item._id + action); setError(''); setMessage('');
    try {
      if (action === 'pdf') {
        const result = await api.get('/admin/invoices/' + item._id + '/pdf', { responseType: 'blob' });
        const url = URL.createObjectURL(result.data); const link = document.createElement('a'); link.href = url; link.download = item.invoiceNumber + '.pdf'; document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else if (action === 'send') {
        const file = files[item._id];
        if (!file || !file.size || file.size > 10 * 1024 * 1024) throw new Error('Choose a PDF, PNG, JPEG, or WebP file up to 10 MB.');
        const form = new FormData(); form.append('invoice', file);
        await api.post('/admin/invoices/' + item._id + '/send-to-client', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        setMessage(item.invoiceNumber + ' is now available to the client. The client email is queued.'); await load();
      } else {
        await api.post('/admin/invoices/' + item._id + '/retry-email', { recipient: action }); setMessage('Invoice PDF email sent to ' + action + '.'); await load();
      }
    } catch (reason) { const failure = reason as { message?: string; response?: { data?: { error?: { message?: string } } } }; setError(failure.response?.data?.error?.message || failure.message || 'Invoice action failed.'); }
    finally { setWorking(''); }
  }
  const pending = items.filter(item => !item.clientSentAt && ['pending_admin', 'submitted'].includes(item.status) && item.adminReviewStatus !== 'approved').length;
  if (mode === 'send') {
    const eligible = items.filter(item => !item.clientSentAt && ['pending_admin', 'submitted'].includes(item.status));
    const selected = eligible.find(item => item._id === selectedInvoiceId) || eligible[0];
    const choose = (file?: File) => {
      if (!file || !selected || working) return;
      if (!file.size || file.size > 10 * 1024 * 1024 || !/\.(pdf|png|jpe?g|webp)$/i.test(file.name)) { setError('Choose a PDF, PNG, JPEG, or WebP file up to 10 MB.'); return; }
      setError(''); setFiles(previous => ({ ...previous, [selected._id]: file }));
    };
    return <details className="air-panel" open={projectId ? true : undefined}><summary>Send invoice to client{items.some(item=>item.adminReviewStatus==='approved'&&!item.clientSentAt)&&<AttentionDot label="Approved invoices ready to send"/>}</summary><div className="air-content">
      {error && <p className="air-error" role="alert">{error}</p>}{message && <p className="air-success" role="status">{message}</p>}
      {loading ? <p>Loading...</p> : !selected ? <p>{items.some(item => item.clientSentAt) ? 'Invoice sent to the client dashboard.' : 'No invoices ready to send.'}</p> : <>
        {eligible.length > 1 && <label className="air-invoice-select">Invoice to send<select value={selected._id} disabled={Boolean(working)} onChange={event => setSelectedInvoiceId(event.target.value)}>{eligible.map(item => <option key={item._id} value={item._id}>{item.projectName} - {item.workerName} - {item.invoiceNumber}</option>)}</select></label>}
        <label className={'air-dropzone' + (dragging ? ' dragging' : '')} onDragOver={event => { event.preventDefault(); if (!working) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); if (event.dataTransfer.files.length !== 1) { setError('Select one document at a time.'); return; } choose(event.dataTransfer.files[0]); }}>
          <input key={selected._id} type="file" accept="application/pdf,image/png,image/jpeg,image/webp,.pdf,.png,.jpg,.jpeg,.webp" disabled={Boolean(working)} aria-label="Select client invoice PDF or image" onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} />
          <strong>{files[selected._id]?.name || 'Drag and drop PDF or image, or click to select'}</strong><span>PDF, PNG, JPEG, or WebP up to 10 MB</span>
        </label>
        <button type="button" disabled={Boolean(working) || !files[selected._id]} onClick={() => void act(selected, 'send')}>{working ? 'Uploading...' : 'Upload'}</button>
      </>}
    </div></details>;
  }
  return <details className="air-panel" id={projectId ? undefined : "admin-invoice-review"} open={projectId ? true : undefined}><summary>{'Invoice review'}{pending>0&&<AttentionDot label="Invoices awaiting review"/>} <span>{pending} {'awaiting admin review'}</span></summary><div className="air-content"><p>{mode === 'review' ? 'Review contractor invoices and download their PDFs before preparing the final client invoice.' : 'Select the final invoice PDF, including your charges, to send to the client. PDF files up to 10 MB are supported.'}</p>{error && <p className="air-error" role="alert">{error}</p>}{message && <p className="air-success" role="status">{message}</p>}{loading ? <p>Loading invoices...</p> : !items.length ? <p>No invoices have been submitted.</p> : items.map(item => <article className="air-invoice" key={item._id}><header><div><strong>{item.invoiceNumber}</strong><h3>{item.projectName || 'Project not provided'}</h3><p>Client company: {item.companyName}</p><p>{item.workerName} - {item.workerRole}</p></div><strong>{item.contractorPaymentApprovedAt?'Approved by contractor':item.contractorPaymentProofSentAt?'Payment proof sent':item.adminReviewStatus==='approved'?'Invoice approved':item.adminReviewStatus==='changes_requested'?'Changes requested':item.clientSentAt?'Sent to client':['pending_admin','submitted'].includes(item.status)?'Awaiting admin review':item.status}</strong></header><p>{item.description}</p>{item.billingMonth&&<p>Billing month: <strong>{item.billingMonth}</strong></p>}<p>Period: {new Date(item.periodStart).toLocaleDateString()} to {new Date(item.periodEnd).toLocaleDateString()}</p><p>Contractor amount: <strong>{item.currency} {item.amountGross.toFixed(2)}</strong></p><p>Admin PDF email: {item.adminEmailSentAt ? 'Sent' : item.adminEmailError ? 'Failed - retry below' : 'Pending'}</p>{item.clientSentAt && <><p>Service charge: {item.currency} {item.serviceCharge.toFixed(2)}</p><p>Client total: <strong>{item.currency} {(item.clientTotal ?? item.amountGross).toFixed(2)}</strong></p><p>Client PDF email: {item.clientEmailSentAt ? 'Sent' : item.clientEmailError ? 'Failed - retry below' : 'Pending'}</p></>}
      {item.adminReviewReason && <p>Admin feedback: {item.adminReviewReason}</p>}
      {!item.clientSentAt && ['pending_admin','submitted'].includes(item.status) && item.adminReviewStatus !== 'approved' && <div className="air-review"><label>Correction instructions<textarea maxLength={2000} value={reviewReasons[item._id]||''} onChange={event=>setReviewReasons(current=>({...current,[item._id]:event.target.value}))} placeholder="Explain any required corrections"/></label><div className="air-actions"><button type="button" disabled={Boolean(working)} onClick={()=>void review(item,'approve')}>Approve invoice</button><button type="button" disabled={Boolean(working)||!reviewReasons[item._id]?.trim()} onClick={()=>void review(item,'changes')}>Request changes</button></div></div>}
      <div className="air-actions"><button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'pdf')}>Download PDF</button><ContractorPaymentProof id={item._id} admin approved={item.adminReviewStatus==='approved'} sent={Boolean(item.contractorPaymentProofSentAt)} onSent={()=>{setMessage('Payment proof sent to contractor.');void load();}}/>{mode === 'review' && !item.adminEmailSentAt && <button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'admin')}>Retry admin email</button>}{item.clientSentAt && !item.clientEmailSentAt && <button type="button" disabled={Boolean(working)} onClick={() => void act(item, 'client')}>Retry client email</button>}{working.startsWith(item._id) && <span role="status">Processing...</span>}</div>
    </article>)}</div></details>;
}
