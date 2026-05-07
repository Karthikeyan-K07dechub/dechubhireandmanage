import { useEffect, useMemo, useState } from 'react';
import './talent-marketplace.css';
import { getMarketplaceTalent, type MarketplaceTalentProfile } from '../api/marketplace.api';
import type { ApiError } from '../api/client';

interface TalentMarketplacePageProps {
  userName: string;
  onLogout: () => void;
}

const DEFAULT_MARKETPLACE_BLURBS = new Set([
  'Tell companies about your strongest skills and the kind of freelance work you want.',
  'Freelancer profile is being completed.',
  'Experienced freelancer available for contract work.',
  'Self-signup freelancer profile',
]);

function formatRate(rate: number, currency: string): string {
  if (!rate || rate <= 0) return 'Rate on request';
  if (currency === 'USD') return `$${rate}/hr`;
  return `${currency} ${rate}/hr`;
}

function isCompletedMarketplaceProfile(profile: MarketplaceTalentProfile): boolean {
  const normalizedRole = profile.role.trim().toLowerCase();
  const normalizedBlurb = profile.blurb.trim();
  const normalizedLocation = profile.location.trim().toLowerCase();

  return Boolean(
    normalizedRole
    && normalizedRole !== 'freelancer'
    && profile.rate > 0
    && profile.skills.length > 0
    && normalizedBlurb
    && !DEFAULT_MARKETPLACE_BLURBS.has(normalizedBlurb)
    && normalizedLocation
    && normalizedLocation !== 'remote',
  );
}

export default function TalentMarketplacePage({
  userName,
  onLogout,
}: TalentMarketplacePageProps) {
  const [query, setQuery] = useState('');
  const [availability, setAvailability] = useState('All');
  const [talentPool, setTalentPool] = useState<MarketplaceTalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMarketplaceTalent()
      .then((profiles) => {
        setTalentPool(profiles.filter((profile) => isCompletedMarketplaceProfile(profile)));
        setLoading(false);
      })
      .catch((err) => {
        const apiError = err as ApiError;
        setError(apiError.message ?? 'Failed to load marketplace talent.');
        setLoading(false);
      });
  }, []);

  const filteredTalent = useMemo(() => {
    return talentPool.filter((talent) => {
      const matchesQuery =
        !query.trim()
        || `${talent.name} ${talent.role} ${talent.location} ${talent.skills.join(' ')} ${talent.blurb}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesAvailability =
        availability === 'All' || talent.availabilityLabel === availability;

      return matchesQuery && matchesAvailability;
    });
  }, [availability, query, talentPool]);

  const availableThisWeek = useMemo(
    () => talentPool.filter((talent) => talent.availability === 'available_now' || talent.availability === 'this_week').length,
    [talentPool],
  );

  return (
    <div className="tmp-root">
      <header className="tmp-topbar">
        <div className="tmp-brand">
          <div className="tmp-brand-mark" />
          <div>
            <div className="tmp-brand-name">Dechub</div>
            <div className="tmp-brand-sub">Talent marketplace</div>
          </div>
        </div>

        <div className="tmp-user">
          <span>{userName}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      </header>

      <main className="tmp-shell">
        <section className="tmp-hero">
          <div className="tmp-hero-copy">
            <div className="tmp-kicker">Company workspace</div>
            <h1>Find talent and move straight into hiring.</h1>
            <p>
              Browse contractor profiles updated by freelancers themselves, filter by role and
              availability, and start outreach from one place.
            </p>
          </div>

          <div className="tmp-summary">
            <div className="tmp-summary-card">
              <strong>{talentPool.length}</strong>
              <span>Active talent profiles</span>
            </div>
            <div className="tmp-summary-card">
              <strong>{availableThisWeek}</strong>
              <span>Available now or this week</span>
            </div>
            <div className="tmp-summary-card">
              <strong>{filteredTalent.length}</strong>
              <span>Profiles matching your filters</span>
            </div>
          </div>
        </section>

        <section className="tmp-toolbar">
          <input
            type="search"
            placeholder="Search by role, skill, or region"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="All">All availability</option>
            <option value="Available now">Available now</option>
            <option value="Available this week">Available this week</option>
            <option value="2 weeks notice">2 weeks notice</option>
            <option value="Available next month">Available next month</option>
            <option value="Not available">Not available</option>
          </select>
        </section>

        {loading && <div className="tmp-state-card">Loading freelancer marketplace...</div>}
        {!loading && error && <div className="tmp-state-card tmp-state-card-error">{error}</div>}
        {!loading && !error && filteredTalent.length === 0 && (
          <div className="tmp-state-card">
            No freelancer profiles match your current filters yet.
          </div>
        )}

        {!loading && !error && filteredTalent.length > 0 && (
          <section className="tmp-grid">
            {filteredTalent.map((talent) => (
              <article key={talent.id} className="tmp-card">
                <div className="tmp-card-head">
                  <div>
                    <h2>{talent.name}</h2>
                    <p>{talent.role}</p>
                  </div>
                  <span>{talent.location}</span>
                </div>

                <div className="tmp-badges">
                  <span className="tmp-badge tmp-badge-strong">{formatRate(talent.rate, talent.currency)}</span>
                  <span className="tmp-badge">{talent.availabilityLabel}</span>
                </div>

                <p className="tmp-blurb">{talent.blurb}</p>

                <div className="tmp-skills">
                  {talent.skills.length > 0 ? talent.skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  )) : <span>No skills added yet</span>}
                </div>

                <div className="tmp-actions">
                  <button className="tmp-primary">View profile</button>
                  <button className="tmp-secondary">Invite to interview</button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
