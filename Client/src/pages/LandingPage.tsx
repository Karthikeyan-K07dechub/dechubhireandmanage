import { Fragment, createElement, useCallback, useMemo, useState, type ReactNode } from 'react';
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
  const markup = useMemo(() => buildLandingMarkup(), []);
  const parser = useMemo(() => new DOMParser(), []);
  const submitMarketplaceSearch = useCallback(() => {
    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      return;
    }

    props.onMarketplaceSearch(normalizedQuery);
  }, [props, searchQuery]);
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

      if (classList.contains('button-2')) {
        return {
          onClick: () => setShowTalentRequestModal(true),
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
            const selector = SECTION_SELECTORS[label];
            const target = selector ? document.querySelector(selector) : null;

            if (!(target instanceof HTMLElement)) {
              return;
            }

            const top = target.getBoundingClientRect().top + window.scrollY - 24;
            window.scrollTo({ top, behavior: 'smooth' });
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
        return node.textContent;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
      }

      const element = node as Element;
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
  }, [markup, parser, props, searchQuery, submitMarketplaceSearch]);

  return (
    <>
      <div className="landing-template-root"><Fragment>{contentWithSearch}</Fragment></div>
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
