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
