import { useEffect, useRef, useState } from 'react';
import './landing.css';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onDemo?: () => void;
}

const NAV_LINKS = [
  { label: 'Solutions', id: 'features' },
  { label: 'How it works', id: 'how-it-works' },
  { label: "Who it's for", id: 'audiences' },
  { label: 'Coverage', id: 'coverage' },
  { label: 'Pricing', id: 'pricing' },
] as const;

const TRUSTED_BRANDS = [
  'coinbase',
  'INTUIT',
  'reddit',
  'Uber',
  'ANTHROPIC',
  'citi',
  'ramp',
  'MUJI',
  'Klarna',
  'DOORDASH',
  'KLM',
  'LUCID',
  'PUMA',
  'Aston Martin',
  'Zillow',
  'LinkedIn',
  'verizon',
] as const;

const TRUSTED_COMPANIES = [
  'Techflow Inc.',
  'BuildAI',
  'Nexus Corp',
  'DataStream',
  'VentureScale',
  'CloudBase',
] as const;

const HERO_SERVICES = [
  'Architecture & Interior Design',
  'Graphic Design',
  'Website Developers',
] as const;

const WORKFLOW_STEPS = [
  {
    number: '1',
    icon: '+',
    title: 'Add a contractor',
    description:
      'Enter their details, choose services, set pay rate and start date. Dechub generates the contract automatically.',
    details: ['Contract generation', 'Service selection', 'Legal templates'],
  },
  {
    number: '2',
    icon: 'Sign',
    title: 'Contractor onboards',
    description:
      'They receive an invite email, complete KYC, add bank details, and sign via DocuSign with a guided setup.',
    details: ['KYC verification', 'DocuSign e-sign', 'Wise / bank setup'],
  },
  {
    number: '3',
    icon: 'Pay',
    title: 'Pay every month',
    description:
      'The contractor submits an invoice. You approve with one click and Wise processes payout in 1-2 business days.',
    details: ['Invoice approval', 'Wise payout', 'Auto receipts'],
  },
] as const;

const FEATURE_CARDS = [
  {
    icon: 'DOC',
    title: 'Smart contract generation',
    description:
      'Legally compliant contractor agreements auto-generated from your inputs. No lawyer needed for standard hires.',
    points: ['Fixed, milestone & hourly contracts', 'IP assignment & NDA clauses', 'Delaware law jurisdiction (US)'],
  },
  {
    icon: 'SIGN',
    title: 'DocuSign e-signature',
    description:
      'Both parties sign electronically via DocuSign. Contractor signs first, then your company countersigns.',
    points: ['Embedded signing with no app download', 'Dual-party signature tracking', 'Instant PDF on completion'],
  },
  {
    icon: 'KYC',
    title: 'KYC identity verification',
    description:
      'Contractor uploads ID plus selfie. Verified within 24 hours. Payments unlock only after approval.',
    points: ['Passport, licence, national ID', 'Liveness check via selfie', 'AES-256 encrypted storage'],
  },
  {
    icon: 'PAY',
    title: 'Wise global payments',
    description:
      'After invoice approval, Wise transfers funds in 1-2 business days in the contractor local currency.',
    points: ['170+ countries supported', 'Zero hidden fees', 'Bank, Wise, or PayPal payout'],
  },
  {
    icon: 'INV',
    title: 'Invoice management',
    description:
      'Contractors submit monthly invoices from their portal. Approve, dispute, or request changes with one click.',
    points: ['Contractor self-service portal', 'Approve or dispute requests', 'PDF receipts auto-generated'],
  },
  {
    icon: 'LAW',
    title: 'Compliance & tax forms',
    description:
      'W-9 and W-8BEN guidance for US engagements. Completion certificates issued at contract end.',
    points: ['W-9 / W-8BEN collection', 'Completion certificate on end', 'Tax calendar & reminders add-on'],
  },
] as const;

