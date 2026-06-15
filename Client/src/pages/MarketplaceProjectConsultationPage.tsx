import { useMemo, useState, type ReactNode } from 'react';
import { useForm, type FieldError, type UseFormRegisterReturn } from 'react-hook-form';
import './marketplace-project-consultation.css';
import {
  createMarketplaceOrderDraft,
  type MarketplaceCheckoutSelection,
  type MarketplaceOrderDraft,
} from '../api/marketplace.api';
import type { ApiError } from '../api/client';
import UserMenu from '../components/common/UserMenu';

interface MarketplaceProjectConsultationPageProps {
  selection: MarketplaceCheckoutSelection | null;
  isAuthenticated: boolean;
  userName: string;
  onBack: () => void;
  onLogout: () => void;
  onNotifications: () => void;
  onLogin: () => void;
  onSubmitSuccess: (draft: MarketplaceOrderDraft) => void;
}

interface ConsultationFormValues {
  firstName: string;
  lastName: string;
  countryCode: string;
  phoneNumber: string;
  workEmail: string;
  projectType: string;
  budget: string;
  projectDescription: string;
}

const MIN_PROJECT_DESCRIPTION = 150;

const COUNTRY_CODE_OPTIONS = [
  { label: 'India (+91)', value: '+91' },
  { label: 'United States (+1)', value: '+1' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
  { label: 'Singapore (+65)', value: '+65' },
  { label: 'Australia (+61)', value: '+61' },
];

const PROJECT_TYPE_OPTIONS = [
  'Web Development',
  'Mobile App',
  'UI/UX Design',
  'E-commerce',
  'Branding',
  'Maintenance & Support',
];

const BUDGET_OPTIONS = [
  '$100 - $500',
  '$500 - $1,500',
  '$1,500 - $3,000',
  '$3,000 - $5,000',
  '$5,000+',
];

function FieldErrorMessage({ error }: { error?: FieldError }) {
  if (!error?.message) return null;
  return <p className="mpc-field-error">{error.message}</p>;
}

function TextField({
  label,
  placeholder,
  registration,
  error,
  type = 'text',
  hideLabel = false,
}: {
  label: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  type?: string;
  hideLabel?: boolean;
}) {
  return (
    <label className="mpc-field">
      <span className={`mpc-label ${hideLabel ? 'mpc-label-placeholder' : ''}`}>{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        className={`mpc-input ${error ? 'mpc-input-error' : ''}`}
        {...registration}
      />
      <FieldErrorMessage error={error} />
    </label>
  );
}

function SelectField({
  label,
  registration,
  error,
  children,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
  children: ReactNode;
}) {
  return (
    <label className="mpc-field">
      <span className="mpc-label">{label}</span>
      <div className="mpc-select-wrap">
        <select className={`mpc-input mpc-select ${error ? 'mpc-input-error' : ''}`} {...registration}>
          {children}
        </select>
        <span className="mpc-select-arrow">⌄</span>
      </div>
      <FieldErrorMessage error={error} />
    </label>
  );
}

export default function MarketplaceProjectConsultationPage({
  selection,
  isAuthenticated,
  userName,
  onBack,
  onLogout,
  onNotifications,
  onLogin,
  onSubmitSuccess,
}: MarketplaceProjectConsultationPageProps) {
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ConsultationFormValues>({
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      countryCode: '+91',
      phoneNumber: '',
      workEmail: '',
      projectType: '',
      budget: '',
      projectDescription: '',
    },
  });

  const description = watch('projectDescription') ?? '';
  const charactersLeft = Math.max(0, MIN_PROJECT_DESCRIPTION - description.trim().length);
  const selectedPackageLabel = useMemo(() => {
    if (!selection) return '';
    return `${selection.package.name} package selected for ${selection.workerName}`;
  }, [selection]);

  const onSubmit = handleSubmit(async (values) => {
    if (!selection) return;

    setSubmitError('');

    try {
      const draft = await createMarketplaceOrderDraft(selection.workerId, {
        packageSnapshot: selection.package,
        clientDetails: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          countryCode: values.countryCode,
          phoneNumber: values.phoneNumber.trim(),
          workEmail: values.workEmail.trim(),
          projectType: values.projectType,
          budget: values.budget,
          projectDescription: values.projectDescription.trim(),
        },
      });

      setIsSubmitted(true);
      window.setTimeout(() => onSubmitSuccess(draft), 450);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.message ?? 'We could not save your project draft. Please try again.');
    }
  });

  if (!selection) {
    return (
      <div className="mpc-root">
        <div className="mpc-empty">
          <h1>Consultation details unavailable</h1>
          <p>Please go back to the service page and select a package again before continuing.</p>
          <button type="button" onClick={onBack} className="mpc-empty-action">
            Back to service details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mpc-root">
      <header className="mpc-topbar">
        <div className="mpc-topbar-inner">
          <button type="button" onClick={onBack} className="mpc-back">
            ← Back to service details
          </button>
          <div className="mpc-user">
            {isAuthenticated ? (
              <UserMenu userName={userName} onLogout={onLogout} onNotifications={onNotifications} />
            ) : (
              <>
                <span>Guest company</span>
                <button type="button" className="mpc-login-button" onClick={onLogin}>
                  Login
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mpc-main">
        <section className="mpc-shell">
          <div className="mpc-heading">
            <p className="mpc-helper">
              {selectedPackageLabel} <span>{selection.package.name} • {new Intl.NumberFormat('en-US', { style: 'currency', currency: selection.currency, maximumFractionDigits: 0 }).format(selection.package.price)}</span>
            </p>
            <h1 className="mpc-title">
              Book a Free <span>Consultation</span>
            </h1>
          </div>

          <form onSubmit={onSubmit} className="mpc-form" noValidate>
            <div className="mpc-grid">
              <TextField
                label="First name *"
                placeholder="First name"
                registration={register('firstName', {
                  required: 'First name is required.',
                  minLength: { value: 2, message: 'Enter at least 2 characters.' },
                })}
                error={errors.firstName}
              />

              <TextField
                label="Last name *"
                placeholder="Last name"
                registration={register('lastName', {
                  required: 'Last name is required.',
                  minLength: { value: 2, message: 'Enter at least 2 characters.' },
                })}
                error={errors.lastName}
              />

              <div className="mpc-phone-row">
                <SelectField
                  label="Phone number"
                  registration={register('countryCode', {
                    required: 'Country code is required.',
                  })}
                  error={errors.countryCode}
                >
                  {COUNTRY_CODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </SelectField>

                <TextField
                  label="Phone number"
                  placeholder="Phone number"
                  registration={register('phoneNumber', {
                    required: 'Phone number is required.',
                    pattern: {
                      value: /^[0-9\s\-()]{6,20}$/,
                      message: 'Enter a valid phone number.',
                    },
                  })}
                  error={errors.phoneNumber}
                  hideLabel
                />
              </div>

              <TextField
                label="Work email *"
                placeholder="Work email"
                type="email"
                registration={register('workEmail', {
                  required: 'Work email is required.',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid work email.',
                  },
                })}
                error={errors.workEmail}
              />

              <SelectField
                label="Project type *"
                registration={register('projectType', {
                  required: 'Project type is required.',
                })}
                error={errors.projectType}
              >
                <option value="">Please Select</option>
                {PROJECT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Choose budget *"
                registration={register('budget', {
                  required: 'Budget is required.',
                })}
                error={errors.budget}
              >
                <option value="">Please Select</option>
                {BUDGET_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="mpc-textarea-block">
              <label className="mpc-field">
                <span className="mpc-label">Tell us about your project *</span>
                <textarea
                  placeholder="Example: We're interested in rebranding and redesigning our website, which includes new content and product descriptions and social media templates for different platforms."
                  className={`mpc-input mpc-textarea ${errors.projectDescription ? 'mpc-input-error' : ''}`}
                  {...register('projectDescription', {
                    required: 'Project description is required.',
                    validate: (value) =>
                      value.trim().length >= MIN_PROJECT_DESCRIPTION
                        ? true
                        : `Please enter at least ${MIN_PROJECT_DESCRIPTION} characters.`,
                  })}
                />
                <FieldErrorMessage error={errors.projectDescription} />
                <p className={`mpc-counter ${charactersLeft > 0 ? 'mpc-counter-error' : ''}`}>
                  {charactersLeft > 0
                    ? `Please enter at least ${MIN_PROJECT_DESCRIPTION} characters, ${charactersLeft} characters left.`
                    : `${description.trim().length} characters entered.`}
                </p>
              </label>
            </div>

            {submitError ? <div className="mpc-message mpc-message-error">{submitError}</div> : null}
            {isSubmitted ? <div className="mpc-message mpc-message-success">Project draft created successfully. Redirecting you to payment...</div> : null}

            <div className="mpc-submit-row">
              <button type="submit" disabled={!isValid || isSubmitting || isSubmitted} className="mpc-submit">
                {isSubmitting ? 'Creating your draft...' : isSubmitted ? 'Draft created' : 'Kick Off Your Project'}
              </button>
            </div>

            <p className="mpc-footnote">
              By submitting this form you agree to Dechub&apos;s Terms of Service and acknowledge that you&apos;ve read our Privacy Policy.
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
