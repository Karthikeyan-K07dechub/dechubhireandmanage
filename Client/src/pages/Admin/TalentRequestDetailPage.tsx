import { useEffect, useMemo, useState } from 'react';
import {
  getTalentRequest,
  markAsRead,
  updateTalentRequestStatus,
  sendTalentRequestShortlist,
  listMarketplaceCandidatesForAdmin,
  type TalentRequestItem,
  type AdminMarketplaceCandidateItem,
} from '../../api/admin.api';
import { resolveImageUrl } from '../../utils/imageUrl';
import './admin-talent-request-detail.css';

interface TalentRequestDetailPageProps {
  requestId: string;
  onBack: () => void;
}

const statusTone: Record<string, string> = {
  pending_review: 'new',
  shortlisted_sent: 'discussion',
  approved: 'contacted',
  alternative_suggested: 'discussion',
  rejected: 'closed',
  hired: 'contacted',
};

export default function TalentRequestDetailPage({
  requestId,
  onBack,
}: TalentRequestDetailPageProps) {
  const [request, setRequest] = useState<TalentRequestItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFullPortfolio, setShowFullPortfolio] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState<AdminMarketplaceCandidateItem[]>([]);
  const [suggestedWorkerId, setSuggestedWorkerId] = useState('');
  const [selectedShortlistIds, setSelectedShortlistIds] = useState<string[]>([]);
  const [reviewNotes, setReviewNotes] = useState('');
  const [savingAction, setSavingAction] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [debouncedCandidateSearch, setDebouncedCandidateSearch] = useState('');
  const [candidateAvailability, setCandidateAvailability] = useState('');
  const [candidateCountry, setCandidateCountry] = useState('');
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateCountries, setCandidateCountries] = useState<string[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const detail = await getTalentRequest(requestId);
        await markAsRead(requestId);

        if (!active) {
          return;
        }

        setRequest({ ...detail, unread: false });
        setSuggestedWorkerId(detail.suggestedWorkerId ?? '');
        setSelectedShortlistIds(detail.shortlistedTalentProfiles?.map((profile) => profile.workerId) ?? []);
        setReviewNotes(detail.reviewNotes ?? '');
        setShowFullPortfolio(false);
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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCandidateSearch(candidateSearch);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [candidateSearch]);

  useEffect(() => {
    if (!requestId) {
      return;
    }

    let active = true;
    setCandidateLoading(true);

    listMarketplaceCandidatesForAdmin({
      requestId,
      q: debouncedCandidateSearch,
      availability: candidateAvailability,
      country: candidateCountry,
      page: candidatePage,
      perPage: 12,
    })
      .then((result) => {
        if (!active) return;
        setAvailableProfiles(result.items);
        setCandidateTotal(result.total);
        setCandidateCountries(result.filters.countries);
      })
      .catch(() => {
        if (!active) return;
        setCandidateCountries([]);
      })
      .finally(() => {
        if (active) {
          setCandidateLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [candidateAvailability, candidateCountry, candidatePage, debouncedCandidateSearch, requestId]);

  const handleStatusChange = async (status: string) => {
    if (!request) {
      return;
    }

    setSavingAction(status);
    setActionError('');
    try {
      const updated = await updateTalentRequestStatus(request._id, {
        status,
        suggestedWorkerId: status === 'alternative_suggested' ? suggestedWorkerId : undefined,
        reviewNotes,
      });
      setRequest(updated);
      setSuggestedWorkerId(updated.suggestedWorkerId ?? '');
      setReviewNotes(updated.reviewNotes ?? '');
    } catch (err) {
      setActionError('We could not update this request right now. Please try again.');
    } finally {
      setSavingAction('');
    }
  };

  const handleSendShortlist = async () => {
    if (!request || selectedShortlistIds.length === 0) {
      return;
    }

    setSavingAction('shortlisted_sent');
    setActionError('');
    try {
      const updated = await sendTalentRequestShortlist(request._id, {
        shortlistedWorkerIds: selectedShortlistIds,
        reviewNotes,
      });
      setRequest(updated);
      setSelectedShortlistIds(updated.shortlistedTalentProfiles?.map((profile) => profile.workerId) ?? selectedShortlistIds);
      setReviewNotes(updated.reviewNotes ?? '');
    } catch (err) {
      setActionError('We could not send the shortlisted profiles. Please try again.');
    } finally {
      setSavingAction('');
    }
  };

  const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Unknown');
  const formatStatus = (value?: string) => (value ? value.replace(/_/g, ' ') : 'unknown');
  const getInitials = (name?: string) => {
    if (!name) {
      return 'NA';
    }

    const parts = name.trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || 'NA';
  };
  const currentTone = statusTone[request?.status || ''] || 'new';
  const isGeneralRequest = !request?.workerId;
  const portfolioProjects = request?.talentProfile?.portfolioProjects ?? [];
  const servicePackages = request?.talentProfile?.servicePackages ?? [];
  const visiblePortfolioProjects = showFullPortfolio ? portfolioProjects : portfolioProjects.slice(0, 2);
  const suggestionCandidates = availableProfiles.filter((profile) => profile.workerId !== request?.workerId);
  const selectedProfiles = useMemo(() => {
    const sentProfiles = request?.shortlistedTalentProfiles ?? [];
    const byId = new Map<string, {
      workerId: string;
      workerName: string;
      workerRole: string;
      profilePhotoUrl: string;
      location: string;
      availabilityLabel: string;
    }>();

    sentProfiles.forEach((profile) => {
      byId.set(profile.workerId, profile);
    });
    availableProfiles.forEach((profile) => {
      if (selectedShortlistIds.includes(profile.workerId)) {
        byId.set(profile.workerId, {
          workerId: profile.workerId,
          workerName: profile.name,
          workerRole: profile.role,
          profilePhotoUrl: profile.profilePhotoUrl,
          location: profile.location,
          availabilityLabel: profile.availabilityLabel,
        });
      }
    });

    return selectedShortlistIds
      .map((id) => byId.get(id))
      .filter(Boolean) as Array<{
      workerId: string;
      workerName: string;
      workerRole: string;
      profilePhotoUrl: string;
      location: string;
      availabilityLabel: string;
    }>;
  }, [availableProfiles, request?.shortlistedTalentProfiles, selectedShortlistIds]);

  const totalCandidatePages = Math.max(1, Math.ceil(candidateTotal / 12));

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
            <div className="atd-header-card atd-header-card-select" style={{ minWidth: 320 }}>
              <label className="atd-select-label" htmlFor="atd-review-notes">Admin decision</label>
              <textarea
                id="atd-review-notes"
                value={reviewNotes}
                onChange={(event) => setReviewNotes(event.target.value)}
                placeholder="Optional note for the company"
                style={{ minHeight: 88, borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.35)', background: 'rgba(15, 23, 42, 0.22)', color: '#fff', padding: 12, resize: 'vertical' }}
              />
              <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
                {isGeneralRequest ? (
                  <button
                    type="button"
                    className="atd-inline-button"
                    onClick={() => void handleSendShortlist()}
                    disabled={selectedShortlistIds.length === 0 || savingAction === 'shortlisted_sent'}
                  >
                    {savingAction === 'shortlisted_sent' ? 'Sending shortlist...' : 'Send profiles to company email'}
                  </button>
                ) : (
                  <>
                    <button type="button" className="atd-inline-button" onClick={() => void handleStatusChange('approved')} disabled={savingAction === 'approved'}>
                      {savingAction === 'approved' ? 'Saving...' : 'Approve talent'}
                    </button>
                    <select
                      value={suggestedWorkerId}
                      onChange={(event) => setSuggestedWorkerId(event.target.value)}
                      style={{ borderRadius: 14, border: '1px solid rgba(148, 163, 184, 0.35)', background: 'rgba(15, 23, 42, 0.22)', color: '#fff', padding: 12 }}
                    >
                      <option value="">Select alternative profile</option>
                      {suggestionCandidates.map((profile) => (
                        <option key={profile.workerId} value={profile.workerId}>
                          {profile.name} - {profile.role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="atd-inline-button"
                      onClick={() => void handleStatusChange('alternative_suggested')}
                      disabled={!suggestedWorkerId || savingAction === 'alternative_suggested'}
                    >
                      {savingAction === 'alternative_suggested' ? 'Saving...' : 'Suggest alternative'}
                    </button>
                  </>
                )}
                <button type="button" className="atd-inline-button" onClick={() => void handleStatusChange('rejected')} disabled={savingAction === 'rejected'}>
                  {savingAction === 'rejected' ? 'Saving...' : 'Reject request'}
                </button>
              </div>
              {actionError ? (
                <p className="atd-action-error">{actionError}</p>
              ) : null}
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
          <section className="atd-grid-layout">
            <div className="atd-column">
              {!isGeneralRequest ? (
                <article className="atd-card">
                  <h2>Talent profile</h2>
                  <div className="atd-profile-top">
                    <div className="atd-talent-head">
                      {request.talentProfile?.profilePhotoUrl ? (
                        <img
                          className="atd-talent-photo"
                          src={request.talentProfile.profilePhotoUrl}
                          alt={request.workerName || 'Talent profile'}
                        />
                      ) : (
                        <div className="atd-talent-photo atd-talent-photo-fallback" aria-hidden="true">
                          {getInitials(request.workerName)}
                        </div>
                      )}
                    </div>
                    <div className="atd-info-grid atd-info-grid-profile">
                      <div>
                        <span>Name</span>
                        <strong>{request.workerName || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Role</span>
                        <strong>{request.workerRole || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Location</span>
                        <strong>{request.talentProfile?.location || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Availability</span>
                        <strong>{request.talentProfile?.availabilityLabel || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Phone number</span>
                        <strong>{request.talentProfile?.phone || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Email</span>
                        <strong>{request.talentProfile?.email || 'Not provided'}</strong>
                      </div>
                      <div>
                        <span>Response time</span>
                        <strong>
                          {request.talentProfile?.responseTimeHours
                            ? `${request.talentProfile.responseTimeHours} hours`
                            : 'Not provided'}
                        </strong>
                      </div>
                    </div>
                  </div>
                  <div className="atd-talent-groups">
                    <div>
                      <span>Skills</span>
                      {request.talentProfile?.skills?.length ? (
                        <div className="atd-pill-list">
                          {request.talentProfile.skills.map((skill) => (
                            <span key={skill} className="atd-pill">{skill}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="atd-helper-copy">No skills added yet.</p>
                      )}
                    </div>
                    <div>
                      <span>Languages</span>
                      {request.talentProfile?.languages?.length ? (
                        <div className="atd-pill-list">
                          {request.talentProfile.languages.map((language) => (
                            <span key={language} className="atd-pill">{language}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="atd-helper-copy">No languages added yet.</p>
                      )}
                    </div>
                  </div>
                  <p className="atd-body-copy">
                    {request.talentProfile?.profileOverview || 'No talent overview provided.'}
                  </p>
                  <div className="atd-portfolio-section">
                    <div className="atd-section-head">
                      <h3>Service package pricing</h3>
                    </div>
                    {servicePackages.length ? (
                      <div className="atd-package-list">
                        {servicePackages.map((item) => {
                          const features = Array.isArray(item.features) ? item.features : [];

                          return (
                            <article key={`${item.name}-${item.price}`} className="atd-package-card">
                              <div className="atd-package-head">
                                <h4>{item.name}</h4>
                                <strong>${item.price.toLocaleString()}</strong>
                              </div>
                              <p>{item.description || 'No package description provided.'}</p>
                              <div className="atd-package-meta">
                                <span>{item.deliveryDays ? `${item.deliveryDays} day delivery` : 'Delivery not provided'}</span>
                                <span>{item.revisions !== null ? `${item.revisions} revisions` : 'Revisions not provided'}</span>
                              </div>
                              {features.length ? (
                                <div className="atd-pill-list">
                                  {features.map((feature) => (
                                    <span key={`${item.name}-${feature}`} className="atd-pill">{feature}</span>
                                  ))}
                                </div>
                              ) : (
                                <p className="atd-helper-copy">No package features added yet.</p>
                              )}
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="atd-helper-copy">Service package pricing has not been added yet.</p>
                    )}
                  </div>
                  <div className="atd-portfolio-section">
                    <div className="atd-section-head">
                      <h3>Portfolio projects</h3>
                      {portfolioProjects.length > 2 ? (
                        <button
                          type="button"
                          className="atd-inline-button"
                          onClick={() => setShowFullPortfolio((prev) => !prev)}
                        >
                          {showFullPortfolio ? 'Show fewer projects' : 'View full portfolio'}
                        </button>
                      ) : null}
                    </div>
                    {visiblePortfolioProjects.length ? (
                      <div className="atd-portfolio-list">
                        {visiblePortfolioProjects.map((project) => (
                          <article
                            key={`${project.title}-${project.imageUrl}-${project.description}`}
                            className="atd-portfolio-card"
                          >
                            {project.imageUrl ? (
                              <img
                                src={resolveImageUrl(project.imageUrl)}
                                alt={project.title}
                                className="atd-portfolio-image"
                              />
                            ) : null}
                            <div className="atd-portfolio-copy">
                              <h4>{project.title}</h4>
                              <p>{project.description}</p>
                              {project.tags.length ? (
                                <div className="atd-pill-list">
                                  {project.tags.map((tag) => (
                                    <span key={`${project.title}-${tag}`} className="atd-pill">{tag}</span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="atd-helper-copy">Portfolio projects have not been added yet.</p>
                    )}
                  </div>
                </article>
              ) : (
                <article className="atd-card">
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(280px, 0.8fr)', gap: 20 }}>
                    <div>
                      <div className="atd-section-head" style={{ marginBottom: 18 }}>
                        <div>
                          <h2 style={{ margin: 0 }}>Shortlist candidates</h2>
                          <p className="atd-helper-copy" style={{ marginTop: 8 }}>
                            Start with the best matching marketplace profiles for this hiring brief, then refine with search and filters.
                          </p>
                        </div>
                      </div>

                      <div className="atd-shortlist-filters">
                        <input
                          value={candidateSearch}
                          onChange={(event) => {
                            setCandidateSearch(event.target.value);
                            setCandidatePage(1);
                          }}
                          placeholder="Search by role, skill, or region"
                          className="atd-shortlist-control"
                        />
                        <select
                          value={candidateAvailability}
                          onChange={(event) => {
                            setCandidateAvailability(event.target.value);
                            setCandidatePage(1);
                          }}
                          className="atd-shortlist-control"
                        >
                          <option value="">All availability</option>
                          <option value="available_now">Available now</option>
                          <option value="this_week">This week</option>
                          <option value="two_weeks">2 weeks notice</option>
                          <option value="next_month">Next month</option>
                        </select>
                        <select
                          value={candidateCountry}
                          onChange={(event) => {
                            setCandidateCountry(event.target.value);
                            setCandidatePage(1);
                          }}
                          className="atd-shortlist-control"
                        >
                          <option value="">All countries</option>
                          {candidateCountries.map((country) => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      </div>

                      <div className="atd-shortlist-results">
                        {candidateLoading ? (
                          <div className="atd-shortlist-loading">Refreshing matches…</div>
                        ) : null}
                        {!candidateLoading && availableProfiles.length === 0 ? (
                          <p className="atd-helper-copy">No candidate profiles match these filters yet.</p>
                        ) : null}
                        {availableProfiles.map((profile) => {
                          const checked = selectedShortlistIds.includes(profile.workerId);
                          return (
                            <article
                              key={profile.workerId}
                              style={{
                                borderRadius: 20,
                                border: checked ? '1px solid rgba(73, 236, 197, 0.75)' : '1px solid rgba(148, 163, 184, 0.16)',
                                background: checked ? 'rgba(18, 52, 64, 0.9)' : 'rgba(15, 23, 42, 0.42)',
                                boxShadow: checked ? '0 0 0 1px rgba(73, 236, 197, 0.2)' : 'none',
                                padding: 18,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: 14 }}>
                                  {profile.profilePhotoUrl ? (
                                    <img
                                      src={resolveImageUrl(profile.profilePhotoUrl)}
                                      alt={profile.name}
                                      style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.18)' }}
                                    />
                                  ) : (
                                    <div style={{ width: 54, height: 54, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.08)', color: '#fff', fontWeight: 700 }}>
                                      {getInitials(profile.name)}
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{profile.name}</div>
                                    <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.76)', fontSize: 14 }}>{profile.role}</div>
                                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                      <span className="atd-pill">{profile.location}</span>
                                      <span className="atd-pill">{profile.availabilityLabel}</span>
                                      {profile.packagePrice > 0 ? (
                                        <span className="atd-pill">
                                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: profile.currency, maximumFractionDigits: 0 }).format(profile.packagePrice)}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
                                  <button
                                    type="button"
                                    className="atd-inline-button"
                                    onClick={() => window.open(`/marketplace/${encodeURIComponent(profile.workerId)}`, '_blank', 'noopener,noreferrer')}
                                  >
                                    View profile
                                  </button>
                                  <button
                                    type="button"
                                    className="atd-inline-button"
                                    style={{ background: checked ? '#49ecc5' : undefined, color: checked ? '#0f172a' : undefined }}
                                    onClick={() => {
                                      setSelectedShortlistIds((current) => (
                                        checked
                                          ? current.filter((id) => id !== profile.workerId)
                                          : Array.from(new Set([...current, profile.workerId]))
                                      ));
                                    }}
                                  >
                                    {checked ? 'Selected' : 'Select'}
                                  </button>
                                </div>
                              </div>
                              <p className="atd-body-copy" style={{ marginTop: 14 }}>
                                {profile.profileOverview || 'Marketplace overview not provided yet.'}
                              </p>
                              <div className="atd-pill-list">
                                {profile.skills.slice(0, 4).map((skill) => (
                                  <span key={`${profile.workerId}-${skill}`} className="atd-pill">{skill}</span>
                                ))}
                              </div>
                            </article>
                          );
                        })}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
                        <span className="atd-helper-copy">
                          Showing page {candidatePage} of {totalCandidatePages} · {candidateTotal} matched profiles
                        </span>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            className="atd-inline-button"
                            disabled={candidatePage <= 1}
                            onClick={() => setCandidatePage((current) => Math.max(1, current - 1))}
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            className="atd-inline-button"
                            disabled={candidatePage >= totalCandidatePages}
                            onClick={() => setCandidatePage((current) => Math.min(totalCandidatePages, current + 1))}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>

                    <aside
                      style={{
                        alignSelf: 'start',
                        position: 'sticky',
                        top: 24,
                        borderRadius: 22,
                        border: '1px solid rgba(148, 163, 184, 0.16)',
                        background: 'rgba(15, 23, 42, 0.56)',
                        padding: 20,
                      }}
                    >
                      <div style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                        Selected profiles
                      </div>
                      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: '#fff' }}>{selectedProfiles.length}</div>
                      <p className="atd-helper-copy" style={{ marginTop: 8 }}>
                        These are the candidates that will be emailed to the company for review.
                      </p>

                      <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                        {selectedProfiles.length === 0 ? (
                          <div style={{ borderRadius: 16, border: '1px dashed rgba(148, 163, 184, 0.28)', padding: 16, color: 'rgba(255,255,255,0.56)', fontSize: 14 }}>
                            Select one or more matched profiles to build the shortlist.
                          </div>
                        ) : selectedProfiles.map((profile) => (
                          <div key={profile.workerId} style={{ borderRadius: 16, background: 'rgba(255,255,255,0.04)', padding: 14 }}>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{profile.workerName}</div>
                            <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>{profile.workerRole}</div>
                            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.56)', fontSize: 12 }}>{profile.location} · {profile.availabilityLabel}</div>
                          </div>
                        ))}
                      </div>
                    </aside>
                  </div>
                </article>
              )}

              <article className="atd-card">
                <h2>Project brief</h2>
                <div className="atd-info-grid">
                  <div>
                    <span>Project type</span>
                    <strong>{request.projectType || 'Not provided'}</strong>
                  </div>
                  <div>
                    <span>Budget</span>
                    <strong>{request.budget}</strong>
                  </div>
                </div>
                <div className="atd-body-label">Project description</div>
                <p className="atd-body-copy">
                  {request.projectDescription || 'No project description provided.'}
                </p>
              </article>

              <article className="atd-card">
                <h2>Company contact</h2>
                <div className="atd-info-grid">
                  <div>
                    <span>Company Name</span>
                    <strong>{request.companyName}</strong>
                  </div>
                  <div>
                    <span>Website</span>
                    <strong>{request.companyWebsite || 'Not provided'}</strong>
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

              {request.suggestedTalentProfile ? (
                <article className="atd-card">
                  <h2>Suggested profile</h2>
                  <div className="atd-info-grid">
                    <div>
                      <span>Name</span>
                      <strong>{request.suggestedTalentProfile.workerName}</strong>
                    </div>
                    <div>
                      <span>Role</span>
                      <strong>{request.suggestedTalentProfile.workerRole}</strong>
                    </div>
                    <div>
                      <span>Location</span>
                      <strong>{request.suggestedTalentProfile.location}</strong>
                    </div>
                    <div>
                      <span>Availability</span>
                      <strong>{request.suggestedTalentProfile.availabilityLabel}</strong>
                    </div>
                  </div>
                </article>
              ) : null}
            </div>
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
