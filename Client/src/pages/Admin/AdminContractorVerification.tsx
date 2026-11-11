import AttentionDot from '../../components/AttentionDot';
import { useEffect, useState } from 'react';
import { api, unwrapApiData } from '../../api/client';
import { documentError } from '../../api/documents.api';

type WorkerKyc = { workerId: string; name: string; status: string; idType?: string; documents: { field: string; fileName: string }[] };
export default function AdminContractorVerification({ projectId }: { projectId: string }) {
  const [workers, setWorkers] = useState<WorkerKyc[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState('');
  async function load() { setLoading(true); try { setWorkers(unwrapApiData((await api.get(`/admin/projects/${projectId}/kyc`)).data)); setError(''); } catch (error) { setError(documentError(error)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, [projectId]);
  async function download(workerId: string, field: string, name: string) {
    if (busy) return; setBusy(workerId + field); setError('');
    try { const response = await api.get(`/admin/workers/${workerId}/kyc/${field}/file`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60000); }
    catch (error) { setError(documentError(error)); } finally { setBusy(''); }
  }
  return <div className="apd-controls"><h3>Contractor KYC documents{workers.some(worker=>worker.documents.length>0&&worker.status!=='approved')&&<AttentionDot label="Contractor verification pending"/>}</h3><p>Confidential files. Access is restricted to Dechub admins. Maximum upload size: 2 MB per file.</p><button type="button" disabled={loading || Boolean(busy)} onClick={() => void load()}>Refresh KYC documents</button>{error && <p role="alert" className="apd-error">{error}</p>}{loading ? <p>Loading verification documents...</p> : workers.map(worker => <article key={worker.workerId}><strong>{worker.name}{worker.documents.length>0&&worker.status!=='approved'&&<AttentionDot label="Verification pending"/>}</strong><p>KYC: {worker.status}{worker.idType ? ` · ${worker.idType.replace(/_/g, ' ')}` : ''}</p>{worker.documents.length ? worker.documents.map(doc => <p key={doc.field}>{doc.field.replace(/([A-Z])/g, ' $1')} <button type="button" disabled={Boolean(busy)} onClick={() => void download(worker.workerId, doc.field, doc.fileName)}>{busy === worker.workerId + doc.field ? 'Downloading...' : 'Download document'}</button></p>) : <p>No KYC documents submitted.</p>}</article>)}</div>;
}
