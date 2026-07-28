import { useMemo, useState } from 'react';
import './landing.css';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onMarketplace: () => void;
  onMarketplaceSearch: (query: string) => void;
}

const HERO_SERVICE_CHIPS = [
  'Architecture & Interior Design',
  'Graphic Design',
  'Website Developer',
];

export default function LandingPage({
  onLogin,
  onGetStarted,
  onMarketplaceSearch,
}: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const submitMarketplaceSearch = useMemo(
    () => () => onMarketplaceSearch(searchQuery.trim()),
    [onMarketplaceSearch, searchQuery],
  );

  return (
    <div className="landing-root">
      <section className="landing-hero landing-hero-v2">
        <div className="landing-hero-v2__shell">
          <video
            className="landing-hero-v2__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/assets/videos/DJis4jbvxfiPHNnoy09s1NXK2tY.mp4" type="video/mp4" />
          </video>
          <div className="landing-hero-v2__overlay" />

          <nav className="landing-hero-v2__nav" aria-label="Primary">
            <button type="button">Home</button>
            <button type="button">About</button>
            <button type="button" className="landing-hero-v2__nav-logo" aria-label="Dechub home">
              <span className="landing-hero-v2__nav-logo-mark" aria-hidden="true" />
            </button>
            <button type="button">Blog</button>
            <button type="button">Contact</button>
          </nav>

          <div className="landing-hero-v2__content">
            <h1 className="landing-hero-v2__title">
              <span>Hire, Pay &amp; Manage</span>
              <span>Global Contractors without the chaos</span>
            </h1>

            <p className="landing-hero-v2__copy">
              Dechub is the all-in-one platform to onboard US contractors, generate contracts,
              collect e-signatures, and process payments via Wise - all from one dashboard.
            </p>

            <div className="landing-hero-search landing-hero-v2__search">
              <input
                type="text"
                value={searchQuery}
                placeholder="Search for any service..."
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    submitMarketplaceSearch();
                  }
                }}
              />
              <button type="button" aria-label="Search marketplace" onClick={submitMarketplaceSearch}>
                <span />
              </button>
            </div>

            <div className="landing-service-pills landing-hero-v2__chips">
              {HERO_SERVICE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setSearchQuery(chip);
                    onMarketplaceSearch(chip);
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="landing-hero-v2__actions">
              <button type="button" className="landing-hero-v2__primary" onClick={onGetStarted}>
                Get Started
              </button>
              <button type="button" className="landing-hero-v2__secondary" onClick={onLogin}>
                Book a demo
              </button>
            </div>
          </div>

          <div className="landing-hero-v2__brands" aria-label="Trusted brands">
            <div className="landing-hero-v2__brands-track">
              <span>Logoipsur</span>
              <span className="landing-hero-v2__brands-dot" aria-hidden="true">•</span>
              <span className="landing-hero-v2__brands-wordmark">LOGO</span>
              <span className="landing-hero-v2__brands-dot" aria-hidden="true">•</span>
              <span className="landing-hero-v2__brands-italic">Logoipsur</span>
              <span className="landing-hero-v2__brands-dot" aria-hidden="true">•</span>
              <span>Logoipsur</span>
              <span className="landing-hero-v2__brands-dot" aria-hidden="true">•</span>
              <span className="landing-hero-v2__brands-wordmark">LOGO</span>
              <span className="landing-hero-v2__brands-dot" aria-hidden="true">•</span>
              <span className="landing-hero-v2__brands-italic">Logoipsur</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-speed-section" aria-labelledby="landing-speed-title">
        <div className="landing-speed-section__shell">
          <div className="landing-speed-section__backdrop" aria-hidden="true">
            20M
          </div>
          <h2 id="landing-speed-title" className="landing-speed-section__title">
            <span>Get a resource in </span>
            <span className="landing-speed-section__accent">20 minutes</span>
            <br />
            <span>with </span>
            <span className="landing-speed-section__accent">10 days</span>
            <span> free trial</span>
          </h2>
        </div>
      </section>

      <section className="landing-how-section" aria-labelledby="landing-how-title">
        <div className="landing-how-section__shell">
          <div className="landing-how-section__intro">
            <span className="landing-how-section__eyebrow">How it works</span>
            <h2 id="landing-how-title" className="landing-how-section__title">
              How Dechub-Bridge
              <br />
              helps you hire faster
            </h2>
          </div>

          <div className="landing-how-section__grid">
            <article className="landing-how-card-v2">
              <p className="landing-how-card-v2__step">Step 1.</p>
              <div className="landing-how-card-v2__frame">
                <div className="landing-how-card-v2__panel">
                  <h3>Hiring Brief</h3>
                  <p>Role, skills, budget, and timeline</p>
                  <div className="landing-how-card-v2__divider" />

                  <div className="landing-how-card-v2__list">
                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon">[]</span>
                      <div>
                        <small>Role needed</small>
                        <strong>Frontend Developer</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon">&lt;/&gt;</span>
                      <div>
                        <small>Skills required</small>
                        <strong>React, Next.js, Tailwind</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon">$</span>
                      <div>
                        <small>Budget range</small>
                        <strong>$800 - $1200 / month</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon">7D</span>
                      <div>
                        <small>Timeline</small>
                        <strong>Need to start in 7 days</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row is-muted">
                      <span className="landing-how-card-v2__icon">H</span>
                      <div>
                        <small>Hiring type</small>
                        <strong>Remote contractor</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="landing-how-card-v2__copy">
                  <h3>Share your requirement</h3>
                  <p>
                    Tell Dechub-Bridge who you need by sharing the role, skills, timeline,
                    and budget you are looking for.
                  </p>
                </div>
              </div>
            </article>

            <article className="landing-how-card-v2">
              <p className="landing-how-card-v2__step">Step 2.</p>
              <div className="landing-how-card-v2__frame">
                <div className="landing-how-card-v2__panel">
                  <h3>Curated Profiles</h3>
                  <p>Shortlisted for your requirement</p>
                  <div className="landing-how-card-v2__divider" />

                  <div className="landing-how-card-v2__list">
                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon is-number">1</span>
                      <div>
                        <small>Profile 1</small>
                        <strong>Frontend Developer</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon is-number">2</span>
                      <div>
                        <small>Profile 2</small>
                        <strong>UI Engineer</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row">
                      <span className="landing-how-card-v2__icon is-number">3</span>
                      <div>
                        <small>Profile 3</small>
                        <strong>Web Developer</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row is-muted">
                      <span className="landing-how-card-v2__icon">AV</span>
                      <div>
                        <small>Availability</small>
                        <strong>2 available this week</strong>
                      </div>
                    </div>

                    <div className="landing-how-card-v2__row is-muted">
                      <span className="landing-how-card-v2__icon">OK</span>
                      <div>
                        <small>Match status</small>
                        <strong>Best-fit profiles shared</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="landing-how-card-v2__copy">
                  <h3>Curated profile matching</h3>
                  <p>
                    The Dechub-Bridge team reviews your requirement and shares suitable
                    curated profiles with you.
                  </p>
                </div>
              </div>
            </article>

            <article className="landing-how-card-v2">
              <p className="landing-how-card-v2__step">Step 3.</p>
              <div className="landing-how-card-v2__frame">
                <div className="landing-how-card-v2__panel">
                  <h3>Contracts, Signatures, Payments</h3>
                  <p>Everything in one workflow</p>
                  <div className="landing-how-card-v2__divider" />

                  <div className="landing-how-card-v2__mini-tabs">
                    <span className="is-green">Contract</span>
                    <span className="is-blue">E-signature</span>
                    <span className="is-orange">Payment setup</span>
                  </div>

                  <div className="landing-how-card-v2__workflow">
                    <h4>Hiring workflow</h4>
                    <p>Move from selection to onboarding smoothly</p>
                    <ul>
                      <li className="is-green">Contract generated</li>
                      <li className="is-green">Pending approval</li>
                      <li className="is-blue">E-signature sent</li>
                      <li className="is-soft-green">Payment setup ready</li>
                      <li className="is-soft-blue">Ready to onboard</li>
                      <li className="is-soft-blue">Can start immediately</li>
                      <li className="is-soft-orange">Hiring completed</li>
                    </ul>
                  </div>
                </div>

                <div className="landing-how-card-v2__copy">
                  <h3>Hire and manage smoothly</h3>
                  <p>
                    Use Dechub-Bridge to handle onboarding, agreements, and contractor
                    management from one place.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-solutions-section" aria-labelledby="landing-solutions-title">
        <div className="landing-solutions-section__shell">
          <div className="landing-solutions-section__intro">
            <span className="landing-solutions-section__eyebrow">Our solutions</span>
            <h2 id="landing-solutions-title" className="landing-solutions-section__title">
              Platform solutions that help you
              <br />
              hire faster and manage smarter
            </h2>
          </div>

          <div className="landing-solutions-grid">
            <article className="landing-solution-card landing-solution-card--top landing-solution-card--workflow">
              <div className="landing-solution-card__copy">
                <h3>Contractor Onboarding.</h3>
                <p>
                  Collect worker details, role scope, budget, and start timelines in one structured intake flow.
                </p>
              </div>
              <div className="landing-solution-card__visual landing-solution-card__visual--workflow">
                <div className="landing-solution-workflow">
                  <div className="landing-solution-workflow__item is-complete">
                    <span className="landing-solution-workflow__icon">ID</span>
                    <div>
                      <strong>Collect contractor details</strong>
                      <small>Name, role, country, and documents</small>
                    </div>
                    <em />
                  </div>
                  <div className="landing-solution-workflow__dots" />
                  <div className="landing-solution-workflow__item is-pending">
                    <span className="landing-solution-workflow__icon">KYB</span>
                    <div>
                      <strong>Review compliance inputs</strong>
                      <small>Scope, pricing, and legal details</small>
                    </div>
                    <em />
                  </div>
                  <div className="landing-solution-workflow__dots" />
                  <div className="landing-solution-workflow__item is-alert">
                    <span className="landing-solution-workflow__icon">$</span>
                    <div>
                      <strong>Approve payout setup</strong>
                      <small>Currency, cadence, and Wise method</small>
                    </div>
                    <em />
                  </div>
                </div>
              </div>
            </article>

            <article className="landing-solution-card landing-solution-card--top landing-solution-card--voice">
              <div className="landing-solution-card__visual landing-solution-card__visual--voice">
                <div className="landing-solution-call">
                  <div className="landing-solution-call__wave" />
                  <div className="landing-solution-call__button">☎</div>
                  <div className="landing-solution-call__wave is-right" />
                </div>
              </div>
              <div className="landing-solution-card__copy">
                <h3>Follow-up Automation.</h3>
                <p>
                  Keep contractor onboarding moving with reminders for signatures, approvals, and missing details.
                </p>
              </div>
            </article>

            <article className="landing-solution-card landing-solution-card--top landing-solution-card--analytics">
              <div className="landing-solution-card__visual landing-solution-card__visual--analytics">
                <div className="landing-solution-analytics">
                  <div className="landing-solution-analytics__metrics">
                    <div>
                      <small>CONTRACT VALUE</small>
                      <strong>$320,000</strong>
                    </div>
                    <div>
                      <small>PAID</small>
                      <strong>$120,000</strong>
                    </div>
                    <div>
                      <small>DUE</small>
                      <strong>$200,000</strong>
                    </div>
                  </div>
                  <div className="landing-solution-analytics__chart" />
                  <div className="landing-solution-analytics__rows">
                    <span><b>Support</b><i>$2190</i><em /></span>
                    <span><b>Payroll</b><i>$2539</i><em /></span>
                    <span><b>Tools</b><i>$1320</i><em /></span>
                    <span><b>Marketing</b><i>$2450</i><em /></span>
                  </div>
                </div>
              </div>
              <div className="landing-solution-card__copy">
                <h3>Hiring Analytics.</h3>
                <p>
                  Track contract value, payout status, and onboarding progress through one clean operations view.
                </p>
              </div>
            </article>

            <article className="landing-solution-card landing-solution-card--bottom landing-solution-card--agents">
              <div className="landing-solution-card__visual landing-solution-card__visual--agents">
                <div className="landing-solution-people">
                  <div className="landing-solution-people__row">
                    <span className="is-green" />
                    <div className="landing-solution-people__avatar">D</div>
                    <div>
                      <strong>David</strong>
                      <small>Project Manager</small>
                    </div>
                  </div>
                  <div className="landing-solution-people__row">
                    <span className="is-red" />
                    <div className="landing-solution-people__avatar">C</div>
                    <div>
                      <strong>Chris</strong>
                      <small>Social Media Manager</small>
                    </div>
                  </div>
                  <div className="landing-solution-people__row">
                    <span className="is-soft" />
                    <div className="landing-solution-people__avatar">J</div>
                    <div>
                      <strong>Julie</strong>
                      <small>Copywriter</small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="landing-solution-card__copy">
                <h3>Curated Talent Matching.</h3>
                <p>
                  Share the role once and get shortlisted contractor profiles aligned to skills, budget, and timeline.
                </p>
              </div>
            </article>

            <article className="landing-solution-card landing-solution-card--bottom landing-solution-card--suite">
              <div className="landing-solution-card__copy">
                <h3>Operations Workspace.</h3>
                <p>
                  Centralize contracts, documents, invoicing, and onboarding tasks so nothing gets lost across tools.
                </p>
              </div>
              <div className="landing-solution-card__visual landing-solution-card__visual--suite">
                <div className="landing-solution-suite">
                  <div className="landing-solution-suite__top">
                    <strong>Dechub Workspace</strong>
                    <span />
                  </div>
                  <div className="landing-solution-suite__search">Search contractor records...</div>
                  <div className="landing-solution-suite__menu">
                    <span>Contracts</span>
                    <span>Invoices</span>
                    <span>Signatures</span>
                    <span>Compliance</span>
                    <span>Payouts</span>
                    <span>Workers</span>
                  </div>
                </div>
              </div>
            </article>

            <article className="landing-solution-card landing-solution-card--bottom landing-solution-card--portal">
              <div className="landing-solution-card__visual landing-solution-card__visual--portal">
                <div className="landing-solution-portal">
                  <div className="landing-solution-portal__chip">Worker portal</div>
                  <div className="landing-solution-portal__bar" />
                  <div className="landing-solution-portal__bar is-short" />
                </div>
              </div>
              <div className="landing-solution-card__copy">
                <h3>Worker Self-Serve Portal.</h3>
                <p>
                  Let contractors review requests, upload documents, and complete onboarding steps without back-and-forth.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
