import { useEffect, useRef, useState } from 'react';
import LandingTalentRequestModal from './LandingTalentRequestModal';
import '../../landing_deel/landing.css';
import '../../landing_deel/overrides.css';
import Header from '../../landing_deel/components/Header.jsx';
import Footer from '../../landing_deel/components/Footer.jsx';

const BOOK_DEMO_LABELS = new Set(['book a demo', 'get started with deel']);
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

interface SharedLandingPageLayoutProps {
  children: React.ReactNode;
}

export default function SharedLandingPageLayout({ children }: SharedLandingPageLayoutProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [isTalentRequestModalOpen, setIsTalentRequestModalOpen] = useState(false);
  const [requestedServices, setRequestedServices] = useState<string[]>([]);

  const openTalentRequestModal = (services?: string[]) => {
    setRequestedServices(
      Array.isArray(services)
        ? services.filter((item): item is string => typeof item === 'string')
        : [],
    );
    setIsTalentRequestModalOpen(true);
  };

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
      const href = anchor?.getAttribute('href')?.trim() ?? '';
      const normalizedHref = href ? (new URL(href, window.location.origin).pathname.replace(/\/+$/, '') || '/') : '';

      const isDemoTrigger =
        actionElement.getAttribute('data-demo-trigger') === 'true' ||
        BOOK_DEMO_LABELS.has(label) ||
        href.includes('book-a-demo');

      if (isDemoTrigger) {
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

      if (GET_STARTED_LABELS.has(label) || href === '/get-started') {
        event.preventDefault();
        navigateToInternalPath('/get-started');
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

      if (href === '/marketplace') {
        event.preventDefault();
        navigateToInternalPath('/marketplace');
        return;
      }

      if (href === '#' || href === '#!') {
        event.preventDefault();
        return;
      }

      if (href.startsWith('/')) {
        event.preventDefault();
        navigateToInternalPath(href);
      }
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, []);

  return (
    <div ref={rootRef} className="deel-clone-root">
      <Header />
      <main className="m-0 p-0">
        <div className="relative">
          <div data-ab-page="true" className="bg-surface-secondary flex flex-col items-center">
            {children}
          </div>
        </div>
      </main>
      <div id="deel-footer" className="deel-clone-band deel-clone-band--footer">
        <div className="deel-clone-shell">
          <Footer />
        </div>
      </div>
      <LandingTalentRequestModal
        isOpen={isTalentRequestModalOpen}
        onClose={() => {
          setIsTalentRequestModalOpen(false);
          setRequestedServices([]);
        }}
        requestedServices={requestedServices}
      />
    </div>
  );
}
