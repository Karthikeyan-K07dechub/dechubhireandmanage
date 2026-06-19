import { useEffect, useState, type CSSProperties } from 'react';
import UserMenu from '../components/common/UserMenu';
import type { ApiError } from '../api/client';
import {
  listCompanyTalentRequests,
  acceptSuggestedTalent,
  type CompanyTalentRequestItem,
} from '../api/talentRequests.api';

interface MarketplaceTalentRequestsPageProps {
  userName: string;
  onBack: () => void;
  onLogout: () => void;
  onNotifications: () => void;
  onOpenProfile: (workerId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending review',
  approved: 'Approved',
  alternative_suggested: 'Alternative suggested',
  rejected: 'Rejected',
  hired: 'Hired',
};

export default function MarketplaceTalentRequestsPage({
  userName,
  onBack,
  onLogout,
  onNotifications,
  onOpenProfile,
}: MarketplaceTalentRequestsPageProps) {
  const [items, setItems] = useState<CompanyTalentRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    let active = true;

    listCompanyTalentRequests()
      .then((data) => {
        if (!active) return;
        setItems(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        const apiError = err as ApiError;
        setError(apiError.message ?? 'Unable to load talent requests.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAcceptSuggestion = async (requestId: string) => {
    setUpdatingId(requestId);
    try {
      const updated = await acceptSuggestedTalent(requestId);
      setItems((current) => current.map((item) => (item._id === requestId ? updated : item)));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? 'Unable to accept the suggested profile.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 40px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <button type="button" onClick={onBack} style={{ border: 'none', background: 'none', fontSize: 14, fontWeight: 600, color: '#1e3a8a', cursor: 'pointer' }}>
          Back to marketplace
        </button>
        <UserMenu userName={userName} onLogout={onLogout} onNotifications={onNotifications} />
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '36px 24px 56px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 10 }}>
              Marketplace
            </div>
            <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1, color: '#0f172a' }}>Talent Requests</h1>
            <p style={{ margin: '12px 0 0', maxWidth: 760, color: '#475569', fontSize: 16, lineHeight: 1.7 }}>
              Track every request you have submitted, review admin decisions, and move approved talent into hiring.
            </p>
          </div>
          <div style={{ minWidth: 180, padding: '20px 22px', borderRadius: 20, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>Total requests</div>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#0f172a' }}>{items.length}</div>
          </div>
        </div>

        {loading ? <div style={cardStyle}>Loading your requests...</div> : null}
        {!loading && error ? <div style={{ ...cardStyle, color: '#b91c1c' }}>{error}</div> : null}
        {!loading && !error && items.length === 0 ? (
          <div style={cardStyle}>
            You have not submitted a marketplace talent request yet.
          </div>
        ) : null}

        {!loading && !error && items.length > 0 ? (
          <div style={{ display: 'grid', gap: 18 }}>
            {items.map((item) => (
              <article key={item._id} style={{ ...cardStyle, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                      <span style={statusPillStyle(item.status)}>{STATUS_LABELS[item.status] ?? item.status}</span>
                      <span style={{ color: '#64748b', fontSize: 13 }}>
                        Submitted {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 26, color: '#0f172a' }}>{item.workerName}</h2>
                    <p style={{ margin: '8px 0 0', color: '#475569' }}>{item.workerRole} · {item.projectType} · {item.budget}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => onOpenProfile(item.workerId)}
                      style={secondaryButtonStyle}
                    >
                      View current profile
                    </button>
                    {item.status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => { window.location.href = `/dashboard?hireRequest=${encodeURIComponent(item._id)}`; }}
                        style={primaryButtonStyle}
                      >
                        Proceed to hire
                      </button>
                    ) : null}
                    {item.status === 'alternative_suggested' && item.suggestedTalentProfile ? (
                      <button
                        type="button"
                        disabled={updatingId === item._id}
                        onClick={() => void handleAcceptSuggestion(item._id)}
                        style={primaryButtonStyle}
                      >
                        {updatingId === item._id ? 'Updating...' : 'Accept suggestion'}
                      </button>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 20 }}>
                  <div style={innerCardStyle}>
                    <div style={sectionLabelStyle}>Request summary</div>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{item.companyName}</div>
                    <div style={{ color: '#475569', lineHeight: 1.7 }}>{item.projectDescription}</div>
                  </div>

                  <div style={innerCardStyle}>
                    <div style={sectionLabelStyle}>Admin update</div>
                    <div style={{ color: '#0f172a', fontWeight: 600, marginBottom: 8 }}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </div>
                    <div style={{ color: '#475569', lineHeight: 1.7 }}>
                      {item.reviewNotes?.trim()
                        || (item.status === 'pending_review' ? 'Your request is with the Dechub admin team for review.' : '')
                        || (item.status === 'approved' ? 'This talent has been approved. You can continue to the dashboard hire flow.' : '')
                        || (item.status === 'rejected' ? 'This request was not approved. Please submit a new request if you want to explore a different fit.' : '')
                        || (item.status === 'hired' ? 'This talent has already been moved into your dashboard.' : '')
                        || 'An alternative profile was suggested for review.'}
                    </div>
                  </div>
                </div>

                {item.suggestedTalentProfile ? (
                  <div style={{ ...innerCardStyle, marginTop: 16 }}>
                    <div style={sectionLabelStyle}>Suggested profile</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.suggestedTalentProfile.workerName}</div>
                        <div style={{ color: '#475569', marginTop: 6 }}>
                          {item.suggestedTalentProfile.workerRole} · {item.suggestedTalentProfile.location} · {item.suggestedTalentProfile.availabilityLabel}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenProfile(item.suggestedTalentProfile!.workerId)}
                        style={secondaryButtonStyle}
                      >
                        View suggested profile
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

const cardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 24,
  boxShadow: '0 20px 45px rgba(15, 23, 42, 0.06)',
  padding: 28,
};

const innerCardStyle: CSSProperties = {
  background: '#f8fafc',
  borderRadius: 18,
  padding: 18,
  border: '1px solid #e2e8f0',
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 999,
  padding: '12px 18px',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  borderRadius: 999,
  padding: '12px 18px',
  background: '#fff',
  color: '#0f172a',
  fontWeight: 700,
  cursor: 'pointer',
};

const sectionLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#64748b',
  marginBottom: 10,
};

function statusPillStyle(status: string): CSSProperties {
  const palette: Record<string, { background: string; color: string }> = {
    pending_review: { background: '#eff6ff', color: '#1d4ed8' },
    approved: { background: '#ecfdf5', color: '#047857' },
    alternative_suggested: { background: '#faf5ff', color: '#7c3aed' },
    rejected: { background: '#fef2f2', color: '#b91c1c' },
    hired: { background: '#f5f3ff', color: '#5b21b6' },
  };

  const tone = palette[status] ?? palette.pending_review;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 700,
    background: tone.background,
    color: tone.color,
  };
}
