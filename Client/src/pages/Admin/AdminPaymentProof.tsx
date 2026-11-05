import { useEffect, useState } from 'react';
import { api, unwrapApiData } from '../../api/client';
import { documentError } from '../../api/documents.api';
export default function AdminPaymentProof({ projectId }: { projectId: string }) {
  const [info, setInfo] = useState<{ available: boolean; fileName?: string; paymentMode?: string; paymentReference?: string }>(); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function load() { try { setInfo(unwrapApiData((await api.get('/admin/projects/' + projectId + '/payment-proof/info')).data)); setError(''); } catch (error) { setError(documentError(error)); } }
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 15000); return () => window.clearInterval(timer); }, [projectId]);
  async function download() { setBusy(true); setError(''); try { const response = await api.get('/admin/projects/' + projectId + '/payment-proof', { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const a = document.createElement('a'); a.href = url; a.download = info?.fileName || 'payment-proof'; document.body.append(a); a.click(); a.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 10000); } catch (error) { setError(documentError(error)); } finally { setBusy(false); } }
  return <div style={{ marginTop: 12 }}>{error && <p role="alert">{error}</p>}{info?.available ? <><p>Payment mode: {info.paymentMode?.replace(/_/g, ' ')} ? Reference: {info.paymentReference}</p><button type="button" className="atd-inline-button" disabled={busy} onClick={() => void download()}>{busy ? 'Downloading...' : 'Download payment proof'}</button></> : <p>No payment proof uploaded yet.</p>}</div>;
}
