import { useEffect, useMemo, useState } from 'react';
import './styles.css';
import LandingPage from './pages/LandingPage';
import CompanyAuthPage from './pages/CompanyAuthPage';
import TalentMarketplacePage from './pages/TalentMarketplacePage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import LoginPage from './pages/LoginPage';
import FreelancerSignupPage from './pages/FreelancerSignupPage';
import FreelancerSignupSuccessPage from './pages/FreelancerSignupSuccessPage';
import { tokenStore } from './api/client';
import { handleGoogleCallback } from './api/auth.api';
import { contractorTokenStore } from './contractor/api/contractor.api';

type AppPage = 'landing' | 'role-select' | 'auth' | 'freelancer-login' | 'freelancer-signup' | 'freelancer-success' | 'freelancer-dashboard' | 'marketplace';
type AuthMode = 'login' | 'signup';

function getRouteState(pathname: string): { page: AppPage; mode: AuthMode } {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';

  if (normalizedPath === '/get-started') {
    return { page: 'role-select', mode: 'login' };
  }

  if (normalizedPath === '/company/login') {
    return { page: 'auth', mode: 'login' };
  }

  if (normalizedPath === '/company/signup') {
    return { page: 'auth', mode: 'signup' };
  }

  if (normalizedPath === '/auth/callback') {
    return { page: 'auth', mode: 'login' };
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

  return { page: 'landing', mode: 'login' };
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

export default function App() {
  const initialRoute = useMemo(
    () => getRouteState(window.location.pathname),
    [],
  );

  const [page, setPage] = useState<AppPage>(initialRoute.page);
  const [authMode, setAuthMode] = useState<AuthMode>(initialRoute.mode);
  const [userName, setUserName] = useState<string>(() => getUserNameFromToken());
  const [freelancerFirstName, setFreelancerFirstName] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      const next = getRouteState(window.location.pathname);
      setPage(next.page);
      setAuthMode(next.mode);
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
      setAuthMode('login');
      setPage('auth');
      return;
    }

    setUserName(getUserNameFromToken());
    setPage('marketplace');
  }, []);

  useEffect(() => {
    if (page === 'marketplace' && !tokenStore.getAccess()) {
      setAuthMode('login');
      setPage('auth');
      return;
    }

    const targetPath =
      page === 'landing'
        ? '/'
        : page === 'role-select'
        ? '/get-started'
        : page === 'marketplace'
        ? '/marketplace'
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

    const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
    if (currentPath !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  }, [authMode, page]);

  const handleAuthSuccess = () => {
    setUserName(getUserNameFromToken());
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
        onGetStarted={() => {
          setPage('role-select');
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
          setAuthMode('login');
          setPage('auth');
        }}
        onFreelancer={() => {
          setPage('freelancer-login');
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

  if (page === 'freelancer-login') {
    return (
      <LoginPage
        initialRole="contractor"
        allowedRoles={['contractor']}
        onCompanyLogin={() => {
          setAuthMode('login');
          setPage('auth');
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
    <TalentMarketplacePage
      userName={userName}
      onLogout={handleLogout}
    />
  );
}