const AUDIENCE_CARDS = [
  {
    eyebrow: 'For businesses',
    title: 'Build your remote team. Skip the compliance chaos.',
    description:
      'Onboard contractors across borders, issue contracts in minutes, and trigger payments automatically with no legal or finance ops required.',
    items: [
      'Live dashboard to track every contractor and contract status',
      'Auto-generated compliant contracts ready to sign',
      'One-click invoice approval with instant Wise payout',
      'All documents in one place: contracts, KYC, and invoices',
    ],
    cta: 'Set up your workspace',
    theme: 'business',
  },
  {
    eyebrow: 'For contractors',
    title: 'Do the work you love. Get paid without the wait.',
    description:
      'Accept a project invite, sign digitally, submit your invoice, and receive payment to your local account wherever you are in the world.',
    items: [
      'Email invite to join with no account creation upfront',
      '5-step mobile-first profile and onboarding flow',
      'Raise invoices and watch payment status in real time',
      'Paid in your currency across 170+ countries via Wise',
    ],
    cta: 'Start earning globally',
    theme: 'contractor',
  },
] as const;

const TRACKS = [
  {
    flag: 'US',
    title: 'Track 2 - US Contractors',
    status: 'Live now',
    description:
      'Hire US-based independent contractors from any country. Full contract, KYC, e-sign, and Wise payout pipeline, production ready.',
    points: [
      'USD contracts with DocuSign e-signature',
      'W-9 / W-8BEN tax form guidance',
      'Wise global payout in 1-2 business days',
      'KYC identity verification',
      'Completion certificate at contract end',
    ],
    tone: 'live',
  },
  {
    flag: 'IN',
    title: 'Track 1 - India Payroll',
    status: 'Coming Q3 2026',
    description:
      'Full India statutory payroll with TDS, PF, ESI, and Form 16 for Indian employees hired by foreign companies.',
    points: [
      'INR payroll with TDS deduction',
      'PF & ESI compliance',
      'Form 16 auto-generation',
      'India banking & UPI integration',
    ],
    tone: 'soon',
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      'We hired 3 US contractors in one afternoon. Contract generated, signed the same day, and payment through Wise worked without any issues.',
    initials: 'RK',
    name: 'Ravi Kumar',
    role: 'CEO, BuildAI - Bengaluru',
  },
  {
    quote:
      'As a US contractor working with Indian companies, getting paid was a nightmare. Dechub made it seamless from invoice approval to next-day transfer.',
    initials: 'JS',
    name: 'John Smith',
    role: 'Senior React Developer - Austin, TX',
  },
  {
    quote:
      'We were spending $800 every month on legal work for contractor agreements. Dechub cut that to zero and gave our board far more confidence.',
    initials: 'AP',
    name: 'Anjali Patel',
    role: 'COO, VentureScale - Mumbai',
  },
] as const;

const PRICING_POINTS = [
  'Contract generation & PDF',
  'DocuSign e-signature for both parties',
  'KYC identity verification ($1.50/check)',
  'Invoice management & approval flow',
  'Wise payment processing',
  'AES-256 encrypted document storage',
  'Completion certificate',
] as const;

const FOOTER_COLUMNS = [
  { title: 'Product', items: ['Features', 'How it works', 'Pricing', 'Coverage', "What's new"] },
  { title: 'Company', items: ['About us', 'Blog', 'Careers', 'Press', 'Contact'] },
  { title: 'Resources', items: ['Documentation', 'API reference', 'Hiring guides', 'Support', 'Status'] },
  { title: 'Legal', items: ['Privacy policy', 'Terms of service', 'Cookie policy', 'Compliance'] },
] as const;

function LogoMark() {
  return (
    <div className="landing-logo-mark" aria-hidden="true">
      <span className="landing-logo-cut landing-logo-cut-a" />
      <span className="landing-logo-cut landing-logo-cut-b" />
      <span className="landing-logo-cut landing-logo-cut-c" />
    </div>
  );
}

function HeroScreen() {
  return (
    <div className="landing-hero-screen">
      <div className="landing-screen-wave landing-screen-wave-one" />
      <div className="landing-screen-wave landing-screen-wave-two" />
      <div className="landing-screen-noise" />
      <div className="landing-screen-brand">
        <LogoMark />
        <span>DECHUB</span>
      </div>
    </div>
  );
}

