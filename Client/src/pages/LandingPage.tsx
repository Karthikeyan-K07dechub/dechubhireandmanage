import { Fragment, createElement, useCallback, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import landingTemplate from '../landing/landing-template.html?raw';
import heroBackground from '../landing/assets/back_img.png';
import heroBannerClock from '../landing/assets/hero-banner-clock.png';
import featureIconAccountBox from '../landing/assets/feature-icon-account-box.png';
import featureIconArticle from '../landing/assets/feature-icon-article.png';
import featureIconAttachMoney from '../landing/assets/feature-icon-attach-money.png';
import featureIconBalance from '../landing/assets/feature-icon-balance.png';
import featureIconEdit from '../landing/assets/feature-icon-edit.png';
import featureIconInbox from '../landing/assets/feature-icon-inbox.png';
import heroLaptop from '../landing/assets/laptop.png';
import modernExperienceImage from '../modern-experience-generated.png';
import usFlag from '../landing/assets/us-flag.svg';
import inFlag from '../landing/assets/in-flag.svg';
import LandingTalentRequestModal from '../components/common/LandingTalentRequestModal';
import '../landing/landing-globals.css';
import '../landing/landing-styleguide.css';
import '../landing/landing-design.css';
import '../landing/landing-overrides.css';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onMarketplace: () => void;
  onMarketplaceSearch: (query: string) => void;
}

const SECTION_SELECTORS: Record<string, string> = {
  Solutions: '.container-32',
  'How it works': '.container-57',
  "Who it’s for": '.rectangle',
  'Who it\'s for': '.rectangle',
  Coverage: '.tracks',
  Pricing: '.pricing',
};

const FEATURE_ICON_REPLACEMENTS = [
  { uid: 'WmW59NGSi5bfhGzu', src: featureIconArticle },
  { uid: 'u2Q4oigrnaLNKofS', src: featureIconEdit },
  { uid: '5U0EC7xyyDUB13qt', src: featureIconAccountBox },
  { uid: 'vMFWKRG62ZgJ6EAs', src: featureIconAttachMoney },
  { uid: '32BFrkUgP77ojXdb', src: featureIconInbox },
  { uid: '92ok09PafYHSWMoI', src: featureIconBalance },
] as const;

const CORRUPTED_TRUSTED_BY_BLOCK_PATTERN =
  /<div data-uid="WD0MyufZpF3jp8yi"[\s\S]*?<p data-uid="VGJ7zSjBvrU7jbEY" class="text-wrapper-43">Trusted by companies hiring global talent<\/p><\/div>/;
