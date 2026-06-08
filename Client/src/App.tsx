import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import LandingPage from './pages/LandingPage';
import CompanyAuthPage from './pages/CompanyAuthPage';
import CompanyChoicePage from './pages/CompanyChoicePage';
import CompanyOnboardingPage from './pages/CompanyOnboardingPage';
import TalentMarketplacePage from './pages/TalentMarketplacePage';
import MarketplaceTalentProfilePage from './pages/MarketplaceTalentProfilePage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import FreelancerSignupPage from './pages/FreelancerSignupPage';
import FreelancerSignupSuccessPage from './pages/FreelancerSignupSuccessPage';
import { tokenStore } from './api/client';
import { handleGoogleCallback } from './api/auth.api';
import { contractorTokenStore } from './contractor/api/contractor.api';
import type { Step } from './types/signup';

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
  | 'marketplace-profile';

type AuthMode = 'login' | 'signup';
type CompanyDestination = 'marketplace' | 'dashboard';

const COMPANY_DESTINATION_KEY = 'dechub_company_destination';

function getRouteState(pathname: string): { page: AppPage; mode: AuthMode } {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

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

  if (normalizedPath.startsWith('/marketplace/')) {
    return { page: 'marketplace-profile', mode: 'login' };
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

  return decodeURIComponent(normalizedPath.slice('/marketplace/'.length)).trim();
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
  const [marketplaceQuery, setMarketplaceQuery] = useState<string>(() => getMarketplaceQueryFromUrl());
  const [selectedMarketplaceProfileId, setSelectedMarketplaceProfileId] = useState<string>(() => getMarketplaceProfileIdFromUrl());

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

    if (getCompanyDestination() === 'dashboard') {
      const nextStep = getNextCompanyStep(result.signupStep);
      if (nextStep) {
        setCompanyOnboardingStep(nextStep);
        setPage('company-onboarding');
      } else {
        window.location.replace('/dashboard');
      }
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

    if (getCompanyDestination() === 'dashboard') {
      const nextStep = getNextCompanyStep(result.signupStep ?? 1);
      if (nextStep) {
        setCompanyOnboardingStep(nextStep);
        setPage('company-onboarding');
      } else {
        window.location.replace('/dashboard');
      }
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

  if (page === 'landing') {
    return (
      <LandingPage
        onLogin={() => {
          setPage('role-select');
        }}
        onGetStarted={() => {
          setCompanyDestination('marketplace');
          setMarketplaceQuery('');
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
          setCompanyDestination('dashboard');
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
        onBack={() => setPage('company-dashboard-auth')}
        onComplete={() => {
          window.location.replace('/dashboard');
        }}
      />
    );
  }

  if (page === 'freelancer-login') {
    return (
      <LoginPage
        initialRole="contractor"
        allowedRoles={['contractor']}
        onCompanyLogin={() => {
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

  return (
    page === 'marketplace-profile' ? (
      <MarketplaceTalentProfilePage
        workerId={selectedMarketplaceProfileId}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onBack={() => {
          setPage('marketplace');
        }}
        onLogout={handleLogout}
      />
    ) : (
      <TalentMarketplacePage
        initialQuery={marketplaceQuery}
        isAuthenticated={Boolean(tokenStore.getAccess())}
        userName={userName}
        onLogout={handleLogout}
        onOpenProfile={(workerId) => {
          setSelectedMarketplaceProfileId(workerId);
          setPage('marketplace-profile');
        }}
      />
    )
  );
}
