'use client';
import { useEffect, useState } from 'react';
import './dashboard.css';
import type { DashboardPage } from './types/dashboard.type';
import DashboardHome from './pages/DashboardHome';
import WorkersPage from './pages/WorkersPage';
import { ContractsPage, InvoicesPage } from './pages/ContractInvoicePage';
import { tokenStore } from '../api/client';

// ─── Sidebar nav config ───────────────────────────────────────────────────────

interface NavItem {
  id:      DashboardPage;
  icon:    string;
  label:   string;
  badge?:  number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      icon: '▣',  label: 'Dashboard'  },
  { id: 'workers',   icon: '👥', label: 'Workers'    },
  { id: 'contracts', icon: '📄', label: 'Contracts'  },
  { id: 'invoices',  icon: '🧾', label: 'Invoices'   },
  { id: 'documents', icon: '📁', label: 'Documents'  },
  { id: 'settings',  icon: '⚙️', label: 'Settings'   },
];

// ─── Page titles ──────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<DashboardPage, string> = {
  home:      'Dashboard',
  workers:   'Workers',
  contracts: 'Contracts',
  invoices:  'Invoices',
  documents: 'Documents',
  settings:  'Settings',
};

function getDashboardPageFromQuery(initialPage: DashboardPage, hireRequestId: string): DashboardPage {
  const tab = new URLSearchParams(window.location.search).get('tab')?.trim() ?? '';

  if (tab === 'contracts') return 'contracts';
  if (tab === 'workers') return 'workers';
  if (tab === 'invoices') return 'invoices';
  if (tab === 'documents') return 'documents';
  if (tab === 'settings') return 'settings';
  if (tab === 'home') return 'home';

  return hireRequestId ? 'workers' : initialPage;
}

// ─── Simple placeholder pages ─────────────────────────────────────────────────