const CORRUPTED_TEMPLATE_FRAGMENT_MARKERS = [
  'modern-experience-section__labels',
  'Trusted by companies hiring global talent',
] as const;
const RESPONSIVE_NAV_ITEMS = ['Solutions', 'How it works', "Who it's for", 'Coverage', 'Pricing'] as const;
const RESPONSIVE_SERVICE_CHIPS = [
  'Architecture & Interior Design',
  'Graphic Design',
  'Website Developer',
] as const;
const RESPONSIVE_STATS = [
  { value: '170+', copy: 'Countries where your contractors can receive payments' },
  { value: '24hr', copy: 'Average KYC verification turnaround time' },
  { value: '$0', copy: 'Setup fee. Pay only $49 per active worker per month' },
  { value: '1-2d', copy: 'Payment delivery via Wise after invoice approval' },
] as const;
const RESPONSIVE_FEATURES = [
  {
    title: 'Smart contract generation',
    copy: 'Legally compliant contractor agreements auto-generated from your inputs. No lawyer needed for standard hires.',
    bullets: ['Fixed, milestone & hourly contracts', 'IP assignment & NDA clauses', 'Delaware law jurisdiction (US)'],
    icon: featureIconArticle,
  },
  {
    title: 'DocuSign e-signature',
    copy: 'Both parties sign electronically via DocuSign. Contractor signs first, then your company countersigns.',
    bullets: ['Embedded signing with no app download', 'Dual-party signature tracking', 'Instant PDF on completion'],
    icon: featureIconEdit,
  },
  {
    title: 'KYC identity verification',
    copy: 'Contractor uploads ID and selfie. Verification is typically completed within 24 hours.',
    bullets: ['Passport, license, national ID', 'Liveness check via selfie', 'AES-256 encrypted storage'],
    icon: featureIconAccountBox,
  },
  {
    title: 'Wise global payments',
    copy: 'After invoice approval, Wise transfers funds in 1-2 business days in the contractor local currency.',
    bullets: ['170+ countries supported', 'Zero hidden fees', 'Bank, Wise, or PayPal payout'],
    icon: featureIconAttachMoney,
  },
  {
    title: 'Invoice management',
    copy: 'Contractors submit monthly invoices from their portal. Approve or dispute with one click.',
    bullets: ['Contractor self-service portal', 'Approve, dispute, or request changes', 'PDF receipts auto-generated'],
    icon: featureIconInbox,
  },
  {
    title: 'Compliance & tax forms',
    copy: 'W-9 and W-8BEN guidance for US engagements, plus completion certificates issued at contract end.',
    bullets: ['Guided W-9 / W-8BEN collection', 'Completion certificate on end', 'Tax reminders as an add-on'],
    icon: featureIconBalance,
  },
] as const;
const RESPONSIVE_TAGS = [
  'Endpoint Protection',
  'PEO',
  'E-sign',
  'EOR',
  'Device Lifecycle Management',
  'Dept Benefits',
  'HRIS',
  'Mobile Device Management',
  'Background Checks',
  'Access Management',
  'Compensation',
  'Entity Setup & Management',
] as const;
const RESPONSIVE_COVERAGE = [
  {
    title: 'Track 2 - US Contractors',
    status: 'Live now',
    summary: 'Hire US-based independent contractors from any country. Full contract, KYC, e-sign, and Wise payout pipeline.',
    bullets: ['USD contracts with DocuSign e-signature', 'W-9 / W-8BEN tax form guidance', 'Wise payout in 1-2 business days'],
    flag: usFlag,
    alt: 'US flag',
  },
  {
    title: 'Track 3 - India Payroll',
    status: 'Coming next',
    summary: 'We are expanding from contractor management to payroll support for Indian teams in the next rollout phase.',
    bullets: ['Onboarding and payroll operations', 'Local compliance workflows', 'Centralized workforce visibility'],
    flag: inFlag,
    alt: 'India flag',
  },
] as const;
const RESPONSIVE_AUDIENCES = [
  {
    eyebrow: 'For businesses',
    title: 'Build your remote team. Skip the compliance chaos.',
    copy: 'Onboard contractors across borders, issue contracts in minutes, and trigger payments automatically without legal or finance bottlenecks.',
    bullets: [
      'Live dashboard to track every contractor and contract status',
      'Auto-generated compliant contracts, ready to sign',
      'One-click invoice approval with instant Wise payout',
      'All documents in one place: contracts, KYC, invoices',
    ],
    cta: 'Set up your workspace',
  },
  {
    eyebrow: 'For contractors',
    title: 'Do the work you love. Get paid without the wait.',
    copy: 'Accept a project invite, sign digitally, submit your invoice, and receive payment in your local account wherever you are in the world.',
    bullets: [
      'Email invite to join with no account creation needed upfront',
      '5-step mobile-first profile and onboarding flow',
      'Raise invoices and watch payment status in real time',
      'Paid in your currency across 170+ countries via Wise',
    ],
    cta: 'Start earning globally',
  },
] as const;
const RESPONSIVE_PRICING_FEATURES = [
  'Contract generation & PDF',
  'DocuSign e-signature for both parties',
  'KYC identity verification ($1.50/check)',
  'Invoice management & approval flow',
  'Wise payment processing',
  'AES-256 encrypted document storage',
  'Completion certificate',
] as const;
const RESPONSIVE_TESTIMONIALS = [
  {
    quote: 'We hired 3 US contractors in one afternoon. Contract generated, signed via DocuSign the same day, and payment through Wise without any issues.',
    role: 'CEO, BuildAI - Bengaluru',
    name: 'Ravi Kumar',
    initials: 'RK',
  },
  {
    quote: 'As a US contractor working with Indian companies, getting paid was a nightmare. Dechub made it seamless, with invoice approval and Wise transfer the next day.',
    role: 'Senior React Developer - Austin, TX',
    name: 'John Smith',
    initials: 'JS',
  },
  {
    quote: 'We were spending $800/month on legal fees for contractor agreements. Dechub cut that to zero and gave our board the compliance confidence they needed.',
    role: 'COO, VentureScale - Mumbai',
    name: 'Anjali Patel',
    initials: 'AP',
  },
] as const;
const RESPONSIVE_FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: ['Features', 'How it works', 'Pricing', 'Coverage', "What's new"],
  },
  {
    title: 'Company',
    links: ['About us', 'Blog', 'Careers', 'Press', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Documentation', 'API reference', 'Hiring guides', 'Support', 'Status'],
  },
  {
    title: 'Legal',
    links: ['Privacy policy', 'Terms of service', 'Cookie policy', 'Compliance'],
  },
] as const;
const RESPONSIVE_SECTION_SELECTORS: Record<string, string> = {
  Solutions: '[data-responsive-section="solutions"]',
  'How it works': '[data-responsive-section="how-it-works"]',
  "Who it's for": '[data-responsive-section="coverage"]',
  Coverage: '[data-responsive-section="coverage"]',
  Pricing: '[data-responsive-section="coverage"]',
};

