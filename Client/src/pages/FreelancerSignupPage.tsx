import { useMemo, useState } from 'react';
import '../contractor/contractor.css';
import './freelancer-signup.css';
import type { ContractorOnboardingData } from '../contractor/types/contractor.types';
import { INITIAL_ONBOARDING } from '../contractor/types/contractor.types';
import { selfSignupContractor } from '../contractor/api/contractor.api';
import Step2PersonalDetails from '../contractor/steps/Step2PersonalDetails';
import Step3KYC from '../contractor/steps/Step3Kyc';
import Step4BankDetails from '../contractor/steps/Step4BankDetails';

interface FreelancerProfile {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  nationality: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId: string;
  idType: string;
  idNumber: string;
  paymentMethod: string;
  wiseEmail: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftCode: string;
  paypalEmail: string;
}

interface FreelancerSignupPageProps {
  onBack: () => void;
  onComplete: (profile: FreelancerProfile) => void;
}

function LogoMark() {
  return (
    <div className="cp-logo-mark">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

const STEPS = [
  { label: 'Create account', desc: 'Set up your freelancer profile' },
  { label: 'Personal details', desc: 'Complete your profile' },
  { label: 'Identity check', desc: 'Verify for payments' },
  { label: 'Payment details', desc: 'Add payout method' },
] as const;

export default function FreelancerSignupPage({
  onBack,
  onComplete,
}: FreelancerSignupPageProps) {
  const [step, setStep] = useState(0);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState('');
  const [account, setAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [form, setForm] = useState<ContractorOnboardingData>({
    ...INITIAL_ONBOARDING,
    paymentMethod: 'wise',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentMeta = useMemo(() => STEPS[step], [step]);

  const updateAccountField = (key: keyof typeof account, value: string) => {
    setAccount((prev) => ({ ...prev, [key]: value }));
    setAccountError('');
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateStringField = (key: keyof ContractorOnboardingData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value as ContractorOnboardingData[typeof key] }));
  };

  const updateFormField = <K extends keyof ContractorOnboardingData>(
    key: K,
    value: ContractorOnboardingData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateAccountStep = () => {
    const nextErrors: Record<string, string> = {};

    if (!account.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!account.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!account.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email)) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (!account.password.trim()) {
      nextErrors.password = 'Password is required';
    } else if (account.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }
    if (!account.confirmPassword.trim()) {
      nextErrors.confirmPassword = 'Please confirm your password';
    } else if (account.password !== account.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    return nextErrors;
  };

  const finishSignup = () => {
    const profile: FreelancerProfile = {
      firstName: account.firstName.trim(),
      lastName: account.lastName.trim(),
      email: account.email.trim().toLowerCase(),
      dateOfBirth: form.dateOfBirth,
      nationality: form.nationality.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      taxId: form.taxId.trim(),
      idType: form.idType,
      idNumber: form.idNumber.trim(),
      paymentMethod: form.paymentMethod,
      wiseEmail: form.wiseEmail.trim(),
      bankName: form.bankName.trim(),
      accountNumber: form.accountNumber.trim(),
      routingNumber: form.routingNumber.trim(),
      swiftCode: form.swiftCode.trim(),
      paypalEmail: form.paypalEmail.trim(),
    };

    onComplete(profile);
  };

  const handleFirstStepContinue = async () => {
    const nextErrors = validateAccountStep();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setAccountLoading(true);
    setAccountError('');
    try {
      await selfSignupContractor({
        firstName: account.firstName.trim(),
        lastName: account.lastName.trim(),
        email: account.email.trim().toLowerCase(),
        password: account.password,
      });
      setStep(1);
    } catch (err) {
      setAccountError((err as Error).message ?? 'Failed to create your account.');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 0) {
      onBack();
      return;
    }
    setStep((prev) => prev - 1);
  };

  return (
    <div className="cp-root">
      <div className="cp-onboarding">
        <aside className="cp-left">
          <div className="cp-logo">
            <LogoMark />
            <span className="cp-logo-name">Dechub</span>
          </div>

          <div className="cp-welcome">
            <div className="cp-welcome-tag">Freelancer signup</div>
            <div className="cp-welcome-company">Create your freelancer account</div>
            <div className="cp-welcome-role">
              Complete your signup, skip contract acceptance, and go straight to your dashboard when finished.
            </div>

            <div className="cp-progress-steps">
              {STEPS.map((item, index) => {
                const state = index < step ? 'done' : index === step ? 'active' : 'pending';
                return (
                  <div key={item.label} className={`cp-progress-step ${state}`}>
                    <div className={`cp-step-num ${state}`}>{index < step ? '✓' : index + 1}</div>
                    <div className="cp-step-info">
                      <div className={`cp-step-label ${state}`}>{item.label}</div>
                      <div className={`cp-step-desc ${state}`}>{item.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cp-left-footer">
            Your data is encrypted with AES-256 and stored securely.
            <br />
            © {new Date().getFullYear()} Dechub Pvt. Ltd. · Bengaluru, India
          </div>
        </aside>

        <div className="cp-right">
          {step === 0 && (
            <div className="cp-form-card">
              <button className="fsp-back" onClick={handleBack}>
                Back
              </button>

              <div className="cp-form-title">{currentMeta.label}</div>
              <div className="cp-form-sub">{currentMeta.desc}</div>

              {accountError && <div className="cp-error">Warning: {accountError}</div>}

              <div className="cp-row-2">
                <div className="cp-field">
                  <label className="cp-label">First name <span className="cp-req">*</span></label>
                  <input
                    className={`cp-input ${errors.firstName ? 'error' : ''}`}
                    value={account.firstName}
                    onChange={(e) => updateAccountField('firstName', e.target.value)}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="cp-field-error">{errors.firstName}</p>}
                </div>
                <div className="cp-field">
                  <label className="cp-label">Last name <span className="cp-req">*</span></label>
                  <input
                    className={`cp-input ${errors.lastName ? 'error' : ''}`}
                    value={account.lastName}
                    onChange={(e) => updateAccountField('lastName', e.target.value)}
                    placeholder="Smith"
                  />
                  {errors.lastName && <p className="cp-field-error">{errors.lastName}</p>}
                </div>
              </div>

              <div className="cp-field">
                <label className="cp-label">Email <span className="cp-req">*</span></label>
                <input
                  type="email"
                  className={`cp-input ${errors.email ? 'error' : ''}`}
                  value={account.email}
                  onChange={(e) => updateAccountField('email', e.target.value)}
                  placeholder="you@example.com"
                />
                {errors.email && <p className="cp-field-error">{errors.email}</p>}
              </div>

              <div className="cp-field">
                <label className="cp-label">Create password <span className="cp-req">*</span></label>
                <input
                  type="password"
                  className={`cp-input ${errors.password ? 'error' : ''}`}
                  value={account.password}
                  onChange={(e) => updateAccountField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                />
                {errors.password && <p className="cp-field-error">{errors.password}</p>}
              </div>

              <div className="cp-field">
                <label className="cp-label">Confirm password <span className="cp-req">*</span></label>
                <input
                  type="password"
                  className={`cp-input ${errors.confirmPassword ? 'error' : ''}`}
                  value={account.confirmPassword}
                  onChange={(e) => updateAccountField('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && <p className="cp-field-error">{errors.confirmPassword}</p>}
              </div>

              <p className="fsp-note">
                Step {step + 1} of {STEPS.length}. Once you finish payment details, you&apos;ll be taken directly to your dashboard.
              </p>

              <button type="button" className="cp-btn-primary" onClick={handleFirstStepContinue} disabled={accountLoading}>
                {accountLoading ? 'Creating account...' : 'Continue to next step'}
              </button>
            </div>
          )}

          {step === 1 && (
            <Step2PersonalDetails
              data={form}
              onChange={updateStringField}
              onBack={handleBack}
              onNext={() => setStep(2)}
              submitLabel="Continue to identity check →"
            />
          )}

          {step === 2 && (
            <Step3KYC
              data={form}
              onChange={(key, value) => updateFormField(key, value as ContractorOnboardingData[typeof key])}
              onBack={handleBack}
              onNext={() => setStep(3)}
              submitLabel="Continue to payment details →"
            />
          )}

          {step === 3 && (
            <Step4BankDetails
              data={form}
              onChange={updateStringField}
              onBack={handleBack}
              onNext={finishSignup}
              submitLabel="Finish signup and go to dashboard"
            />
          )}
        </div>
      </div>
    </div>
  );
}
