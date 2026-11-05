import { useRef, useState } from 'react';
import { api } from '../../api/client';
import type { DeliveryProject, DeliveryTask } from '../../api/projects.api';

export default function CloseProject({ project, tasks, onClosed }: { project: DeliveryProject; tasks: DeliveryTask[]; onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!['active', 'payment_submitted'].includes(project.status)) return null;
  const ready = tasks.length > 0 && tasks.every(task => task.status === 'completed');
  async function close() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      await api.post(`/company/projects/${project._id}/close`);
      dialog.current?.close(); onClosed();
    } catch (reason: any) {
      setError(reason.response?.data?.error?.message || reason.message || 'Unable to close project. Try again.');
    } finally { setBusy(false); }
  }
  return <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 24, paddingTop: 24 }}>
    <p>You can keep assigning tasks until you close this project.</p>
    {!ready && <p>Approve all assigned tasks to enable project completion.</p>}
    <button type="button" className="db-btn-primary" disabled={!ready} onClick={() => dialog.current?.showModal()}>Close and complete project</button>
    <dialog ref={dialog} style={{ position: 'fixed', inset: 0, margin: 'auto', width: 'min(440px, calc(100vw - 32px))', padding: 28, border: 0, borderRadius: 16 }} onCancel={event => { if (busy) event.preventDefault(); }}>
      <h3>Close and complete project?</h3>
      <p>Mark {project.title} as completed for the client, admin, and contractors? You will no longer be able to assign tasks to this project.</p>
      {error && <p role="alert">{error}</p>}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
        <button type="button" className="db-btn-secondary" disabled={busy} onClick={() => dialog.current?.close()}>No</button>
        <button type="button" className="db-btn-primary" disabled={busy} onClick={() => void close()}>{busy ? 'Completing...' : 'Yes'}</button>
      </div>
    </dialog>
  </div>;
}
