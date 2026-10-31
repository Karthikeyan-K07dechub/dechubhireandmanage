import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Worker, WorkerStatus, Track, AddWorkerFormData } from '../types/dashboard.type';
import { getWorkers, terminateWorker } from '../api/dashboard.api';
import { getCompanyProjects, type DeliveryProject } from '../../api/projects.api';
import { buildWorkerAssignments, mergeProjectWorkers, type WorkerListEntry } from '../utils/workerAssignments';
import AddWorkerModal from '../components/AddWorkerModel';
import { getTalentRequestHirePrefill } from '../../api/talentRequests.api';

function WorkerAvatar({ w }: { w: WorkerListEntry }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #0a1628, #2563eb)',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {w.firstName[0]}{w.lastName[0]}
    </div>
  );
}

function RowMenu({ worker, onTerminate }: { worker: WorkerListEntry; onTerminate: (id: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="db-btn-secondary db-btn-sm"
        onClick={() => setOpen((value) => !value)}
        style={{ padding: '0 10px', fontSize: 16 }}
        aria-label="Actions"
      >
        ...
      </button>

      {open ? (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '100%',
              marginTop: 4,
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              width: 180,
              zIndex: 100,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => { onTerminate(worker._id); setOpen(false); }}
              style={{
                width: '100%',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                color: '#dc2626',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
            >
              Terminate
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface WorkersPageProps {
  initialHireRequestId?: string;
}

export default function WorkersPage({ initialHireRequestId = '' }: WorkersPageProps) {
  const [workers, setWorkers] = useState<WorkerListEntry[]>([]);
  const [projects, setProjects] = useState<DeliveryProject[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalSeed, setModalSeed] = useState<AddWorkerFormData | undefined>(undefined);
  const [modalRequestId, setModalRequestId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<WorkerStatus | ''>('');
  const [filterTrack, setFilterTrack] = useState<Track | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLoadError('');
      const [data, assignments] = await Promise.allSettled([getWorkers(), getCompanyProjects()]);
      setWorkers(mergeProjectWorkers(
        data.status === 'fulfilled' ? data.value : [],
        assignments.status === 'fulfilled' ? assignments.value : [],
      ));
      if (assignments.status === 'fulfilled') setProjects(assignments.value);
      if (data.status === 'rejected' || assignments.status === 'rejected') {
        setLoadError('Some worker or project information could not be loaded. Refresh to try again.');
      }
    } catch {
      setLoadError('Unable to load workers. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [load]);

  useEffect(() => {
    if (!initialHireRequestId) return;

    let active = true;

    void getTalentRequestHirePrefill(initialHireRequestId)
      .then((result) => {
        if (!active) return;
        setModalSeed(result.initialData);
        setModalRequestId(result.talentRequestId);
        setShowModal(true);
      })
      .catch(() => {
        if (!active) return;
        setModalSeed(undefined);
        setModalRequestId(undefined);
      });

    return () => {
      active = false;
    };
  }, [initialHireRequestId]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return buildWorkerAssignments(workers, projects).filter(row => {
      const w = row.worker;
      if (q && ![w.firstName, w.lastName, w.email, row.role, w.country, row.project?.title].join(' ').toLowerCase().includes(q)) return false;
      if (filterStatus && w.status !== filterStatus) return false;
      if (filterTrack && w.track !== filterTrack) return false;
      return true;
    });
  }, [workers, projects, searchQuery, filterStatus, filterTrack]);

  const handleTerminate = useCallback(async (id: string) => {
    if (!window.confirm('Terminate this worker? This cannot be undone.')) return;
    try {
      await terminateWorker(id);
      setWorkers((prev) => prev.map((w) => (w._id === id ? { ...w, status: 'terminated' as const } : w)));
    } catch {
      // Keep current row state if termination fails.
    }
  }, []);

  const handleWorkerAdded = useCallback((worker: unknown) => {
    setWorkers((prev) => [worker as Worker, ...prev]);
    setShowModal(false);
    setModalSeed(undefined);
    setModalRequestId(undefined);
    window.location.replace('/dashboard?tab=contracts');
  }, []);

  const activeWorkers = workers.filter((w) => w.status === 'active').length;
  const invitedWorkers = workers.filter((w) => w.status === 'invited').length;
  const pendingKyc = workers.filter((w) => w.kycStatus === 'pending' && w.status !== 'terminated').length;

  return (
    <>
      <div className="db-page">
        <div className="db-page-header">
          <div>
            <div className="db-page-title">Workers</div>
            <div className="db-page-sub">
              {workers.length} total · {activeWorkers} active · {invitedWorkers} invited
              {pendingKyc > 0 && ` · ${pendingKyc} KYC pending`}
            </div>
          </div>
          <div className="db-page-actions">
            <button type="button" className="db-btn-secondary" onClick={() => void load()}>Refresh</button>
          </div>
        </div>

        {loadError && <p className="db-pending-warning" role="alert">{loadError}</p>}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'All', value: workers.length, filter: '', color: '#0a1628' },
            { label: 'Active', value: activeWorkers, filter: 'active', color: '#16a34a' },
            { label: 'Invited', value: invitedWorkers, filter: 'invited', color: '#ca8a04' },
            { label: 'KYC Pending', value: pendingKyc, filter: 'kyc_pending', color: '#ea580c' },
          ].map(({ label, value, filter, color }) => (
            <button
              key={label}
              onClick={() => setFilterStatus(filter as WorkerStatus | '')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 14px',
                borderRadius: 99,
                border: `1.5px solid ${filterStatus === filter ? color : '#e2e8f0'}`,
                background: filterStatus === filter ? `${color}11` : '#fff',
                color: filterStatus === filter ? color : '#475569',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {label}
              <span
                style={{
                  background: filterStatus === filter ? color : '#f1f4f9',
                  color: filterStatus === filter ? '#fff' : '#64748b',
                  borderRadius: 99,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {value}
              </span>
            </button>
          ))}
        </div>

        <div className="db-card">
          <div className="db-filters">
            <div className="db-filter-search">
              <span style={{ color: '#94a3b8' }}>Search</span>
              <input
                type="text"
                placeholder="Search workers, countries, or projects..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>

            <select
              className="db-filter-select"
              value={filterTrack}
              onChange={(event) => setFilterTrack(event.target.value as Track | '')}
            >
              <option value="">All tracks</option>
              <option value="track_2_us">Track 2 - US</option>
              <option value="track_1_india">Track 1 - India</option>
            </select>

            <div className="db-filter-count">
              {new Set(filtered.map(row => row.worker._id)).size} of {workers.length} workers ? {filtered.length} assignments
            </div>
          </div>

          {loading ? (
            <div className="db-loading">
              <div className="db-spinner" /> Loading workers...
            </div>
          ) : filtered.length === 0 ? (
            <div className="db-empty">
              <div className="db-empty-icon">{workers.length === 0 ? 'Team' : 'Search'}</div>
              <div className="db-empty-title">
                {workers.length === 0 ? 'No workers yet' : 'No workers match your search'}
              </div>
              <div className="db-empty-sub">
                {workers.length === 0
                  ? 'Approved marketplace hires will appear here after you proceed from Talent Requests.'
                  : 'Try a different search term or clear your filters.'}
              </div>
            </div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Worker name</th><th>Role</th><th>Country</th><th>Assigned project</th>
                    <th>Start date</th><th>End date</th><th>Project status</th><th aria-label="Worker actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.key}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <WorkerAvatar w={row.worker} />
                          <div>
                            <div className="db-table-name">{row.worker.firstName} {row.worker.lastName}</div>
                            <div className="db-table-sub">{row.worker.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>{row.role || '?'}</td>
                      <td>{row.worker.country || '?'}</td>
                      <td><span className="db-table-name">{row.project?.title ?? (loadError ? 'Unavailable' : 'Not assigned')}</span></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{row.startDate ? new Date(row.startDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{row.endDate ? new Date(row.endDate).toLocaleDateString(undefined, { timeZone: 'UTC' }) : 'Not provided'}</td>
                      <td><span className={
                        row.project?.status === 'active' || row.project?.status === 'payment_submitted'
                          ? 'db-worker-project-status ongoing'
                          : row.project?.status === 'completed' ? 'db-worker-project-status completed'
                          : 'db-worker-project-status'
                      }>{!row.project && loadError ? 'Unavailable' : row.status}</span></td>
                      <td>{row.worker.canManage !== false && <RowMenu worker={row.worker} onTerminate={handleTerminate} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal ? (
        <AddWorkerModal
          onClose={() => {
            setShowModal(false);
            setModalSeed(undefined);
            setModalRequestId(undefined);
            if (window.location.search) {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onSuccess={handleWorkerAdded}
          initialData={modalSeed}
          talentRequestId={modalRequestId}
        />
      ) : null}
    </>
  );
}
