import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  DEEL_HIRE_HTML_CLASSES,
  DEEL_HIRE_INLINE_STYLES,
  DEEL_HIRE_PAGE_TITLE,
  DEEL_HIRE_STYLESHEET_HREFS,
  DeelHireContent,
} from './deelHire/generatedPageData';
import SharedLandingPageLayout from '../components/common/SharedLandingPageLayout';

const STYLE_DATA_ATTR = 'data-deel-hire-style';
const LINK_DATA_ATTR = 'data-deel-hire-stylesheet';
const HIRE_TAB_LABELS = ['Technology', 'Professional Services', 'Finance & Fintech'] as const;

const HIRE_TABS: Record<
  (typeof HIRE_TAB_LABELS)[number],
  { title: string; description: string; imageSrc: string }
> = {
  Technology: {
    title: 'Access a larger pool of skilled candidates',
    description:
      'Hire engineers, designers, and product teams across time zones with fast onboarding and flexible hiring models.',
    imageSrc: '/solutions/hire/assets/images/Technology_e5f72c1f25-46e3402737.png',
  },
  'Professional Services': {
    title: 'Hire specialists quickly',
    description:
      'Bring on consultants and contractors quickly with clear agreements and smooth onboarding, wherever they’re located.',
    imageSrc: '/solutions/hire/assets/images/Professional_Services_ae94d6160e-47aca41df0.png',
  },
  'Finance & Fintech': {
    title: 'Build a borderless, teams complaintly',
    description:
      'Scale globally while meeting strict compliance requireme-nts for hiring, verification, and worker classification.',
    imageSrc: '/solutions/hire/assets/images/Finance_and_Fintech_20b01b8318-2cfc7bbb76.png',
  },
};

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
  const handlePrevious = () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  const handleNext = () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });

  previousButton.addEventListener('click', handlePrevious);
  nextButton.addEventListener('click', handleNext);

  return () => {
    previousButton.removeEventListener('click', handlePrevious);
    nextButton.removeEventListener('click', handleNext);
  };
}

function wireHireIndustryTabs(root: HTMLElement) {
  const tabList = Array.from(root.querySelectorAll<HTMLElement>('[role="tablist"]')).find((list) => {
    const labels = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).map((tab) =>
      tab.textContent?.trim(),
    );

    return HIRE_TAB_LABELS.every((label) => labels.includes(label));
  });

  if (!tabList) {
    return () => undefined;
  }

  const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const sectionContent = tabList.closest('.MuiTabs-root')?.nextElementSibling as HTMLElement | null;
  const titleNode = sectionContent?.querySelector<HTMLElement>('h5');
  const descriptionNode = sectionContent?.querySelector<HTMLElement>('p');
  const imageNode = sectionContent?.querySelector<HTMLImageElement>('img');
  const indicator =
    tabList.querySelector<HTMLElement>('.MuiTabs-indicator') ?? document.createElement('span');

  if (!sectionContent || !titleNode || !descriptionNode || !imageNode || tabs.length === 0) {
    return () => undefined;
  }

  indicator.className ||= 'MuiTabs-indicator mui-ttwr4n';

  const activateTab = (tab: HTMLButtonElement) => {
    const label = tab.textContent?.trim() as keyof typeof HIRE_TABS | undefined;
    if (!label || !(label in HIRE_TABS)) {
      return;
    }

    const nextContent = HIRE_TABS[label];

    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
      candidate.setAttribute('tabindex', selected ? '0' : '-1');
      candidate.classList.toggle('Mui-selected', selected);
    });

    titleNode.textContent = nextContent.title;
    descriptionNode.textContent = nextContent.description;
    imageNode.src = nextContent.imageSrc;
    imageNode.setAttribute('srcset', nextContent.imageSrc);

    if (indicator.parentElement !== tab) {
      indicator.remove();
      tab.appendChild(indicator);
    }
  };

  const disposers = tabs.map((tab, index) => {
    const handleClick = () => activateTab(tab);
    const handleKeyDown = (event: KeyboardEvent) => {
      let nextIndex = index;

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      activateTab(nextTab);
      nextTab.focus();
    };

    tab.addEventListener('click', handleClick);
    tab.addEventListener('keydown', handleKeyDown);

    return () => {
      tab.removeEventListener('click', handleClick);
      tab.removeEventListener('keydown', handleKeyDown);
    };
  });

  const selectedTab =
    tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
  activateTab(selectedTab);

  return () => {
    disposers.forEach((dispose) => dispose());
  };
}

export default function DeelHirePage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClassName = document.documentElement.className;
    const previousBodyClassName = document.body.className;

    document.title = DEEL_HIRE_PAGE_TITLE;

    const mergedHtmlClasses = Array.from(
      new Set(
        `${previousHtmlClassName} ${DEEL_HIRE_HTML_CLASSES}`
          .split(/\s+/)
          .map((className) => className.trim())
          .filter(Boolean),
      ),
    ).join(' ');

    document.documentElement.className = mergedHtmlClasses;

    const cleanupNodes: HTMLElement[] = [];

    DEEL_HIRE_STYLESHEET_HREFS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(LINK_DATA_ATTR, href);
      document.head.appendChild(link);
      cleanupNodes.push(link);
    });

    DEEL_HIRE_INLINE_STYLES.forEach((cssText, index) => {
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
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    root.querySelectorAll('header, footer').forEach((element) => {
      element.remove();
    });

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

    const cleanupComparisonSlider = wireSlider(root, 'nav-comparison-slider', 'comparison-slider');
    const cleanupG2ReviewsSlider = wireSlider(root, 'nav-g2-reviews-669', 'g2-reviews-669');
    const cleanupHireTabs = wireHireIndustryTabs(root);

    root.addEventListener('click', handleAnchorClick);

    return () => {
      root.removeEventListener('click', handleAnchorClick);
      cleanupComparisonSlider();
      cleanupG2ReviewsSlider();
      cleanupHireTabs();
    };
  }, []);

  return (
    <SharedLandingPageLayout>
      <div ref={rootRef} data-page="deel-hire-react">
        <DeelHireContent />
      </div>
    </SharedLandingPageLayout>
  );
}
