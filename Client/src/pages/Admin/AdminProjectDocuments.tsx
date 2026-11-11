import AttentionDot from '../../components/AttentionDot';

import { useEffect, useState } from 'react';
import { api, unwrapApiData } from '../../api/client';
import { documentError } from '../../api/documents.api';
import './admin-project-documents.css';
type AdminFiles = { documents: { _id: string; fileName: string; status: string; replacementReason: string }[]; verificationStatus: string; verificationDocuments: { _id: string; fileName: string }[] };
const verificationDocumentLabels: Record<string, string> = {
  incorporation_cert: 'Certificate of Incorporation',
  tax_id: 'Tax ID / EIN document',
  owner_id: 'Owner / Director Government ID',
  proof_of_address: 'Proof of Business Address',
};
function verificationDocumentLabel(key: string) {
  const type = key.replace(/^verification-/, '');
  return verificationDocumentLabels[type] || type.replace(/_/g, ' ');
}
export default function AdminProjectDocuments({ projectId }: { projectId: string }) {
  const [data, setData] = useState<AdminFiles>();
  const [reason, setReason] = useState(''); const [target, setTarget] = useState('verification');
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  async function load() { try { setData(unwrapApiData((await api.get(`/admin/projects/${projectId}/documents`)).data)); } catch (error) { setError(documentError(error)); } }
  useEffect(() => { setData(undefined); setTarget('verification'); setReason(''); setMessage(''); setError(''); void load(); }, [projectId]);
  async function download(key: string, name: string) {
    if (busy) return; setBusy(true); setError('');
    try { const response = await api.get(`/admin/projects/${projectId}/documents/${key}/file`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (error) { setError(documentError(error)); } finally { setBusy(false); }
  }
  async function act(status = 'replacement_requested') {
    if (busy) return; setBusy(true); setError(''); setMessage('');
    try {
      await api.patch(`/admin/projects/${projectId}/documents/review`, { documentId: target, status, reason }); setReason(''); setMessage(status === 'approved' ? 'Verification approved. Client notified.' : 'Replacement requested. Client notified.');
      await load();
    } catch (error) { setError(documentError(error)); } finally { setBusy(false); }
  }
  return <section className="apd-panel"><h3>Client verification documents{data?.verificationDocuments.length&&data.verificationStatus!=='approved'?<AttentionDot label="Verification needs review"/>:null}</h3>{error && <p role="alert" className="apd-error">{error}</p>}{message && <p role="status">{message}</p>}
    {!data ? <p>Loading documents...</p> : <><p>Company verification: {data.verificationStatus || 'Pending'}</p><div className="apd-verification-files">{data.verificationDocuments.map(d => <div className="apd-verification-file" key={d._id}><span>{verificationDocumentLabel(d._id)}</span><button type="button" disabled={busy} onClick={() => void download(d._id, d.fileName)}>Download document</button></div>)}</div><ul>{data.documents.map(d => <li key={d._id}>{d.fileName} — {d.status.replace(/_/g, ' ')}{d.replacementReason && <p>{d.replacementReason}</p>}</li>)}</ul>
    <div className="apd-controls"><label>Document to review<select value={target} disabled={busy} onChange={e => setTarget(e.target.value)}><option value="verification">Company verification</option>{data.documents.map(d => <option key={d._id} value={d._id}>{d.fileName}</option>)}</select></label><label>Reason / replacement instructions<textarea value={reason} disabled={busy} maxLength={1000} onChange={e => setReason(e.target.value)} placeholder="Explain which file needs replacing and why" /></label><div className="apd-actions"><button type="button" disabled={busy || !reason.trim()} onClick={() => void act()}>Request replacement</button>{target === 'verification' && <button type="button" disabled={busy} onClick={() => void act('approved')}>Approve verification</button>}</div></div></>}

  </section>;
}
