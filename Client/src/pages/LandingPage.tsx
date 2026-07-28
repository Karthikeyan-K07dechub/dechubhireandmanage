import { useEffect, useMemo, useState } from 'react';
import LandingTalentRequestModal from '../components/common/LandingTalentRequestModal';
import { LandingFooter } from '../landing/components/LandingFooter';
import { LandingHeader } from '../landing/components/LandingHeader';
import { LandingHero } from '../landing/components/LandingHero';
import {
  AudienceSection,
  CoverageSection,
  FaqSection,
  FeaturesSection,
  HowItWorksSection,
  PartnerSection,
  PricingSection,
  StatsSection,
  TestimonialsSection,
} from '../landing/components/LandingSections';
import {
  audienceCards,
  brandLogos,
  browserRows,
  browserStats,
  chipCloudTags,
  closingCta,
  companyStripLogos,
  coverageTracks,
  faqItems,
  featureCards,
  footerColumns,
  howItWorksSteps,
  navItems,
  partnerBullets,
  partnerProfiles,
  pricingFeatures,
  serviceChips,
  stats,
  trustBadges,
} from '../landing/landingContent';
import heroBannerClock from '../landing/assets/hero-banner-clock.png';
import heroLaptop from '../landing/assets/laptop.png';
import modernExperienceImage from '../modern-experience-generated.png';
import './landing.css';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onMarketplace: () => void;
  onMarketplaceSearch: (query: string) => void;
}

const SECTION_IDS: Record<(typeof navItems)[number], string> = {
  Solutions: 'solutions',
  'How it works': 'how-it-works',
  "Who it's for": 'who-its-for',
  Coverage: 'coverage',
  Pricing: 'pricing',
};

function LandingLogoMark() {
  return (
    <span className="landing-logo-mark" aria-hidden="true">
      <span className="landing-logo-cut landing-logo-cut-a" />
      <span className="landing-logo-cut landing-logo-cut-b" />
      <span className="landing-logo-cut landing-logo-cut-c" />
    </span>
  );
}

