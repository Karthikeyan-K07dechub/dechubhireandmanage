import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import LandingPage from './pages/LandingPage';
import CompanyAuthPage from './pages/CompanyAuthPage';
import CompanyChoicePage from './pages/CompanyChoicePage';
import CompanyOnboardingPage from './pages/CompanyOnboardingPage';
import TalentMarketplacePage from './pages/TalentMarketplacePage';
import MarketplaceTalentProfilePage from './pages/MarketplaceTalentProfilePage';
import MarketplaceProjectConsultationPage from './pages/MarketplaceProjectConsultationPage';
import MarketplacePaymentPage from './pages/MarketplacePaymentPage';
import NotificationPage from './pages/NotificationPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import FreelancerSignupPage from './pages/FreelancerSignupPage';
import FreelancerSignupSuccessPage from './pages/FreelancerSignupSuccessPage';
import { tokenStore } from './api/client';
import { handleGoogleCallback } from './api/auth.api';
import { contractorTokenStore } from './contractor/api/contractor.api';
import type { Step } from './types/signup';
import type { MarketplaceCheckoutSelection, MarketplaceOrderDraft } from './api/marketplace.api';

type AppPage =
  | 'landing'
  | 'role-select'
  | 'company-choice'
  | 'company-dashboard-auth'
  | 'company-onboarding'
  | 'auth'
  | 'freelancer-login'
  | 'freelancer-signup'
  | 'freelancer-success'
  | 'freelancer-dashboard'
  | 'marketplace'
  | 'marketplace-profile'
  | 'marketplace-consultation'
  | 'marketplace-payment'
  | 'notifications';

type AuthMode = 'login' | 'signup';
type CompanyDestination = 'marketplace' | 'dashboard';

const COMPANY_DESTINATION_KEY = 'dechub_company_destination';
const MARKETPLACE_CHECKOUT_SELECTION_KEY = 'dechub_marketplace_checkout_selection';
const MARKETPLACE_ORDER_DRAFT_KEY = 'dechub_marketplace_order_draft';

function readSessionJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionJson<T>(key: string, value: T | null): void {
  if (value === null) {
    sessionStorage.removeItem(key);
    return;
  }

  sessionStorage.setItem(key, JSON.stringify(value));
}

function getRouteState(pathname: string): { page: AppPage; mode: AuthMode } {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const marketplaceMatch = normalizedPath.match(/^\/marketplace\/([^/]+)(?:\/(consultation|payment))?$/);

  if (marketplaceMatch) {
    if (marketplaceMatch[2] === 'consultation') {
      return { page: 'marketplace-consultation', mode: 'login' };
    }

    if (marketplaceMatch[2] === 'payment') {
      return { page: 'marketplace-payment', mode: 'login' };
    }

    return { page: 'marketplace-profile', mode: 'login' };
  }

  if (normalizedPath === '/get-started') {
    return { page: 'role-select', mode: 'login' };
  }

  if (normalizedPath === '/company') {
    return { page: 'company-choice', mode: 'login' };
  }

  if (normalizedPath === '/company/dashboard/login' || normalizedPath === '/company/login') {
    return { page: 'company-dashboard-auth', mode: 'login' };
  }

  if (normalizedPath === '/company/onboarding') {
    return { page: 'company-onboarding', mode: 'login' };
  }

  if (normalizedPath === '/company/signup') {
    return { page: 'auth', mode: 'signup' };
  }

  if (normalizedPath === '/auth/callback') {
    return { page: 'company-dashboard-auth', mode: 'login' };
  }

  if (normalizedPath === '/freelancer/login') {
    return { page: 'freelancer-login', mode: 'login' };
  }

  if (normalizedPath === '/freelancer/signup') {
    return { page: 'freelancer-signup', mode: 'login' };
  }

  if (normalizedPath === '/freelancer/dashboard') {
    return { page: 'freelancer-dashboard', mode: 'login' };
  }

  if (normalizedPath === '/freelancer/success') {
    return { page: 'freelancer-success', mode: 'login' };
  }

  if (normalizedPath === '/marketplace') {
    return { page: 'marketplace', mode: 'login' };
  }

  if (normalizedPath === '/notifications') {
    return { page: 'notifications', mode: 'login' };
  }

  return { page: 'landing', mode: 'login' };
}

function getMarketplaceQueryFromUrl(): string {
  return new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
}

