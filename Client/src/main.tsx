import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ContractorPortal from './contractor/ContractorPortal';
import ContractorDashboard from './contractor/ContractorDashboard';
import Dashboard from './dashboard/Dashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { tokenStore } from './api/client';
import { contractorTokenStore } from './contractor/api/contractor.api';
import './responsive.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const isDashboardRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');
const isTalentOnboardingRoute = pathname === '/talent/join' || pathname === '/talent/signed';
const isResetPasswordRoute = pathname === '/reset-password';
const isContractorDashboardRoute =
  pathname === '/talent/dashboard' || pathname.startsWith('/talent/dashboard/');

if (isDashboardRoute && !tokenStore.getAccess()) {
  window.location.replace('/company/login');
}

if (isContractorDashboardRoute && !contractorTokenStore.get()) {
  window.location.replace('/talent/login');
}

const RootComponent = isDashboardRoute
  ? Dashboard
  : isResetPasswordRoute
  ? ResetPasswordPage
  : isContractorDashboardRoute
  ? ContractorDashboard
  : isTalentOnboardingRoute
  ? ContractorPortal
  : App;

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <RootComponent />
    </ErrorBoundary>
  </StrictMode>,
);