function BrowserShowcase() {
  return (
    <div className="landing-browser landing-reveal" data-reveal>
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
          <div className="landing-browser-item is-active">
            <span className="landing-browser-dot" />
            Dashboard
          </div>
          <div className="landing-browser-item">
            <span className="landing-browser-dot" />
            Workers
          </div>
          <div className="landing-browser-item">
            <span className="landing-browser-dot" />
            Contracts
          </div>
          <div className="landing-browser-item">
            <span className="landing-browser-dot" />
            Invoices
          </div>
          <div className="landing-browser-group landing-browser-group-gap">OTHER</div>
          <div className="landing-browser-item">
            <span className="landing-browser-dot" />
            Documents
          </div>
          <div className="landing-browser-item">
            <span className="landing-browser-dot" />
            Settings
          </div>
        </aside>

        <div className="landing-browser-main">
          <div className="landing-browser-stats">
            {browserStats.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="landing-browser-table">
            <div className="landing-browser-head">
              <span>WORKER</span>
              <span>TRACK</span>
              <span>ROLE</span>
              <span>STATUS</span>
              <span>PAY</span>
            </div>

            {browserRows.map((row) => (
              <div key={row.name} className="landing-browser-row">
                <span>{row.name}</span>
                <span>{row.track}</span>
                <span>{row.role}</span>
                <span className={`landing-browser-badge ${row.badgeClass}`}>{row.status}</span>
                <span>{row.pay}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandsSection() {
  return (
    <section className="landing-brands">
      <div className="landing-shell">
        <p className="landing-trust-copy">TRUSTED BY COMPANIES HIRING GLOBAL TALENT</p>
        <div className="landing-brand-grid landing-reveal" data-reveal>
          {brandLogos.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>

        <button type="button" className="landing-story-button landing-reveal" data-reveal>
          Built for modern teams
          <span>LIVE PLATFORM</span>
        </button>

        <BrowserShowcase />

        <div className="landing-company-strip landing-reveal" data-reveal>
          <p>Companies already using Dechub to centralize contractor operations.</p>
          <div>
            {companyStripLogos.map((brand) => (
              <span key={brand}>{brand}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

interface FinalCtaSectionProps {
  onBookDemo: () => void;
  onGetStarted: () => void;
}

function FinalCtaSection({ onBookDemo, onGetStarted }: FinalCtaSectionProps) {
  return (
    <section className="landing-final-cta">
      <div className="landing-shell">
        <div className="landing-final-cta-card landing-reveal" data-reveal>
          <h2>{closingCta.title}</h2>
          <p>{closingCta.copy}</p>
          <div className="landing-final-cta-actions">
            <button type="button" className="landing-final-primary" onClick={onGetStarted}>
              Get started for free
            </button>
            <button type="button" className="landing-final-secondary" onClick={onBookDemo}>
              Book a demo
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage({
  onGetStarted,
  onMarketplaceSearch,
}: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTalentRequestModal, setShowTalentRequestModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const submitMarketplaceSearch = useMemo(
    () => () => {
      const trimmed = searchQuery.trim();
      onMarketplaceSearch(trimmed);
    },
    [onMarketplaceSearch, searchQuery],
  );

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!nodes.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15,
      },
    );

    nodes.forEach((node, index) => {
      if (index < 3) {
        node.classList.add('is-visible');
        return;
      }

      observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (item: string) => {
    setIsMenuOpen(false);
    const sectionId = SECTION_IDS[item as keyof typeof SECTION_IDS];
    if (!sectionId) {
      return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <div className="landing-root">
        <LandingHeader
          isMenuOpen={isMenuOpen}
          isScrolled={isScrolled}
          navItems={navItems}
          onBookDemo={() => {
            setIsMenuOpen(false);
            setShowTalentRequestModal(true);
          }}
          onCloseMenu={() => setIsMenuOpen(false)}
          onSelectNav={scrollToSection}
          onToggleMenu={() => setIsMenuOpen((current) => !current)}
          onTopClick={() => {
            setIsMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <main className="landing-main">
          <LandingHero
            clockImage={heroBannerClock}
            laptopImage={heroLaptop}
            navChips={serviceChips}
            searchQuery={searchQuery}
            trustBadges={trustBadges}
            onBookDemo={() => setShowTalentRequestModal(true)}
            onChangeSearch={setSearchQuery}
            onGetStarted={onGetStarted}
            onQuickSearch={(chip) => {
              setSearchQuery(chip);
              onMarketplaceSearch(chip);
            }}
            onSubmitSearch={submitMarketplaceSearch}
            renderLogoMark={() => <LandingLogoMark />}
          />

          <BrandsSection />

          <StatsSection
            id="how-it-works"
            image={modernExperienceImage}
            items={stats}
            chipTags={chipCloudTags}
          />

          <HowItWorksSection id="how-it-works-grid" items={howItWorksSteps} />

          <FeaturesSection id="solutions" items={featureCards} />

          <AudienceSection
            id="who-its-for"
            items={audienceCards}
            onBusinessCta={onGetStarted}
            onContractorCta={() => setShowTalentRequestModal(true)}
          />

          <PartnerSection
            bullets={partnerBullets}
            profiles={partnerProfiles}
            onBookDemo={() => setShowTalentRequestModal(true)}
          />

          <CoverageSection id="coverage" items={coverageTracks} />

          <TestimonialsSection />

          <PricingSection id="pricing" features={pricingFeatures} onGetStarted={onGetStarted} />

          <FaqSection items={faqItems} />

          <FinalCtaSection onBookDemo={() => setShowTalentRequestModal(true)} onGetStarted={onGetStarted} />
        </main>

        <LandingFooter columns={footerColumns} />
      </div>

      <LandingTalentRequestModal
        isOpen={showTalentRequestModal}
        onClose={() => setShowTalentRequestModal(false)}
      />
    </>
  );
}
