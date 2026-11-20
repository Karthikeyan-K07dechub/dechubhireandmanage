import { useEffect, useState } from 'react';
import {
  downloadVerificationDocument,
  getVerificationDocuments,
  updateVerificationDocuments,
  type ContractorVerificationDocuments,
  type VerificationDocumentField,
} from './api/contractor.api';

const documentTypes = [
  { field: 'idFront', label: 'Front of ID' },
  { field: 'idBack', label: 'Back of ID' },
  { field: 'selfie', label: 'Selfie' },
] as const;

const idTypeLabels: Record<string, string> = {
  passport: 'Passport',
  drivers_license: 'Driver’s License',
  national_id: 'National ID Card',
};

export default function VerificationDocuments() {
  const [details, setDetails] = useState<ContractorVerificationDocuments | null>(null);
  const [editing, setEditing] = useState(false);
  const [files, setFiles] = useState<Partial<Record<VerificationDocumentField, File>>>({});
  const [removed, setRemoved] = useState<VerificationDocumentField[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    getVerificationDocuments().then(result => { if (active) setDetails(result); })
      .catch(() => { if (active) setError('Could not load your verification documents.'); });
    return () => { active = false; };
  }, []);

  async function download(field: VerificationDocumentField, fileName: string) {
    setError('');
    try {
      const url = URL.createObjectURL(await downloadVerificationDocument(field));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError(`Could not download ${fileName}.`);
    }
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      setDetails(await updateVerificationDocuments(files, removed));
      setFiles({});
      setRemoved([]);
      setEditing(false);
      setMessage('Your verification document changes were saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your verification documents.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="cd-profile-summary-card cd-verification-card" aria-labelledby="verification-documents-heading">
      <div className="cd-verification-header">
        <div>
          <h2 className="cd-profile-section-title" id="verification-documents-heading">Verification documents</h2>
          <p>Private documents used to verify your identity.</p>
        </div>
        {details?.canEdit && !editing && <button type="button" className="cp-btn-secondary" onClick={() => { setEditing(true); setMessage(''); setError(''); }}>Edit documents</button>}
      </div>
      {error && <p className="cd-profile-error" role="alert">{error}</p>}
      {message && <p className="cd-profile-success" role="status">{message}</p>}
      {!details && !error && <p role="status">Loading documents…</p>}
      {details && (
        <>
          <div className="cd-verification-meta">
            {details.idType && <p>Selected ID <strong>{idTypeLabels[details.idType] ?? details.idType.replace(/_/g, ' ')}</strong></p>}
            {details.documents.length === 0 && <p>No verification documents submitted yet.</p>}
            {details.documents.length > 0 && <span className={`cd-verification-status cd-verification-status--${details.status}`}>{details.status === 'pending' ? 'Pending review' : details.status === 'approved' ? 'Approved' : 'Rejected'}</span>}
          </div>
          <div className="cd-verification-list">
            {documentTypes.map(({ field, label }) => {
              const existing = details.documents.find(document => document.field === field);
              const markedForRemoval = removed.includes(field);
              if (!editing && !existing) return null;
              return (
                <div className="cd-verification-row" key={field}>
                  <div className="cd-verification-file">
                    <strong>{label}</strong>
                    {existing && <p title={existing.fileName}>{existing.fileName}</p>}
                    {files[field] && <p className="cd-verification-selection" title={files[field]?.name}>Selected file · {files[field]?.name}</p>}
                    {markedForRemoval && <p>Will be deleted from this profile when you save.</p>}
                  </div>
                  <div className="cd-verification-actions">
                    {existing && <button type="button" className="cp-btn-secondary" aria-label={`Download ${label}`} onClick={() => void download(field, existing.fileName)}>Download</button>}
                    {editing && existing && (
                      <button type="button" className="cp-btn-secondary" disabled={saving} onClick={() => {
                        setRemoved(previous => markedForRemoval ? previous.filter(item => item !== field) : [...previous, field]);
                        setFiles(previous => ({ ...previous, [field]: undefined }));
                      }} aria-label={markedForRemoval ? `Undo delete ${label}` : `Delete ${label}`}>{markedForRemoval ? 'Undo delete' : 'Delete'}</button>
                    )}
                    {editing && !markedForRemoval && (
                      <label className="cd-verification-picker">
                        <span>{existing ? 'Replace' : 'Add'}</span>
                        <input type="file" aria-label={`${existing ? 'Replace' : 'Add'} ${label}`} accept=".pdf,.png,.jpg,.jpeg,.webp" disabled={saving} onChange={event => {
                          const file = event.currentTarget.files?.[0];
                          setError(file && file.size > 2 * 1024 * 1024 ? `${label} must be no larger than 2 MB.` : '');
                          if (file && file.size > 2 * 1024 * 1024) event.currentTarget.value = '';
                          setFiles(previous => ({ ...previous, [field]: file && file.size <= 2 * 1024 * 1024 ? file : undefined }));
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {editing && (
            <div className="cd-verification-footer">
              <p>PDF, PNG, JPEG, or WebP, up to 2 MB each. Changes reset verification to pending review.</p>
              <div className="cd-verification-actions">
                <button type="button" className="cp-btn-secondary" disabled={saving} onClick={() => { setEditing(false); setFiles({}); setRemoved([]); setError(''); }}>Cancel</button>
                <button type="button" className="cp-btn-primary" disabled={saving || (!removed.length && !Object.values(files).some(Boolean))} onClick={() => void save()}>{saving ? 'Saving…' : 'Save documents'}</button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
