import { useEffect, useRef, useState } from 'react';
import '../landing_deel/landing.css';
import '../landing_deel/overrides.css';
import '../landing_deel/home-offer.css';
import Header from '../landing_deel/components/Header.jsx';
import Section01 from '../landing_deel/components/Section01.jsx';
import Section02 from '../landing_deel/components/Section02.jsx';
import Section02Promo from '../landing_deel/components/Section02Promo.jsx';
import Section03 from '../landing_deel/components/Section03.jsx';
import Section04 from '../landing_deel/components/Section04.jsx';
import Section05 from '../landing_deel/components/Section05.jsx';
import Section06 from '../landing_deel/components/Section06.jsx';
import Section07 from '../landing_deel/components/Section07.jsx';
import Section08 from '../landing_deel/components/Section08.jsx';
import Footer from '../landing_deel/components/Footer.jsx';

interface LandingPageDeelProps {
  onGetStarted: () => void;
  onMarketplace: () => void;
  onMarketplaceSearch: (query: string) => void;
}

const BOOK_DEMO_LABELS = new Set(['book a demo']);
const GET_STARTED_LABELS = new Set(['get started', 'start free']);
const INTERNAL_SOLUTION_PATHS = new Set([
  '/solutions/payroll',
  '/solutions/payroll/eor',
  '/solutions/payroll/contractors',
  '/solutions/it',
  '/solutions/benefits',
  '/solutions/hire',
  '/solutions/hr',
  '/solutions/mobility',
  '/mobility',
  '/solutions/services',
  '/solutions/embedded',
  '/solutions/open-api',
  '/integrations',
]);

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function navigateToInternalPath(href: string): void {
  const nextUrl = new URL(href, window.location.origin);
  const normalizedPath = nextUrl.pathname.replace(/\/+$/, '') || '/';
  const target = `${normalizedPath}${nextUrl.search}${nextUrl.hash}`;
  const current = `${window.location.pathname.replace(/\/+$/, '') || '/'}${window.location.search}${window.location.hash}`;

  if (target !== current) {
    window.history.pushState({}, '', target);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

export default function LandingPageDeel({
  onGetStarted,
  onMarketplace,
}: LandingPageDeelProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [expertVisible,setExpertVisible]=useState(false);
  const [expertDismissed,setExpertDismissed]=useState(false);
  const [expertMounted,setExpertMounted]=useState(false);
  const expertShouldShow=expertVisible&&!expertDismissed;
  useEffect(()=>{
    if(expertShouldShow){setExpertMounted(true);return;}
    const delay=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:240;
    const timer=window.setTimeout(()=>setExpertMounted(false),delay);
    return()=>window.clearTimeout(timer);
  },[expertShouldShow]);
  useEffect(()=>{
    const hero=rootRef.current?.querySelector('.deel-clone-band--hero');if(!hero)return;
    const observer=new IntersectionObserver(([entry])=>setExpertVisible(entry.boundingClientRect.top<0&&entry.intersectionRatio<0.05),{threshold:[0,0.05]});
    observer.observe(hero);return()=>observer.disconnect();
  },[]);

  const openTalentRequestModal = (services?: string[]) => {
    if(Array.isArray(services))sessionStorage.setItem('dechub_hero_requested_services',JSON.stringify(services));
    window.history.pushState({},'','/book-demo');window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo(0,0);
  };

  useEffect(() => {
    document.title = 'Dechub-Bridge | Payroll, Compliance, HR Solutions | HRIS';
  }, []);

  useEffect(() => {
    const appRoot = document.getElementById('root');
    document.body.classList.add('deel-clone-body');
    appRoot?.classList.add('deel-clone-app-root');

    return () => {
      document.body.classList.remove('deel-clone-body');
      appRoot?.classList.remove('deel-clone-app-root');
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;

    if (!root) {
      return;
    }

      const handleClick = (event: MouseEvent) => {
        if (event.defaultPrevented) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const anchorElement = target?.closest('a') as HTMLAnchorElement | null;
        const buttonElement = target?.closest('button') as HTMLButtonElement | null;
        const actionElement = (anchorElement ?? buttonElement) as HTMLAnchorElement | HTMLButtonElement | null;

        if (!actionElement || !root.contains(actionElement)) {
          return;
        }

        if (actionElement.tagName === 'BUTTON' && actionElement.getAttribute('aria-haspopup') === 'menu') {
          return;
        }

        const label = normalizeLabel(actionElement.textContent);
      const anchor = anchorElement ?? (actionElement.tagName === 'A' ? (actionElement as HTMLAnchorElement) : null);
      const href = anchor?.getAttribute('href') ?? '';
      // Let the browser open external links, including footer social profiles.
      if (anchor && href && new URL(href, window.location.origin).origin !== window.location.origin) {
        return;
      }
      const normalizedHref = href ? (new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/') : '';

      if (actionElement.id === 'navbar-logo-link' || href === '/') {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      if (href === '/get-started') {
        event.preventDefault();
        onGetStarted();
        return;
      }

      if (INTERNAL_SOLUTION_PATHS.has(normalizedHref)) {
        event.preventDefault();
        navigateToInternalPath(normalizedHref);
        return;
      }

      if (label === 'log in' || href.includes('login')) {
        event.preventDefault();
        navigateToInternalPath('/company/login');
        return;
      }

      if (BOOK_DEMO_LABELS.has(label) || href.includes('book-a-demo')) {
        event.preventDefault();
        const requestedServicesAttr = actionElement.getAttribute('data-requested-services');
        openTalentRequestModal(
          requestedServicesAttr
            ? (() => {
                try {
                  const parsed = JSON.parse(requestedServicesAttr);
                  return Array.isArray(parsed) ? parsed : [];
                } catch {
                  return [];
                }
              })()
            : [],
        );
        return;
      }

      if (GET_STARTED_LABELS.has(label)) {
        event.preventDefault();
        onGetStarted();
        return;
      }

      if (label === 'pricing') {
        event.preventDefault();
        navigateToInternalPath('/pricing');
        return;
      }

      if (label === 'solutions' || href.startsWith('/solutions/')) {
        event.preventDefault();
        document.getElementById('deel-solutions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (label === 'use cases' || href.startsWith('/use-cases/')) {
        event.preventDefault();
        document.getElementById('deel-speed')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (label === 'who we serve') {
        event.preventDefault();
        document.getElementById('deel-testimonials')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (label === 'resources' || href.startsWith('/blog/') || href.startsWith('/help-center/')) {
        event.preventDefault();
        document.getElementById('deel-footer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      if (href === '/marketplace') {
        event.preventDefault();
        onMarketplace();
        return;
      }

      if (
        href === '/dechub-bridge-vs-competitors/'
        || href === '/dechub-bridge-vs-competitors'
      ) {
        event.preventDefault();
        navigateToInternalPath('/dechub-bridge-vs-competitors');
        return;
      }

      if (href === '#') {
        event.preventDefault();
        onMarketplace();
        return;
      }

      if (href.startsWith('/')) {
        event.preventDefault();
        navigateToInternalPath(href);
      }
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, [onGetStarted, onMarketplace]);

  return (
    <div ref={rootRef} className="deel-clone-root">
      <Header showOfferBanner />
      <main className="m-0 p-0">
        <div className="relative">
          <div data-ab-page="true" className="bg-surface-secondary flex flex-col items-center">
            <div className="deel-clone-band deel-clone-band--hero">
              <Section01 onBookDemo={openTalentRequestModal} resetKey={0} />
            </div>
            <div id="deel-proof" className="deel-clone-band deel-clone-band--proof">
              <div className="deel-clone-shell">
                <Section02 />
                <Section02Promo />
              </div>
            </div>
            <div id="deel-solutions" className="deel-clone-band deel-clone-band--solutions">
              <div className="deel-clone-shell">
                <Section03 />
              </div>
            </div>
            <div id="deel-speed" className="deel-clone-band deel-clone-band--speed">
              <div className="deel-clone-shell">
                <Section04 />
              </div>
            </div>
            <div className="deel-clone-band deel-clone-band--workforce">
              <div className="deel-clone-shell">
                <Section05 />
              </div>
            </div>
            <div id="deel-testimonials" className="deel-clone-band deel-clone-band--testimonials">
              <div className="deel-clone-shell">
                <Section06 />
              </div>
            </div>
            <div className="deel-clone-band deel-clone-band--metrics">
              <div className="deel-clone-shell">
                <Section07 />
              </div>
            </div>
            <div className="deel-clone-band deel-clone-band--reviews">
              <div className="deel-clone-shell">
                <Section08 />
              </div>
            </div>
          </div>
        </div>
      </main>
      {expertMounted&&<aside className={"bridge-expert-banner"+(expertShouldShow?"":" is-leaving")} aria-hidden={!expertShouldShow} aria-label="Speak with a Bridge expert"><span className="bridge-expert-banner__avatar" aria-hidden="true"><img src="/dechub-assets/bridge-demo-expert.jpg" alt="" width="512" height="544"/></span><strong>Build your team with ease</strong><a href="/book-demo" tabIndex={expertShouldShow?0:-1} onClick={event=>{event.preventDefault();event.stopPropagation();navigateToInternalPath('/book-demo');}}>Speak with a trusted expert</a><button type="button" aria-label="Dismiss expert banner" tabIndex={expertShouldShow?0:-1} onClick={()=>setExpertDismissed(true)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></aside>}
      <div id="deel-footer" className="deel-clone-band deel-clone-band--footer">
        <div className="deel-clone-shell">
          <Footer />
        </div>
      </div>
    </div>
  );
}