function getMarketplaceProfileIdFromUrl(): string {
  const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
  if (!normalizedPath.startsWith('/marketplace/')) {
    return '';
  }

  const segments = normalizedPath.split('/').filter(Boolean);
  const workerId = segments[1] ?? '';
  return decodeURIComponent(workerId).trim();
}

function getUserNameFromToken(): string {
  const accessToken = tokenStore.getAccess();
  if (!accessToken) return 'Company User';

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? ''));
    const firstName = typeof payload.firstName === 'string' ? payload.firstName : '';
    const lastName = typeof payload.lastName === 'string' ? payload.lastName : '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || payload.email || 'Company User';
  } catch {
    return 'Company User';
  }
}

function setCompanyDestination(destination: CompanyDestination): void {
  sessionStorage.setItem(COMPANY_DESTINATION_KEY, destination);
}

function getCompanyDestination(): CompanyDestination {
  return sessionStorage.getItem(COMPANY_DESTINATION_KEY) === 'dashboard'
    ? 'dashboard'
    : 'marketplace';
}

function getNextCompanyStep(signupStep: number): Step | null {
  if (signupStep >= 7) return null;
  return Math.min(Math.max(signupStep + 1, 1), 6) as Step;
}

export default function App() {
  const initialRoute = useMemo(() => getRouteState(window.location.pathname), []);

  const [page, setPage] = useState<AppPage>(initialRoute.page);
  const [authMode, setAuthMode] = useState<AuthMode>(initialRoute.mode);
  const [userName, setUserName] = useState<string>(() => getUserNameFromToken());
  const [freelancerFirstName, setFreelancerFirstName] = useState('');
  const [companyOnboardingStep, setCompanyOnboardingStep] = useState<Step>(1);
  const [companyOnboardingFromMarketplace, setCompanyOnboardingFromMarketplace] = useState(false);
  const [marketplaceQuery, setMarketplaceQuery] = useState<string>(() => getMarketplaceQueryFromUrl());
  const [selectedMarketplaceProfileId, setSelectedMarketplaceProfileId] = useState<string>(() => getMarketplaceProfileIdFromUrl());
  const [selectedMarketplacePackage, setSelectedMarketplacePackage] = useState<MarketplaceCheckoutSelection | null>(
    () => readSessionJson<MarketplaceCheckoutSelection>(MARKETPLACE_CHECKOUT_SELECTION_KEY),
  );
  const [marketplaceOrderDraft, setMarketplaceOrderDraft] = useState<MarketplaceOrderDraft | null>(
    () => readSessionJson<MarketplaceOrderDraft>(MARKETPLACE_ORDER_DRAFT_KEY),
  );

  useEffect(() => {
    const handlePopState = () => {
      const next = getRouteState(window.location.pathname);
      setPage(next.page);
      setAuthMode(next.mode);
      setMarketplaceQuery(getMarketplaceQueryFromUrl());
      setSelectedMarketplaceProfileId(getMarketplaceProfileIdFromUrl());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (normalizedPath !== '/auth/callback') {
      return;
    }

    const result = handleGoogleCallback();
    if (!result) {
      setPage('company-dashboard-auth');
      return;
    }

    setUserName(getUserNameFromToken());

    const signupStep = typeof result.signupStep === 'number' ? result.signupStep : 1;

    if (signupStep < 7) {
      const nextStep = getNextCompanyStep(signupStep);
      if (nextStep) {
        setCompanyOnboardingStep(nextStep);
        setPage('company-onboarding');
      } else {
        window.location.replace('/dashboard');
      }
      return;
    }

    // completed onboarding: go to destination (dashboard or marketplace)
    if (getCompanyDestination() === 'dashboard') {
      window.location.replace('/dashboard');
      return;
    }

    setPage('marketplace');
  }, []);

  useEffect(() => {
    const targetPath =
      page === 'landing'
        ? '/'
        : page === 'role-select'
        ? '/get-started'
        : page === 'company-choice'
        ? '/company'
        : page === 'company-dashboard-auth'
        ? '/company/dashboard/login'
        : page === 'company-onboarding'
        ? '/company/onboarding'
        : page === 'marketplace'
        ? `/marketplace${marketplaceQuery ? `?q=${encodeURIComponent(marketplaceQuery)}` : ''}`
        : page === 'notifications'
        ? '/notifications'
        : page === 'marketplace-consultation'
        ? `/marketplace/${encodeURIComponent(selectedMarketplaceProfileId)}/consultation`
        : page === 'marketplace-payment'
        ? `/marketplace/${encodeURIComponent(selectedMarketplaceProfileId)}/payment`
        : page === 'marketplace-profile'
        ? `/marketplace/${encodeURIComponent(selectedMarketplaceProfileId)}`
        : page === 'freelancer-login'
        ? '/freelancer/login'
        : page === 'freelancer-signup'
        ? '/freelancer/signup'
        : page === 'freelancer-success'
        ? '/freelancer/success'
        : page === 'freelancer-dashboard'
        ? '/freelancer/dashboard'
        : authMode === 'signup'
        ? '/company/signup'
        : '/company/login';

    const currentPath = `${window.location.pathname.replace(/\/+$/, '') || '/'}${window.location.search}`;
    if (currentPath !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [authMode, marketplaceQuery, page, selectedMarketplaceProfileId]);

  const handleAuthSuccess = (result: { signupStep?: number }) => {
    setUserName(getUserNameFromToken());
    setCompanyOnboardingFromMarketplace(getCompanyDestination() === 'marketplace');

    const signupStep = typeof result.signupStep === 'number' ? result.signupStep : 1;

    if (signupStep < 7) {
      const nextStep = getNextCompanyStep(signupStep);
      if (nextStep) {
        setCompanyOnboardingStep(nextStep);
        setPage('company-onboarding');
      } else {
        window.location.replace('/dashboard');
      }
      return;
    }

    // completed onboarding: route to chosen destination
    if (getCompanyDestination() === 'dashboard') {
      window.location.replace('/dashboard');
      return;
    }

    setPage('marketplace');
  };

  const handleLogout = () => {
    tokenStore.clear();
    setUserName('Company User');
    setAuthMode('login');
    setPage('landing');
  };

  const handleCompanyOnboardingComplete = () => {
    if (companyOnboardingFromMarketplace || getCompanyDestination() === 'marketplace') {
      window.location.replace('/marketplace');
      return;
    }

    window.location.replace('/dashboard');
  };

  const handleMarketplaceCheckoutSelection = (selection: MarketplaceCheckoutSelection) => {
    setSelectedMarketplaceProfileId(selection.workerId);
    setSelectedMarketplacePackage(selection);
    setMarketplaceOrderDraft(null);
    writeSessionJson(MARKETPLACE_CHECKOUT_SELECTION_KEY, selection);
    writeSessionJson(MARKETPLACE_ORDER_DRAFT_KEY, null);
    setPage('marketplace-consultation');
  };

  const handleMarketplaceOrderDraftSuccess = (draft: MarketplaceOrderDraft) => {
    setMarketplaceOrderDraft(draft);
    writeSessionJson(MARKETPLACE_ORDER_DRAFT_KEY, draft);
    setPage('marketplace-payment');
  };

  if (page === 'landing') {
    return (
      <LandingPage
        onLogin={() => {
          setPage('role-select');
        }}
        onGetStarted={() => {
          setPage('role-select');
        }}
        onMarketplace={() => {
          setCompanyDestination('marketplace');
          setMarketplaceQuery('');
          setSelectedMarketplaceProfileId('');
          setPage('marketplace');
        }}
        onMarketplaceSearch={(query) => {
          setCompanyDestination('marketplace');
          setMarketplaceQuery(query.trim());
          setSelectedMarketplaceProfileId('');
          setPage('marketplace');
        }}
        onDemo={() => window.open('mailto:demo@dechub.in')}
      />
    );
  }

  if (page === 'role-select') {
    return (
      <RoleSelectionPage
        onBack={() => setPage('landing')}
        onCompany={() => {
          setPage('company-choice');
        }}
        onFreelancer={() => {
          setPage('freelancer-login');
        }}
      />
    );
  }

  if (page === 'company-choice') {
    return (
      <CompanyChoicePage
        onBack={() => setPage('role-select')}
        onMarketplace={() => {
          setCompanyDestination('marketplace');
          setMarketplaceQuery('');
          setSelectedMarketplaceProfileId('');
          setPage('marketplace');
        }}
        onDashboard={() => {
          if (tokenStore.getAccess()) {
            window.location.replace('/dashboard');
            return;
          }
          setCompanyDestination('dashboard');
          setPage('company-dashboard-auth');
        }}
      />
    );
  }

  if (page === 'company-dashboard-auth') {
    return (
      <LoginPage
        initialRole="company"
        allowedRoles={['company']}
        onCompanyLogin={handleAuthSuccess}
        onContractorLogin={() => {
          window.location.replace('/contractor/dashboard');
        }}
        onSignUp={() => {
          tokenStore.clear();
          setCompanyOnboardingFromMarketplace(getCompanyDestination() === 'marketplace');
          setCompanyOnboardingStep(1);
          setPage('company-onboarding');
        }}
      />
    );
  }

  if (page === 'auth') {
    return (
      <CompanyAuthPage
        mode={authMode}
        onModeChange={setAuthMode}
        onBack={() => setPage('role-select')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  if (page === 'company-onboarding') {
    return (
      <CompanyOnboardingPage
        initialStep={companyOnboardingStep}
        hideProgress={companyOnboardingFromMarketplace}
        completeAfterStep1={companyOnboardingFromMarketplace}
        onBack={() => setPage('company-dashboard-auth')}
        onComplete={handleCompanyOnboardingComplete}
      />
    );
  }

  if (page === 'freelancer-login') {
    return (
      <LoginPage
        initialRole="contractor"
        allowedRoles={['contractor']}
        onCompanyLogin={() => {
          if (tokenStore.getAccess()) {
            window.location.replace('/dashboard');
            return;
          }
          setPage('company-dashboard-auth');
        }}
        onContractorLogin={() => {
          window.location.replace('/contractor/dashboard');
        }}
        onSignUp={() => {
          contractorTokenStore.clear();
          setPage('freelancer-signup');
        }}
      />
    );
  }

  if (page === 'freelancer-signup') {
    return (
      <FreelancerSignupPage
        onBack={() => setPage('freelancer-login')}
        onComplete={(profile) => {
          setFreelancerFirstName(profile.firstName);
          setPage('freelancer-success');
        }}
      />
    );
  }

  if (page === 'freelancer-success') {
    return (
      <FreelancerSignupSuccessPage
        firstName={freelancerFirstName || 'there'}
        onDashboard={() => {
          window.location.replace('/contractor/dashboard');
        }}
      />
    );
  }

  if (page === 'freelancer-dashboard') {
    window.location.replace('/contractor/dashboard');
    return null;
  }

  if (page === 'marketplace-consultation') {
    return (
      <MarketplaceProjectConsultationPage
        selection={selectedMarketplacePackage}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onBack={() => setPage('marketplace-profile')}
        onLogout={handleLogout}
        onNotifications={() => setPage('notifications')}
        onLogin={() => {
          if (tokenStore.getAccess()) {
            // already logged in: go to marketplace immediately
            setCompanyDestination('marketplace');
            setPage('marketplace');
            return;
          }
          setCompanyDestination('marketplace');
          setPage('company-dashboard-auth');
        }}
        onSubmitSuccess={handleMarketplaceOrderDraftSuccess}
      />
    );
  }

  if (page === 'marketplace-payment') {
    return (
      <MarketplacePaymentPage
        selection={selectedMarketplacePackage}
        orderDraft={marketplaceOrderDraft}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onBack={() => setPage('marketplace-consultation')}
        onLogout={handleLogout}
        onNotifications={() => setPage('notifications')}
        onLogin={() => {
          if (tokenStore.getAccess()) {
            setCompanyDestination('marketplace');
            setPage('marketplace');
            return;
          }
          setCompanyDestination('marketplace');
          setPage('company-dashboard-auth');
        }}
      />
    );
  }

  if (page === 'notifications') {
    return <NotificationPage onBack={() => setPage('marketplace')} />;
  }

  return (
    page === 'marketplace-profile' ? (
      <MarketplaceTalentProfilePage
        workerId={selectedMarketplaceProfileId}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onContinueToConsultation={handleMarketplaceCheckoutSelection}
        onBack={() => {
          setPage('marketplace');
        }}
        onLogout={handleLogout}
        onNotifications={() => setPage('notifications')}
        onLogin={() => {
          if (tokenStore.getAccess()) {
            setCompanyDestination('marketplace');
            setPage('marketplace');
            return;
          }
          setCompanyDestination('marketplace');
          setPage('company-dashboard-auth');
        }}
      />
    ) : (
      <TalentMarketplacePage
        initialQuery={marketplaceQuery}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onLogout={handleLogout}
        onNotifications={() => setPage('notifications')}
        onLogin={() => {
          setCompanyDestination('marketplace');
          setPage('company-dashboard-auth');
        }}
        onOpenProfile={(workerId) => {
          setSelectedMarketplaceProfileId(workerId);
          setPage('marketplace-profile');
        }}
      />
    )
  );
}
