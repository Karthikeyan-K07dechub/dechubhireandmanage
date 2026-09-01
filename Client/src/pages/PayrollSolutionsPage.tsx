import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  PAYROLL_SOLUTIONS_HTML_CLASSES,
  PAYROLL_SOLUTIONS_INLINE_STYLES,
  PAYROLL_SOLUTIONS_PAGE_TITLE,
  PAYROLL_SOLUTIONS_STYLESHEET_HREFS,
  PayrollSolutionsContent,
} from './payrollSolutions/generatedPageData';
import SharedLandingPageLayout from '../components/common/SharedLandingPageLayout';
import Section02 from '../landing_deel/components/Section02.jsx';
import Section07 from '../landing_deel/components/Section07.jsx';

const STYLE_DATA_ATTR = 'data-payroll-solutions-style';
const LINK_DATA_ATTR = 'data-payroll-solutions-stylesheet';
const PAYROLL_HERO_LAYOUT_FIXES = `
  html:has(.payroll-solutions-page),
  body:has(.payroll-solutions-page) {
    max-width: 100%;
    overflow-x: hidden;
  }

  .payroll-solutions-page,
  .payroll-solutions-page > .w-full {
    width: 100%;
    max-width: 100vw;
    overflow-x: clip;
  }

  .payroll-solutions-page section {
    max-width: 100%;
  }

  .payroll-solutions-page > .w-full > section:first-child {
    width: 100%;
    overflow: hidden;
    padding: 12px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child > div {
    width: 100% !important;
    max-width: 1704px !important;
    min-width: 0;
    margin-inline: auto !important;
  }

  .payroll-solutions-page > .w-full > section:first-child > div > div {
    min-width: 0;
    overflow: hidden;
  }

  .payroll-solutions-page > .w-full > section:first-child > div > div:first-child {
    padding: 24px 20px 32px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child h1 {
    display: block !important;
    margin: 0 0 28px !important;
    color: #fff !important;
  }

  .payroll-solutions-page > .w-full > section:first-child [role="group"] {
    display: flex !important;
    flex-direction: column !important;
    gap: 12px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child [role="group"] > div {
    display: flex !important;
    gap: 12px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child [role="checkbox"] {
    min-height: 72px !important;
    padding: 12px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child [role="group"] + div {
    margin-top: 24px !important;
  }

  .payroll-solutions-page > .w-full > section:first-child [role="group"] + div + div {
    display: none !important;
  }

  .payroll-solutions-page > .w-full > section:first-child h1 + div > p {
    transform: translateY(-8px);
  }

  .payroll-solutions-page .payroll-generated-logo-strip {
    display: none !important;
  }

  .payroll-solutions-page .payroll-generated-key-figures {
    display: none !important;
  }

  .payroll-solutions-page .mui-16f0pz5 .mui-1si5xjn {
    display: none !important;
  }

  .payroll-solutions-page .payroll-landing-logo-strip-mount,
  .payroll-solutions-page .deel-logo-strip,
  .payroll-solutions-page .deel-logo-strip__viewport {
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .payroll-solutions-page .deel-logo-strip__track {
    min-width: max-content;
  }

  .payroll-product-needs-section {
    width: 100%;
    overflow: hidden;
    padding: 12px !important;
  }

  .payroll-product-needs-section > div {
    width: 100%;
    max-width: none;
    margin-inline: 0;
    padding: 64px clamp(24px, 6vw, 112px) !important;
  }

  .payroll-product-needs-section > div > div {
    width: 100% !important;
    max-width: 1312px !important;
    margin-inline: auto !important;
  }

  .payroll-product-needs-section .MuiTabs-scroller {
    overflow-x: auto !important;
    scrollbar-width: none;
  }

  .payroll-product-needs-section .MuiTabs-scroller::-webkit-scrollbar {
    display: none;
  }

  .payroll-product-needs-section [role="tablist"] {
    width: max-content !important;
    min-width: max-content;
    margin-inline: auto !important;
  }

  .payroll-product-needs-section .MuiTabs-root + div > div {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 48px !important;
  }

  .payroll-product-needs-section .MuiTabs-root + div > div > div {
    width: auto !important;
    min-width: 0 !important;
    flex: initial !important;
  }

  /* Product CTA banner: restore the original centered desktop frame and padding. */
  .payroll-solutions-page section[id="4"] {
    padding: clamp(40px, 4.8vw, 92px) clamp(24px, 3.125vw, 60px) clamp(48px, 5vw, 96px) !important;
    margin-bottom: 0 !important;
    background: #fff !important;
  }

  .payroll-solutions-page section[id="4"] + .MuiBox-root {
    margin-top: 0 !important;
  }

  .payroll-solutions-page section[id="4"] > div:first-child {
    width: 100% !important;
    max-width: 1776px !important;
    min-height: 718px !important;
    margin-inline: auto !important;
    border-radius: 30px !important;
  }

  .payroll-solutions-page section[id="4"] > div:first-child > div:first-child {
    height: 100% !important;
    padding-inline: clamp(32px, 3.125vw, 60px) !important;
  }

  @media (max-width: 1199px) {
    .payroll-solutions-page section[id="4"] > div:first-child {
      min-height: 600px !important;
    }
  }

  @media (max-width: 700px) {
    .payroll-solutions-page section[id="4"] {
      padding: 32px 16px 48px !important;
    }

    .payroll-solutions-page section[id="4"] > div:first-child {
      min-height: 620px !important;
      border-radius: 20px !important;
    }

    .payroll-solutions-page section[id="4"] > div:first-child > div:first-child {
      padding: 48px 24px 24px !important;
    }

    .payroll-solutions-page section[id="4"] > div:first-child > div:first-child > div:first-child {
      align-items: center !important;
      text-align: center !important;
    }

    .payroll-solutions-page section[id="4"] h2 {
      text-align: center !important;
    }

    .payroll-solutions-page section[id="4"] h2 + div {
      justify-content: center !important;
    }

    .payroll-solutions-page .mui-3lz68q {
      grid-template-columns: minmax(0, 1fr) !important;
    }

    .payroll-solutions-page .mui-3lz68q > .mui-pjjft1 {
      grid-column: auto !important;
      padding-right: 0 !important;
    }
  }

  @media (max-width: 1049px) {
    .payroll-solutions-page > .w-full > section:first-child > div {
      flex-direction: column !important;
      min-height: auto !important;
    }

    .payroll-solutions-page > .w-full > section:first-child > div > div:first-child,
    .payroll-solutions-page > .w-full > section:first-child > div > div:last-child {
      width: 100% !important;
    }

    .payroll-solutions-page > .w-full > section:first-child > div > div:last-child {
      display: none !important;
    }

    .payroll-solutions-page > .w-full > section:first-child h1 {
      font-size: 38px !important;
      line-height: 1.05 !important;
      overflow-wrap: anywhere;
    }

    .payroll-product-needs-section > div {
      padding: 48px 20px !important;
    }

    .payroll-product-needs-section [role="tablist"] {
      margin-inline: 0 !important;
    }

    .payroll-product-needs-section .MuiTabs-root + div > div {
      grid-template-columns: minmax(0, 1fr);
      gap: 20px !important;
    }

    .payroll-product-needs-section .MuiTabs-root + div > div > div:first-child {
      padding: 24px !important;
    }
  }

  @media (min-width: 1050px) {
    .payroll-solutions-page > .w-full > section:first-child > div {
      display: flex !important;
      flex-direction: row !important;
    }

    .payroll-solutions-page > .w-full > section:first-child > div > div:first-child,
    .payroll-solutions-page > .w-full > section:first-child > div > div:last-child {
      width: 50% !important;
      flex: 0 1 50% !important;
    }

    .payroll-solutions-page > .w-full > section:first-child > div > div:first-child {
      display: flex !important;
      padding: 64px !important;
    }

    .payroll-solutions-page > .w-full > section:first-child > div > div:first-child > div:first-child {
      width: 100% !important;
      max-width: 450px !important;
      margin: auto !important;
      align-items: center !important;
      justify-content: center !important;
      text-align: center !important;
    }

    .payroll-solutions-page > .w-full > section:first-child h1 {
      margin-bottom: 48px !important;
      text-align: center !important;
    }

    .payroll-solutions-page > .w-full > section:first-child h1 + div,
    .payroll-solutions-page > .w-full > section:first-child h1 + div > p {
      text-align: center !important;
    }

    .payroll-solutions-page > .w-full > section:first-child [role="checkbox"] {
      min-height: 80px !important;
    }
  }
`;
const PAYROLL_PRODUCT_TAB_LABELS = [
  'Deel Payroll',
  'EOR',
  'PEO',
  'Contractor',
  'Local Payroll',
  'Payroll Connect',
  'Expense Management',
  'Benefits',
  'AI Agent',
] as const;

