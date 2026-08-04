import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  PAYROLL_SOLUTIONS_HTML_CLASSES,
  PAYROLL_SOLUTIONS_INLINE_STYLES,
  PAYROLL_SOLUTIONS_PAGE_TITLE,
  PAYROLL_SOLUTIONS_STYLESHEET_HREFS,
  PayrollSolutionsContent,
} from './payrollSolutions/generatedPageData';
import SharedLandingPageLayout from '../components/common/SharedLandingPageLayout';

const STYLE_DATA_ATTR = 'data-payroll-solutions-style';
const LINK_DATA_ATTR = 'data-payroll-solutions-stylesheet';
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

export default function PayrollSolutionsPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

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

    root.addEventListener('click', handleAnchorClick);

    return () => {
      root.removeEventListener('click', handleAnchorClick);
      cleanupPayrollTabs();
    };
  }, []);

  return (
    <SharedLandingPageLayout>
      <div ref={rootRef} data-page="payroll-solutions-react">
        <PayrollSolutionsContent />
      </div>
    </SharedLandingPageLayout>
  );
}