function extractBodyMarkup(template: string): string {
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? template;
}

function buildLandingMarkup(): string {
  const heroPromoBanner = `
    <section class="hero-promo-banner" aria-label="Get a resource in 20 minutes with 10 days free trial">
      <div class="hero-promo-banner__panel">
        <div class="hero-promo-banner__media">
          <img
            class="hero-promo-banner__clock"
            src="${heroBannerClock}"
            alt="20 minute turnaround indicator"
          />
        </div>
        <div class="hero-promo-banner__copy">
          <p class="hero-promo-banner__line">
            Get a resource in <strong>20 minutes</strong>
          </p>
          <p class="hero-promo-banner__line">
            with <strong>10 days</strong> free trial
          </p>
        </div>
      </div>
    </section>
  `;

  const modernExperienceSection = `
    <section class="modern-experience-section" aria-label="One modern experience for today's workforce">
      <div class="modern-experience-section__panel">
        <div class="modern-experience-section__header">
          <h2 class="modern-experience-section__title">One Modern Experience For Today's Workforce</h2>
        </div>

        <div class="modern-experience-section__stats">
          <article class="modern-experience-section__stat-card">
            <div class="modern-experience-section__stat-value">170+</div>
            <p class="modern-experience-section__stat-copy">Countries where your contractors can receive payments</p>
          </article>
          <article class="modern-experience-section__stat-card">
            <div class="modern-experience-section__stat-value">24hr</div>
            <p class="modern-experience-section__stat-copy">Average KYC verification turn around time</p>
          </article>
          <article class="modern-experience-section__stat-card">
            <div class="modern-experience-section__stat-value">$0</div>
            <p class="modern-experience-section__stat-copy">Setup fee. Pay only $49 per active worker per month</p>
          </article>
          <article class="modern-experience-section__stat-card">
            <div class="modern-experience-section__stat-value">1-2d</div>
            <p class="modern-experience-section__stat-copy">Payment delivery via Wise after invoice approval</p>
          </article>
        </div>

        <div class="modern-experience-section__media-wrap">
          <img
            class="modern-experience-section__media"
            src="${modernExperienceImage}"
            alt="Team collaborating in a modern workspace"
          />
        </div>

        <div class="modern-experience-section__bottom">
          <article class="modern-experience-section__info-card">
            <div class="modern-experience-section__info-content">
              <p class="modern-experience-section__info-copy">
                <strong>Built on in-house infrastructure,</strong> with single payroll engines,
                owned entities, and more.
              </p>
              <p class="modern-experience-section__info-copy modern-experience-section__info-copy--secondary">
                Run onboarding, contracts, verification, and payouts from one reliable
                workflow designed for fast-moving global teams.
              </p>
            </div>
            <button class="modern-experience-section__link" type="button">
              Learn more <span class="modern-experience-section__link-icon" aria-hidden="true">→</span>
            </button>
          </article>

          <article class="modern-experience-section__tag-card">
            <div class="modern-experience-section__tag-grid">
              <span>Endpoint Protection</span>
              <span>PEO</span>
              <span>E-sign</span>
              <span>EOR</span>
              <span>Device Lifecycle Management</span>
              <span>Dept Benefits</span>
              <span>Dept Mobility</span>
              <span>HRIS</span>
              <span>Mobile Device Management</span>
              <span>Talent</span>
              <span>Background Checks</span>
              <span>Access Management</span>
              <span>Equity Consulting</span>
              <span>Workforce Planning</span>
              <span>Contractor</span>
              <span>Compensation</span>
              <span>Seat Pricing</span>
              <span>Entity Setup & Management</span>
              <span>AI</span>
            </div>
          </article>
        </div>
      </div>
    </section>
  `;

  return extractBodyMarkup(landingTemplate)
    .replace(CORRUPTED_TRUSTED_BY_BLOCK_PATTERN, '')
    .split('./back_img.png')
    .join(heroBackground)
    .split('./laptop.png')
    .join(heroLaptop)
    .split('Covergae')
    .join('Coverage')
    .replace(
      '<div data-uid="WmW59NGSi5bfhGzu" class="text-wrapper-44">ðŸ“„</div>',
      `<img data-uid="WmW59NGSi5bfhGzu" class="feature-card-icon" src="${featureIconArticle}" alt="" aria-hidden="true">`,
    )
    .split('src="assets/us-flag.png"').join(`src="${usFlag}"`)
    .split('src="assets/us-flag.svg"').join(`src="${usFlag}"`)
    .split('src="assets/in-flag.png"').join(`src="${inFlag}"`)
    .split('src="assets/in-flag.svg"').join(`src="${inFlag}"`)
    .replace(
      '<div data-uid="u2Q4oigrnaLNKofS" class="text-wrapper-48">âœï¸</div>',
      `<img data-uid="u2Q4oigrnaLNKofS" class="feature-card-icon" src="${featureIconEdit}" alt="" aria-hidden="true">`,
    )
    .replace(
      '<div data-uid="5U0EC7xyyDUB13qt" class="text-wrapper-44">ðŸªª</div>',
      `<img data-uid="5U0EC7xyyDUB13qt" class="feature-card-icon" src="${featureIconAccountBox}" alt="" aria-hidden="true">`,
    )
    .replace(
      '<div data-uid="vMFWKRG62ZgJ6EAs" class="text-wrapper-44">ðŸ’¸</div>',
      `<img data-uid="vMFWKRG62ZgJ6EAs" class="feature-card-icon" src="${featureIconAttachMoney}" alt="" aria-hidden="true">`,
    )
    .replace(
      '<div data-uid="32BFrkUgP77ojXdb" class="text-wrapper-44">ðŸ§¾</div>',
      `<img data-uid="32BFrkUgP77ojXdb" class="feature-card-icon" src="${featureIconInbox}" alt="" aria-hidden="true">`,
    )
    .replace(
      '<div data-uid="92ok09PafYHSWMoI" class="text-wrapper-64">âš–ï¸</div>',
      `<img data-uid="92ok09PafYHSWMoI" class="feature-card-icon" src="${featureIconBalance}" alt="" aria-hidden="true">`,
    )
    .replace(
      '<img data-uid="4vI55LXSCxqQzjK2" class="global-contractors" src="https://c.animaapp.com/mpdmfpod17G5Pz/img/global-contractors.svg">',
      '<div data-uid="4vI55LXSCxqQzjK2" class="global-contractors">Global Contractors</div>',
    )
    .replace(
      '<div data-uid="VElckwnoJgZyzynm" class="text-wrapper-158">without the chaos.</div>',
      '<div data-uid="VElckwnoJgZyzynm" class="text-wrapper-158">without the chaos</div>',
    )
    .replace(
      '<div data-uid="d5M2KxfQ0Cd6tqMh" class="text-wrapper-161">Marketplace</div>',
      '<div data-uid="d5M2KxfQ0Cd6tqMh" class="text-wrapper-161">Get Started</div>',
    )
    .replace('<div data-uid="ah3NPVC6bhpWgpvS" class="text-wrapper-162">Get Started</div>', '<div data-uid="ah3NPVC6bhpWgpvS" class="text-wrapper-162">Book a demo</div>')
    .replace(
      '<div data-uid="oS4DYtmmko6gmSN6" class="button-4"><p data-uid="1ANXJxLkUlkLj3N3" class="text-wrapper-157">Start hiring for free â†’</p></div>',
      '<div data-uid="oS4DYtmmko6gmSN6" class="button-4"><p data-uid="1ANXJxLkUlkLj3N3" class="text-wrapper-157">Book a demo</p></div>',
    )
    .replace(
      '<div data-uid="vDuWMIPVFf11Amqa" class="a"><div data-uid="p6EjCbx5RtG8d19J" class="div-4"><div data-uid="xTK6tuILGF64yz4j" class="p-erink"><a data-uid="uvwZ6wu72lLopAA6" href="https://www.fiverr.com/categories/graphics-design/architectural-design-services" target="_blank" rel="noopener noreferrer"><div data-uid="McjkPpod9COrNUFO" class="text-wrapper-164">Full-Stack Developer</div></a></div>',
      '<div data-uid="vDuWMIPVFf11Amqa" class="a"><div data-uid="p6EjCbx5RtG8d19J" class="div-4"><div data-uid="xTK6tuILGF64yz4j" class="p-erink"><a data-uid="uvwZ6wu72lLopAA6" href="https://www.fiverr.com/categories/graphics-design/architectural-design-services" target="_blank" rel="noopener noreferrer"><div data-uid="McjkPpod9COrNUFO" class="text-wrapper-164">Architecture &amp; Interior Design</div></a></div>',
    )
    .replace(
      '<div data-uid="qOWZUJ8v4t1V5BRM" class="a-erinr"><div data-uid="YgZogK7n8Ss9VrCL" class="div-5"><div data-uid="6bgT6A3gJ9PaEhCu" class="p-2"><div data-uid="k1D8J6o8mp9htsGg" class="text-wrapper-164">Graphic Designer</div></div>',
      '<div data-uid="qOWZUJ8v4t1V5BRM" class="a-erinr"><div data-uid="YgZogK7n8Ss9VrCL" class="div-5"><div data-uid="6bgT6A3gJ9PaEhCu" class="p-2"><div data-uid="k1D8J6o8mp9htsGg" class="text-wrapper-164">Graphic Design</div></div>',
    )
    .replace(
      '<div data-uid="qlS5nOMQkWqG1wvp" class="div-gwtp-wrapper"><div data-uid="ch56JCUVf0Pr40Ps" class="div-6"><div data-uid="c86DaoBKP1tpG3i6" class="p-2"><div data-uid="IEtFgc9BUHHM0mVh" class="text-wrapper-164">Front-End Developer</div></div>',
      '<div data-uid="qlS5nOMQkWqG1wvp" class="div-gwtp-wrapper"><div data-uid="ch56JCUVf0Pr40Ps" class="div-6"><div data-uid="c86DaoBKP1tpG3i6" class="p-2"><div data-uid="IEtFgc9BUHHM0mVh" class="text-wrapper-164">Website Developer</div></div>',
    )
    .replace(
      '<div data-uid="nEYRtSq34kIX9zZZ" class="container-32">',
      `${modernExperienceSection}<div data-uid="nEYRtSq34kIX9zZZ" class="container-32">`,
    )
    .replace(
      '<div data-uid="kBRPtjkr4BB7msAs" class="container-8">',
      `${heroPromoBanner}<div data-uid="kBRPtjkr4BB7msAs" class="container-8">`,
    );
}

