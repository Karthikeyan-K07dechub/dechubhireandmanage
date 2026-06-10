import { useEffect, useMemo, useState } from 'react';
import './marketplace-talent-profile.css';
import {
  getMarketplaceTalentProfile,
  type MarketplaceFaqItem,
  type MarketplaceServicePackage,
  type MarketplaceTalentProfileDetail,
} from '../api/marketplace.api';
import type { ApiError } from '../api/client';
import { imageBackground, resolveImageUrl } from '../utils/imageUrl';

interface MarketplaceTalentProfilePageProps {
  workerId: string;
  isAuthenticated: boolean;
  userName: string;
  onBack: () => void;
  onLogout: () => void;
}

function formatRate(rate: number, currency: string): string {
  if (!rate || rate <= 0) return 'Rate on request';
  return currency === 'USD' ? `$${rate}/hr` : `${currency} ${rate}/hr`;
}

function formatPackagePrice(price: number, currency: string): string {
  if (!price || price <= 0) return 'Custom quote';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

function getBasicPackagePrice(profile: MarketplaceTalentProfileDetail): string {
  const packageList = profile.servicePackages ?? [];
  const basicPackage = packageList.find((pkg) => pkg.name.trim().toLowerCase().includes('basic'))
    ?? packageList.find((pkg) => pkg.price > 0)
    ?? packageList[0];

  if (basicPackage?.price && basicPackage.price > 0) {
    return formatPackagePrice(basicPackage.price, profile.currency);
  }

  return formatRate(profile.rate, profile.currency);
}

function formatMemberSince(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recently joined';
  }

  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function getInitials(profile: MarketplaceTalentProfileDetail): string {
  return profile.name
    .split(' ')
    .map((chunk) => chunk[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function PackageCard({ pkg, currency }: { pkg: MarketplaceServicePackage; currency: string }) {
  return (
    <article className="mpp-package-card">
      <div className="mpp-package-tier">{pkg.name}</div>
      <div className="mpp-package-price">{formatPackagePrice(pkg.price, currency)}</div>
      <p className="mpp-package-description">{pkg.description}</p>
      <div className="mpp-package-meta">
        <span>{pkg.deliveryDays} day delivery</span>
        <span>{pkg.revisions} revisions</span>
      </div>
      <div className="mpp-package-feature-list">
        {pkg.features.map((feature) => (
          <span key={`${pkg.name}-${feature}`}>{feature}</span>
        ))}
      </div>
      <button className="mpp-primary-action">Continue</button>
    </article>
  );
}

function FaqList({ items }: { items: MarketplaceFaqItem[] }) {
  const [openIndex, setOpenIndex] = useState(0);

  if (!items.length) {
    return <div className="mpp-empty-block">This contractor has not added FAQ details yet.</div>;
  }

  return (
    <div className="mpp-faq-list">
      {items.map((item, index) => (
        <div key={`${item.question}-${index}`} className="mpp-faq-item">
          <button
            className="mpp-faq-trigger"
            onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
          >
            <span>{item.question}</span>
            <span>{openIndex === index ? '−' : '+'}</span>
          </button>
          {openIndex === index ? <p className="mpp-faq-answer">{item.answer}</p> : null}
        </div>
      ))}
    </div>
  );
}

export default function MarketplaceTalentProfilePage({
  workerId,
  isAuthenticated,
  userName,
  onBack,
  onLogout,
}: MarketplaceTalentProfilePageProps) {
  const [profile, setProfile] = useState<MarketplaceTalentProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workerId) {
      setError('Profile not found.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    getMarketplaceTalentProfile(workerId)
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        const apiError = err as ApiError;
        setError(apiError.message ?? 'Failed to load contractor profile.');
        setLoading(false);
      });
  }, [workerId]);

  const compareRows = useMemo(() => {
    if (!profile?.servicePackages.length) return [];

    const allFeatures = Array.from(
      new Set(profile.servicePackages.flatMap((pkg) => pkg.features)),
    );

    return allFeatures.map((feature) => ({
      feature,
      values: profile.servicePackages.map((pkg) => pkg.features.includes(feature)),
    }));
  }, [profile]);

  return (
    <div className="mpp-root">
      <header className="mpp-topbar">
        <button className="mpp-back" onClick={onBack}>← Back to marketplace</button>
        <div className="mpp-user">
          <span>{isAuthenticated ? userName : 'Guest company'}</span>
          {isAuthenticated ? <button onClick={onLogout}>Logout</button> : null}
        </div>
      </header>

      <main className="mpp-shell">
        {loading ? <div className="mpp-state-card">Loading contractor profile...</div> : null}
        {!loading && error ? <div className="mpp-state-card mpp-state-card-error">{error}</div> : null}

        {!loading && !error && profile ? (
          <div className="mpp-layout">
            <section className="mpp-main">
              <div className="mpp-hero-card">
                {profile.bannerImageUrl ? (
                  <div className="mpp-hero-banner" style={{ backgroundImage: imageBackground(profile.bannerImageUrl) }} />
                ) : null}
                <div className="mpp-hero-head">
                  <div className="mpp-avatar">
                    {profile.profilePhotoUrl ? (
                      <img src={resolveImageUrl(profile.profilePhotoUrl)} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: "50%" }} />
                    ) : getInitials(profile)}
                  </div>
                  <div>
                    {/* <div className="mpp-title">{profile.role}</div> */}
                    <h1>{profile.name}</h1>
                    {/* <div className="mpp-subline">
                      <span>{profile.location}</span>
                      <span>{profile.availabilityLabel}</span>
                      <span>{getBasicPackagePrice(profile)}</span>
                    </div> */}
                  </div>
                </div>
                <p className="mpp-hero-summary">{profile.blurb}</p>
                <div className="mpp-skill-cloud">
                  {profile.skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </div>

              <section className="mpp-section-card">
                <h2>About this profile</h2>
                <p>{profile.profileOverview || profile.blurb}</p>
              </section>

              <section className="mpp-section-card">
                <h2>Get to know {profile.name.split(' ')[0] ?? 'this contractor'}</h2>
                <div className="mpp-facts-grid">
                  <div>
                    <span>From</span>
                    <strong>{profile.country || 'Not added yet'}</strong>
                  </div>
                  <div>
                    <span>Member since</span>
                    <strong>{formatMemberSince(profile.memberSince)}</strong>
                  </div>
                  <div>
                    <span>Avg. response time</span>
                    <strong>{profile.responseTimeHours} hours</strong>
                  </div>
                  <div>
                    <span>Languages</span>
                    <strong>{profile.languages.length ? profile.languages.join(', ') : 'Not added yet'}</strong>
                  </div>
                </div>
              </section>

              <section className="mpp-section-card">
                <h2>My Portfolio</h2>
                {profile.portfolioProjects.length ? (
                  <div className="mpp-portfolio-list">
                    {profile.portfolioProjects.map((project) => (
                      <article key={`${project.title}-${project.imageUrl}`} className="mpp-portfolio-card">
                        <img src={resolveImageUrl(project.imageUrl)} alt={project.title} />
                        <div>
                          <h3>{project.title}</h3>
                          <p>{project.description}</p>
                          <div className="mpp-portfolio-tags">
                            {project.tags.map((tag) => <span key={`${project.title}-${tag}`}>{tag}</span>)}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mpp-empty-block">Portfolio projects have not been added yet.</div>
                )}
              </section>

              <section className="mpp-section-card">
                <h2>Compare packages</h2>
                <div className="mpp-compare-table">
                  <div className="mpp-compare-header">
                    <span>Package</span>
                    {profile.servicePackages.map((pkg) => (
                      <div key={`${pkg.name}-header`}>
                        <strong>{formatPackagePrice(pkg.price, profile.currency)}</strong>
                        <span>{pkg.name}</span>
                      </div>
                    ))}
                  </div>
                  {compareRows.map((row) => (
                    <div key={row.feature} className="mpp-compare-row">
                      <span>{row.feature}</span>
                      {row.values.map((enabled, index) => (
                        <strong key={`${row.feature}-${profile.servicePackages[index].name}`}>{enabled ? '✓' : '—'}</strong>
                      ))}
                    </div>
                  ))}
                </div>
              </section>

              <section className="mpp-section-card">
                <h2>FAQ</h2>
                <FaqList items={profile.faqItems} />
              </section>
            </section>

            <aside className="mpp-sidebar">
              <div className="mpp-sticky">
                <div className="mpp-sidebar-card">
                  {profile.servicePackages.map((pkg) => (
                    <PackageCard key={`${pkg.name}-${pkg.price}`} pkg={pkg} currency={profile.currency} />
                  ))}
                </div>

                <div className="mpp-sidebar-card">
                  <div className="mpp-hiring-title">Need flexibility when hiring?</div>
                  <p>Hire by the hour for long-term work with weekly payment visibility.</p>
                  <div className="mpp-hourly-rate">{formatRate(profile.rate, profile.currency)}</div>
                  <button className="mpp-secondary-action">Request hourly offer</button>
                </div>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  );
}
