import { useEffect, useState } from 'react';
import { getTalentRequest, markAsRead, updateTalentRequestStatus, unreadCount, type TalentRequestItem } from '../../api/admin.api';
import './admin-talent-request-detail.css';

interface TalentRequestDetailPageProps {
  requestId: string;
  onBack: () => void;
}

const statusTone: Record<string, string> = {
  new: 'new',
  contacted: 'contacted',
  in_discussion: 'discussion',
  closed: 'closed',
};

export default function TalentRequestDetailPage({
  requestId,
  onBack,
}: TalentRequestDetailPageProps) {
  const [request, setRequest] = useState<TalentRequestItem | null>(null);
  const [badge, setBadge] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const detail = await getTalentRequest(requestId);
        await markAsRead(requestId);
        const unread = await unreadCount();

        if (!active) {
          return;
        }

        setRequest({ ...detail, unread: false });
        setBadge(unread.unread || 0);
      } catch (err) {
        if (active) {
          setRequest(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [requestId]);

  const handleStatusChange = async (status: string) => {
    if (!request) {
      return;
    }

    await updateTalentRequestStatus(request._id, status);
    setRequest({ ...request, status });
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Unknown');
  const formatStatus = (value?: string) => (value ? value.replace(/_/g, ' ') : 'unknown');
  const currentTone = statusTone[request?.status || ''] || 'new';

  return (
    <div className="atd-root">
      <div className="atd-background" aria-hidden="true">
        <span className="atd-orb atd-orb-one" />
        <span className="atd-orb atd-orb-two" />
        <span className="atd-grid" />
      </div>

      <header className="atd-header">
        <button className="atd-back" onClick={onBack}>Back to requests</button>
        {!loading && request ? (
          <div className="atd-header-meta">
            <div className="atd-header-card">
              <span>Request ID</span>
              <strong>{request._id}</strong>
            </div>
            <div className="atd-header-card">
              <span>Submitted date</span>
              <strong>{formatDate(request.createdAt)}</strong>
            </div>
            <div className="atd-header-card">
              <span>Request status</span>
              <strong className={`atd-header-status ${currentTone}`}>{formatStatus(request.status)}</strong>
            </div>
            <div className="atd-header-card atd-header-card-select">
              <label className="atd-select-label" htmlFor="atd-status">Status dropdown</label>
              <select
                id="atd-status"
                value={request.status}
                onChange={(event) => handleStatusChange(event.target.value)}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in_discussion">In Discussion</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        ) : null}
      </header>

      {loading ? (
        <main className="atd-shell">
          <section className="atd-hero-card">
            <span className="atd-kicker">Loading request</span>
            <h1>Preparing premium detail view...</h1>
          </section>
        </main>
      ) : request ? (
        <main className="atd-shell">
          <section className="atd-hero-card">
            <div className="atd-hero-copy">
              <span className="atd-kicker">Request overview</span>
              <h1>{request.workerName}</h1>
              <p>{request.workerRole || 'Talent request'}</p>
            </div>
            <div className="atd-hero-meta">
              <div className="atd-stat">
                <span>Budget</span>
                <strong>{request.budget}</strong>
              </div>
              <div className="atd-stat">
                <span>Unread queue</span>
                <strong>{badge}</strong>
              </div>
            </div>
          </section>

          <section className="atd-grid-layout">
            <div className="atd-column">
              <article className="atd-card">
                <h2>Project brief</h2>
                <div className="atd-info-grid">
                  <div>
                    <span>Project type</span>
                    <strong>{request.projectType || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span>Request ID</span>
                    <strong>{request._id}</strong>
                  </div>
                </div>
                <p className="atd-body-copy">
                  {request.projectDescription || 'No project description provided.'}
                </p>
              </article>

              <article className="atd-card">
                <h2>Company contact</h2>
                <div className="atd-info-grid">
                  <div>
                    <span>Business</span>
                    <strong>{request.companyName}</strong>
                  </div>
                  <div>
                    <span>Contact person</span>
                    <strong>{request.contactFirstName} {request.contactLastName}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{request.email}</strong>
                  </div>
                  <div>
                    <span>Phone</span>
                    <strong>{request.phoneNumber || 'Not provided'}</strong>
                  </div>
                </div>
              </article>
            </div>

            <aside className="atd-column atd-sidebar">
              <article className="atd-card">
                <h2>Talent profile</h2>
                <div className="atd-info-grid atd-info-grid-single">
                  <div>
                    <span>Role</span>
                    <strong>{request.workerRole || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span>Portfolio</span>
                    <strong>
                      {request.workerProfileUrl ? (
                        <a href={request.workerProfileUrl} target="_blank" rel="noreferrer">
                          Open profile
                        </a>
                      ) : (
                        'Not provided'
                      )}
                    </strong>
                  </div>
                </div>
              </article>

            </aside>
          </section>
        </main>
      ) : (
        <main className="atd-shell">
          <section className="atd-hero-card">
            <span className="atd-kicker">Request unavailable</span>
            <h1>We couldn&apos;t load this request.</h1>
            <p>Try going back to the request stream and opening it again.</p>
          </section>
        </main>
      )}
    </div>
  );
}