function DocumentsPage() {
  return (
    <div className="db-page">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Documents</div>
          <div className="db-page-sub">All contracts, invoices, KYC files, and payslips</div>
        </div>
      </div>
      <div className="db-card">
        <div className="db-empty">
          <div className="db-empty-icon">📁</div>
          <div className="db-empty-title">No documents yet</div>
          <div className="db-empty-sub">
            Documents are stored here when workers complete KYC, sign contracts,
            and submit invoices
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ companyName }: { companyName: string }) {
  return (
    <div className="db-page">
      <div className="db-page-header">
        <div>
          <div className="db-page-title">Settings</div>
          <div className="db-page-sub">Manage your company profile, billing, and preferences</div>
        </div>
        <button className="db-btn-primary">Save changes</button>
      </div>

      {[
        {
          title: 'Company Profile',
          rows: [
            { label: 'Company name',    value: companyName,      input: 'text' },
            { label: 'Company email',   value: 'admin@company.com', input: 'email' },
            { label: 'Default currency',value: 'USD',            input: 'select' },
            { label: 'Pay cycle',       value: 'Monthly',        input: 'select' },
          ],
        },
        {
          title: 'Billing',
          rows: [
            { label: 'Plan',        value: 'Starter — $49/worker/month', input: 'none' },
            { label: 'Billing card',value: '•••• •••• •••• 4242',        input: 'none' },
          ],
        },
      ].map((section) => (
        <div key={section.title} className="db-card" style={{ marginBottom: 16 }}>
          <div className="db-card-header">
            <span className="db-card-title">{section.title}</span>
          </div>
          <div style={{ padding: '8px 24px 20px' }}>
            {section.rows.map((row) => (
              <div key={row.label} className="db-form-group" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 14 }}>
                <label className="db-label" style={{ width: 180, marginBottom: 0, flexShrink: 0, color: '#64748b', fontWeight: 500 }}>
                  {row.label}
                </label>
                {row.input === 'none' ? (
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{row.value}</span>
                ) : (
                  <input
                    type={row.input === 'email' ? 'email' : 'text'}
                    className="db-input"
                    defaultValue={row.value}
                    style={{ maxWidth: 320 }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard component ─────────────────────────────────────────────────

interface DashboardProps {
  /** Company name to display in sidebar — pass from your auth context */
  companyName?: string;
  /** User's full name */
  userName?: string;
  /** User role */
  userRole?: string;
  /** Starting page — default 'home' */
  initialPage?: DashboardPage;
}

export default function Dashboard({
  companyName = 'My Company',
  userName    = 'Admin User',
  userRole    = 'Company Admin',
  initialPage = 'home',
}: DashboardProps) {
  const initialHireRequestId = new URLSearchParams(window.location.search).get('hireRequest')?.trim() ?? '';
  const [page,           setPage]           = useState<DashboardPage>(() => getDashboardPageFromQuery(initialPage, initialHireRequestId));
  const [notifCount,     setNotifCount]     = useState(3);
  const [searchQuery,    setSearchQuery]    = useState('');

  useEffect(() => {
    const nextPage = getDashboardPageFromQuery(initialPage, initialHireRequestId);
    setPage(nextPage);
  }, [initialHireRequestId, initialPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', page);
    if (page !== 'workers') {
      params.delete('hireRequest');
    }
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `/dashboard?${nextQuery}` : '/dashboard';
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [page]);

  const handleLogout = () => {
    tokenStore.clear();
    window.location.href = '/';
  };

  const initials = userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const companyInitial = companyName[0]?.toUpperCase() ?? 'C';

  return (
    <div className="db-shell">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="db-sidebar">
        {/* Logo */}
        <div className="db-sidebar-logo">
          <div className="db-logo-mark">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="db-logo-text">Dechub</span>
        </div>

        {/* Company switcher */}
        <div className="db-company-switcher">
          <div className="db-company-avatar">{companyInitial}</div>
          <span className="db-company-name">{companyName}</span>
          <span className="db-company-chevron">⌄</span>
        </div>

        {/* Navigation */}
        <nav className="db-nav" aria-label="Main navigation">
          <div className="db-nav-section">Main</div>
          {NAV_ITEMS.slice(0, 4).map((item) => (
            <button
              key={item.id}
              className={`db-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); }}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span className="db-nav-label">{item.label}</span>
              {item.badge ? (
                <span className="db-nav-badge">{item.badge}</span>
              ) : null}
            </button>
          ))}

          <div className="db-nav-section">Other</div>
          {NAV_ITEMS.slice(4).map((item) => (
            <button
              key={item.id}
              className={`db-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => { setPage(item.id); }}
              aria-current={page === item.id ? 'page' : undefined}
            >
              <span className="db-nav-icon">{item.icon}</span>
              <span className="db-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="db-sidebar-user">
          <div className="db-user-avatar">{initials}</div>
          <div className="db-user-info">
            <div className="db-user-name">{userName}</div>
            <div className="db-user-role">{userRole}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', fontSize: 16,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}
          >
            ⇥
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="db-main">
        {/* Top bar */}
        <header className="db-topbar">
          <div className="db-topbar-title">{PAGE_TITLES[page]}</div>

          <div className="db-topbar-search">
            <span>🔍</span>
            <input
              type="search"
              placeholder="Search…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Global search"
            />
          </div>

          <div className="db-topbar-actions">
            <button
              className="db-icon-btn"
              aria-label={`${notifCount} notifications`}
              onClick={() => setNotifCount(0)}
            >
              🔔
              {notifCount > 0 && <span className="db-notif-dot" />}
            </button>
            <button className="db-icon-btn" aria-label="Help">?</button>
            <div
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0a1628, #2563eb)',
                display: 'grid', placeItems: 'center',
                color: '#fff', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
              title={userName}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main>
          {page === 'home'      && <DashboardHome onNavigate={(p: string) => setPage(p as DashboardPage)} />}
          {page === 'workers'   && <WorkersPage initialHireRequestId={initialHireRequestId} />}
          {page === 'contracts' && <ContractsPage />}
          {page === 'invoices'  && <InvoicesPage />}
          {page === 'documents' && <DocumentsPage />}
          {page === 'settings'  && <SettingsPage companyName={companyName} />}
        </main>
      </div>
    </div>
  );
}
