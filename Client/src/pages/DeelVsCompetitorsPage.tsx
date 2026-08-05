import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  DEEL_VS_COMPETITORS_HTML_CLASSES,
  DEEL_VS_COMPETITORS_INLINE_STYLES,
  DEEL_VS_COMPETITORS_PAGE_TITLE,
  DEEL_VS_COMPETITORS_STYLESHEET_HREFS,
  DeelVsCompetitorsContent,
} from './deelVsCompetitors/generatedPageData';
import SharedLandingPageLayout from '../components/common/SharedLandingPageLayout';

const STYLE_DATA_ATTR = 'data-deel-vs-competitors-style';
const LINK_DATA_ATTR = 'data-deel-vs-competitors-stylesheet';

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function wireSlider(root: HTMLElement, navId: string, trackId: string) {
  const nav = root.querySelector<HTMLElement>(`#${navId}`);
  const track = root.querySelector<HTMLElement>(`#${trackId}`);
  const wrapper = track?.querySelector<HTMLElement>('.swiper-wrapper');
  const previousButton = nav?.querySelector<HTMLButtonElement>('.swiper-button-prev');
  const nextButton = nav?.querySelector<HTMLButtonElement>('.swiper-button-next');

  if (!track || !wrapper || !previousButton || !nextButton) {
    return () => undefined;
  }

  track.style.overflowX = 'auto';
  track.style.scrollBehavior = 'smooth';
  track.style.scrollbarWidth = 'none';
  wrapper.style.display = 'flex';

  Array.from(wrapper.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      child.style.scrollSnapAlign = 'start';
    }
  });

  const scrollAmount = () => Math.max(track.clientWidth * 0.9, 320);
  const handlePrevious = () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  };
  const handleNext = () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  };

  previousButton.addEventListener('click', handlePrevious);
  nextButton.addEventListener('click', handleNext);

  return () => {
    previousButton.removeEventListener('click', handlePrevious);
    nextButton.removeEventListener('click', handleNext);
  };
}

