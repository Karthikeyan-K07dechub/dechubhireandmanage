import { useEffect, useRef, useState } from 'react';
import './landing.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LandingPageProps {
  onGetStarted: () => void;
  onDemo?:      () => void;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📄',
    color: 'rgba(37,99,235,0.12)',
    title: 'Smart contract generation',
    desc:  'Legally compliant contractor agreements auto-generated from your inputs. No lawyer needed for standard hires.',
    items: ['Fixed, milestone & hourly contracts', 'IP assignment & NDA clauses', 'Delaware law jurisdiction (US)'],
  },
  {
    icon: '✍️',
    color: 'rgba(0,201,167,0.12)',
    title: 'DocuSign e-signature',
    desc:  'Both parties sign electronically via DocuSign. Contractor signs first, then your company countersigns.',
    items: ['Embedded signing — no app download', 'Dual-party signature tracking', 'Instant PDF on completion'],
  },
  {
    icon: '🪪',
    color: 'rgba(245,158,11,0.12)',
    title: 'KYC identity verification',
    desc:  'Contractor uploads ID + selfie. Verified within 24 hours. Payments unlock only after approval.',
    items: ['Passport, license, national ID', 'Liveness check via selfie', 'AES-256 encrypted storage'],
  },
  {
    icon: '💸',
    color: 'rgba(16,185,129,0.12)',
    title: 'Wise global payments',
    desc:  "After invoice approval, Wise transfers funds in 1–2 business days in the contractor's local currency.",
    items: ['170+ countries supported', 'Zero hidden fees', 'Bank, Wise, or PayPal payout'],
  },
  {
    icon: '🧾',
    color: 'rgba(124,58,237,0.12)',
    title: 'Invoice management',
    desc:  'Contractors submit monthly invoices from their portal. Approve or dispute with one click.',
    items: ['Contractor self-service portal', 'Approve, dispute, or request changes', 'PDF receipts auto-generated'],
  },
  {
    icon: '⚖️',
    color: 'rgba(239,68,68,0.12)',
    title: 'Compliance & tax forms',
    desc:  'W-9 and W-8BEN guidance for US engagements. Completion certificates issued at contract end.',
    items: ['W-9 / W-8BEN guided collection', 'Completion certificate on end', 'Tax calendar & reminders (add-on)'],
  },
] as const;

const TESTIMONIALS = [
  {
    text:     '"We hired 3 US contractors in one afternoon. Contract generated, signed via DocuSign same day, payment through Wise without any issues."',
    initials: 'RK',
    gradient: 'linear-gradient(135deg,#7c3aed,#6366f1)',
    name:     'Ravi Kumar',
    role:     'CEO, BuildAI · Bengaluru',
  },
  {
    text:     '"As a US contractor working with Indian companies, getting paid was a nightmare. Dechub made it seamless — invoice approved, Wise transfer next day."',
    initials: 'JS',
    gradient: 'linear-gradient(135deg,#5b21b6,#7c3aed)',
    name:     'John Smith',
    role:     'Senior React Developer · Austin, TX',
  },
  {
    text:     '"We were spending $800/month on legal fees for contractor agreements. Dechub cut that to zero and gave our board the compliance confidence they needed."',
    initials: 'AP',
    gradient: 'linear-gradient(135deg,#4c1d95,#6d28d9)',
    name:     'Anjali Patel',
    role:     'COO, VentureScale · Mumbai',
  },
] as const;

const PRICE_INCLUDES = [
  'Contract generation & PDF',
  'DocuSign e-signature (both parties)',
  'KYC identity verification ($1.50/check)',
  'Invoice management & approval flow',
  'Wise payment processing',
  'AES-256 encrypted document storage',
  'Completion certificate',
] as const;

const NAV_LINKS = [
  { label: 'Solutions',    id: 'features' },
  { label: 'How it works', id: 'how'      },
  { label: "Who it's for", id: 'who'      },
  { label: 'Coverage',     id: 'tracks'   },
  { label: 'Pricing',      id: 'pricing'  },
] as const;