const PAYROLL_PRODUCT_TABS: Record<
  (typeof PAYROLL_PRODUCT_TAB_LABELS)[number],
  {
    title: string;
    description: string;
    ctaLabel: string;
    ctaLink: string;
    imageSrc: string;
  }
> = {
  'Deel Payroll': {
    title: 'For companies running payroll through their own entities',
    description:
      'Run multi-country payroll for employees and contractors. Self-serve or fully managed.',
    ctaLabel: 'Book a demo',
    ctaLink: '/solutions/payroll/',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  EOR: {
    title: 'Employer of Record',
    description: 'Hire and pay teams globally',
    ctaLabel: 'Explore EOR',
    ctaLink: '/solutions/payroll/eor',
    imageSrc: '/solutions/payroll/eor/assets/images/eor_4c9368273e-e690716c19.webp',
  },
  PEO: {
    title: 'Professional Employer Organization',
    description: 'Support US employees with payroll, benefits, and compliance.',
    ctaLabel: 'Explore PEO',
    ctaLink: '/solutions/payroll/peo',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  Contractor: {
    title: 'Contractor management',
    description: 'Onboard, pay, and manage contractors in one platform.',
    ctaLabel: 'Explore Contractor',
    ctaLink: '/solutions/payroll/contractors',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  'Local Payroll': {
    title: 'Local payroll',
    description: 'Run compliant local payroll with one global system of record.',
    ctaLabel: 'Explore Local Payroll',
    ctaLink: '/solutions/payroll',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  'Payroll Connect': {
    title: 'Payroll Connect',
    description: 'Unify Deel-run and third-party payrolls in one dashboard.',
    ctaLabel: 'Explore Payroll Connect',
    ctaLink: '/solutions/payroll',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  'Expense Management': {
    title: 'Expense management',
    description: 'Track and reimburse global expenses alongside payroll.',
    ctaLabel: 'Explore Expense Management',
    ctaLink: '/solutions/payroll',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  Benefits: {
    title: 'Benefits',
    description: 'Offer localized benefits without managing separate vendors.',
    ctaLabel: 'Explore Benefits',
    ctaLink: '/solutions/benefits',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
  'AI Agent': {
    title: 'AI Agent',
    description: 'Catch anomalies, automate checks, and move payroll faster.',
    ctaLabel: 'Explore AI Agent',
    ctaLink: '/hr-platform/ai',
    imageSrc: '/solutions/payroll/assets/images/Deel_Payroll_f1478e71c3-2a3cd820c9.png',
  },
};

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, '') || '/';
}

function navigateWithinApp(rawHref: string) {
  let url: URL;

  try {
    url = new URL(rawHref, window.location.origin);
  } catch {
    return;
  }

  if (url.origin !== window.location.origin) {
    window.location.assign(url.toString());
    return;
  }

  const nextUrl = `${normalizePathname(url.pathname)}${url.search}${url.hash}`;
  const currentUrl = `${normalizePathname(window.location.pathname)}${window.location.search}${window.location.hash}`;

  if (nextUrl !== currentUrl) {
    window.history.pushState({}, '', nextUrl);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

function wirePayrollProductTabs(root: HTMLElement) {
  const tabList = Array.from(root.querySelectorAll<HTMLElement>('[role="tablist"]')).find((list) => {
    const labels = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).map((tab) =>
      tab.textContent?.trim(),
    );

    return PAYROLL_PRODUCT_TAB_LABELS.every((label) => labels.includes(label));
  });

  if (!tabList) {
    return () => undefined;
  }

  const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const sectionContent = tabList.closest('.MuiTabs-root')?.nextElementSibling as HTMLElement | null;
  const titleNode = sectionContent?.querySelector<HTMLElement>('h5');
  const descriptionNode = sectionContent?.querySelector<HTMLElement>('p');
  const ctaButton = Array.from(sectionContent?.querySelectorAll<HTMLButtonElement>('button') ?? []).find(
    (button) => button.textContent?.trim(),
  );
  const imageNode = sectionContent?.querySelector<HTMLImageElement>('img');
  const indicator =
    tabList.querySelector<HTMLElement>('.MuiTabs-indicator') ?? document.createElement('span');

  if (!sectionContent || !titleNode || !descriptionNode || !ctaButton || !imageNode || tabs.length === 0) {
    return () => undefined;
  }

  indicator.className ||= 'MuiTabs-indicator mui-ttwr4n';
  ctaButton.style.cursor = 'pointer';

  let activeLink = PAYROLL_PRODUCT_TABS['Deel Payroll'].ctaLink;

  const activateTab = (tab: HTMLButtonElement) => {
    const normalizedLabel = (tab.textContent ?? '').trim().replace(/\s+/g, ' ') as
      | keyof typeof PAYROLL_PRODUCT_TABS
      | '';

    if (!normalizedLabel || !(normalizedLabel in PAYROLL_PRODUCT_TABS)) {
      return;
    }

    const nextContent = PAYROLL_PRODUCT_TABS[normalizedLabel];
    activeLink = nextContent.ctaLink;

    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
      candidate.setAttribute('tabindex', selected ? '0' : '-1');
      candidate.classList.toggle('Mui-selected', selected);
    });

    titleNode.textContent = nextContent.title;
    descriptionNode.textContent = nextContent.description;
    ctaButton.textContent = nextContent.ctaLabel;
    ctaButton.setAttribute('data-route', nextContent.ctaLink);
    imageNode.src = nextContent.imageSrc;
    imageNode.setAttribute('srcset', nextContent.imageSrc);
    imageNode.alt = nextContent.title;

    if (indicator.parentElement !== tab) {
      indicator.remove();
      tab.appendChild(indicator);
    }
  };

  const handleCtaClick = () => {
    navigateWithinApp(activeLink);
  };

  ctaButton.addEventListener('click', handleCtaClick);

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
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateTab(tab);
        return;
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

  const initiallySelected =
    tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') ?? tabs[0];
  activateTab(initiallySelected);

  return () => {
    ctaButton.removeEventListener('click', handleCtaClick);
    disposers.forEach((dispose) => dispose());
  };
}

function wireCustomerStoriesSlider(root: HTMLElement) {
  const slider = root.querySelector<HTMLElement>('#comparison-slider');
  const wrapper = slider?.querySelector<HTMLElement>('.swiper-wrapper');
  const previousButton = root.querySelector<HTMLButtonElement>('#nav-comparison-slider .swiper-button-prev');
  const nextButton = root.querySelector<HTMLButtonElement>('#nav-comparison-slider .swiper-button-next');
  const telinSlide = Array.from(wrapper?.querySelectorAll<HTMLElement>(':scope > .swiper-slide') ?? []).find(
    (slide) => slide.textContent?.includes('How Telin cut onboarding time'),
  );

  telinSlide?.remove();

  const slides = wrapper
    ? Array.from(wrapper.querySelectorAll<HTMLElement>(':scope > .swiper-slide'))
    : [];

  if (!slider || !wrapper || !previousButton || !nextButton || slides.length === 0) {
    return () => undefined;
  }

  const gap = 24;

  // Keep the browser responsible for the track geometry. The controls scroll to
  // real card offsets, which remains correct at every viewport size.
  slider.style.overflowX = 'auto';
  slider.style.overflowY = 'hidden';
  slider.style.scrollBehavior = 'smooth';
  slider.style.scrollSnapType = 'x mandatory';
  slider.style.scrollbarWidth = 'none';
  wrapper.style.display = 'flex';
  wrapper.style.width = 'max-content';
  wrapper.style.minWidth = '100%';
  wrapper.style.gap = `${gap}px`;
  wrapper.style.transform = 'none';
  wrapper.style.transition = 'none';

  const updateLayout = () => {
    const cardWidth = Math.min(380, Math.max(280, slider.clientWidth - 24));

    slides.forEach((slide) => {
      slide.style.flex = `0 0 ${cardWidth}px`;
      slide.style.width = `${cardWidth}px`;
      slide.style.maxWidth = 'none';
      slide.style.minWidth = '0';
      slide.style.marginRight = '0';
      slide.style.boxSizing = 'border-box';
      slide.style.scrollSnapAlign = 'start';

      const storyLink = slide.querySelector<HTMLAnchorElement>(':scope > a');
      const storyCard = storyLink?.querySelector<HTMLElement>('.MuiCard-root');
      const storyContent = storyCard?.querySelector<HTMLElement>('.MuiCardContent-root');
      const storyTitle = storyCard?.querySelector<HTMLElement>('h3');
      const titleWrapper = storyTitle?.parentElement as HTMLElement | null;

      if (storyLink) {
        storyLink.style.display = 'block';
        storyLink.style.width = '100%';
      }

      if (storyCard) {
        storyCard.style.width = '100%';
        storyCard.style.minWidth = '0';
        storyCard.style.boxSizing = 'border-box';
      }

      if (storyContent) {
        storyContent.style.width = '100%';
        storyContent.style.boxSizing = 'border-box';
      }

      if (titleWrapper) {
        titleWrapper.style.width = '100%';
        titleWrapper.style.minWidth = '0';
        titleWrapper.style.alignSelf = 'stretch';
      }

      if (storyTitle) {
        storyTitle.style.width = '100%';
        storyTitle.style.whiteSpace = 'normal';
        storyTitle.style.overflowWrap = 'normal';
      }
    });

    updateControls();
  };

  const updateControls = () => {
    const lastScrollPosition = Math.max(0, slider.scrollWidth - slider.clientWidth);
    previousButton.disabled = slider.scrollLeft <= 1;
    nextButton.disabled = slider.scrollLeft >= lastScrollPosition - 1;
    previousButton.setAttribute('aria-disabled', String(previousButton.disabled));
    nextButton.setAttribute('aria-disabled', String(nextButton.disabled));
  };

  const handlePrevious = () => {
    const target = [...slides].reverse().find((slide) => slide.offsetLeft < slider.scrollLeft - 1);
    slider.scrollTo({ left: target?.offsetLeft ?? 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    const target = slides.find((slide) => slide.offsetLeft > slider.scrollLeft + 1);
    slider.scrollTo({ left: target?.offsetLeft ?? slider.scrollWidth, behavior: 'smooth' });
  };

  previousButton.addEventListener('click', handlePrevious);
  nextButton.addEventListener('click', handleNext);
  slider.addEventListener('scroll', updateControls, { passive: true });
  window.addEventListener('resize', updateLayout);
  updateLayout();

  return () => {
    previousButton.removeEventListener('click', handlePrevious);
    nextButton.removeEventListener('click', handleNext);
    slider.removeEventListener('scroll', updateControls);
    window.removeEventListener('resize', updateLayout);
  };
}

function wirePayrollFaqs(root: HTMLElement) {
  const summaries = Array.from<HTMLElement>(
    root.querySelectorAll('.product-faqs .MuiAccordionSummary-root[role="button"]'),
  );

  if (summaries.length === 0) {
    return () => undefined;
  }

  const setExpanded = (summary: HTMLElement, expanded: boolean) => {
    const accordion = summary.parentElement;
    const panel = accordion?.querySelector<HTMLElement>('.MuiCollapse-root');
    const panelContent = panel?.querySelector<HTMLElement>('.MuiCollapse-wrapperInner');

    if (!panel || !panelContent) {
      return;
    }

    summary.setAttribute('aria-expanded', String(expanded));
    summary.classList.toggle('Mui-expanded', expanded);
    panel.classList.toggle('MuiCollapse-hidden', !expanded);
    panel.style.visibility = expanded ? 'visible' : 'hidden';
    panel.style.height = expanded ? `${panelContent.scrollHeight}px` : '0px';

    const expandIcon = summary.querySelector<HTMLElement>('.expandIconWrapper');
    const collapseIcon = summary.querySelector<HTMLElement>('.collapseIconWrapper');
    if (expandIcon) {
      expandIcon.style.display = expanded ? 'block' : 'none';
    }
    if (collapseIcon) {
      collapseIcon.style.display = expanded ? 'none' : 'block';
    }
  };

  const disposers = summaries.map((summary) => {
    const handleToggle = () => {
      const willExpand = summary.getAttribute('aria-expanded') !== 'true';
      summaries.forEach((candidate) => setExpanded(candidate, candidate === summary && willExpand));
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    };

    summary.style.cursor = 'pointer';
    summary.addEventListener('click', handleToggle);
    summary.addEventListener('keydown', handleKeyDown);
    setExpanded(summary, false);

    return () => {
      summary.removeEventListener('click', handleToggle);
      summary.removeEventListener('keydown', handleKeyDown);
    };
  });

  return () => disposers.forEach((dispose) => dispose());
}

function wirePayrollReviewSlider(root: HTMLElement) {
  const slider = root.querySelector<HTMLElement>('#g2-reviews-671');
  const wrapper = slider?.querySelector<HTMLElement>('.swiper-wrapper');
  const previousButton = root.querySelector<HTMLButtonElement>('#nav-g2-reviews-671 .swiper-button-prev');
  const nextButton = root.querySelector<HTMLButtonElement>('#nav-g2-reviews-671 .swiper-button-next');

  if (!wrapper || !previousButton || !nextButton) {
    return () => undefined;
  }

  const handlePrevious = () => {
    const lastReview = wrapper.lastElementChild;
    if (lastReview) {
      wrapper.insertBefore(lastReview, wrapper.firstElementChild);
    }
  };

  const handleNext = () => {
    const firstReview = wrapper.firstElementChild;
    if (firstReview) {
      wrapper.appendChild(firstReview);
    }
  };

  previousButton.style.cursor = 'pointer';
  nextButton.style.cursor = 'pointer';
  previousButton.addEventListener('click', handlePrevious);
  nextButton.addEventListener('click', handleNext);

  return () => {
    previousButton.removeEventListener('click', handlePrevious);
    nextButton.removeEventListener('click', handleNext);
  };
}

export default function PayrollSolutionsPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [landingLogoStripTarget, setLandingLogoStripTarget] = useState<HTMLDivElement | null>(null);
  const [landingKeyFiguresTarget, setLandingKeyFiguresTarget] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClassName = document.documentElement.className;
    const previousBodyClassName = document.body.className;

    document.title = PAYROLL_SOLUTIONS_PAGE_TITLE;

    const mergedHtmlClasses = Array.from(
      new Set(
        `${previousHtmlClassName} ${PAYROLL_SOLUTIONS_HTML_CLASSES}`
          .split(/\s+/)
          .map((className) => className.trim())
          .filter(Boolean),
      ),
    ).join(' ');

    document.documentElement.className = mergedHtmlClasses;

    const cleanupNodes: HTMLElement[] = [];

    PAYROLL_SOLUTIONS_STYLESHEET_HREFS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(LINK_DATA_ATTR, href);
      document.head.appendChild(link);
      cleanupNodes.push(link);
    });

    PAYROLL_SOLUTIONS_INLINE_STYLES.forEach((cssText, index) => {
      const style = document.createElement('style');
      style.setAttribute(STYLE_DATA_ATTR, String(index));
      style.textContent = cssText;
      document.head.appendChild(style);
      cleanupNodes.push(style);
    });

    const heroLayoutStyle = document.createElement('style');
    heroLayoutStyle.setAttribute(STYLE_DATA_ATTR, 'hero-layout-fixes');
    heroLayoutStyle.textContent = PAYROLL_HERO_LAYOUT_FIXES;
    document.head.appendChild(heroLayoutStyle);
    cleanupNodes.push(heroLayoutStyle);

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
      navigateWithinApp(url.toString());
    };

    const cleanupPayrollTabs = wirePayrollProductTabs(root);
    const cleanupCustomerStoriesSlider = wireCustomerStoriesSlider(root);
    const cleanupPayrollFaqs = wirePayrollFaqs(root);
    const cleanupPayrollReviewSlider = wirePayrollReviewSlider(root);

    root.addEventListener('click', handleAnchorClick);

    return () => {
      root.removeEventListener('click', handleAnchorClick);
      cleanupPayrollTabs();
      cleanupCustomerStoriesSlider();
      cleanupPayrollFaqs();
      cleanupPayrollReviewSlider();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const heading = Array.from(root?.querySelectorAll('h2') ?? []).find(
      (node) => node.textContent?.trim() === 'A product fit for every need',
    );
    const section = heading?.closest<HTMLElement>('div[class*="bg-surface-primary"]');

    if (!section) {
      return undefined;
    }

    section.classList.add('payroll-product-needs-section');
    return () => section.classList.remove('payroll-product-needs-section');
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const generatedLogoStrip = root?.querySelector<HTMLElement>('section.logo-stripe-standard-wrapper');

    if (!generatedLogoStrip?.parentElement) {
      return undefined;
    }

    const mount = document.createElement('div');
    mount.className = 'payroll-landing-logo-strip-mount';
    generatedLogoStrip.classList.add('payroll-generated-logo-strip');
    generatedLogoStrip.parentElement.insertBefore(mount, generatedLogoStrip);
    setLandingLogoStripTarget(mount);

    return () => {
      generatedLogoStrip.classList.remove('payroll-generated-logo-strip');
      mount.remove();
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const generatedKeyFigures = Array.from(root?.querySelectorAll<HTMLElement>('div.key-figures-wrapper') ?? []).find(
      (section) =>
        section.querySelector('h3')?.textContent?.trim() ===
        'Deel makes growing remote and international teams effortless',
    );

    if (!generatedKeyFigures?.parentElement) {
      return undefined;
    }

    const mount = document.createElement('div');
    mount.className = 'payroll-landing-key-figures-mount';
    generatedKeyFigures.classList.add('payroll-generated-key-figures');
    generatedKeyFigures.parentElement.insertBefore(mount, generatedKeyFigures);
    setLandingKeyFiguresTarget(mount);

    return () => {
      generatedKeyFigures.classList.remove('payroll-generated-key-figures');
      mount.remove();
    };
  }, []);

  return (
    <SharedLandingPageLayout>
      <div ref={rootRef} className="payroll-solutions-page" data-page="payroll-solutions-react">
        <PayrollSolutionsContent />
        {landingLogoStripTarget ? createPortal(<Section02 />, landingLogoStripTarget) : null}
        {landingKeyFiguresTarget ? createPortal(<Section07 />, landingKeyFiguresTarget) : null}
      </div>
    </SharedLandingPageLayout>
  );
}