export default function DeelVsCompetitorsPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClassName = document.documentElement.className;
    const previousBodyClassName = document.body.className;
    const previousHtmlOverflowAnchor = document.documentElement.style.overflowAnchor;
    const previousBodyOverflowAnchor = document.body.style.overflowAnchor;
    const previousScrollRestoration = window.history.scrollRestoration;

    document.title = DEEL_VS_COMPETITORS_PAGE_TITLE;
    document.documentElement.style.overflowAnchor = 'none';
    document.body.style.overflowAnchor = 'none';
    window.history.scrollRestoration = 'manual';

    const mergedHtmlClasses = Array.from(
      new Set(
        `${previousHtmlClassName} ${DEEL_VS_COMPETITORS_HTML_CLASSES}`
          .split(/\s+/)
          .map((className) => className.trim())
          .filter(Boolean),
      ),
    ).join(' ');

    document.documentElement.className = mergedHtmlClasses;

    const cleanupNodes: HTMLElement[] = [];

    DEEL_VS_COMPETITORS_STYLESHEET_HREFS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(LINK_DATA_ATTR, href);
      document.head.appendChild(link);
      cleanupNodes.push(link);
    });

    DEEL_VS_COMPETITORS_INLINE_STYLES.forEach((cssText, index) => {
      const style = document.createElement('style');
      style.setAttribute(STYLE_DATA_ATTR, String(index));
      style.textContent = cssText;
      document.head.appendChild(style);
      cleanupNodes.push(style);
    });

    return () => {
      cleanupNodes.forEach((node) => node.remove());
      document.title = previousTitle;
      document.documentElement.className = previousHtmlClassName;
      document.body.className = previousBodyClassName;
      document.documentElement.style.overflowAnchor = previousHtmlOverflowAnchor;
      document.body.style.overflowAnchor = previousBodyOverflowAnchor;
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && rootRef.current?.contains(activeElement)) {
        activeElement.blur();
      }
    };

    const animationFrameId = window.requestAnimationFrame(() => {
      scrollToTop();
      window.requestAnimationFrame(scrollToTop);
    });

    const timeoutIds = [0, 120, 360].map((delay) => window.setTimeout(scrollToTop, delay));

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const heroDescription = root.querySelector<HTMLElement>('#heroCentered .mui-o4h2l7');
    if (heroDescription) {
      heroDescription.textContent =
        'We bring together powerful integrations, connected workflows, dedicated support, and more to help you efficiently streamline operations, improve team productivity, and scale your business with confidence.';
    }

    const proofGraphic = root.querySelector<HTMLImageElement>(
      'img[src*="Hug_Bound_75aff069ed-7a07081e18.svg"]',
    );
    if (proofGraphic) {
      proofGraphic.src = '/dechub-bridge-vs-competitors/dechub-bridge-compare-1.png';
      proofGraphic.srcset = '/dechub-bridge-vs-competitors/dechub-bridge-compare-1.png 640w';
      proofGraphic.alt = 'One connected platform for HR, payroll, IT, hiring, and workflows';
    }

    const proofSection = proofGraphic?.closest('.mui-mpqocb');
    const proofButtons = proofSection?.querySelectorAll<HTMLButtonElement>('.mui-wsfch7 button');
    const proofAnchor = proofSection?.querySelector<HTMLAnchorElement>('.mui-wsfch7 a');

    if (proofButtons?.[0]) {
      proofButtons[0].textContent = 'Book a demo';
    }

    if (proofButtons?.[1]) {
      proofButtons[1].remove();
    }

    if (proofAnchor) {
      proofAnchor.href = '/book-a-demo';
      proofAnchor.target = '_self';
      proofAnchor.removeAttribute('aria-disabled');
      proofAnchor.style.pointerEvents = '';
    }

    const strengthCards = root.querySelectorAll<HTMLElement>('.mui-12z3uld > .mui-75v203 > .mui-n90dtd');
    const scalabilityCard = strengthCards[0];
    if (scalabilityCard) {
      const leftEyebrow = scalabilityCard.querySelector<HTMLElement>('.mui-qbzoaa');
      const leftHeadline = scalabilityCard.querySelector<HTMLElement>('.mui-1h3xmcn');
      const leftParagraph = scalabilityCard.querySelector<HTMLElement>('.mui-1c732k9 .mui-o4h2l7');

      if (leftEyebrow) {
        leftEyebrow.textContent = 'Scalability';
      }

      if (leftHeadline) {
        leftHeadline.textContent = 'Scale with confidence at every stage';
      }

      if (leftParagraph) {
        leftParagraph.textContent =
          'Dechub Bridge is built to support your business as it grows. From evolving workflows to increasing operational demands, the platform gives teams the flexibility, structure, and visibility they need to scale efficiently without relying on disconnected systems.';
      }
    }

    const scalabilityRowTextMap = new Map<string, string>([
      [
        'Hire and pay everyone with in-house services for EOR, contractors, PEO, immigration, US payroll, local payroll, and global payroll',
        'Manage operations more efficiently with connected workflows, automation, and tools that support growing business needs',
      ],
      [
        'Manage and develop your entire workforce with a suite of products for compensation, workforce planning, talent sourcing, and talent management',
        'Improve team coordination with solutions that simplify planning, execution, and day-to-day operational management',
      ],
      [
        'Get Deel’s expert services for entity setup, new market expansion, equity consulting, and more',
        'Access expert support for process improvement, operational expansion, system alignment, and business efficiency initiatives',
      ],
      [
        'Expert services for entity setup, new market expansion, equity consulting, and more',
        'Get practical guidance for scaling operations, improving internal systems, and managing change more effectively',
      ],
      [
        'Get alerts on new regulations and potential violations in 150+ countries with a dedicated compliance hub',
        'Gain better visibility into process risks, operational gaps, and areas that need attention',
      ],
      [
        'Locally compliant document collection for EOR employees and contractors in 150+ countries constantly reviewed and updated',
        'Maintain accurate, organized, and up-to-date operational records across teams and workflows',
      ],
    ]);

    root.querySelectorAll<HTMLElement>('.mui-1ya6hls').forEach((row) => {
      const currentText = row.textContent?.replace(/\s+/g, ' ').trim();
      if (!currentText) {
        return;
      }

      const replacementText = scalabilityRowTextMap.get(currentText);
      if (replacementText) {
        row.textContent = replacementText;
      }
    });

    const coverageCard = strengthCards[1];
    if (coverageCard) {
      const leftEyebrow = coverageCard.querySelector<HTMLElement>('.mui-qbzoaa');
      const leftHeadline = coverageCard.querySelector<HTMLElement>('.mui-1h3xmcn');
      const leftParagraph = coverageCard.querySelector<HTMLElement>('.mui-1c732k9 .mui-o4h2l7');

      if (leftEyebrow) {
        leftEyebrow.textContent = 'Coverage';
      }

      if (leftHeadline) {
        leftHeadline.textContent = 'One platform. Unlimited skills. Broader workforce coverage.';
      }

      if (leftParagraph) {
        leftParagraph.textContent =
          'Dechub Bridge gives businesses access to a wider range of pre-vetted talent through one managed platform. From AI engineers and developers to marketers, analysts, designers, operations, and support roles, Bridge helps teams cover critical business functions faster and with greater confidence.';
      }
    }

    const coverageRowTextMap = new Map<string, string>([
      [
        'Owns a network of entities in 150+ countries',
        'Access pre-vetted talent across technical, creative, operational, and business functions',
      ],
      [
        'In-house operated payroll and professionals in every country they provide services to ensure direct support and maintain uniform standards.',
        'Support everything from individual hires to full delivery teams through one platform',
      ],
      [
        'In-house immigration services in 50+ countries, including the United States, Canada, and the United Arab Emirates',
        'Match business requirements faster with AI-powered skill discovery and human validation',
      ],
      [
        'Single native payroll calculation engine across 50+ countries',
        'Reduce hiring gaps across growth, product, engineering, operations, and support roles',
      ],
      [
        'Real-time payroll for instant G2N calculations and faster payroll processing in 50+ countries',
        'Expand workforce capacity without depending on fragmented hiring channels',
      ],
      [
        'In-house service to automate IT operations and logistics for employee equipment from deployment to end-of-life in 130+ countries',
        'Build stronger execution with talent coverage aligned to real business outcomes',
      ],
    ]);

    root.querySelectorAll<HTMLElement>('.mui-1ya6hls').forEach((row) => {
      const currentText = row.textContent?.replace(/\s+/g, ' ').trim();
      if (!currentText) {
        return;
      }

      const replacementText = coverageRowTextMap.get(currentText);
      if (replacementText) {
        row.textContent = replacementText;
      }
    });

    const embeddedG2Widget = root.querySelector<HTMLIFrameElement>('#g2-crowd-widget-default');
    const g2WidgetContainer = embeddedG2Widget?.parentElement;
    const g2WidgetCallToAction = embeddedG2Widget
      ?.closest('.mui-mpqocb')
      ?.querySelector<HTMLAnchorElement>('a[href="#"]');

    if (embeddedG2Widget) {
      embeddedG2Widget.remove();
    }

    if (g2WidgetContainer && !g2WidgetContainer.textContent?.trim()) {
      g2WidgetContainer.remove();
    }

    if (g2WidgetCallToAction) {
      g2WidgetCallToAction.removeAttribute('href');
      g2WidgetCallToAction.setAttribute('role', 'button');
      g2WidgetCallToAction.setAttribute('aria-disabled', 'true');
      g2WidgetCallToAction.style.pointerEvents = 'none';
    }

    const handleAnchorClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const anchor = target.closest('a[href]');
      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (normalizeLabel(anchor.textContent) === 'book a demo') {
        return;
      }

      const rawHref = anchor.getAttribute('href')?.trim() ?? '';
      if (!rawHref || rawHref === '#' || rawHref === '#!') {
        event.preventDefault();
        return;
      }

      if (anchor.target === '_blank' || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      let url: URL;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) {
        return;
      }

      event.preventDefault();
      const nextUrl = `${normalizePathname(url.pathname)}${url.search}${url.hash}`;
      const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`;

      if (nextUrl !== currentUrl) {
        window.history.pushState({}, '', nextUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    const cleanupExploreMoreSlider = wireSlider(root, 'nav-explore-more', 'explore-more');
    const cleanupTestimonialsSlider = wireSlider(root, 'nav-testimonials-slider-832', 'testimonials-slider-832');

    root.addEventListener('click', handleAnchorClick);

    return () => {
      root.removeEventListener('click', handleAnchorClick);
      cleanupExploreMoreSlider();
      cleanupTestimonialsSlider();
    };
  }, []);

  return (
    <SharedLandingPageLayout>
      <div ref={rootRef} data-page="deel-vs-competitors-react" style={{ overflowAnchor: 'none' }}>
        <DeelVsCompetitorsContent />
      </div>
    </SharedLandingPageLayout>
  );
}