// ─── Logo mark ────────────────────────────────────────────────────────────────

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      className="lp-logo-mark"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <svg
        viewBox="0 0 24 24"
        style={{ width: size * 0.55, height: size * 0.55, fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round' }}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

// ─── Dashboard preview — light theme ─────────────────────────────────────────

function DashboardPreview() {
  const rows = [
    { name: 'John Smith',  track: '🇺🇸 US', role: 'React Dev', badge: 'active',  pay: '$5k' },
    { name: 'Sarah Lee',   track: '🇺🇸 US', role: 'Designer',  badge: 'pending', pay: '$3k' },
    { name: 'Mike Torres', track: '🇺🇸 US', role: 'PM',        badge: 'invited', pay: '$4k' },
  ] as const;

  const badgeClass: Record<string, string> = {
    active:  'lp-preview-badge lp-preview-badge-active',
    pending: 'lp-preview-badge lp-preview-badge-pending',
    invited: 'lp-preview-badge lp-preview-badge-invited',
  };
  const badgeLabel: Record<string, string> = { active: 'Active', pending: 'KYC', invited: 'Invited' };

  return (
    <div className="lp-preview">
      {/* Window chrome */}
      <div className="lp-preview-topbar">
        <div className="lp-preview-dots">
          <div className="lp-preview-dot" style={{ background: '#ff5f57' }} />
          <div className="lp-preview-dot" style={{ background: '#febc2e' }} />
          <div className="lp-preview-dot" style={{ background: '#28c840' }} />
        </div>
        <div className="lp-preview-url">app.dechub.in/dashboard</div>
      </div>

      {/* Body */}
      <div className="lp-preview-body">
        {/* Sidebar */}
        <div className="lp-preview-sidebar">
          <div style={{ marginBottom: 18 }}>
            <div className="lp-preview-nav-group-label">Main</div>
            {(['Dashboard', 'Workers', 'Contracts', 'Invoices'] as const).map((item) => (
              <div key={item} className={`lp-preview-nav-item ${item === 'Dashboard' ? 'active' : ''}`}>
                <div className="lp-preview-nav-dot" />
                {item}
              </div>
            ))}
          </div>
          <div>
            <div className="lp-preview-nav-group-label">Other</div>
            {(['Documents', 'Settings'] as const).map((item) => (
              <div key={item} className="lp-preview-nav-item">
                <div className="lp-preview-nav-dot" />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="lp-preview-main">
          {/* Stats */}
          <div className="lp-preview-stats">
            {[
              { val: '12',     color: '#7c3aed', label: 'Active workers'   },
              { val: '3',      color: '#0f172a', label: 'Pending invoices' },
              { val: 'May 31', color: '#0f172a', label: 'Next payroll'     },
              { val: '$36k',   color: '#0f172a', label: 'Monthly cost'     },
            ].map(({ val, color, label }) => (
              <div key={label} className="lp-preview-stat">
                <div className="lp-preview-stat-val" style={{ color }}>{val}</div>
                <div className="lp-preview-stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="lp-preview-table-head">
            <span>Worker</span><span>Track</span><span>Role</span><span>Status</span><span>Pay</span>
          </div>
          {rows.map((row) => (
            <div key={row.name} className="lp-preview-table-row">
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{row.name}</span>
              <span style={{ fontSize: 10, color: '#94a3b8' }}>{row.track}</span>
              <span style={{ color: '#64748b', fontSize: 10.5 }}>{row.role}</span>
              <span><div className={badgeClass[row.badge]}>{badgeLabel[row.badge]}</div></span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: row.badge === 'invited' ? '#94a3b8' : '#7c3aed' }}>
                {row.pay}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LandingPage({ onGetStarted, onDemo }: LandingPageProps) {
  const [scrolled,      setScrolled]      = useState(false);
  const [mobileMenuOpen,setMobileMenuOpen]= useState(false);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('lp-visible'); }),
      { threshold: 0.1 },
    );
    revealRefs.current.forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const addReveal = (index: number) => (el: HTMLElement | null) => { revealRefs.current[index] = el; };
  const scrollTo  = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="lp-root">

      {/* ══ NAVBAR ══════════════════════════════════════════════════════════ */}
      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-container">
          <div className="lp-nav-inner">
            <div className="lp-logo">
              <LogoMark size={32} />
              Dechub
            </div>

            <div className="lp-nav-links">
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} className="lp-nav-link" onClick={() => scrollTo(id)}>{label}</button>
              ))}
            </div>

            <div className="lp-nav-actions">
              <button className="lp-btn-ghost" onClick={onGetStarted}>Login</button>
              <button className="lp-btn-primary" onClick={onGetStarted} style={{ fontSize: 13.5, padding: '10px 20px' }}>
                Get Started for free
              </button>
              <button
                className="lp-hamburger"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label="Toggle menu"
              >
                <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, transition: 'all .3s', transform: mobileMenuOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
                <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, transition: 'opacity .2s', opacity: mobileMenuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: 22, height: 2, background: '#0f172a', borderRadius: 2, transition: 'all .3s', transform: mobileMenuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="lp-mobile-menu">
              {NAV_LINKS.map(({ label, id }) => (
                <button key={id} className="lp-mobile-menu-link" onClick={() => scrollTo(id)}>{label}</button>
              ))}
              <div className="lp-mobile-menu-actions">
                <button className="lp-btn-primary" onClick={() => { onGetStarted(); setMobileMenuOpen(false); }} style={{ width: '100%', justifyContent: 'center' }}>
                  Get started free
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ══ HERO ════════════════════════════════════════════════════════════ */}
      <section id="hero" className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow" />
          <div className="lp-hero-glow2" />
        </div>
        <div className="lp-container" style={{ width: '100%' }}>
          <div className="lp-hero-content">
            <div className="lp-hero-tag">
              <span className="lp-tag">🌏 Now live — Track 2 US contractors</span>
            </div>
            <h1 className="lp-hero-title">
              Hire, pay &amp; manage<br />
              <span className="lp-hero-title-accent">global contractors</span><br />
              without the chaos.
            </h1>
            <p className="lp-hero-sub">
              Dechub is the all-in-one platform to onboard US contractors, generate contracts,
              collect e-signatures, and process payments via Wise — all from one dashboard.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-primary" onClick={onGetStarted} style={{ fontSize: 15, padding: '15px 30px' }}>
                Start hiring for free →
              </button>
              <button className="lp-btn-outline" onClick={() => scrollTo('how')}>
                See how it works
              </button>
            </div>
            <div className="lp-hero-note">
              <svg viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              No credit card · No setup fee · Cancel anytime
            </div>
          </div>
          <DashboardPreview />
        </div>
      </section>

      {/* ══ LOGOS ═══════════════════════════════════════════════════════════ */}
      <section className="lp-logos">
        <div className="lp-container">
          <div className="lp-logos-label">Trusted by companies hiring global talent</div>
          <div className="lp-logos-track">
            {['Techflow Inc.', 'BuildAI', 'Nexus Corp', 'DataStream', 'VentureScale', 'CloudBase'].map((name) => (
              <div key={name} className="lp-logo-item">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ STATS ═══════════════════════════════════════════════════════════ */}
      <section className="lp-stats">
        <div className="lp-container">
          <div className="lp-stats-grid lp-reveal" ref={addReveal(0)}>
            {[
              { num: ['170', '+'],  desc: 'Countries where your contractors can receive payments' },
              { num: ['24',  'hr'], desc: 'Average KYC verification turnaround time' },
              { num: ['$',   '0'],  desc: 'Setup fee — pay only $49 per active worker per month', dollar: true },
              { num: ['1–2', 'd'],  desc: 'Payment delivery via Wise after invoice approval' },
            ].map(({ num, desc, dollar }, i) => (
              <div key={i} className="lp-stat-item">
                <div className="lp-stat-number">
                  {dollar
                    ? <><span className="lp-stat-accent">{num[0]}</span>{num[1]}</>
                    : <>{num[0]}<span className="lp-stat-accent">{num[1]}</span></>
                  }
                </div>
                <div className="lp-stat-desc">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
      <section id="how" className="lp-how">
        <div className="lp-container">
          <div className="lp-how-header lp-reveal" ref={addReveal(1)}>
            <div className="lp-section-label">How it works</div>
            <h2 className="lp-section-title">Hire a global contractor<br />in under 10 minutes</h2>
            <p className="lp-section-sub">No lawyers, no paperwork, no back-and-forth. Dechub handles the entire lifecycle.</p>
          </div>
          <div className="lp-steps lp-reveal" ref={addReveal(2)}>
            {[
              { num: '1', icon: '➕', title: 'Add a contractor',
                desc: 'Enter their details, choose services, set pay rate and start date. Dechub generates the contract automatically.',
                chips: ['Contract generation', 'Service selection', 'Legal templates'] },
              { num: '2', icon: '✍️', title: 'Contractor onboards',
                desc: 'They receive an invite email, complete KYC, add bank details, and sign via DocuSign — fully guided.',
                chips: ['KYC verification', 'DocuSign e-sign', 'Wise / bank setup'] },
              { num: '3', icon: '💸', title: 'Pay every month',
                desc: 'Contractor submits an invoice. You approve with one click. Wise processes payment in 1–2 business days.',
                chips: ['Invoice approval', 'Wise payout', 'Auto receipts'] },
            ].map(({ num, icon, title, desc, chips }) => (
              <div key={num} className="lp-step">
                <div className="lp-step-num">{num}</div>
                <div className="lp-step-icon">{icon}</div>
                <div className="lp-step-title">{title}</div>
                <div className="lp-step-desc">{desc}</div>
                <div className="lp-step-chips">
                  {chips.map((c) => <span key={c} className="lp-step-chip">{c}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ════════════════════════════════════════════════════════ */}
      <section id="features" className="lp-features">
        <div className="lp-container">
          <div className="lp-features-header lp-reveal" ref={addReveal(3)}>
            <div className="lp-section-label">Platform features</div>
            <h2 className="lp-features-title">Everything you need to run a global team</h2>
            <p className="lp-features-sub">
              One platform replaces 6+ tools — contracts, e-sign, KYC, payments, documents, and compliance.
            </p>
          </div>
          <div className="lp-features-grid lp-reveal" ref={addReveal(4)}>
            {FEATURES.map(({ icon, color, title, desc, items }) => (
              <div key={title} className="lp-feature-card">
                <div className="lp-feature-icon-wrap" style={{ background: color }}>{icon}</div>
                <div className="lp-feature-title">{title}</div>
                <div className="lp-feature-desc">{desc}</div>
                <div className="lp-feature-items">
                  {items.map((item) => <div key={item} className="lp-feature-item">{item}</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHO IT'S FOR ════════════════════════════════════════════════════ */}
      <section id="who" className="lp-who">
        <div className="lp-container">
          <div className="lp-who-header lp-reveal" ref={addReveal(5)}>
            <div className="lp-section-label">Who it's for</div>
            <h2 className="lp-section-title">One platform. Two sides.</h2>
            <p className="lp-section-sub">Works for both the company hiring and the contractor being hired.</p>
          </div>
          <div className="lp-who-grid lp-reveal" ref={addReveal(6)}>
            {/* Company card — purple gradient */}
            <div className="lp-who-card lp-who-card-company">
              <div className="lp-who-glow lp-who-glow-purple" />
              <div className="lp-who-tag lp-who-tag-company">For companies</div>
              <div className="lp-who-title">You hire the talent.<br />We handle everything else.</div>
              <div className="lp-who-desc">
                Add US contractors, generate compliant contracts, approve invoices, and run payroll
                — all without a single spreadsheet or legal call.
              </div>
              <div className="lp-who-features">
                {[
                  ['🏢', 'Company dashboard with real-time worker overview'],
                  ['📋', 'Full contract lifecycle management'],
                  ['✅', 'One-click invoice approval and Wise payment trigger'],
                  ['📁', 'Centralised document storage — contracts, invoices, KYC'],
                ].map(([icon, text]) => (
                  <div key={text as string} className="lp-who-feature">
                    <div className="lp-who-feature-icon lp-who-feature-icon-company">{icon}</div>
                    {text}
                  </div>
                ))}
              </div>
              <button className="lp-btn-who-company" onClick={onGetStarted}>
                Start as a company →
              </button>
            </div>

            {/* Contractor card — white */}
            <div className="lp-who-card lp-who-card-contractor">
              <div className="lp-who-glow lp-who-glow-soft" />
              <div className="lp-who-tag lp-who-tag-contractor">For contractors</div>
              <div className="lp-who-title lp-who-title-dark">Get paid globally.<br />No banking headaches.</div>
              <div className="lp-who-desc lp-who-desc-dark">
                Accept invitations, complete your profile, sign your contract, and receive payments
                directly to your Wise account — from anywhere in the world.
              </div>
              <div className="lp-who-features">
                {[
                  ['📧', 'Accept invite via email — no cold signup needed'],
                  ['📱', 'Mobile-friendly 5-step onboarding'],
                  ['💰', 'Submit invoices and track payment status live'],
                  ['🌍', 'Receive in local currency — 170+ countries'],
                ].map(([icon, text]) => (
                  <div key={text as string} className="lp-who-feature lp-who-feature-dark">
                    <div className="lp-who-feature-icon lp-who-feature-icon-contractor">{icon}</div>
                    {text}
                  </div>
                ))}
              </div>
              <button className="lp-btn-who-contractor" onClick={onGetStarted}>
                Get started free →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRACKS ══════════════════════════════════════════════════════════ */}
      <section id="tracks" className="lp-tracks">
        <div className="lp-container">
          <div className="lp-tracks-header lp-reveal" ref={addReveal(7)}>
            <div className="lp-section-label">Coverage</div>
            <h2 className="lp-section-title">Global hiring, phased rollout</h2>
            <p className="lp-section-sub">Starting with US contractors, expanding to India payroll in Q3 2026.</p>
          </div>
          <div className="lp-tracks-grid lp-reveal" ref={addReveal(8)}>
            {/* US — purple */}
            <div className="lp-track-card lp-track-card-us">
              <div className="lp-track-flag">🇺🇸</div>
              <div className="lp-track-title">Track 2 — US Contractors</div>
              <div className="lp-track-status lp-track-status-live">Live now</div>
              <div className="lp-track-desc">
                Hire US-based independent contractors from any country. Full contract, KYC,
                e-sign, and Wise payout pipeline — production ready.
              </div>
              <div className="lp-track-features">
                {['USD contracts with DocuSign e-signature', 'W-9 / W-8BEN tax form guidance', 'Wise global payout in 1–2 business days', 'KYC identity verification', 'Completion certificate at contract end'].map((f) => (
                  <div key={f} className="lp-track-feature lp-track-feature-us">{f}</div>
                ))}
              </div>
            </div>
            {/* India — white */}
            <div className="lp-track-card lp-track-card-in">
              <div className="lp-track-flag">🇮🇳</div>
              <div className="lp-track-title lp-track-title-dark">Track 1 — India Payroll</div>
              <div className="lp-track-status lp-track-status-soon">Coming Q3 2026</div>
              <div className="lp-track-desc lp-track-desc-dark">
                Full India statutory payroll with TDS, PF, ESI, and Form 16.
                For Indian employees hired by foreign companies.
              </div>
              <div className="lp-track-features">
                {['INR payroll with TDS deduction', 'PF & ESI compliance', 'Form 16 auto-generation', 'India banking & UPI integration'].map((f) => (
                  <div key={f} className="lp-track-feature lp-track-feature-in">{f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ════════════════════════════════════════════════════ */}
      <section className="lp-testimonials">
        <div className="lp-container">
          <div className="lp-testimonials-header lp-reveal" ref={addReveal(9)}>
            <div className="lp-section-label">What people say</div>
            <h2 className="lp-section-title">Loved by companies &amp; contractors</h2>
          </div>
          <div className="lp-testimonials-grid lp-reveal" ref={addReveal(10)}>
            {TESTIMONIALS.map(({ text, initials, gradient, name, role }) => (
              <div key={name} className="lp-testimonial-card">
                <div className="lp-stars">{'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}</div>
                <div className="lp-testimonial-text">{text}</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: gradient }}>{initials}</div>
                  <div>
                    <div className="lp-testimonial-name">{name}</div>
                    <div className="lp-testimonial-role">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═════════════════════════════════════════════════════════ */}
      <section id="pricing" className="lp-pricing">
        <div className="lp-container">
          <div className="lp-pricing-header lp-reveal" ref={addReveal(11)}>
            <div className="lp-section-label lp-section-label-light">Simple pricing</div>
            <h2 className="lp-section-title lp-section-title-white">One price. No surprises.</h2>
            <p className="lp-section-sub lp-section-sub-white">Pay per active worker. No setup fee, no annual commitment, no hidden charges.</p>
          </div>
          <div className="lp-pricing-card lp-reveal" ref={addReveal(12)}>
            <div className="lp-price"><sup>$</sup>49<span className="lp-price-period">/worker/month</span></div>
            <div className="lp-price-desc">Billed monthly per active worker. Add or remove workers anytime.</div>
            <div className="lp-price-includes">
              {PRICE_INCLUDES.map((item) => (
                <div key={item} className="lp-price-include">{item}</div>
              ))}
            </div>
            <button className="lp-btn-pricing" onClick={onGetStarted}>
              Start free — first contractor on us →
            </button>
            <div className="lp-price-note">
              Optional add-ons: Compliance advisory +$5/mo · HRMS +$5/mo (coming soon)
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══════════════════════════════════════════════════════ */}
      <section className="lp-cta">
        <div className="lp-container">
          <div className="lp-cta-inner lp-reveal" ref={addReveal(13)}>
            <div className="lp-cta-glow" />
            <h2 className="lp-cta-title">
              Ready to hire your<br />
              <span className="lp-cta-title-accent">first global contractor?</span>
            </h2>
            <p className="lp-cta-sub">
              Join companies hiring smarter with Dechub. Set up in 10 minutes, no credit card required.
            </p>
            <div className="lp-cta-buttons">
              <button className="lp-btn-cta-primary" onClick={onGetStarted}>
                Get started for free →
              </button>
              <button className="lp-btn-cta-outline" onClick={onDemo ?? (() => {})}>
                Book a demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div>
              <div className="lp-logo lp-footer-logo" style={{ marginBottom: 14 }}>
                <LogoMark size={28} />
                Dechub
              </div>
              <div className="lp-footer-tagline">
                Global HR, payroll &amp; contractor management. Built in Bengaluru, used worldwide.
              </div>
              <div className="lp-footer-social">
                {[['𝕏', 'Twitter'], ['in', 'LinkedIn'], ['⌥', 'GitHub']].map(([icon, label]) => (
                  <button key={label} className="lp-social-btn" title={label}>{icon}</button>
                ))}
              </div>
            </div>
            {[
              { title: 'Product',   items: ['Features', 'How it works', 'Pricing', 'Coverage', "What's new"] },
              { title: 'Company',   items: ['About us', 'Blog', 'Careers', 'Press', 'Contact'] },
              { title: 'Resources', items: ['Documentation', 'API reference', 'Hiring guides', 'Support', 'Status'] },
              { title: 'Legal',     items: ['Privacy policy', 'Terms of service', 'Cookie policy', 'Compliance'] },
            ].map(({ title, items }) => (
              <div key={title}>
                <div className="lp-footer-col-title">{title}</div>
                <div className="lp-footer-links">
                  {items.map((item) => <button key={item} className="lp-footer-link">{item}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">© 2026 Dechub Pvt. Ltd. · Bengaluru, India</div>
            <div className="lp-footer-legal">
              {['Privacy', 'Terms', 'Cookies'].map((item) => (
                <button key={item} className="lp-footer-legal-link">{item}</button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}