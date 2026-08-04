import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  DEEL_SERVICES_HTML_CLASSES,
  DEEL_SERVICES_INLINE_STYLES,
  DEEL_SERVICES_PAGE_TITLE,
  DEEL_SERVICES_STYLESHEET_HREFS,
  DeelServicesContent,
} from './deelServices/generatedPageData';
import SharedLandingPageLayout from '../components/common/SharedLandingPageLayout';

const STYLE_DATA_ATTR = 'data-deel-services-style';
const LINK_DATA_ATTR = 'data-deel-services-stylesheet';
const SERVICES_TAB_LABELS = [
  'Corporate Services',
  'Equity and Tokens',
  'Privacy Services',
  'Human Resource Services',
  'Background Checks',
] as const;

const SERVICES_TABS: Record<
  (typeof SERVICES_TAB_LABELS)[number],
  { title: string; description: string; ctaLabel: string; ctaLink: string; imageSrc: string }
> = {
  'Corporate Services': {
    title: 'Run entities worldwide',
    description:
      'Entity setup, foreign employer registration, and ongoing entity management are handled across countries, with filings, deadlines, and local requirements managed on your behalf.',
    ctaLabel: 'Explore Corporate Services',
    ctaLink: '/solutions/services/corporate-services/',
    imageSrc: '/solutions/services/assets/images/Map_73890c8164-dc7a55b32a.png',
  },
  'Equity and Tokens': {
    title: 'Support equity compliantly across borders',
    description:
      'Protect your team from tax risks with expert support for local obligations, ensuring vesting and exercise events are processed with precision.',
    ctaLabel: 'Explore Equity & Token Services',
    ctaLink: '/solutions/services/equity/',
    imageSrc: '/solutions/services/assets/images/Group_2147257378_b7076b3849-50cbc1f516.png',
  },
  'Privacy Services': {
    title: 'Navigate privacy requirements confidently',
    description:
      'Privacy consulting helps interpret data protection requirements, assess risk, and guide compliance decisions as regulations evolve across regions.',
    ctaLabel: 'Explore Privacy Consulting',
    ctaLink: '/solutions/services/privacy/',
    imageSrc: '/solutions/services/assets/images/Group_2147257346_579c25583e-609d81118c.png',
  },
  'Human Resource Services': {
    title: 'Handle complex people matters with expert support',
    description:
      'HR consulting supports sensitive workforce decisions, local employment requirements, and complex scenarios as teams grow in regions.',
    ctaLabel: 'Explore HR Services',
    ctaLink: '/solutions/services/privacy/',
    imageSrc: '/solutions/services/assets/images/Group_2147257472_8e84a1a46c-15e1c68420.png',
  },
  'Background Checks': {
    title: 'Verify workers before they onboard',
    description:
      'Global background checks are completed to verify identity and credentials before workers onboard.',
    ctaLabel: 'Explore Verifications',
    ctaLink: '/solutions/services/verifications/',
    imageSrc: '/solutions/services/assets/images/Group_2147257450_9ca64fb8c8-383b649822.png',
  },
};

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}

