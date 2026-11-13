import AttentionDot from '../components/AttentionDot';
import ITAccessPanel from '../components/ITAccessPanel';
import ClientBillingPage from './pages/ClientBillingPage';
import EquipmentSection from '../components/EquipmentSection';
import AnalyticsPage, { ANALYTICS_VIEWS, getAnalyticsView, type AnalyticsView } from './pages/AnalyticsPage';
import { resolveImageUrl } from '../utils/imageUrl';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';
import SignOutButton from '../components/common/SignOutButton';
import DashboardHelp from './components/DashboardHelp';
import DashboardNotifications from './components/DashboardNotifications';
'use client';

import { useEffect, useMemo, useState } from 'react';
import './dashboard.css';
import type { DashboardPage } from './types/dashboard.type';
import DashboardHome from './pages/DashboardHome';
import WorkersPage from './pages/WorkersPage';
import { ContractsPage } from './pages/ContractInvoicePage';
import ProjectsPage from './pages/ProjectsPage';
import { tokenStore } from '../api/client';
import { getMyCompany } from '../api/company.api';
import TalentMarketplacePage from '../pages/TalentMarketplacePage';
import MarketplaceTalentRequestsPage from '../pages/MarketplaceTalentRequestsPage';
import MarketplaceTalentProfilePage from '../pages/MarketplaceTalentProfilePage';
import MarketplaceProjectConsultationPage from '../pages/MarketplaceProjectConsultationPage';
import type { MarketplaceCheckoutSelection } from '../api/marketplace.api';

function CompanyAvatar({ name, logo }: { name: string; logo: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [logo]);
  return logo && !failed ? <img className="db-company-profile-image" src={resolveImageUrl(logo)} alt={name + ' logo'} onError={() => setFailed(true)} /> : <>{Array.from(name.trim())[0]?.toUpperCase() || 'C'}</>;
}

