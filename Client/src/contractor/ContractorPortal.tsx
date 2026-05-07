import { useEffect, useState } from 'react';
import './contractor.css';
import type { ContractorOnboardingData, ContractorTokenInfo } from './types/contractor.types';
import { INITIAL_ONBOARDING } from './types/contractor.types';
import { verifyInviteToken, contractorTokenStore } from './api/contractor.api';
import Step1Password       from './steps/Step1Password';
import Step2PersonalDetails from './steps/Step2PersonalDetails';
import Step3KYC            from './steps/Step3Kyc';
import Step4BankDetails    from './steps/Step4BankDetails';
import Step5ReviewSign     from './steps/Step5reviewSign';
import ContractorDashboard from './ContractorDashboard';

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Set password',      desc: 'Create your account'            },
  { label: 'Personal details',  desc: 'DOB, address, tax ID'           },
  { label: 'Identity check',    desc: 'Upload ID + selfie for KYC'     },
  { label: 'Payment details',   desc: 'Wise, bank, or PayPal'          },
  { label: 'Review & Sign',     desc: 'Accept and sign your contract' },
];

// ─── Left panel ───────────────────────────────────────────────────────────────

function LeftPanel({ info, step }: { info: ContractorTokenInfo; step: number }) {
  return (
    <aside className="cp-left">
      {/* Logo */}
      <div className="cp-logo">
        <div className="cp-logo-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="cp-logo-name">Dechub</span>
      </div>

      {/* Welcome */}
      <div className="cp-welcome">
        <div className="cp-welcome-tag">Contractor Onboarding</div>
        <div className="cp-welcome-company">{info.companyName}</div>
        <div className="cp-welcome-role">
          {info.roleTitle} · {info.payCurrency} {info.payRate?.toLocaleString()}/{info.payFrequency}
        </div>

        {/* Steps */}
        <div className="cp-progress-steps">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'pending';
            return (
              <div key={s.label} className={`cp-progress-step ${state}`}>
                <div className={`cp-step-num ${state}`}>
                  {state === 'done' ? '✓' : i + 1}
                </div>
                <div className="cp-step-info">
                  <div className={`cp-step-label ${state}`}>{s.label}</div>
                  <div className={`cp-step-desc ${state}`}>{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cp-left-footer">
        🔒 Your data is encrypted with AES-256 and stored securely.<br />
        © {new Date().getFullYear()} Dechub Pvt. Ltd. · Bengaluru, India
      </div>
    </aside>
  );
}

// ─── Loading / error screens ──────────────────────────────────────────────────

function FullPageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', flexDirection: 'column', gap: 16 }}>
      <div className="cp-spinner dark" style={{ width: 28, height: 28, borderWidth: 3 }} />
      <p style={{ color: '#94a3b8', fontSize: 14 }}>Verifying your invite link…</p>
    </div>
  );
}

function FullPageError({ message }: { message: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
          Invalid invite link
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          {message}
        </p>
        <p style={{ fontSize: 13, color: '#94a3b8' }}>
          If you believe this is a mistake, contact your company's HR team or email{' '}
          <a href="mailto:support@dechub.in" style={{ color: '#2563eb' }}>support@dechub.in</a>
        </p>
      </div>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ info, onDashboard }: { info: ContractorTokenInfo; onDashboard: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ maxWidth: 480, textAlign: 'center', padding: 32 }}>
        <div style={{
          width: 80, height: 80,
          background: 'linear-gradient(135deg, #00c9a7, #2563eb)',
          borderRadius: '50%',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 24px',
          fontSize: 36,
        }}>
          🎉
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 10 }}>
          You're all set!
        </h2>
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, marginBottom: 8 }}>
          Welcome to <strong>{info.companyName}</strong>'s team on Dechub.
        </p>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 32 }}>
          Your contract has been signed and your account is active.
          You can now submit invoices every month and track your payments.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            className="cp-btn-primary"
            onClick={onDashboard}
          >
            Go to my dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ContractorPortalProps {
  /** Extract from URL: /worker/join?token=xxx */
  inviteToken?: string;
}

export default function ContractorPortal({ inviteToken }: ContractorPortalProps) {
  const [state, setState] = useState<
    'loading' | 'error' | 'onboarding' | 'success' | 'dashboard'
  >('loading');

  const [errorMsg,  setErrorMsg]  = useState('');
  const [info,      setInfo]      = useState<ContractorTokenInfo | null>(null);
  const [step,      setStep]      = useState(0);
  const [formData,  setFormData]  = useState<ContractorOnboardingData>(INITIAL_ONBOARDING);

  // Extract token from URL if not passed as prop
  const token = inviteToken ?? new URLSearchParams(window.location.search).get('token') ?? '';

  useEffect(() => {
    // If already logged in as contractor — show dashboard
    if (contractorTokenStore.get() && !token) {
      setState('dashboard');
      return;
    }

    if (!token) {
      setErrorMsg('No invite token found in the URL. Please use the link from your invitation email.');
      setState('error');
      return;
    }

    verifyInviteToken(token)
      .then((info) => {
        setInfo(info);
        setStep(info.onboardingStep ?? 0);
        setState('onboarding');
      })
      .catch((err: Error) => {
        setErrorMsg(
          err.message.includes('expired')
            ? 'This invite link has expired (valid for 7 days). Ask your company to resend the invite.'
            : err.message.includes('already')
            ? 'This invite has already been used. Try logging in instead.'
            : 'This invite link is invalid or has already been used.',
        );
        setState('error');
      });
  }, [token]);

  const handleChange = <K extends keyof ContractorOnboardingData>(
    key: K,
    value: ContractorOnboardingData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleStringChange = (key: keyof ContractorOnboardingData, value: string) => {
    handleChange(key, value as ContractorOnboardingData[typeof key]);
  };

  if (state === 'loading') return <FullPageLoader />;
  if (state === 'error')   return <FullPageError message={errorMsg} />;
  if (state === 'dashboard') return <ContractorDashboard />;
  if (state === 'success' && info) {
    return <SuccessScreen info={info} onDashboard={() => setState('dashboard')} />;
  }

  if (!info) return <FullPageError message="Unexpected error. Please try again." />;

  return (
    <div className="cp-root">
      <div className="cp-onboarding">
        {/* Left panel */}
        <LeftPanel info={info} step={step} />

        {/* Right panel */}
        <div className="cp-right">
          {step === 0 && (
            <Step1Password
              token={token}
              info={info}
              data={formData}
              onChange={handleStringChange}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <Step2PersonalDetails
              data={formData}
              onChange={handleStringChange}
              onNext={() => setStep(2)}
              onBack={() => setStep(0)}
            />
          )}
          {step === 2 && (
            <Step3KYC
              data={formData}
              onChange={(k, v) => handleChange(k, v as ContractorOnboardingData[typeof k])}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step4BankDetails
              data={formData}
              onChange={handleStringChange}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step5ReviewSign
              onComplete={() => setState('success')}
              onBack={() => setStep(3)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