function wireSlider(root: HTMLElement) {
  const cleanupFns: Array<() => void> = [];
  const tracks = Array.from(root.querySelectorAll<HTMLElement>('[id]')).filter((element) =>
    element.querySelector('.swiper-wrapper'),
  );

  tracks.forEach((track) => {
    const wrapper = track.querySelector<HTMLElement>('.swiper-wrapper');
    if (!wrapper) {
      return;
    }

    const trackId = track.id;
    const nav = trackId ? root.querySelector<HTMLElement>(`#nav-${trackId}`) : null;
    const previousButton = nav?.querySelector<HTMLButtonElement>('.swiper-button-prev');
    const nextButton = nav?.querySelector<HTMLButtonElement>('.swiper-button-next');

    if (!previousButton || !nextButton) {
      return;
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

    cleanupFns.push(() => {
      previousButton.removeEventListener('click', handlePrevious);
      nextButton.removeEventListener('click', handleNext);
    });
  });

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

function wireTabs(root: HTMLElement) {
  const tabLists = Array.from(root.querySelectorAll<HTMLElement>('[role="tablist"]'));
  const cleanupFns = tabLists.map((tabList, listIndex) => {
    const tabs = Array.from(tabList.querySelectorAll<HTMLElement>('[role="tab"]'));
    if (tabs.length === 0) {
      return () => undefined;
    }

    const tabContainer = tabList.closest('.MuiTabs-root') ?? tabList.parentElement;
    const panels = Array.from(
      tabContainer?.parentElement?.querySelectorAll<HTMLElement>('[role="tabpanel"]') ?? [],
    );

    const activateTab = (nextTab: HTMLElement) => {
      tabs.forEach((tab, tabIndex) => {
        const selected = tab === nextTab;
        const generatedId = tab.id || `deel-services-tab-${listIndex}-${tabIndex}`;
        const generatedPanelId = `deel-services-tabpanel-${listIndex}-${tabIndex}`;

        tab.id = generatedId;
        tab.setAttribute('aria-controls', generatedPanelId);
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.setAttribute('tabindex', selected ? '0' : '-1');
        tab.classList.toggle('Mui-selected', selected);
      });

      panels.forEach((panel, panelIndex) => {
        const linkedTab = tabs[panelIndex];
        const active = linkedTab === nextTab;

        panel.hidden = !active;
        panel.style.display = active ? '' : 'none';
        panel.setAttribute('tabindex', active ? '0' : '-1');

        if (!linkedTab) {
          return;
        }

        const generatedId = linkedTab.id || `deel-services-tab-${listIndex}-${panelIndex}`;
        const generatedPanelId = `deel-services-tabpanel-${listIndex}-${panelIndex}`;

        linkedTab.id = generatedId;
        linkedTab.setAttribute('aria-controls', generatedPanelId);
        panel.id = generatedPanelId;
        panel.setAttribute('aria-labelledby', generatedId);
      });
    };

    const disposers = tabs.map((tab, tabIndex) => {
      tab.id ||= `deel-services-tab-${listIndex}-${tabIndex}`;

      const handleClick = () => activateTab(tab);
      const handleKeyDown = (event: KeyboardEvent) => {
        const currentIndex = tabs.indexOf(tab);

        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          const nextTab = tabs[(currentIndex + 1) % tabs.length];
          activateTab(nextTab);
          nextTab.focus();
          return;
        }

        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          const nextTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
          activateTab(nextTab);
          nextTab.focus();
          return;
        }

        if (event.key === 'Home') {
          event.preventDefault();
          activateTab(tabs[0]);
          tabs[0].focus();
          return;
        }

        if (event.key === 'End') {
          event.preventDefault();
          const nextTab = tabs[tabs.length - 1];
          activateTab(nextTab);
          nextTab.focus();
        }
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
      disposers.forEach((dispose) => dispose());
    };
  });

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

function wireServicesTabs(root: HTMLElement) {
  const tabList = Array.from(root.querySelectorAll<HTMLElement>('[role="tablist"]')).find((list) => {
    const labels = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).map((tab) =>
      tab.textContent?.trim(),
    );

    return SERVICES_TAB_LABELS.every((label) => labels.includes(label));
  });

  if (!tabList) {
    return () => undefined;
  }

  const tabs = Array.from(tabList.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const sectionContent = tabList.closest('.MuiTabs-root')?.nextElementSibling as HTMLElement | null;
  const titleNode = sectionContent?.querySelector<HTMLElement>('h5');
  const descriptionNode = sectionContent?.querySelector<HTMLElement>('p');
  const ctaAnchor = sectionContent?.querySelector<HTMLAnchorElement>('a[href]');
  const ctaButton = ctaAnchor?.querySelector<HTMLButtonElement>('button');
  const imageNode = sectionContent?.querySelector<HTMLImageElement>('img');
  const indicator =
    tabList.querySelector<HTMLElement>('.MuiTabs-indicator') ?? document.createElement('span');

  if (
    !sectionContent ||
    !titleNode ||
    !descriptionNode ||
    !ctaAnchor ||
    !ctaButton ||
    !imageNode ||
    tabs.length === 0
  ) {
    return () => undefined;
  }

  indicator.className ||= 'MuiTabs-indicator mui-ttwr4n';

  const activateTab = (tab: HTMLButtonElement) => {
    const label = tab.textContent?.trim() as keyof typeof SERVICES_TABS | undefined;
    if (!label || !(label in SERVICES_TABS)) {
      return;
    }

    const nextContent = SERVICES_TABS[label];

    tabs.forEach((candidate) => {
      const selected = candidate === tab;
      candidate.setAttribute('aria-selected', selected ? 'true' : 'false');
      candidate.setAttribute('tabindex', selected ? '0' : '-1');
      candidate.classList.toggle('Mui-selected', selected);
    });

    titleNode.textContent = nextContent.title;
    descriptionNode.textContent = nextContent.description;
    ctaAnchor.href = nextContent.ctaLink;
    ctaAnchor.setAttribute('aria-label', ` ${nextContent.ctaLink.replace(/\//g, ' ').trim()} `);

    const buttonLabelNode = Array.from(ctaButton.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    );
    if (buttonLabelNode) {
      buttonLabelNode.textContent = nextContent.ctaLabel;
    } else {
      ctaButton.textContent = nextContent.ctaLabel;
    }

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

function wireAccordions(root: HTMLElement) {
  const accordions = Array.from(root.querySelectorAll<HTMLElement>('.MuiAccordion-root'));

  const cleanupFns = accordions.map((accordion, index) => {
    const summary = accordion.querySelector<HTMLElement>('.MuiAccordionSummary-root');
    const collapse = accordion.querySelector<HTMLElement>('.MuiCollapse-root');
    const region = accordion.querySelector<HTMLElement>('.MuiAccordion-region');
    const details = accordion.querySelector<HTMLElement>('.MuiAccordionDetails-root');

    if (!summary || !collapse || !region || !details) {
      return () => undefined;
    }

    summary.style.display = 'flex';
    summary.style.alignItems = 'center';
    summary.style.justifyContent = 'space-between';
    summary.style.gap = '16px';
    summary.style.width = '100%';

    const ensureIconWrapper = (
      className: 'expandIconWrapper' | 'collapseIconWrapper',
      symbol: string,
    ) => {
      let wrapper = accordion.querySelector<HTMLElement>(`.${className}`);
      if (!wrapper) {
        wrapper = document.createElement('span');
        wrapper.className = className;
        wrapper.setAttribute('aria-hidden', 'true');
        summary.appendChild(wrapper);
      }
      wrapper.replaceChildren();
      wrapper.style.display = 'inline-flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.justifyContent = 'center';
      wrapper.style.width = '34px';
      wrapper.style.height = '34px';
      wrapper.style.minWidth = '34px';
      wrapper.style.borderRadius = '999px';
      wrapper.style.backgroundColor = '#1B1B1B';
      wrapper.style.flexShrink = '0';
      wrapper.style.marginLeft = 'auto';

      const glyph = document.createElement('span');
      glyph.textContent = symbol;
      glyph.style.display = 'block';
      glyph.style.color = '#FFFFFF';
      glyph.style.fontSize = symbol === '+' ? '28px' : '24px';
      glyph.style.fontWeight = '500';
      glyph.style.lineHeight = '1';
      glyph.style.fontFamily = 'Inter, Arial, sans-serif';
      glyph.style.transform = symbol === '+' ? 'translateY(-1px)' : 'translateY(-2px)';

      wrapper.appendChild(glyph);

      return wrapper;
    };

    const expandIcon = ensureIconWrapper('expandIconWrapper', '+');
    const collapseIcon = ensureIconWrapper('collapseIconWrapper', '-');

    const summaryId = `deel-services-accordion-header-${index}`;
    const regionId = `deel-services-accordion-panel-${index}`;

    summary.id = summaryId;
    summary.setAttribute('aria-controls', regionId);
    summary.setAttribute('role', 'button');
    summary.tabIndex = 0;

    region.id = regionId;
    region.setAttribute('aria-labelledby', summaryId);

    const setExpanded = (expanded: boolean) => {
      accordion.classList.toggle('Mui-expanded', expanded);
      summary.classList.toggle('Mui-expanded', expanded);
      region.classList.toggle('Mui-expanded', expanded);
      collapse.classList.toggle('MuiCollapse-hidden', !expanded);
      collapse.classList.toggle('Mui-expanded', expanded);

      summary.setAttribute('aria-expanded', expanded ? 'true' : 'false');
      region.hidden = !expanded;
      collapse.style.minHeight = expanded ? 'unset' : '0px';
      collapse.style.height = expanded ? 'auto' : '0px';
      collapse.style.overflow = expanded ? 'visible' : 'hidden';
      collapse.style.visibility = expanded ? 'visible' : 'hidden';
      region.style.display = expanded ? '' : 'none';
      details.style.display = expanded ? '' : 'none';

      collapseIcon.style.display = expanded ? 'inline-flex' : 'none';
      expandIcon.style.display = expanded ? 'none' : 'inline-flex';
    };

    const toggle = () => {
      const expanded = summary.getAttribute('aria-expanded') === 'true';
      setExpanded(!expanded);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    };

    summary.addEventListener('click', toggle);
    summary.addEventListener('keydown', handleKeyDown);

    const initiallyExpanded =
      accordion.classList.contains('Mui-expanded') || summary.getAttribute('aria-expanded') === 'true';
    setExpanded(initiallyExpanded);

    return () => {
      summary.removeEventListener('click', toggle);
      summary.removeEventListener('keydown', handleKeyDown);
    };
  });

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

function wireCheckboxButtons(root: HTMLElement) {
  const checkboxes = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="checkbox"]'));

  const setChecked = (button: HTMLButtonElement, checked: boolean) => {
    button.setAttribute('aria-checked', checked ? 'true' : 'false');
    button.style.background = checked ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.04)';
    button.style.borderColor = checked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)';

    const marker = button.querySelector<HTMLElement>('span[aria-hidden="true"]');
    if (marker) {
      marker.style.background = checked ? 'var(--color-purple-525)' : 'transparent';
      marker.style.borderColor = 'var(--color-purple-525)';
      marker.style.boxShadow = checked ? 'inset 0 0 0 3px rgba(255,255,255,0.95)' : '';
    }
  };

  const cleanupFns = checkboxes.map((button) => {
    setChecked(button, button.getAttribute('aria-checked') === 'true');

    const handleClick = () => {
      const nextChecked = button.getAttribute('aria-checked') !== 'true';
      setChecked(button, nextChecked);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleClick();
      }
    };

    button.addEventListener('click', handleClick);
    button.addEventListener('keydown', handleKeyDown);

    return () => {
      button.removeEventListener('click', handleClick);
      button.removeEventListener('keydown', handleKeyDown);
    };
  });

  return () => {
    cleanupFns.forEach((cleanup) => cleanup());
  };
}

export default function DeelServicesPage() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const previousHtmlClassName = document.documentElement.className;
    const previousBodyClassName = document.body.className;

    document.title = DEEL_SERVICES_PAGE_TITLE;

    const mergedHtmlClasses = Array.from(
      new Set(
        `${previousHtmlClassName} ${DEEL_SERVICES_HTML_CLASSES}`
          .split(/\s+/)
          .map((className) => className.trim())
          .filter(Boolean),
      ),
    ).join(' ');

    document.documentElement.className = mergedHtmlClasses;

    const cleanupNodes: HTMLElement[] = [];

    DEEL_SERVICES_STYLESHEET_HREFS.forEach((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(LINK_DATA_ATTR, href);
      document.head.appendChild(link);
      cleanupNodes.push(link);
    });

    DEEL_SERVICES_INLINE_STYLES.forEach((cssText, index) => {
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

    const cleanupSlider = wireSlider(root);
    const cleanupTabs = wireTabs(root);
    const cleanupServicesTabs = wireServicesTabs(root);
    const cleanupAccordions = wireAccordions(root);
    const cleanupCheckboxes = wireCheckboxButtons(root);

    root.addEventListener('click', handleAnchorClick);

    return () => {
      root.removeEventListener('click', handleAnchorClick);
      cleanupSlider();
      cleanupTabs();
      cleanupServicesTabs();
      cleanupAccordions();
      cleanupCheckboxes();
    };
  }, []);

  return (
    <SharedLandingPageLayout>
      <div ref={rootRef} data-page="deel-services-react">
        <DeelServicesContent />
      </div>
    </SharedLandingPageLayout>
  );
}