export default function LandingPage(props: LandingPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTalentRequestModal, setShowTalentRequestModal] = useState(false);
  const [isResponsiveMenuOpen, setIsResponsiveMenuOpen] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [areHeroAssetsReady, setAreHeroAssetsReady] = useState(false);
  const markup = useMemo(() => buildLandingMarkup(), []);
  const parser = useMemo(() => new DOMParser(), []);

  useLayoutEffect(() => {
    setIsLayoutReady(true);
  }, []);

  useEffect(() => {
    let isActive = true;
    let pendingAssets = 2;

    const markAssetComplete = () => {
      pendingAssets -= 1;
      if (isActive && pendingAssets <= 0) {
        setAreHeroAssetsReady(true);
      }
    };

    const preloadImage = (src: string) => {
      const image = new Image();
      let didComplete = false;
      const handleComplete = () => {
        if (didComplete) {
          return;
        }

        didComplete = true;
        markAssetComplete();
      };

      image.onload = handleComplete;
      image.onerror = handleComplete;
      image.src = src;

      if (image.complete) {
        handleComplete();
      }
    };

    preloadImage(heroBackground);
    preloadImage(heroLaptop);

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isResponsiveMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isResponsiveMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsResponsiveMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const submitMarketplaceSearch = useCallback(() => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    props.onMarketplaceSearch(normalizedQuery);
  }, [props, searchQuery]);
  const scrollToSection = useCallback((label: string) => {
    const responsiveSelector = RESPONSIVE_SECTION_SELECTORS[label];
    const responsiveTarget = responsiveSelector ? document.querySelector(responsiveSelector) : null;

    if (responsiveTarget instanceof HTMLElement && window.innerWidth <= 1024) {
      const top = responsiveTarget.getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    }

    const selector = SECTION_SELECTORS[label];
    const target = selector ? document.querySelector(selector) : null;

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - 24;
    window.scrollTo({ top, behavior: 'smooth' });
  }, []);
  const contentWithSearch = useMemo(() => {
    const doc = parser.parseFromString(markup, 'text/html');
    FEATURE_ICON_REPLACEMENTS.forEach(({ uid, src }) => {
      const iconNode = doc.querySelector(`[data-uid="${uid}"]`);
      if (!iconNode?.parentElement) {
        return;
      }

      const replacement = doc.createElement('img');
      replacement.setAttribute('data-uid', uid);
      replacement.setAttribute('class', 'feature-card-icon');
      replacement.setAttribute('src', src);
      replacement.setAttribute('alt', '');
      replacement.setAttribute('aria-hidden', 'true');
      iconNode.parentElement.replaceChild(replacement, iconNode);
    });
    let keyIndex = 0;

    const createKey = () => `landing-node-${keyIndex++}`;

    const getActionProps = (element: Element): Record<string, unknown> => {
      const classList = element.classList;
      const textContent = element.textContent?.trim() ?? '';
      const dataUid = element.getAttribute('data-uid');

      if (
        classList.contains('button-2')
        || dataUid === 'nvYEz0NvOOFegVmL'
        || dataUid === 'oS4DYtmmko6gmSN6'
      ) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: () => setShowTalentRequestModal(true),
        };
      }

      if (classList.contains('frame-12')) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: props.onGetStarted,
        };
      }

      if (
        classList.contains('frame-13') ||
        classList.contains('button') ||
        classList.contains('button-3') ||
        classList.contains('button-4') ||
        classList.contains('component')
      ) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: props.onGetStarted,
        };
      }

      if (classList.contains('image-5')) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        };
      }

      if (classList.contains('text-wrapper-160')) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: () => {
            const label = element.textContent?.trim() ?? '';
            scrollToSection(label);
          },
        };
      }

      if (classList.contains('form-search-form')) {
        return {
          action: undefined,
          method: undefined,
          target: undefined,
          rel: undefined,
          onSubmit: (event: Event) => {
            event.preventDefault();
            submitMarketplaceSearch();
          },
        };
      }

      if (classList.contains('input-long')) {
        return {
          value: searchQuery,
          placeholder: 'Search for any service...',
          onChange: (event: Event) => {
            const target = event.target as HTMLInputElement;
            setSearchQuery(target.value);
          },
          onKeyDown: (event: KeyboardEvent) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submitMarketplaceSearch();
            }
          },
        };
      }

      if (classList.contains('text-wrapper-164') && textContent) {
        return {
          role: 'button',
          tabIndex: 0,
          onClick: (event: Event) => {
            event.preventDefault();
            setSearchQuery(textContent);
            props.onMarketplaceSearch(textContent);
          },
        };
      }

      if (element.tagName === 'A' && element.getAttribute('href') === '#') {
        return {
          href: '#',
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            props.onGetStarted();
          },
        };
      }

      if (element.tagName === 'A' && element.closest('.service-chip-row')) {
        return {
          href: '#',
          onClick: (event: MouseEvent) => {
            event.preventDefault();
            if (textContent) {
              setSearchQuery(textContent);
              props.onMarketplaceSearch(textContent);
            }
          },
        };
      }

      return {};
    };

    const renderNode = (node: ChildNode): ReactNode => {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent ?? '';
        if (containsCorruptedTemplateMarker(textContent)) {
          return null;
        }

        return textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const element = node as Element;
      if (isCorruptedTemplateElement(element)) {
        return null;
      }

      const tagName = element.tagName.toLowerCase();
      const reactProps: Record<string, unknown> = {
        key: createKey(),
        ...getActionProps(element),
      };

      for (const attribute of Array.from(element.attributes)) {
        if (attribute.name === 'class') {
          reactProps.className = attribute.value;
          continue;
        }

        if (
          attribute.name === 'style'
          || (classListContains(element, 'form-search-form') && ['action', 'method', 'target', 'rel'].includes(attribute.name))
        ) {
          continue;
        }

        if (classListContains(element, 'input-long') && ['value', 'placeholder'].includes(attribute.name)) {
          continue;
        }

        if (element.tagName === 'A' && element.closest('.service-chip-row') && attribute.name === 'href') {
          continue;
        }

        reactProps[attribute.name] = attribute.value;
      }

      const children = Array.from(element.childNodes)
        .map(renderNode)
        .filter((child) => child !== null);

      return createElement(tagName, reactProps, ...children);
    };

    return Array.from(doc.body.childNodes)
      .map(renderNode)
      .filter((child) => child !== null);
  }, [markup, parser, props, scrollToSection, searchQuery, submitMarketplaceSearch]);

  return (
    <>
      <div className="landing-responsive-shell" style={{ visibility: isLayoutReady && areHeroAssetsReady ? 'visible' : 'hidden' }}>
        <section className="landing-responsive-page">
          <header className="landing-responsive-header">
            <button
              className="landing-responsive-logo"
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Scroll to top"
            >
              DECHUB
            </button>

            <nav className="landing-responsive-nav" aria-label="Primary">
              {RESPONSIVE_NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  className="landing-responsive-nav__link"
                  type="button"
                  onClick={() => scrollToSection(item)}
                >
                  {item}
                </button>
              ))}
            </nav>

            <div className="landing-responsive-header__actions">
              <button
                className="landing-responsive-cta"
                type="button"
                onClick={() => setShowTalentRequestModal(true)}
              >
                Book a demo
              </button>
              <button
                className="landing-responsive-menu"
                type="button"
                aria-expanded={isResponsiveMenuOpen}
                aria-label={isResponsiveMenuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setIsResponsiveMenuOpen((open) => !open)}
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </header>

          <div className={`landing-responsive-drawer${isResponsiveMenuOpen ? ' is-open' : ''}`}>
            {RESPONSIVE_NAV_ITEMS.map((item) => (
              <button
                key={item}
                className="landing-responsive-drawer__link"
                type="button"
                onClick={() => {
                  setIsResponsiveMenuOpen(false);
                  scrollToSection(item);
                }}
              >
                {item}
              </button>
            ))}
            <button
              className="landing-responsive-drawer__link landing-responsive-drawer__link--primary"
              type="button"
              onClick={() => {
                setIsResponsiveMenuOpen(false);
                props.onGetStarted();
              }}
            >
              Get Started
            </button>
          </div>

          <section className="landing-responsive-hero" data-responsive-section="hero">
            <div className="landing-responsive-hero__content">
              <div className="landing-responsive-hero__eyebrow">Now Live - Track 2 US Contractors</div>
              <h1 className="landing-responsive-hero__title">
                Hire, Pay &amp; Manage <span>Global Contractors</span> without the chaos
              </h1>
              <p className="landing-responsive-hero__copy">
                Dechub is the all-in-one platform to onboard US contractors, generate contracts,
                collect e-signatures, and process payments via Wise all from one dashboard.
              </p>

              <form
                className="landing-responsive-hero__search"
                onSubmit={(event) => {
                  event.preventDefault();
                  submitMarketplaceSearch();
                }}
              >
                <input
                  type="search"
                  value={searchQuery}
                  placeholder="Search for any service..."
                  aria-label="Search for any service"
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <button type="submit">Search</button>
              </form>

              <div className="landing-responsive-hero__chips">
                {RESPONSIVE_SERVICE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    className="landing-responsive-hero__chip"
                    type="button"
                    onClick={() => {
                      setSearchQuery(chip);
                      props.onMarketplaceSearch(chip);
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="landing-responsive-hero__actions">
                <button className="landing-responsive-hero__action landing-responsive-hero__action--primary" type="button" onClick={props.onGetStarted}>
                  Get Started
                </button>
                <button className="landing-responsive-hero__action landing-responsive-hero__action--secondary" type="button" onClick={() => setShowTalentRequestModal(true)}>
                  Book a demo
                </button>
              </div>

              <p className="landing-responsive-hero__trust">No credit card. No setup fee. Cancel anytime.</p>
            </div>

            <div className="landing-responsive-hero__visual">
              <div className="landing-responsive-hero__visual-glow" />
              <img src={heroLaptop} alt="Dechub platform preview on laptop" />
            </div>
          </section>

          <section className="landing-responsive-promo">
            <img src={heroBannerClock} alt="20 minute turnaround indicator" />
            <div>
              <p>Get a resource in <strong>20 minutes</strong></p>
              <p>with <strong>10 days</strong> free trial</p>
            </div>
          </section>

          <section className="landing-responsive-modern" data-responsive-section="how-it-works">
            <div className="landing-responsive-modern__heading">
              <p>One modern experience for today&apos;s workforce</p>
              <h2>Everything you need to run a global team</h2>
            </div>

            <div className="landing-responsive-modern__stats">
              {RESPONSIVE_STATS.map((stat) => (
                <article key={stat.value} className="landing-responsive-modern__stat">
                  <div className="landing-responsive-modern__stat-value">{stat.value}</div>
                  <p>{stat.copy}</p>
                </article>
              ))}
            </div>

            <div className="landing-responsive-modern__image">
              <img src={modernExperienceImage} alt="Team collaborating in a modern workspace" />
            </div>

            <div className="landing-responsive-modern__bottom">
              <article className="landing-responsive-modern__info">
                <p>
                  <strong>Built on in-house infrastructure,</strong> with single payroll engines,
                  owned entities, and more.
                </p>
                <p>
                  Run onboarding, contracts, verification, and payouts from one reliable workflow
                  designed for fast-moving global teams.
                </p>
              </article>

              <div className="landing-responsive-modern__tags">
                {RESPONSIVE_TAGS.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </section>

          <section className="landing-responsive-features" data-responsive-section="solutions">
            <div className="landing-responsive-section-heading">
              <p>Platform features</p>
              <h2>Global hiring, contracts, compliance, and payouts in one place</h2>
            </div>

            <div className="landing-responsive-features__grid">
              {RESPONSIVE_FEATURES.map((feature) => (
                <article key={feature.title} className="landing-responsive-feature-card">
                  <div className="landing-responsive-feature-card__icon">
                    <img src={feature.icon} alt="" aria-hidden="true" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.copy}</p>
                  <ul>
                    {feature.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-responsive-coverage" data-responsive-section="coverage">
            <div className="landing-responsive-section-heading">
              <p>Coverage</p>
              <h2>Global hiring, phased rollout</h2>
            </div>

            <div className="landing-responsive-coverage__grid">
              {RESPONSIVE_COVERAGE.map((item) => (
                <article key={item.title} className="landing-responsive-coverage-card">
                  <div className="landing-responsive-coverage-card__meta">
                    <img src={item.flag} alt={item.alt} />
                    <span>{item.status}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <ul>
                    {item.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-responsive-audiences" data-responsive-section="who-its-for">
            <div className="landing-responsive-section-heading">
              <p>Built for both sides</p>
              <h2>Two roles. One seamless system.</h2>
            </div>

            <div className="landing-responsive-audiences__grid">
              {RESPONSIVE_AUDIENCES.map((audience) => (
                <article key={audience.eyebrow} className="landing-responsive-audience-card">
                  <div className="landing-responsive-audience-card__eyebrow">{audience.eyebrow}</div>
                  <h3>{audience.title}</h3>
                  <p>{audience.copy}</p>
                  <ul>
                    {audience.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="landing-responsive-audience-card__cta"
                    onClick={audience.eyebrow === 'For businesses' ? props.onGetStarted : () => setShowTalentRequestModal(true)}
                  >
                    {audience.cta}
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-responsive-pricing" data-responsive-section="pricing">
            <div className="landing-responsive-section-heading">
              <p>Simple pricing</p>
              <h2>One price. No surprises.</h2>
            </div>

            <article className="landing-responsive-pricing-card">
              <div className="landing-responsive-pricing-card__amount">
                <span>$</span>
                <strong>49</strong>
                <small>/worker/month</small>
              </div>
              <p>Billed monthly per active worker. Add or remove workers anytime.</p>
              <ul>
                {RESPONSIVE_PRICING_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button type="button" className="landing-responsive-pricing-card__cta" onClick={props.onGetStarted}>
                Start free - first contractor on us
              </button>
              <div className="landing-responsive-pricing-card__note">
                Optional add-ons: Compliance advisory +$5/mo and HRMS +$5/mo coming soon.
              </div>
            </article>
          </section>

          <section className="landing-responsive-testimonials">
            <div className="landing-responsive-section-heading">
              <p>Testimonials</p>
              <h2>Our customer reviews</h2>
            </div>

            <div className="landing-responsive-testimonials__grid">
              {RESPONSIVE_TESTIMONIALS.map((testimonial) => (
                <article key={testimonial.name} className="landing-responsive-testimonial-card">
                  <div className="landing-responsive-testimonial-card__stars">★★★★★</div>
                  <p>&ldquo;{testimonial.quote}&rdquo;</p>
                  <div className="landing-responsive-testimonial-card__meta">
                    <div className="landing-responsive-testimonial-card__avatar">{testimonial.initials}</div>
                    <div>
                      <strong>{testimonial.name}</strong>
                      <span>{testimonial.role}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="landing-responsive-closing-cta">
            <p>Ready to hire your first global contractor?</p>
            <h2>Join companies hiring smarter with Dechub.</h2>
            <span>Set up in 10 minutes, no credit card required.</span>
            <div className="landing-responsive-closing-cta__actions">
              <button type="button" onClick={props.onGetStarted}>Get started for free</button>
              <button type="button" onClick={() => setShowTalentRequestModal(true)}>Book a demo</button>
            </div>
          </section>

          <footer className="landing-responsive-footer">
            <div className="landing-responsive-footer__intro">
              <h3>Global HR, payroll &amp; contractor management.</h3>
              <p>Built in Bengaluru, used worldwide.</p>
            </div>

            <div className="landing-responsive-footer__grid">
              {RESPONSIVE_FOOTER_COLUMNS.map((column) => (
                <div key={column.title} className="landing-responsive-footer__column">
                  <h4>{column.title}</h4>
                  {column.links.map((link) => (
                    <span key={link}>{link}</span>
                  ))}
                </div>
              ))}
            </div>

            <div className="landing-responsive-footer__bottom">
              <span>© 2026 Dechub Pvt. Ltd. - Bengaluru, India</span>
              <div>
                <span>Privacy</span>
                <span>Terms</span>
                <span>Cookies</span>
              </div>
            </div>
          </footer>
        </section>

        <div className="landing-template-root"><Fragment>{contentWithSearch}</Fragment></div>
      </div>
      <LandingTalentRequestModal
        isOpen={showTalentRequestModal}
        onClose={() => setShowTalentRequestModal(false)}
      />
    </>
  );
}

function classListContains(element: Element, className: string): boolean {
  return element.classList.contains(className);
}

function containsCorruptedTemplateMarker(value: string): boolean {
  return CORRUPTED_TEMPLATE_FRAGMENT_MARKERS.some((marker) => value.includes(marker));
}

function isCorruptedTemplateElement(element: Element): boolean {
  if (element.getAttribute('data-uid') === 'WD0MyufZpF3jp8yi') {
    return true;
  }

  return Array.from(element.attributes).some(
    (attribute) =>
      containsCorruptedTemplateMarker(attribute.name)
      || containsCorruptedTemplateMarker(attribute.value),
  );
}
