import { Fragment, createElement, useMemo, type ReactNode } from 'react';
import landingTemplate from '../landing/landing-template.html?raw';
import heroBackground from '../landing/assets/back_img.png';
import heroLaptop from '../landing/assets/laptop.png';
import modernExperienceImage from '../image_34.png';
import '../landing/landing-globals.css';
import '../landing/landing-styleguide.css';
import '../landing/landing-design.css';
import '../landing/landing-overrides.css';

interface LandingPageProps {
  onLogin: () => void;
  onGetStarted: () => void;
  onDemo?: () => void;
}

const SECTION_SELECTORS: Record<string, string> = {
  Solutions: '.container-32',
  'How it works': '.container-57',
  "Who it’s for": '.rectangle',
  'Who it\'s for': '.rectangle',
  Coverage: '.tracks',
  Pricing: '.pricing',
};

function extractBodyMarkup(template: string): string {
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch?.[1] ?? template;
}

function buildLandingMarkup(): string {
  const modernExperienceSection = `
    <section class="modern-experience-section" aria-label="One modern experience for today's workforce">
      <div class="modern-experience-section__panel">
        <div class="modern-experience-section__header">
          <h2 class="modern-experience-section__title">One Modern Experience For Today's Workforce</h2>
          <p class="modern-experience-section__subtitle">Container</p>
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

        <div class="modern-experience-section__labels">
          <span>Frame 2147224572</span>
          <span>Frame 2147224573</span>
        </div>

        <div class="modern-experience-section__bottom">
          <article class="modern-experience-section__info-card">
            <p class="modern-experience-section__info-copy">
              <strong>Built on in-house infrastructure,</strong> with single payroll engines,
              owned entities, and more.
            </p>
            <button class="modern-experience-section__link" type="button">Learn more -></button>
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
      '<div data-uid="nEYRtSq34kIX9zZZ" class="container-32">',
      `${modernExperienceSection}<div data-uid="nEYRtSq34kIX9zZZ" class="container-32">`,
    );
}

function toReactNodeList(
  html: string,
  props: LandingPageProps,
): ReactNode[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  let keyIndex = 0;

  const createKey = () => `landing-node-${keyIndex++}`;

  const getActionProps = (element: Element): Record<string, unknown> => {
    const classList = element.classList;

    if (classList.contains('frame-12')) {
      return {
        role: 'button',
        tabIndex: 0,
        onClick: props.onLogin,
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
        onClick: () =>
          (props.onDemo ?? (() => window.open('mailto:demo@dechub.in', '_blank', 'noopener,noreferrer')))(),
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

    if (element.tagName === 'A' && element.getAttribute('href') === '#') {
      return {
        href: '#',
        onClick: (event: MouseEvent) => {
          event.preventDefault();
          props.onGetStarted();
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

      if (attribute.name === 'style') {
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
}

export default function LandingPage(props: LandingPageProps) {
  const markup = useMemo(() => buildLandingMarkup(), []);
  const content = useMemo(() => toReactNodeList(markup, props), [markup, props]);

  return <div className="landing-template-root"><Fragment>{content}</Fragment></div>;
}
