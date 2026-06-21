import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getMyCompany } from '../../api/company.api';
import type { ApiError } from '../../api/client';
import { createPublicTalentRequest } from '../../api/talentRequests.api';
import './landing-talent-request-modal.css';

interface LandingTalentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LandingTalentRequestFormValues {
  companyName: string;
  companyWebsite: string;
  projectType: string;
  budget: string;
  projectDescription: string;
  contactName: string;
  contactEmail: string;
  phoneNumber: string;
}

const PROJECT_TYPE_OPTIONS = [
  'Hire freelance talent',
  'Build a remote team',
  'UI/UX Design',
  'Web Development',
  'Mobile App',
  'Ongoing support',
];

const BUDGET_OPTIONS = [
  '$500 - $1,500',
  '$1,500 - $3,000',
  '$3,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
];

const MIN_PROJECT_DESCRIPTION = 150;

export default function LandingTalentRequestModal({
  isOpen,
  onClose,
}: LandingTalentRequestModalProps) {
  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LandingTalentRequestFormValues>({
    mode: 'onChange',
    defaultValues: {
      companyName: '',
      companyWebsite: '',
      projectType: '',
      budget: '',
      projectDescription: '',
      contactName: '',
      contactEmail: '',
      phoneNumber: '',
    },
  });
  const [submitError, setSubmitError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      setSubmitError('');
      setIsSubmitted(false);
      reset();
      return;
    }

    document.body.style.overflow = 'hidden';

    let cancelled = false;

    void getMyCompany()
      .then((data) => {
        if (cancelled) {
          return;
        }

        const company = (data.company ?? {}) as Record<string, unknown>;
        const user = (data.user ?? {}) as Record<string, unknown>;
        const companyName = typeof company.companyName === 'string' ? company.companyName.trim() : '';
        const companyWebsite = typeof company.companyWebsite === 'string' ? company.companyWebsite.trim() : '';
        const firstName = typeof user.firstName === 'string' ? user.firstName.trim() : '';
        const lastName = typeof user.lastName === 'string' ? user.lastName.trim() : '';
        const contactEmail = typeof user.email === 'string' ? user.email.trim() : '';
        const phoneNumber = typeof user.phone === 'string' ? user.phone.trim() : '';

        reset((currentValues) => ({
          ...currentValues,
          companyName: currentValues.companyName || companyName,
          companyWebsite: currentValues.companyWebsite || companyWebsite,
          contactName: currentValues.contactName || `${firstName} ${lastName}`.trim(),
          contactEmail: currentValues.contactEmail || contactEmail,
          phoneNumber: currentValues.phoneNumber || phoneNumber,
        }));
      })
      .catch(() => {
        // Guests can still submit the request with manual contact details.
      });

    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, [isOpen, reset]);

  const description = watch('projectDescription') ?? '';
  const charactersLeft = Math.max(0, MIN_PROJECT_DESCRIPTION - description.trim().length);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');

    try {
      await createPublicTalentRequest({
        companyName: values.companyName.trim(),
        companyWebsite: values.companyWebsite.trim(),
        projectType: values.projectType,
        budget: values.budget,
        projectDescription: values.projectDescription.trim(),
        contactName: values.contactName.trim(),
        contactEmail: values.contactEmail.trim(),
        phoneNumber: values.phoneNumber.trim(),
      });
      setIsSubmitted(true);
    } catch (err) {
      const apiError = err as ApiError;
      setSubmitError(apiError.message ?? 'We could not submit your request. Please try again.');
    }
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="ltrm-overlay" role="dialog" aria-modal="true" aria-labelledby="landing-talent-request-title" onClick={onClose}>
      <div className="ltrm-card" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="ltrm-close" onClick={onClose} aria-label="Close request form">
          ×
        </button>

        {!isSubmitted ? (
          <>
            <div className="ltrm-header">
              <span className="ltrm-kicker">Book a demo</span>
              <h2 id="landing-talent-request-title">Tell us who you want to hire</h2>
              <p>
                Share your requirement and Dechub will review the brief, shortlist the right marketplace candidates,
                and send profile links to your company email.
              </p>
            </div>

            <form className="ltrm-form" onSubmit={onSubmit} noValidate>
              <div className="ltrm-grid">
                <label className="ltrm-field">
                  <span>Company name *</span>
                  <input
                    type="text"
                    placeholder="Acme Corporation"
                    {...register('companyName', {
                      required: 'Company name is required.',
                      minLength: { value: 2, message: 'Enter at least 2 characters.' },
                    })}
                  />
                  {errors.companyName ? <small>{errors.companyName.message}</small> : null}
                </label>

                <label className="ltrm-field">
                  <span>Company website URL *</span>
                  <input
                    type="url"
                    placeholder="https://acme.com"
                    {...register('companyWebsite', {
                      required: 'Company website URL is required.',
                      pattern: {
                        value: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
                        message: 'Enter a valid website URL starting with http:// or https://',
                      },
                    })}
                  />
                  {errors.companyWebsite ? <small>{errors.companyWebsite.message}</small> : null}
                </label>

                <label className="ltrm-field">
                  <span>Contact name *</span>
                  <input
                    type="text"
                    placeholder="Alex Johnson"
                    {...register('contactName', {
                      required: 'Contact name is required.',
                      minLength: { value: 2, message: 'Enter at least 2 characters.' },
                    })}
                  />
                  {errors.contactName ? <small>{errors.contactName.message}</small> : null}
                </label>

                <label className="ltrm-field">
                  <span>Work email *</span>
                  <input
                    type="email"
                    placeholder="alex@acme.com"
                    {...register('contactEmail', {
                      required: 'Work email is required so we can send candidate profiles.',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Enter a valid email address.',
                      },
                    })}
                  />
                  {errors.contactEmail ? <small>{errors.contactEmail.message}</small> : null}
                </label>

                <label className="ltrm-field">
                  <span>Project type *</span>
                  <select
                    {...register('projectType', {
                      required: 'Project type is required.',
                    })}
                  >
                    <option value="">Please Select</option>
                    {PROJECT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.projectType ? <small>{errors.projectType.message}</small> : null}
                </label>

                <label className="ltrm-field">
                  <span>Choose budget *</span>
                  <select
                    {...register('budget', {
                      required: 'Budget is required.',
                    })}
                  >
                    <option value="">Please Select</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {errors.budget ? <small>{errors.budget.message}</small> : null}
                </label>
              </div>

              <label className="ltrm-field ltrm-field-full">
                <span>Phone number</span>
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  {...register('phoneNumber')}
                />
              </label>

              <label className="ltrm-field ltrm-field-full">
                <span>Tell us about your project *</span>
                <textarea
                  placeholder="Describe the role, skills, team context, expected deliverables, timeline, and anything else that will help us shortlist the right candidate."
                  {...register('projectDescription', {
                    required: 'Project description is required.',
                    validate: (value) =>
                      value.trim().length >= MIN_PROJECT_DESCRIPTION
                        ? true
                        : `Please enter at least ${MIN_PROJECT_DESCRIPTION} characters.`,
                  })}
                />
                {errors.projectDescription ? <small>{errors.projectDescription.message}</small> : null}
                <p className={`ltrm-counter ${charactersLeft > 0 ? 'ltrm-counter-error' : ''}`}>
                  {charactersLeft > 0
                    ? `Please enter at least ${MIN_PROJECT_DESCRIPTION} characters, ${charactersLeft} characters left.`
                    : `${description.trim().length} characters entered.`}
                </p>
              </label>

              {submitError ? <div className="ltrm-message">{submitError}</div> : null}

              <div className="ltrm-actions">
                <button type="button" className="ltrm-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="ltrm-primary" disabled={!isValid || isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Send request'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="ltrm-success">
            <span className="ltrm-kicker">Request submitted</span>
            <h2>Thanks, we’ve received your hiring brief.</h2>
            <p>
              Dechub admin will review your requirement, onboard the best-fit candidates, and send their marketplace
              profile links to your company email. When you open any link, you’ll land directly on that candidate’s
              marketplace profile to review and continue hiring.
            </p>
            <button type="button" className="ltrm-primary" onClick={onClose}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