interface NavItem {
  id: DashboardPage;
  icon: string;
  label: string;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: '▣', label: 'Dashboard' },
  { id: 'marketplace', icon: '🛍', label: 'Marketplace' },
  { id: 'workers', icon: '👥', label: 'Talents' },
  { id: 'hiring', icon: '🎯', label: 'Hiring' },
  { id: 'contracts', icon: '📄', label: 'Contracts' },
  { id: 'analytics', icon: '', label: 'Analytics' },
  { id: 'payroll', icon: '💵', label: 'Payroll' },
  { id: 'invoices', icon: '🧾', label: 'Invoices' },
  { id: 'documents', icon: '📁', label: 'Documents' },
  { id: 'equipment', icon: '', label: 'Equipment' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

NAV_ITEMS.splice(1, 0, { id: 'projects', icon: 'P', label: 'Projects' },{id:'it-access',icon:'IT',label:'IT access'});

const PAGE_TITLES: Record<DashboardPage, string> = {
  analytics: 'Analytics',
  home: 'Dashboard',
  projects: 'Projects',
  'it-access':'IT access',
  marketplace: 'Marketplace',
  workers: 'Talents',
  hiring: 'Hiring',
  contracts: 'Contracts',
  payroll: 'Payroll',
  invoices: 'Invoices',
  equipment: 'Equipment Management',
  documents: 'Documents',
  settings: 'Settings',
};

const COMPANY_DESTINATION_KEY = 'dechub_company_destination';


type HiringView = 'overview' | 'marketplace' | 'requests' | 'profile' | 'consultation';

function getDashboardPageFromQuery(initialPage: DashboardPage, hireRequestId: string): DashboardPage {
  const tab = new URLSearchParams(window.location.search).get('tab')?.trim() ?? '';

  if (tab === 'marketplace') return 'hiring';
  if (tab === 'it-access') return 'it-access';
  if (tab === 'projects') return 'projects';
  if (tab === 'contracts') return 'contracts';
  if (tab === 'workers') return 'workers';
  if (tab === 'hiring') return 'hiring';
  if (tab === 'payroll') return 'payroll';
  if (tab === 'invoices') return 'invoices';
  if (tab === 'equipment') return 'equipment';
  if (tab === 'documents') return 'documents';
  if (tab === 'settings') return 'settings';
  if (tab === 'analytics') return 'analytics';
  if (tab === 'home') return 'home';

  return hireRequestId ? 'workers' : initialPage;
}

function getHiringViewFromQuery(): HiringView {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab')?.trim() ?? '';
  const hiringView = params.get('hiringView')?.trim() ?? '';

  if (tab === 'marketplace') return 'marketplace';
  if (tab !== 'hiring') return 'overview';
  if (hiringView === 'marketplace') return 'marketplace';
  if (hiringView === 'requests') return 'requests';
  return 'overview';
}

function HiringOverviewPage({ onSelectView }: { onSelectView: (next: HiringView) => void }) {
  return (
    <div className="db-page">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Hiring</div>
          <div className="db-page-sub">
            Browse pre-vetted talent, manage open requests, and move approved hires into your delivery workflow.
          </div>
        </div>
      </div>

      <div className="db-workspace-grid db-marketplace-grid">
        <div className="db-card db-workspace-hero db-marketplace-hero">
          <div className="db-workspace-eyebrow">Dechub-Bridge Marketplace</div>
          <h2 className="db-workspace-title">Source talent faster from one hiring workspace</h2>
          <div className="db-marketplace-tags">
            <span className="db-marketplace-tag">Pre-vetted profiles</span>
            <span className="db-marketplace-tag">Request tracking</span>
            <span className="db-marketplace-tag">Talent conversion</span>
          </div>
          <div className="db-workspace-actions">
            <button className="db-btn-primary" onClick={() => onSelectView('marketplace')}>
              Explore Marketplace
            </button>
            <button className="db-btn-secondary" onClick={() => onSelectView('requests')}>
              Manage Requests
            </button>
          </div>
        </div>

        <div className="db-card db-workspace-card">
          <div className="db-card-header">
            <span className="db-card-title">What you can do here</span>
          </div>
          <div className="db-feature-stack">
            {[
              'Browse approved contractor and specialist profiles',
              'Track company talent requests in one place',
              'Move selected profiles into talents and contracts',
              'Keep hiring discovery separate from payroll execution',
            ].map((item) => (
              <div key={item} className="db-feature-row">
                <span className="db-feature-dot">✓</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card db-workspace-card db-marketplace-flow">
          <div className="db-card-header">
            <span className="db-card-title">Recommended flow</span>
          </div>
          <div className="db-kpi-list">
            <div className="db-kpi-item">
              <strong>1. Discover</strong>
              <span>Search talent and shortlist relevant profiles inside Marketplace.</span>
            </div>
            <div className="db-kpi-item">
              <strong>2. Request</strong>
              <span>Open and track talent requests with your hiring details.</span>
            </div>
            <div className="db-kpi-item">
              <strong>3. Convert</strong>
              <span>Move approved hires into talents, contracts, and payroll execution.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HiringPage({
  hiringView,
  onSelectView,
  selectedProfileId,
  onSelectProfile,
  checkoutSelection,
  onSelectCheckout,
  hiringReturnView,
  onSetHiringReturnView,
  userName,
}: {
  hiringView: HiringView;
  onSelectView: (next: HiringView) => void;
  selectedProfileId: string;
  onSelectProfile: (workerId: string) => void;
  checkoutSelection: MarketplaceCheckoutSelection | null;
  onSelectCheckout: (selection: MarketplaceCheckoutSelection | null) => void;
  hiringReturnView: 'marketplace' | 'requests';
  onSetHiringReturnView: (next: 'marketplace' | 'requests') => void;
  userName: string;
}) {
  if (hiringView === 'marketplace') {
    return (
      <TalentMarketplacePage
        initialQuery=""
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onOpenProfile={(workerId) => {
          onSetHiringReturnView('marketplace');
          onSelectProfile(workerId);
          onSelectView('profile');
        }}
        onOpenTalentRequests={() => onSelectView('requests')}
        onLogout={() => {}}
        onNotifications={() => {}}
        onLogin={() => { window.location.href = '/get-started'; }}
        embedded
      />
    );
  }

  if (hiringView === 'requests') {
    return (
      <MarketplaceTalentRequestsPage
        userName={userName}
        onBack={() => onSelectView('overview')}
        onLogout={() => {}}
        onNotifications={() => {}}
        onOpenProfile={(workerId) => {
          onSetHiringReturnView('requests');
          onSelectProfile(workerId);
          onSelectView('profile');
        }}
        embedded
      />
    );
  }

  if (hiringView === 'profile') {
    return (
      <MarketplaceTalentProfilePage
        workerId={selectedProfileId}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onContinueToConsultation={(selection) => {
          onSelectCheckout(selection);
          onSelectView('consultation');
        }}
        onOpenTalentRequests={() => onSelectView('requests')}
        onBack={() => onSelectView(hiringReturnView)}
        onLogout={() => {}}
        onNotifications={() => {}}
        onLogin={() => { window.location.href = '/get-started'; }}
        embedded
      />
    );
  }

  if (hiringView === 'consultation') {
    return (
      <MarketplaceProjectConsultationPage
        selection={checkoutSelection}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onBack={() => onSelectView('profile')}
        onLogout={() => {}}
        onNotifications={() => {}}
        onLogin={() => { window.location.href = '/get-started'; }}
        embedded
        onSuccess={() => {
          onSelectView('requests');
        }}
      />
    );
  }

  return <HiringOverviewPage onSelectView={onSelectView} />;
}

interface DashboardProps {
  companyName?: string;
  userName?: string;
  userRole?: string;
  initialPage?: DashboardPage;
}

export default function Dashboard({
  companyName = 'My Company',
  userName = 'Admin User',
  userRole = 'Company Admin',
  initialPage = 'home',
}: DashboardProps) {
  const [companyIdentity, setCompanyIdentity] = useState({ name: companyName, logo: '' });
  const [sectionCounts, setSectionCounts] = useState<Record<string, number>>({});
  const initialHireRequestId = new URLSearchParams(window.location.search).get('hireRequest')?.trim() ?? '';
  const [page, setPage] = useState<DashboardPage>(() => getDashboardPageFromQuery(initialPage, initialHireRequestId));
  const [analyticsView, setAnalyticsView] = useState<AnalyticsView>(() => getAnalyticsView());
  const [analyticsOpen, setAnalyticsOpen] = useState(() => new URLSearchParams(window.location.search).get('tab') === 'analytics');
  const [hiringOpen, setHiringOpen] = useState(() => ['hiring', 'marketplace'].includes(new URLSearchParams(window.location.search).get('tab') || ''));
  const [hiringView, setHiringView] = useState<HiringView>(() => getHiringViewFromQuery());
  const [selectedMarketplaceProfileId, setSelectedMarketplaceProfileId] = useState('');
  const [marketplaceCheckoutSelection, setMarketplaceCheckoutSelection] = useState<MarketplaceCheckoutSelection | null>(null);
  const [hiringReturnView, setHiringReturnView] = useState<'marketplace' | 'requests'>('marketplace');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [signupStep, setSignupStep] = useState<number | null>(null);
  const [setupBannerLoading, setSetupBannerLoading] = useState(true);
  const [oauthNotice] = useState(() => {
    const notice = sessionStorage.getItem('dechub_oauth_notice');
    sessionStorage.removeItem('dechub_oauth_notice');
    return notice;
  });

  useEffect(() => {
    const nextPage = getDashboardPageFromQuery(initialPage, initialHireRequestId);
    setPage(nextPage);
    setHiringView(getHiringViewFromQuery());
  }, [initialHireRequestId, initialPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', page);
    if (page === 'analytics') params.set('analyticsView', analyticsView); else params.delete('analyticsView');
    if (page === 'hiring' && hiringView !== 'overview') {
      const queryHiringView = hiringView === 'requests' ? 'requests' : 'marketplace';
      params.set('hiringView', queryHiringView);
    } else {
      params.delete('hiringView');
    }
    if (page !== 'workers') {
      params.delete('hireRequest');
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `/dashboard?${nextQuery}` : '/dashboard';
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [hiringView, page, analyticsView]);

  useEffect(() => { if (page === 'hiring') setHiringOpen(true); if (page === 'analytics') setAnalyticsOpen(true); }, [page]);

  useEffect(() => {
    if (!mobileNavOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileNavOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadCompanySetupStatus() {
      if (!tokenStore.getAccess()) {
        if (!cancelled) {
          setSignupStep(null);
          setSetupBannerLoading(false);
        }
        return;
      }

      try {
        const company = await getMyCompany();
        if (cancelled) return;
        const nextSignupStep = typeof company.user?.signupStep === 'number' ? company.user.signupStep : null;
        setSignupStep(nextSignupStep);
        setCompanyIdentity({ name: String(company.company.companyName || companyName), logo: String(company.company.companyLogoUrl || '') });
      } catch {
        if (cancelled) return;
        setSignupStep(null);
      } finally {
        if (!cancelled) {
          setSetupBannerLoading(false);
        }
      }
    }

    const updateIdentity = (event: Event) => {
      const details = (event as CustomEvent<{ companyName?: string | null; companyLogoUrl?: string | null }>).detail;
      if (!details) return;
      setCompanyIdentity(previous => ({ name: typeof details.companyName === 'string' && details.companyName.trim() ? details.companyName : previous.name, logo: 'companyLogoUrl' in details ? String(details.companyLogoUrl || '') : previous.logo }));
    };
    window.addEventListener('dechub:company-profile-updated', updateIdentity);
    void loadCompanySetupStatus();
    return () => { cancelled = true; window.removeEventListener('dechub:company-profile-updated', updateIdentity); };
  }, [companyName]);



  useEffect(() => {
    const checkCompanySession = () => {
      if (!tokenStore.getAccess()) window.location.replace('/company/login');
    };
    window.addEventListener('dechub:session-expired', checkCompanySession);
    window.addEventListener('storage', checkCompanySession);
    window.addEventListener('focus', checkCompanySession);
    checkCompanySession();
    return () => {
      window.removeEventListener('dechub:session-expired', checkCompanySession);
      window.removeEventListener('storage', checkCompanySession);
      window.removeEventListener('focus', checkCompanySession);
    };
  }, []);

  const handleContinueSetup = () => {
    sessionStorage.setItem(COMPANY_DESTINATION_KEY, 'dashboard');
    window.location.href = '/company/onboarding?start=identity';
  };

  const companyInitial = Array.from(companyIdentity.name.trim())[0]?.toUpperCase() || 'C';
  const isSetupIncomplete = typeof signupStep === 'number' && signupStep < 7;
  const completedSteps = useMemo(() => {
    if (!isSetupIncomplete || typeof signupStep !== 'number') return 0;
    return Math.max(0, Math.min(signupStep, 6));
  }, [isSetupIncomplete, signupStep]);
  const progressPercent = useMemo(() => {
    if (!isSetupIncomplete || completedSteps <= 0) return 0;
    return Math.round((completedSteps / 6) * 100);
  }, [completedSteps, isSetupIncomplete]);
  const currentPageTitle = page === 'hiring'
    ? hiringView === 'marketplace'
      ? 'Talent Marketplace'
      : hiringView === 'requests'
        ? 'Manage Requests'
        : hiringView === 'profile'
          ? 'Talent Profile'
          : hiringView === 'consultation'
            ? 'Project Consultation'
            : 'Hiring'
    : PAGE_TITLES[page];

  const workspaceItems = NAV_ITEMS.filter((item) =>
    ['home', 'projects', 'it-access', 'workers', 'hiring', 'contracts', 'payroll', 'analytics'].includes(item.id),
  );
  const operationsItems = NAV_ITEMS.filter((item) => ['invoices', 'documents', 'equipment', 'settings'].includes(item.id));

  return (
    <div className="db-shell">
      {mobileNavOpen && (
        <button
          type="button"
          className="db-nav-scrim"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <aside className={`db-sidebar${mobileNavOpen ? ' db-sidebar-open' : ''}`}>
        <div className="db-sidebar-logo">
          <div className="db-platform-logo">
            <img src="/dechub-assets/email/bridge-logo-email.png" alt="Bridge" />
          </div>
        </div>

        <div className="db-company-switcher">
          <div className="db-company-avatar">{companyInitial}</div>
          <span className="db-company-name">{companyIdentity.name}</span>
          <span className="db-company-chevron">⌄</span>
        </div>

        <nav className="db-nav" aria-label="Main navigation">

          {workspaceItems.map((item) => (
            item.id === 'hiring' ? (
              <div key={item.id} className={`db-nav-group ${page === 'hiring' ? 'active' : ''}`}>
                <button
                  className={`db-nav-item ${page === 'hiring' ? 'active' : ''}`}
                  onClick={() => {
                    setHiringOpen(open => !open);
                  }}
                  aria-expanded={hiringOpen}
                  aria-controls="hiring-navigation"
                >
                  <span className="db-nav-label">{item.label}</span>{sectionCounts[item.id] > 0 && <AttentionDot label={sectionCounts[item.id]+" pending actions or unread updates"}/>}
                <span className={`db-nav-chevron ${hiringOpen ? 'expanded' : ''}`} aria-hidden="true" />
                </button>
                {hiringOpen && <div className="db-nav-sublist" id="hiring-navigation">
                  <button className={`db-nav-subitem ${page === 'hiring' && hiringView === 'overview' ? 'active' : ''}`} onClick={() => { setPage('hiring'); setHiringView('overview'); setMobileNavOpen(false); }}>Hiring overview</button>
                  <button
                    className={`db-nav-subitem ${page === 'hiring' && (hiringView === 'marketplace' || hiringView === 'profile' || hiringView === 'consultation') ? 'active' : ''}`}
                    onClick={() => {
                      setPage('hiring');
                      setHiringView('marketplace');
                      setMobileNavOpen(false);
                    }}
                  >
                    Talent Marketplace
                  </button>
                  <button
                    className={`db-nav-subitem ${page === 'hiring' && hiringView === 'requests' ? 'active' : ''}`}
                    onClick={() => {
                      setPage('hiring');
                      setHiringView('requests');
                      setMobileNavOpen(false);
                    }}
                  >
                    Manage Requests {sectionCounts.hiring > 0 && <AttentionDot label="Hiring updates or pending actions"/>}
                  </button>
                </div>}
              </div>
            ) : item.id === 'analytics' ? (
              <div key={item.id} className="db-nav-group">
                <button className={`db-nav-item ${page === 'analytics' ? 'active' : ''}`} onClick={() => setAnalyticsOpen(open => !open)} aria-expanded={analyticsOpen} aria-controls="analytics-navigation"><span className="db-nav-label">Analytics</span><span className={`db-nav-chevron ${analyticsOpen ? 'expanded' : ''}`} aria-hidden="true" /></button>
                {analyticsOpen && <div id="analytics-navigation" className="db-nav-sublist">{ANALYTICS_VIEWS.map(([view, title]) => <button key={view} className={`db-nav-subitem ${page === 'analytics' && analyticsView === view ? 'active' : ''}`} aria-current={page === 'analytics' && analyticsView === view ? 'page' : undefined} onClick={() => { setPage('analytics'); setAnalyticsView(view); setMobileNavOpen(false); }}>{title}</button>)}</div>}
              </div>
            ) : (
              <button
                key={item.id}
                className={`db-nav-item ${page === item.id ? 'active' : ''}`}
                onClick={() => {
                  setPage(item.id);
                  setMobileNavOpen(false);
                }}
                aria-current={page === item.id ? 'page' : undefined}
              >
                <span className="db-nav-label">{item.label}</span>{sectionCounts[item.id] > 0 && <AttentionDot label={sectionCounts[item.id]+" pending actions or unread updates"}/>}

              </button>
            )
          ))}

          {operationsItems.map((item) => (
            <button
              key={item.id}
              className={`db-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => {
                setPage(item.id);
                setMobileNavOpen(false);
              }}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <span className="db-nav-label">{item.label}</span>{sectionCounts[item.id] > 0 && <AttentionDot label={sectionCounts[item.id]+" pending actions or unread updates"}/>}
            </button>
          ))}
        </nav>

        <div className="db-sidebar-user">
          <a href="/company/profile" className="db-user-avatar" aria-label="Open company profile"><CompanyAvatar name={companyIdentity.name} logo={companyIdentity.logo} /></a>
          <a href="/company/profile" className="db-user-info">
            <div className="db-user-name">{userName}</div>
            <div className="db-user-role">{userRole}</div>
          </a>
          <SignOutButton className="db-signout-btn" />
        </div>
      </aside>

      <div className="db-main">
        <header className="db-topbar">
          <div className="db-topbar-heading">
            <button
              type="button"
              className="db-mobile-menu"
              aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              ☰
            </button>
            <div className="db-topbar-title">{currentPageTitle}</div>
          </div>

          <div className="db-topbar-search">
            <span>🔍</span>
            <input
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Global search"
            />
          </div>

          <div className="db-topbar-actions">
            <DashboardNotifications onCountsChange={setSectionCounts} activeSection={page === 'hiring' && hiringView !== 'requests' ? 'marketplace' : page} />
            <DashboardHelp />
            <a href="/company/profile" className="db-profile-avatar" aria-label="Open company profile"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0a1628, #2563eb)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title={companyIdentity.name}
            >
              <CompanyAvatar name={companyIdentity.name} logo={companyIdentity.logo} />
            </a>
          </div>
        </header>

        <main>
          {oauthNotice && (
            <div className="db-oauth-notice" role="status">
              {oauthNotice}
            </div>
          )}

          {!setupBannerLoading && isSetupIncomplete && (
            <section className="db-setup-banner" aria-label="Complete company setup">
              <div className="db-setup-banner__content">
                <div className="db-setup-banner__eyebrow">Complete company setup</div>
                <h2 className="db-setup-banner__title">
                  Your dashboard is ready. Finish setup whenever you&apos;re ready.
                </h2>
                <p className="db-setup-banner__text">
                  You can keep exploring the dashboard now and come back to complete the remaining company onboarding steps later.
                </p>
                <div className="db-setup-banner__meta">
                  <span>{completedSteps}/6 setup steps completed</span>
                  <span>{progressPercent}% done</span>
                </div>
                <div className="db-setup-banner__progress" aria-hidden="true">
                  <span className="db-setup-banner__progress-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="db-setup-banner__actions">
                <button className="db-btn-primary" onClick={handleContinueSetup}>
                  Complete company setup
                </button>
                <button className="db-btn-secondary" onClick={() => setPage('home')}>
                  Keep exploring dashboard
                </button>
              </div>
            </section>
          )}

          {page === 'analytics' && <AnalyticsPage view={analyticsView} onView={setAnalyticsView} />}
          {page === 'it-access' && <div className="db-page"><ITAccessPanel/></div>}
          {page === 'home' && <DashboardHome onNavigate={(nextPage) => setPage(nextPage as DashboardPage)} />}
          {page === 'projects' && <ProjectsPage onRequestCreated={() => {
            setHiringView('requests');
            setPage('hiring');
          }} />}
          {page === 'workers' && <WorkersPage initialHireRequestId={initialHireRequestId} />}
          {page === 'hiring' && (
            <HiringPage
              hiringView={hiringView}
              onSelectView={setHiringView}
              selectedProfileId={selectedMarketplaceProfileId}
              onSelectProfile={setSelectedMarketplaceProfileId}
              checkoutSelection={marketplaceCheckoutSelection}
              onSelectCheckout={setMarketplaceCheckoutSelection}
              hiringReturnView={hiringReturnView}
              onSetHiringReturnView={setHiringReturnView}
              userName={userName}
            />
          )}
          {page === 'contracts' && <ContractsPage />}
          {page === 'payroll' && <ClientBillingPage />}
          {page === 'invoices' && <ClientBillingPage invoicesOnly />}
          {page === 'documents' && <DocumentsPage />}
          {page === 'equipment' && <div className="db-page"><EquipmentSection role="client"/></div>}
          {page === 'settings' && <SettingsPage />}

        </main>
      </div>
    </div>
  );
}
