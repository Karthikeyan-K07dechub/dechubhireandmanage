import { useEffect, useState } from 'react';
import { getTalentRequest, markAsRead, updateTalentRequestStatus, type TalentRequestItem } from '../../api/admin.api';
import { resolveImageUrl } from '../../utils/imageUrl';
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
  const [loading, setLoading] = useState(true);
  const [showFullPortfolio, setShowFullPortfolio] = useState(false);

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

  const handleStatusChange = async (status: string) => {
    if (!request) {
      return;
    }

    await updateTalentRequestStatus(request._id, status);
    setRequest({ ...request, status });
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
  const portfolioProjects = request?.talentProfile?.portfolioProjects ?? [];
  const servicePackages = request?.talentProfile?.servicePackages ?? [];
  const visiblePortfolioProjects = showFullPortfolio ? portfolioProjects : portfolioProjects.slice(0, 2);

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
              <label className="atd-select-label" htmlFor="atd-status">Update status</label>
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
          <section className="atd-grid-layout">
            <div className="atd-column">
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