function BrowserPreview() {
  const workers = [
    { name: 'John Smith', track: 'US', role: 'React Dev', status: 'Active', pay: '$5k' },
    { name: 'Sarah Lee', track: 'US', role: 'Designer', status: 'KYC', pay: '$3k' },
    { name: 'Mike Torres', track: 'US', role: 'PM', status: 'Invited', pay: '$4k' },
  ] as const;

  return (
    <div className="landing-browser">
      <div className="landing-browser-bar">
        <div className="landing-browser-dots">
          <span />
          <span />
          <span />
        </div>
        <div className="landing-browser-url">app.dechub.in/dashboard</div>
      </div>
      <div className="landing-browser-body">
        <aside className="landing-browser-sidebar">
          <div className="landing-browser-group">MAIN</div>
          {['Dashboard', 'Workers', 'Contracts', 'Invoices'].map((item) => (
            <div key={item} className={`landing-browser-item${item === 'Dashboard' ? ' is-active' : ''}`}>
              <span className="landing-browser-dot" />
              {item}
            </div>
          ))}
          <div className="landing-browser-group landing-browser-group-gap">OTHER</div>
          {['Documents', 'Settings'].map((item) => (
            <div key={item} className="landing-browser-item">
              <span className="landing-browser-dot" />
              {item}
            </div>
          ))}
        </aside>
        <div className="landing-browser-main">
          <div className="landing-browser-stats">
            <div>
              <strong>12</strong>
              <span>ACTIVE WORKERS</span>
            </div>
            <div>
              <strong>3</strong>
              <span>PENDING INVOICES</span>
            </div>
            <div>
              <strong>May 31</strong>
              <span>NEXT PAYROLL</span>
            </div>
            <div>
              <strong>$36k</strong>
              <span>MONTHLY COST</span>
            </div>
          </div>
          <div className="landing-browser-table">
            <div className="landing-browser-head">
              <span>Worker</span>
              <span>Track</span>
              <span>Role</span>
              <span>Status</span>
              <span>Pay</span>
            </div>
            {workers.map((worker) => (
              <div key={worker.name} className="landing-browser-row">
                <span>{worker.name}</span>
                <span>{worker.track}</span>
                <span>{worker.role}</span>
                <span className={`landing-browser-badge landing-browser-badge-${worker.status.toLowerCase()}`}>
                  {worker.status}
                </span>
                <span>{worker.pay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricWall() {
  return (
    <div className="landing-metric-shell">
      <div className="landing-metric-header">
        <h2>One Modern Experience For Today&apos;s Workforce</h2>
      </div>
      <div className="landing-metric-grid">
        {[
          ['170+', 'Countries where your contractors can receive payments'],
          ['24hr', 'Average KYC verification turn around time'],
          ['$0', 'Setup fee - pay only $49 per active worker per month'],
          ['1-2d', 'Payment delivery via Wise after invoice approval'],
        ].map(([value, label]) => (
          <div key={value} className="landing-metric-card">
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="landing-team-photo">
        <div className="landing-team-panel landing-team-panel-a" />
        <div className="landing-team-panel landing-team-panel-b" />
        <div className="landing-team-panel landing-team-panel-c" />
        <div className="landing-team-people">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className={`landing-team-person landing-team-person-${index + 1}`} />
          ))}
        </div>
      </div>
      <div className="landing-metric-lower">
        <div className="landing-note-card">
          <p>
            <strong>Built on in-house infrastructure,</strong> with single payroll engines, owned entities,
            and more.
          </p>
          <button type="button">Learn more</button>
        </div>
        <div className="landing-chip-cloud">
          {[
            'Endpoint Protection',
            'PEO',
            'Engage',
            'EOR',
            'Device Lifecycle Management',
            'Deel Benefits',
            'Deel Mobility',
            'HRIS',
            'Mobile Device Management',
            'Talent',
            'Background Checks',
            'Access Management',
            'Equity Consulting',
            'Workforce Planning',
            'Contractor',
            'Compensation',
            'Deel Payroll',
            'Entity Setup & Management',
            'ATS',
          ].map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContractorCards() {
  const profiles = [
    ['Sarah Jones', 'Marketing Director'],
    ['Diane Moore', 'Project Manager'],
    ['Alex Smith', 'CEO'],
  ] as const;

  return (
    <div className="landing-profile-strip">
      {profiles.map(([name, role], index) => (
        <div key={name} className="landing-profile-card">
          <div className={`landing-profile-avatar landing-profile-avatar-${index + 1}`} />
          <strong>{name}</strong>
          <span>{role}</span>
          <p>
            {index === 0 && 'This product has exceeded our expectations. The quality and performance are outstanding.'}
            {index === 1 && 'Excellent service and fantastic results. We are very satisfied with our experience.'}
            {index === 2 && 'A game changer for our business. I highly recommend this to anyone.'}
          </p>
        </div>
      ))}
    </div>
  );
}

function VideoCaseStudy({ onDemo }: { onDemo?: () => void }) {
  return (
    <div className="landing-video-section">
      <div className="landing-video-copy">
        <div>
          <span className="landing-section-kicker">Testimonials</span>
          <h2>Our Customer Reviews</h2>
        </div>
        <p>Discover the insights from customers regarding their experiences with Deel.</p>
      </div>
      <div className="landing-video-carousel">
        <div className="landing-video-side" />
        <div className="landing-video-main">
          <button type="button" className="landing-video-play" aria-label="Play review">
            <span />
          </button>
          <div className="landing-video-film-strip" />
          <div className="landing-video-person" />
        </div>
        <div className="landing-video-side landing-video-side-right" />
      </div>
      <div className="landing-video-footer">
        <div className="landing-video-story">
          <strong>Revolut</strong>
          <p>See how the Revolut team has hired 150+ workers and relocated 10+ people through Deel.</p>
          <div className="landing-video-dots">
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} className={index === 0 ? 'is-active' : ''} />
            ))}
          </div>
        </div>
        <button type="button" className="landing-video-cta" onClick={onDemo ?? (() => undefined)}>
          Learn more
        </button>
        <p className="landing-video-sidecopy">
          By embedding Dechub into their payment flow, teams can create the perfect product experience.
        </p>
      </div>
    </div>
  );
}

export default function LandingPage({ onLogin, onGetStarted, onDemo }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          }
        });
      },
      { threshold: 0.12 },
    );

    revealRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  const attachReveal = (index: number) => (element: HTMLElement | null) => {
    revealRefs.current[index] = element;
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMenuOpen(false);
  };

  return (
    <div className="landing-root">
      <nav className={`landing-nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="landing-shell landing-nav-shell">
          <button type="button" className="landing-brand" onClick={() => scrollToSection('top')}>
            <LogoMark />
            <span>DECHUB</span>
          </button>

          <div className="landing-nav-links">
            {NAV_LINKS.map((link) => (
              <button key={link.id} type="button" onClick={() => scrollToSection(link.id)}>
                {link.label}
              </button>
            ))}
          </div>

          <div className="landing-nav-actions">
            <button type="button" className="landing-nav-login" onClick={onLogin}>
              Login
            </button>
            <button type="button" className="landing-pill-button" onClick={onGetStarted}>
              Get Started for free
            </button>
            <button
              type="button"
              className={`landing-menu-toggle${menuOpen ? ' is-open' : ''}`}
              aria-label="Toggle navigation menu"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="landing-mobile-menu">
            {NAV_LINKS.map((link) => (
              <button key={link.id} type="button" onClick={() => scrollToSection(link.id)}>
                {link.label}
              </button>
            ))}
            <button type="button" className="landing-mobile-login" onClick={onLogin}>
              Login
            </button>
            <button type="button" className="landing-pill-button" onClick={onGetStarted}>
              Get Started for free
            </button>
          </div>
        )}
      </nav>

      <main className="landing-main" id="top">
        <section className="landing-hero">
          <div className="landing-hero-aurora" />
          <div className="landing-shell landing-hero-layout">
            <div className="landing-hero-copy">
              <div className="landing-live-pill">Now live - Track 2 US contractors</div>
              <h1>
                Hire, Pay &amp; Manage <span>Global contractors</span> without the chaos.
              </h1>
              <p>
                Dechub is the all-in-one platform to onboard US contractors, generate contracts,
                collect e-signatures, and process payments via Wise from one dashboard.
              </p>

              <div className="landing-hero-search">
                <input type="text" value="Search for any service..." readOnly aria-label="Search services" />
                <button type="button" aria-label="Search services">
                  <span />
                </button>
              </div>

              <div className="landing-service-pills">
                {HERO_SERVICES.map((service) => (
                  <span key={service}>{service}</span>
                ))}
              </div>

              <button type="button" className="landing-hero-primary" onClick={onGetStarted}>
                Start hiring for free
              </button>
            </div>

            <div className="landing-hero-media">
              <div className="landing-hero-pedestal">
                <div className="landing-hero-rock landing-hero-rock-left" />
                <div className="landing-hero-rock landing-hero-rock-center" />
                <div className="landing-hero-rock landing-hero-rock-right" />
              </div>
              <div className="landing-laptop-base" />
              <div className="landing-laptop-shadow" />
              <div className="landing-laptop-frame">
                <HeroScreen />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-brands landing-reveal" ref={attachReveal(0)}>
          <div className="landing-shell">
            <p className="landing-trust-copy">TRUSTED BY 40,000+ COMPANIES FROM STARTUPS TO ENTERPRISE</p>
            <div className="landing-brand-grid">
              {TRUSTED_BRANDS.map((brand) => (
                <span key={brand}>{brand}</span>
              ))}
            </div>
            <button type="button" className="landing-story-button" onClick={() => scrollToSection('reviews')}>
              <span>175 STORIES</span>
              Read about real results
            </button>

            <BrowserPreview />

            <div className="landing-company-strip">
              <p>Trusted by companies hiring global talent</p>
              <div>
                {TRUSTED_COMPANIES.map((company) => (
                  <span key={company}>{company}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-metrics landing-reveal" ref={attachReveal(1)}>
          <div className="landing-shell">
            <MetricWall />
          </div>
        </section>

        <section id="how-it-works" className="landing-how landing-reveal" ref={attachReveal(2)}>
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-centered">
              <span className="landing-section-kicker">How it works</span>
              <h2>Hire a global contractor in under 10 minutes</h2>
              <p>No lawyers, no paperwork, no back-and-forth. Dechub handles the entire lifecycle.</p>
            </div>

            <div className="landing-how-grid">
              {WORKFLOW_STEPS.map((step) => (
                <article key={step.number} className="landing-how-card">
                  <div className="landing-how-step">{step.number}</div>
                  <div className="landing-how-icon">{step.icon}</div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <div className="landing-how-details">
                    {step.details.map((detail) => (
                      <span key={detail}>{detail}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="landing-features landing-reveal" ref={attachReveal(3)}>
          <div className="landing-shell">
            <div className="landing-section-heading">
              <span className="landing-section-kicker landing-section-kicker-light">Platform features</span>
              <h2>Everything you need to run a global team</h2>
              <p>
                One platform replaces 6+ tools: contracts, e-sign, KYC, payments, documents, and
                compliance.
              </p>
            </div>

            <div className="landing-feature-grid">
              {FEATURE_CARDS.map((feature) => (
                <article key={feature.title} className="landing-feature-card">
                  <div className={`landing-feature-icon landing-feature-icon-${feature.icon.toLowerCase()}`}>
                    {feature.icon}
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                  <ul>
                    {feature.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="audiences" className="landing-audiences landing-reveal" ref={attachReveal(4)}>
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-centered landing-section-tight">
              <span className="landing-section-kicker">Built for both sides</span>
              <h2>Two roles. One seamless system.</h2>
              <p>
                Dechub bridges the gap between the businesses that hire and the professionals who
                deliver with no back-and-forth and no paperwork pile-ups.
              </p>
            </div>

            <div className="landing-audience-grid">
              {AUDIENCE_CARDS.map((card) => (
                <article
                  key={card.title}
                  className={`landing-audience-card landing-audience-card-${card.theme}`}
                >
                  <span className="landing-audience-pill">{card.eyebrow}</span>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <ul>
                    {card.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <button type="button" onClick={onGetStarted}>
                    {card.cta}
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-partner landing-reveal" ref={attachReveal(5)}>
          <div className="landing-shell">
            <div className="landing-partner-banner">
              <div className="landing-partner-copy">
                <h2>Your global hiring partner for India and the US</h2>
                <ul>
                  <li>Hire verified talent across India and the US</li>
                  <li>Manage contracts, onboarding, and payments in one place</li>
                  <li>Build remote teams faster with secure workforce solutions</li>
                </ul>
                <button type="button" onClick={onGetStarted}>
                  Get Started Free
                </button>
                <div className="landing-guarantee">100% money-back guarantee</div>
              </div>
              <ContractorCards />
            </div>
          </div>
        </section>

        <section id="coverage" className="landing-coverage landing-reveal" ref={attachReveal(6)}>
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-centered">
              <span className="landing-section-kicker landing-section-kicker-light">Coverage</span>
              <h2>Global hiring, phased rollout</h2>
              <p>Starting with US contractors, expanding to India payroll in Q3 2026.</p>
            </div>

            <div className="landing-track-grid">
              {TRACKS.map((track) => (
                <article key={track.title} className={`landing-track-card landing-track-card-${track.tone}`}>
                  <div className="landing-track-flag">{track.flag}</div>
                  <h3>{track.title}</h3>
                  <span className="landing-track-status">{track.status}</span>
                  <p>{track.description}</p>
                  <ul>
                    {track.points.map((point) => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reviews" className="landing-reviews landing-reveal" ref={attachReveal(7)}>
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-centered">
              <span className="landing-section-kicker">What people say</span>
              <h2>Loved by companies &amp; contractors</h2>
            </div>

            <div className="landing-review-grid">
              {TESTIMONIALS.map((testimonial) => (
                <article key={testimonial.name} className="landing-review-card">
                  <div className="landing-stars">{'*****'}</div>
                  <p>&quot;{testimonial.quote}&quot;</p>
                  <div className="landing-review-author">
                    <span>{testimonial.initials}</span>
                    <div>
                      <strong>{testimonial.name}</strong>
                      <small>{testimonial.role}</small>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-case-study landing-reveal" ref={attachReveal(8)}>
          <div className="landing-shell">
            <VideoCaseStudy onDemo={onDemo} />
          </div>
        </section>

        <section id="pricing" className="landing-pricing landing-reveal" ref={attachReveal(9)}>
          <div className="landing-shell">
            <div className="landing-section-heading landing-section-heading-centered">
              <span className="landing-section-kicker landing-section-kicker-light">Simple pricing</span>
              <h2>One price. No surprises.</h2>
              <p>Pay per active worker. No setup fee, no annual commitment, and no hidden charges.</p>
            </div>

            <div className="landing-pricing-card">
              <div className="landing-price">
                <strong>$49</strong>
                <span>/worker/month</span>
              </div>
              <p>Billed monthly per active worker. Add or remove workers anytime.</p>
              <ul>
                {PRICING_POINTS.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <button type="button" onClick={onGetStarted}>
                Start free - first contractor on us
              </button>
              <small>Optional add-ons: Compliance advisory +$5/mo, HRMS +$5/mo (coming soon)</small>
            </div>
          </div>
        </section>

        <section className="landing-final-cta landing-reveal" ref={attachReveal(10)}>
          <div className="landing-shell">
            <div className="landing-final-cta-card">
              <h2>Ready to hire your first global contractor?</h2>
              <p>Join companies hiring smarter with Dechub. Set up in 10 minutes, no credit card required.</p>
              <div className="landing-final-cta-actions">
                <button type="button" className="landing-final-primary" onClick={onGetStarted}>
                  Get started for free
                </button>
                <button type="button" className="landing-final-secondary" onClick={onDemo ?? (() => undefined)}>
                  Book a demo
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-shell">
          <div className="landing-footer-top">
            <div className="landing-footer-brand">
              <div className="landing-brand landing-brand-footer">
                <LogoMark />
                <span>DECHUB</span>
              </div>
              <p>Global HR, payroll &amp; contractor management. Built in Bengaluru, used worldwide.</p>
              <div className="landing-footer-socials">
                <button type="button" aria-label="Twitter">
                  X
                </button>
                <button type="button" aria-label="LinkedIn">
                  in
                </button>
                <button type="button" aria-label="Share">
                  ~
                </button>
              </div>
            </div>

            {FOOTER_COLUMNS.map((column) => (
              <div key={column.title} className="landing-footer-column">
                <h3>{column.title}</h3>
                {column.items.map((item) => (
                  <button key={item} type="button">
                    {item}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="landing-footer-bottom">
            <span>(c) 2026 Dechub Pvt. Ltd. - Bengaluru, India</span>
            <div>
              <button type="button">Privacy</button>
              <button type="button">Terms</button>
              <button type="button">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
