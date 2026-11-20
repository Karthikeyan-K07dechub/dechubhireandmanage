import {observeVisibleUpdates,updateResource} from '../components/updateVisibility';
import TalentHomeSections from './TalentHomeSections';
import VerificationDocuments from './VerificationDocuments';
import { talentDashboardLink } from './talentRoutes';

import AttentionDot from '../components/AttentionDot';
import EquipmentSection from '../components/EquipmentSection';
import DashboardHelp from '../dashboard/components/DashboardHelp';

import BridgeLogo from '../components/common/BridgeLogo';
import ContractorNotificationPopup from './ContractorNotificationPopup';
import ContractorProfileReminder from './ContractorProfileReminder';
import SignOutButton from '../components/common/SignOutButton';


import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ContractorContract,
  ContractorInvoice,
  ContractorNotification,
  ContractorPage,
  ContractorProfile,


} from './types/contractor.types';
import {

  contractorTokenStore,
  getContractorNotifications,
  getContractorProfile,
  getMyContract,
  getMyInvoices,
  markContractorNotificationRead,

  updateContractorProfile,
  uploadContractorProfileImage,
} from './api/contractor.api';
import { imageBackground, resolveImageUrl } from '../utils/imageUrl';
import ProjectTasksPage from './ProjectTasksPage';
import WorkUpdatesPage from './WorkUpdatesPage';

interface ContractorDashboardProps {
  previewProfile?: ContractorProfile | null;
  onLogoutOverride?: () => void;
  initialPage?: ContractorPage;
  flashMessage?: string;
}

function getContractorPageFromQuery(initialPage: ContractorPage): ContractorPage {
  const tab = new URLSearchParams(window.location.search).get('tab')?.trim() ?? '';

  if (tab === 'contract') return 'contract';
  if (tab === 'equipment') return 'equipment';
  if (tab === 'projects') return 'projects';
  if (tab === 'work-updates') return 'work-updates';
  if (tab === 'invoices') return 'dashboard';
  if (tab === 'profile') return 'profile';
  if (tab === 'notifications') return 'notifications';
  if (tab === 'dashboard') return 'dashboard';

  return initialPage==='invoices'?'dashboard':initialPage;
}

const MARKETPLACE_AVAILABILITY_OPTIONS = [
  { value: 'available_now', label: 'Available now' },
  { value: 'this_week', label: 'Available this week' },
  { value: 'two_weeks', label: '2 weeks notice' },
  { value: 'next_month', label: 'Available next month' },
  { value: 'not_available', label: 'Not available' },
] as const;

const SKILL_SUGGESTIONS: string[] = [];

const DEFAULT_MARKETPLACE_TITLE = 'Freelancer';
const PROFILE_SUMMARY_PLACEHOLDER = 'Tell companies about your strongest skills and the kind of freelance work you want.';
const DEFAULT_MARKETPLACE_SUMMARIES = new Set([
  PROFILE_SUMMARY_PLACEHOLDER,
  'Experienced freelancer available for contract work.',
  'Self-signup freelancer profile',
]);

function inferOnboardingStepFromProfile(profile: Partial<ContractorProfile>): number {
  const hasPersonalDetails = Boolean(
    profile.dateOfBirth
    && profile.nationality?.trim()
    && profile.addressLine1?.trim()
    && profile.city?.trim()
    && profile.postalCode?.trim()
    && profile.country?.trim()
    && profile.taxId?.trim(),
  );

  if (!hasPersonalDetails) {
    return 1;
  }

  const hasKycSubmission = Boolean(profile.idType?.trim() && profile.idNumber?.trim());
  if (!hasKycSubmission) {
    return 2;
  }

  const hasPaymentDetails = Boolean(
    (profile.paymentMethod === 'wise' && profile.wiseEmail?.trim())
    || (profile.paymentMethod === 'paypal' && profile.paypalEmail?.trim())
    || (profile.paymentMethod === 'bank_transfer' && profile.bankName?.trim() && profile.accountNumber?.trim()),
  );

  if (!hasPaymentDetails) {
    return 3;
  }

  return 4;
}

function FileUploadControl({
  value,
  accept = 'image/*',
  onFile,
  buttonLabel = 'Choose file',
  placeholder = 'No file chosen',
}: {
  value: string;
  accept?: string;
  onFile: (file: File) => void;
  buttonLabel?: string;
  placeholder?: string;
}) {
  const displayText = value
    ? value.startsWith('http')
        ? value.replace(/^https?:\/\/(www\.)?/, '')
        : value
    : placeholder;

  return (
    <label className="cp-file-picker">
      <div className="cp-file-picker-main">
        <input
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onFile(file);
            event.currentTarget.value = '';
          }}
        />
        <span className="cp-file-picker-button">{buttonLabel}</span>
        <span className="cp-file-picker-filename">{displayText}</span>
      </div>
    </label>
  );
}

function normalizeContractorProfile(profile: Partial<ContractorProfile>): ContractorProfile {
  const availabilityOption = MARKETPLACE_AVAILABILITY_OPTIONS.find(
    (option) => option.value === profile.marketplaceAvailability,
  );
  const inferredOnboardingStep = inferOnboardingStepFromProfile(profile);

  return {
    workerId: profile.workerId ?? '',
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    roleTitle: profile.roleTitle ?? '',
    companyName: profile.companyName ?? '',
    status: profile.status ?? '',
    kycStatus: profile.kycStatus ?? '',
    kycDocumentsSubmitted: Boolean(profile.kycDocumentsSubmitted),
    marketplaceProfileComplete: Boolean(profile.marketplaceProfileComplete),
    marketplaceMissingFields: profile.marketplaceMissingFields || [],
    marketplaceEligible: Boolean(profile.marketplaceEligible),
    kycSubmittedAt: profile.kycSubmittedAt ?? null,
    payRate: typeof profile.payRate === 'number' ? profile.payRate : 0,
    payCurrency: profile.payCurrency ?? 'USD',
    payFrequency: profile.payFrequency ?? 'monthly',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    marketplaceTitle: profile.marketplaceTitle ?? DEFAULT_MARKETPLACE_TITLE,
    yearsOfExperience: typeof profile.yearsOfExperience === 'number' ? profile.yearsOfExperience : null,
    marketplaceBio: profile.marketplaceBio ?? '',
    marketplaceAvailability: availabilityOption ? availabilityOption.value : 'available_now',
    marketplaceAvailabilityLabel: profile.marketplaceAvailabilityLabel ?? (availabilityOption?.label ?? 'Available now'),
    marketplaceRate: typeof profile.marketplaceRate === 'number' ? profile.marketplaceRate : 0,
    marketplaceMonthlyRate: profile.marketplaceMonthlyRate ?? null,
    city: profile.city ?? '',
    country: profile.country ?? '',
    responseTimeHours: typeof profile.responseTimeHours === 'number' ? profile.responseTimeHours : 2,
    languages: Array.isArray(profile.languages) ? profile.languages : [],
    profilePhotoUrl: profile.profilePhotoUrl ?? '',
    bannerImageUrl: profile.bannerImageUrl ?? '',
    profileOverview: profile.profileOverview ?? '',
    portfolioProjects: Array.isArray(profile.portfolioProjects)
      ? profile.portfolioProjects.map((project) => ({
          title: project.title ?? '',
          description: project.description ?? '',
          imageUrl: project.imageUrl ?? '',
          projectLink: project.projectLink ?? '',
          tags: Array.isArray(project.tags) ? project.tags : [],
        }))
      : [],
    servicePackages: Array.isArray(profile.servicePackages)
      ? profile.servicePackages.map((pkg) => ({
          name: pkg.name ?? '',
          price: typeof pkg.price === 'number' ? pkg.price : 0,
          description: pkg.description ?? '',
          deliveryDays: typeof pkg.deliveryDays === 'number' ? pkg.deliveryDays : 0,
          revisions: typeof pkg.revisions === 'number' ? pkg.revisions : 0,
          features: Array.isArray(pkg.features) ? pkg.features : [],
        }))
      : [],
    faqItems: Array.isArray(profile.faqItems)
      ? profile.faqItems.map((item) => ({ question: item.question ?? '', answer: item.answer ?? '' }))
      : [],
    onboardingStep:
      typeof profile.onboardingStep === 'number' && profile.onboardingStep > 0
        ? profile.onboardingStep
        : inferredOnboardingStep,
    dateOfBirth: profile.dateOfBirth ?? '',
    nationality: profile.nationality ?? '',
    addressLine1: profile.addressLine1 ?? '',
    addressLine2: profile.addressLine2 ?? '',
    state: profile.state ?? '',
    postalCode: profile.postalCode ?? '',
    taxId: profile.taxId ?? '',
    idType: profile.idType ?? '',
    idNumber: profile.idNumber ?? '',
    paymentMethod: profile.paymentMethod ?? '',
    wiseEmail: profile.wiseEmail ?? '',
    bankName: profile.bankName ?? '',
    accountNumber: profile.accountNumber ?? '',
    routingNumber: profile.routingNumber ?? '',
    swiftCode: profile.swiftCode ?? '',
    paypalEmail: profile.paypalEmail ?? '',
  };
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f4f9', fontSize: 13.5, gap: 18 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function DashboardHome({profile,onNavigate,notifications,readOnly}:{profile:ContractorProfile;notifications:ContractorNotification[];readOnly:boolean;onNavigate:(page:ContractorPage)=>void}) {
 return <div className="cd-page th-home"><div className="cd-page-title">Welcome back, {profile.firstName}</div><div className="cd-page-sub">{profile.roleTitle} at {profile.companyName}</div><TalentHomeSections notifications={notifications} onNavigate={onNavigate} readOnly={readOnly}/></div>;
}

function SkillsPage({
  profile,
  onSave,
}: {
  profile: ContractorProfile;
  onSave: (skills: string[]) => Promise<void>;
}) {
  const [draftSkills, setDraftSkills] = useState<string[]>(profile.skills ?? []);
  const [newSkill, setNewSkill] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDraftSkills(profile.skills ?? []);
  }, [profile.skills]);

  const availableSuggestions = useMemo(
    () => SKILL_SUGGESTIONS.filter((skill) => !draftSkills.some((item) => item.toLowerCase() === skill.toLowerCase())),
    [draftSkills],
  );

  const persistSkills = async (nextSkills: string[], successMessage: string) => {
    setDraftSkills(nextSkills);
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSave(nextSkills);
      setMessage(successMessage);
    } catch (err) {
      setDraftSkills(profile.skills ?? []);
      setError((err as Error).message ?? 'Failed to update skills.');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (draftSkills.some((skill) => skill.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill('');
      return;
    }

    const nextSkills = [...draftSkills, trimmed];
    setNewSkill('');
    await persistSkills(nextSkills, `"${trimmed}" added and saved.`);
  };

  const removeSkill = async (skillToRemove: string) => {
    const nextSkills = draftSkills.filter((skill) => skill !== skillToRemove);
    await persistSkills(nextSkills, `"${skillToRemove}" removed and saved.`);
  };

  const handleSave = async () => {
    await persistSkills(draftSkills, 'Skills updated successfully.');
  };

  return (
    <div className="cd-page">
      <div className="cd-page-title">Skills</div>
      <div className="cd-page-sub">Add and update the skills you want shown on your contractor profile.</div>

      <div className="cd-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center' }}>
          <input
            className="cp-input"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void addSkill(newSkill);
              }
            }}
            placeholder="Add a skill like React, Node.js, UI Design"
            style={{ flex: 1 }}
          />
          <button type="button" className="cp-btn-primary" style={{ width: 'auto', padding: '0 20px' }} onClick={() => void addSkill(newSkill)} disabled={saving}>
            Add skill
          </button>
        </div>

        {draftSkills.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
            {draftSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => void removeSkill(skill)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#0f172a',
                  borderRadius: 999,
                  padding: '9px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {skill} ×
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 24, fontSize: 13, color: '#94a3b8' }}>
            No skills added yet. Start by adding the strengths you want shown on your profile.
          </div>
        )}

        <div style={{ marginBottom: 14, fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Suggested skills
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {availableSuggestions.map((skill) => (
            <button
              key={skill}
              type="button"
              onClick={() => void addSkill(skill)}
              style={{
                border: '1px dashed #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                borderRadius: 999,
                padding: '8px 14px',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              + {skill}
            </button>
          ))}
        </div>

        {message && <div style={{ marginBottom: 14, color: '#15803d', fontSize: 13, fontWeight: 600 }}>{message}</div>}
        {error && <div role="alert" style={{ marginBottom: 14, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}

        <button type="button" className="cp-btn-primary" style={{ width: 'auto', padding: '0 24px' }} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save skills'}
        </button>
      </div>
    </div>
  );
}

void SkillsPage;

function ContractPage({ profile, readOnly }: { profile: ContractorProfile; readOnly: boolean }) {
  const [contract, setContract] = useState<ContractorContract | null>(null);
  const [loading, setLoading] = useState(!readOnly);

  useEffect(() => {
    if (readOnly) {
      setLoading(false);
      return;
    }

    getMyContract()
      .then((data) => {
        setContract(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [readOnly]);

  return (
    <div className="cd-page">
      <div className="cd-page-title">My Contract</div>
      <div className="cd-page-sub">Review the current status of your agreement with {profile.companyName}</div>

      {readOnly ? (
        <div className="cd-card" style={{ padding: 32, color: '#64748b' }}>
          Contract preview is not available in self-signup mode yet.
        </div>
      ) : loading ? (
        <div className="cd-card" style={{ padding: 32, color: '#64748b' }}>Loading contract...</div>
      ) : !contract ? (
        <div className="cd-card" style={{ padding: 32, color: '#64748b' }}>Contract not found.</div>
      ) : (
        <div className="cd-card" style={{ padding: '24px 28px' }}>
          <DetailRow label="Role" value={contract.roleTitle} />
          <DetailRow label="Company" value={contract.companyName} />
          <DetailRow label="Pay rate" value={`${contract.payCurrency} ${contract.payRate?.toLocaleString()} / ${contract.payFrequency}`} />
          <DetailRow
            label="Status"
            value={
              contract.status === 'worker_signed'
                ? 'Pending company signature'
                : contract.status === 'company_signed'
                ? 'Pending your signature'
                : contract.status === 'active'
                ? 'Active'
                : contract.status === 'rejected'
                ? 'Rejected'
                : contract.status.replace(/_/g, ' ')
            }
          />
          <DetailRow label="Worker signature" value={contract.workerSigned ? 'Signed' : 'Pending'} />
          <DetailRow label="Company signature" value={contract.companySigned ? 'Signed' : 'Pending'} />
        </div>
      )}
    </div>
  );
}

function ProfilePage({
  editRequested = false,
  onEditStarted,
  profile,
  readOnly,
  onSave,
}: {
  editRequested?: boolean;
  onEditStarted?: () => void;
  profile: ContractorProfile;
  readOnly: boolean;
  onSave: (payload: {
    firstName: string;
    lastName: string;
    marketplaceTitle: string;
    yearsOfExperience: number;
    marketplaceBio: string;
    marketplaceAvailability: ContractorProfile['marketplaceAvailability'];
    marketplaceMonthlyRate?: number | null;
    city: string;
    country: string;
    responseTimeHours: number;
    skills: string[];
    languages: string[];
    profilePhotoUrl?: string;
    bannerImageUrl?: string;
    portfolioProjects: ContractorProfile['portfolioProjects'];
    faqItems: ContractorProfile['faqItems'];
  }) => Promise<void>;
}) {
  const buildFormState = useCallback(() => ({
    firstName: profile.firstName,
    lastName: profile.lastName,
    marketplaceTitle: profile.marketplaceTitle.trim().toLowerCase() === DEFAULT_MARKETPLACE_TITLE.toLowerCase() ? '' : profile.marketplaceTitle,
    yearsOfExperience: profile.yearsOfExperience === null || profile.yearsOfExperience === undefined ? '' : String(profile.yearsOfExperience),
    marketplaceBio: profile.marketplaceBio.trim() === PROFILE_SUMMARY_PLACEHOLDER ? '' : profile.marketplaceBio,
    marketplaceAvailability: profile.marketplaceAvailability,
    marketplaceMonthlyRate: profile.marketplaceMonthlyRate?.toString() ?? '',
    city: profile.city,
    country: profile.country,
    responseTimeHours: String(profile.responseTimeHours ?? 2),
    skillsInput: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
    languagesInput: Array.isArray(profile.languages) ? profile.languages.join(', ') : '',
    profilePhotoUrl: profile.profilePhotoUrl ?? '',
    bannerImageUrl: profile.bannerImageUrl ?? '',
    portfolioProjects: Array.isArray(profile.portfolioProjects) ? profile.portfolioProjects.map((project) => ({
      title: project.title ?? '',
      description: project.description ?? '',
      imageUrl: project.imageUrl ?? '',
      projectLink: project.projectLink ?? '',
      tags: Array.isArray(project.tags) ? project.tags : [],
    })) : [],
    faqItems: Array.isArray(profile.faqItems) ? profile.faqItems.map((item) => ({ question: item.question ?? '', answer: item.answer ?? '' })) : [],
  }), [profile]);

  const [form, setForm] = useState(buildFormState);
  const [isEditing, setIsEditing] = useState(editRequested);
  useEffect(() => { if (editRequested && !readOnly) { setIsEditing(true); onEditStarted?.(); } }, [editRequested, readOnly, onEditStarted]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [bannerImagePreview, setBannerImagePreview] = useState('');
  const [projectImagePreviews, setProjectImagePreviews] = useState<Record<number, string>>({});

  const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || 'Not added yet';
  const domainValue =
    profile.marketplaceTitle?.trim() && profile.marketplaceTitle.trim() !== DEFAULT_MARKETPLACE_TITLE
      ? profile.marketplaceTitle.trim()
      : 'Not added yet';
  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();
  const locationValue =
    profile.city?.trim() && profile.country?.trim() && profile.country.trim().toLowerCase() !== 'unknown'
      ? `${profile.city.trim()}, ${profile.country.trim()}`
      : profile.country?.trim() && profile.country.trim().toLowerCase() !== 'unknown'
      ? profile.country.trim()
      : 'Not added yet';
  const rateValue =
    profile.marketplaceMonthlyRate != null
      ? `${profile.payCurrency} ${profile.marketplaceMonthlyRate}/mo`
      : typeof profile.marketplaceRate === 'number' && profile.marketplaceRate > 0
      ? `${profile.payCurrency} ${profile.marketplaceRate}/hr`
      : 'Not added yet';
  const summaryValue =
    profile.marketplaceBio?.trim() && !DEFAULT_MARKETPLACE_SUMMARIES.has(profile.marketplaceBio.trim())
      ? profile.marketplaceBio.trim()
      : 'No profile summary added yet.';
  const skillsValue = Array.isArray(profile.skills) && profile.skills.length ? profile.skills.join(', ') : 'No skills added yet';
  const languagesValue = Array.isArray(profile.languages) && profile.languages.length ? profile.languages.join(', ') : 'Not added yet';
  const hasRateBadge = (profile.marketplaceMonthlyRate ?? profile.marketplaceRate) > 0;
  const heroSkills = Array.isArray(profile.skills) ? profile.skills.slice(0, 2) : [];
  const extraSkillCount = Math.max(Array.isArray(profile.skills) ? profile.skills.length - heroSkills.length : 0, 0);
  const hasDomainValue = domainValue !== 'Not added yet';
  const hasLocationValue = locationValue !== 'Not added yet';
  const heroSkillsLabel = [
    ...heroSkills,
    extraSkillCount > 0 ? `+${extraSkillCount} more` : null,
  ].filter(Boolean).join('  •  ');

  useEffect(() => {
    setForm(buildFormState());
    setProfilePhotoPreview('');
    setBannerImagePreview('');
    setProjectImagePreviews({});
  }, [buildFormState]);

  useEffect(() => {
    return () => {
      if (profilePhotoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoPreview);
      }
    };
  }, [profilePhotoPreview]);

  useEffect(() => {
    return () => {
      if (bannerImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerImagePreview);
      }
    };
  }, [bannerImagePreview]);

  useEffect(() => {
    return () => {
      Object.values(projectImagePreviews).forEach((previewUrl) => {
        if (previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, [projectImagePreviews]);

  useEffect(() => {
    if (!message) return;

    const timeoutId = window.setTimeout(() => {
      setMessage('');
    }, 5_000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [message]);

  const handleSave = async () => {
    const marketplaceTitle = form.marketplaceTitle.trim();
    if (!marketplaceTitle || marketplaceTitle.toLowerCase() === DEFAULT_MARKETPLACE_TITLE.toLowerCase()) {
      setError('Enter a professional title, such as Frontend Developer.');
      document.getElementById('profile-professional-title')?.focus();
      return;
    }
    const yearsOfExperience = Number(form.yearsOfExperience);
    if (
      form.yearsOfExperience.trim() === ''
      || !Number.isInteger(yearsOfExperience)
      || yearsOfExperience < 0
      || yearsOfExperience > 50
    ) {
      setError('Please enter your years of experience as a whole number between 0 and 50.');
      return;
    }

    const skills = Array.from(
      new Set(
        form.skillsInput
          .split(',')
          .map((skill) => skill.trim())
          .filter(Boolean),
      ),
    );
    const languages = Array.from(
      new Set(
        form.languagesInput
          .split(',')
          .map((language) => language.trim())
          .filter(Boolean),
      ),
    );
    const portfolioProjects = Array.isArray(form.portfolioProjects)
      ? form.portfolioProjects
          .map((project) => ({
            title: project.title.trim(),
            description: project.description.trim(),
            imageUrl: project.imageUrl.trim(),
            projectLink: project.projectLink.trim(),
            tags: Array.from(new Set((Array.isArray(project.tags) ? project.tags : []).map((tag) => tag.trim()).filter(Boolean))),
          }))
          .filter((project) => project.title && project.description && project.imageUrl)
      : [];
    const faqItems = Array.isArray(form.faqItems)
      ? form.faqItems
          .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
          .filter((item) => item.question && item.answer)
      : [];
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSave({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        marketplaceTitle,
        yearsOfExperience,
        marketplaceBio: form.marketplaceBio.trim(),
        marketplaceAvailability: form.marketplaceAvailability,
        marketplaceMonthlyRate: form.marketplaceMonthlyRate === '' ? null : Number(form.marketplaceMonthlyRate),
        city: form.city.trim(),
        country: form.country.trim(),
        responseTimeHours: Number(form.responseTimeHours) || 2,
        skills,
        languages,
        profilePhotoUrl: form.profilePhotoUrl?.trim() || '',
        bannerImageUrl: form.bannerImageUrl?.trim() || '',
        portfolioProjects,
        faqItems,
      });
      setMessage('Marketplace profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message ?? 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = () => {
    setForm(buildFormState());
    setError('');
    setMessage('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setForm(buildFormState());
    setError('');
    setIsEditing(false);
  };

  if (readOnly || !isEditing) {
    return (
      <div className="cd-page cd-profile-page">
        <div className="cd-page-title">My Profile</div>
        <div className="cd-page-sub">
          {readOnly
            ? 'Your contractor profile and account settings'
            : 'Review the freelancer details that companies currently see in the marketplace.'}
        </div>
        <div className="cd-profile-shell">
          {message && !readOnly && (
            <div className="cd-profile-success">
              {message}
            </div>
          )}

          {profile.bannerImageUrl ? (
            <div
              className="cd-profile-banner"
              style={{ backgroundImage: imageBackground(profile.bannerImageUrl) }}
            />
          ) : null}

          <div className="cd-profile-hero">
            <div className="cd-profile-hero-copy">
              <div className="cd-profile-hero-name">{fullName}</div>
              <div className="cd-profile-hero-meta">
                {hasDomainValue && <span>{domainValue}</span>}
                {hasDomainValue && hasLocationValue && <span className="cd-profile-dot" />}
                {hasLocationValue && <span>{locationValue}</span>}
              </div>
              <div className="cd-profile-badges">
                <span className="cd-profile-badge cd-profile-badge-primary">{profile.marketplaceAvailabilityLabel}</span>
                {hasRateBadge && <span className="cd-profile-badge">{rateValue}</span>}
                {heroSkillsLabel && <span className="cd-profile-badge">{heroSkillsLabel}</span>}
              </div>
            </div>

            <div className="cd-profile-hero-media">
              {profile.profilePhotoUrl ? (
                <img
                  className="cd-profile-avatar-image"
                  src={resolveImageUrl(profile.profilePhotoUrl)}
                  alt={fullName || 'Profile photo'}
                />
              ) : (
                <div className="cd-profile-avatar-fallback">{initials}</div>
              )}
            </div>

            {!readOnly && (
              <button
                type="button"
                className="cd-profile-edit-btn"
                onClick={handleStartEdit}
              >
                Update profile
              </button>
            )}
          </div>

          <div className="cd-profile-grid">
            <div className="cd-profile-info-card">
              <div className="cd-profile-section-title">Overview</div>
              <div className="cd-profile-info-list">
                <DetailRow label="Full name" value={fullName} />
                <DetailRow label="Email" value={profile.email?.trim() || 'Not added yet'} />
                <DetailRow label="Contact number" value={profile.phone?.trim() || 'Not added yet'} />
                <DetailRow label="Professional domain" value={domainValue} />
                <DetailRow label="Location" value={locationValue} />
              </div>
            </div>

            <div className="cd-profile-info-card">
              <div className="cd-profile-section-title">Hiring Snapshot</div>
              <div className="cd-profile-metrics">
                <div className="cd-profile-metric">
                  <span className="cd-profile-metric-label">Availability</span>
                  <strong>{profile.marketplaceAvailabilityLabel || 'Not added yet'}</strong>
                </div>
                <div className="cd-profile-metric">
                  <span className="cd-profile-metric-label">Expected rate</span>
                  <strong>{rateValue}</strong>
                </div>
                <div className="cd-profile-metric">
                  <span className="cd-profile-metric-label">Skills</span>
                  <strong>{Array.isArray(profile.skills) && profile.skills.length ? `${profile.skills.length} added` : 'Not added yet'}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="cd-profile-summary-card">
            <div className="cd-profile-section-title">Profile summary</div>
            <p>{summaryValue}</p>
          </div>

          <div className="cd-profile-info-card">
              <div className="cd-profile-section-title">Client signals</div>
              <div className="cd-profile-info-list">
                <DetailRow label="Response time" value={`${profile.responseTimeHours} hours`} />
                <DetailRow label="Languages" value={languagesValue} />
                <DetailRow
                  label="Portfolio projects"
                  value={Array.isArray(profile.portfolioProjects) && profile.portfolioProjects.length ? `${profile.portfolioProjects.length} added` : 'Not added yet'}
                />
                <DetailRow
                  label="FAQ entries"
                  value={Array.isArray(profile.faqItems) && profile.faqItems.length ? `${profile.faqItems.length} added` : 'Not added yet'}
                />
              </div>
          </div>

          {!readOnly && <VerificationDocuments />}

          <div className="cd-profile-summary-card">
            <div className="cd-profile-section-title">Skills visible to companies</div>
            <div className="cd-profile-skill-cloud">
              {Array.isArray(profile.skills) && profile.skills.length ? profile.skills.map((skill) => (
                <span key={skill} className="cd-profile-skill-pill">{skill}</span>
              )) : (
                <span className="cd-profile-empty-note">{skillsValue}</span>
              )}
            </div>
          </div>

          <div className="cd-profile-summary-card">
            <div className="cd-profile-section-title">Portfolio preview</div>
            {Array.isArray(profile.portfolioProjects) && profile.portfolioProjects.length ? (
              <div className="cd-profile-portfolio">
                {profile.portfolioProjects.slice(0, 3).map((project) => (
                  <div className="cd-portfolio-item" key={`${project.title}-${project.imageUrl}`}>
                    <img src={resolveImageUrl(project.imageUrl)} alt={project.title} />
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.description}</p>
                      {project.projectLink ? (
                        <a href={project.projectLink} rel="noreferrer noopener" target="_blank">
                          View hosted project
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="cd-profile-empty-note">No portfolio projects added yet.</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page cd-profile-page">
      <div className="cd-page-title">My Profile</div>
      <div className="cd-page-sub">Update the freelancer details that companies see in the marketplace.</div>

      <VerificationDocuments />
      <div className="cd-profile-editor">
        <div className="cd-profile-editor-head">
          <div>
            <div className="cd-profile-section-title">Edit your public profile</div>
            <div className="cd-page-sub" style={{ marginBottom: 0 }}>
              These details appear on your marketplace card and help companies understand your fit faster.
            </div>
          </div>
          <div className="cd-profile-editor-tag">Visible to companies</div>
        </div>

        {error && <div className="cd-profile-error" role="alert">{error}</div>}

        <div className="cd-profile-form-grid cd-profile-form-grid--two">
          <div className="cp-field">
            <label className="cp-label">First name *</label>
            <input className="cp-input" value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} />
          </div>
          <div className="cp-field">
            <label className="cp-label">Last name *</label>
            <input className="cp-input" value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} />
          </div>
        </div>

        <div className="cd-profile-form-grid cd-profile-form-grid--two">
          <div className="cp-field">
            <label className="cp-label" htmlFor="profile-professional-title">Professional title *</label>
            <input id="profile-professional-title" className="cp-input" required placeholder="e.g. Frontend Developer" value={form.marketplaceTitle} onChange={(e) => setForm((prev) => ({ ...prev, marketplaceTitle: e.target.value }))} />
          </div>
          <div className="cp-field">
            <label className="cp-label">Years of experience *</label>
            <input
              className="cp-input"
              type="number"
              min="0"
              max="50"
              step="1"
              inputMode="numeric"
              value={form.yearsOfExperience}
              onChange={(e) => setForm((prev) => ({ ...prev, yearsOfExperience: e.target.value }))}
            />
            {!form.yearsOfExperience && <small style={{ color: '#64748b' }}>Please add your years of experience.</small>}
          </div>
        </div>

        <div className="cp-profile-upload-grid">
          <div className="cp-field">
            <label className="cp-label">Profile photo</label>
            <div className="cp-profile-upload-row">
              <FileUploadControl
                value={form.profilePhotoUrl}
                buttonLabel="Upload photo"
                placeholder="No photo selected"
                onFile={async (file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setProfilePhotoPreview((previousUrl) => {
                    if (previousUrl.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
                    return previewUrl;
                  });
                  try {
                    const imageUrl = await uploadContractorProfileImage(file);
                    setForm((prev) => ({ ...prev, profilePhotoUrl: imageUrl }));
                  } catch {
                    setError('Unable to upload selected profile photo.');
                  }
                }}
              />
              <div className="cp-profile-image-preview">
                {profilePhotoPreview || resolveImageUrl(form.profilePhotoUrl) ? (
                  <img src={profilePhotoPreview || resolveImageUrl(form.profilePhotoUrl)} alt="Profile preview" />
                ) : (
                  'Preview'
                )}
              </div>
            </div>
          </div>
          <div className="cp-field">
            <label className="cp-label">Marketplace banner</label>
            <div className="cp-profile-upload-row cp-profile-upload-row--banner">
              <FileUploadControl
                value={form.bannerImageUrl}
                buttonLabel="Upload banner"
                placeholder="No banner selected"
                onFile={async (file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setBannerImagePreview((previousUrl) => {
                    if (previousUrl.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
                    return previewUrl;
                  });
                  try {
                    const imageUrl = await uploadContractorProfileImage(file);
                    setForm((prev) => ({ ...prev, bannerImageUrl: imageUrl }));
                  } catch {
                    setError('Unable to upload selected banner image.');
                  }
                }}
              />
              <div className="cp-profile-image-preview">
                {bannerImagePreview || resolveImageUrl(form.bannerImageUrl) ? (
                  <img src={bannerImagePreview || resolveImageUrl(form.bannerImageUrl)} alt="Banner preview" />
                ) : (
                  'Preview'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="cd-profile-form-grid cd-profile-form-grid--three">
          <div className="cp-field">
            <label className="cp-label">City *</label>
            <input className="cp-input" value={form.city} onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))} />
          </div>
          <div className="cp-field">
            <label className="cp-label">Country *</label>
            <input className="cp-input" value={form.country} onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))} />
          </div>
          <div className="cp-field">
            <label className="cp-label" htmlFor="profile-monthly-rate">Expected monthly rate ({profile.payCurrency})</label>
            <input id="profile-monthly-rate" className="cp-input" type="number" min="0" step="0.01" value={form.marketplaceMonthlyRate} onChange={(e) => setForm((prev) => ({ ...prev, marketplaceMonthlyRate: e.target.value }))} />
          </div>
        </div>

        <div className="cp-field">
          <label className="cp-label">Availability *</label>
          <select
            className="cp-input"
            value={form.marketplaceAvailability}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              marketplaceAvailability: e.target.value as ContractorProfile['marketplaceAvailability'],
            }))}
          >
            {MARKETPLACE_AVAILABILITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="cp-field">
          <label className="cp-label" htmlFor="profile-summary">Profile summary *</label>
          <textarea
            id="profile-summary"
            className="cp-textarea"
            style={{ height: 120 }}
            placeholder={PROFILE_SUMMARY_PLACEHOLDER}
            required
            value={form.marketplaceBio}
            onChange={(e) => setForm((prev) => ({ ...prev, marketplaceBio: e.target.value }))}
          />
        </div>

        <div className="cp-field" style={{ marginBottom: 10 }}>
          <label className="cp-label">Skills shown in marketplace</label>
          <textarea
            className="cp-textarea"
            style={{ height: 88 }}
            value={form.skillsInput}
            onChange={(e) => setForm((prev) => ({ ...prev, skillsInput: e.target.value }))}
            placeholder="React, TypeScript, Node.js"
          />
          <div className="cd-profile-form-hint">
            Separate skills with commas. These will appear on your marketplace card.
          </div>
        </div>

        <div className="cd-profile-form-grid cd-profile-form-grid--two">
          <div className="cp-field">
            <label className="cp-label">Average response time (hours) *</label>
            <input className="cp-input" type="number" min="1" value={form.responseTimeHours} onChange={(e) => setForm((prev) => ({ ...prev, responseTimeHours: e.target.value }))} />
          </div>
          <div className="cp-field">
            <label className="cp-label">Languages</label>
            <input className="cp-input" value={form.languagesInput} onChange={(e) => setForm((prev) => ({ ...prev, languagesInput: e.target.value }))} placeholder="English, Hindi" />
          </div>
        </div>

        <div className="cp-field">
          <label className="cp-label">Portfolio projects</label>
          {form.portfolioProjects.length === 0 ? (
            <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>
              Add a portfolio project below to show your previous work.
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 18 }}>
            {form.portfolioProjects.map((project, projectIndex) => (
              <div key={projectIndex} className="cd-profile-form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>Project {projectIndex + 1}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setProjectImagePreviews((previousPreviews) => {
                        const previousUrl = previousPreviews[projectIndex];
                        if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);

                        return Object.fromEntries(
                          Object.entries(previousPreviews)
                            .filter(([index]) => Number(index) !== projectIndex)
                            .map(([index, previewUrl]) => {
                              const numericIndex = Number(index);
                              return [numericIndex > projectIndex ? numericIndex - 1 : numericIndex, previewUrl];
                            }),
                        );
                      });
                      setForm((prev) => ({
                        ...prev,
                        portfolioProjects: prev.portfolioProjects.filter((_, index) => index !== projectIndex),
                      }));
                    }}
                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Remove
                  </button>
                </div>

                <div className="cp-field">
                  <label className="cp-label">Project title</label>
                  <input
                    className="cp-input"
                    value={project.title}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      portfolioProjects: prev.portfolioProjects.map((item, index) => index === projectIndex ? { ...item, title: e.target.value } : item),
                    }))}
                  />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Project description</label>
                  <textarea
                    className="cp-textarea"
                    style={{ height: 100 }}
                    value={project.description}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      portfolioProjects: prev.portfolioProjects.map((item, index) => index === projectIndex ? { ...item, description: e.target.value } : item),
                    }))}
                  />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Project image</label>
                  <div className="cp-project-image-row">
                    <FileUploadControl
                      value={project.imageUrl}
                      buttonLabel="Upload image"
                      placeholder="No image selected"
                      onFile={async (file) => {
                        const previewUrl = URL.createObjectURL(file);
                        setProjectImagePreviews((previousPreviews) => {
                          const previousUrl = previousPreviews[projectIndex];
                          if (previousUrl?.startsWith('blob:')) URL.revokeObjectURL(previousUrl);
                          return { ...previousPreviews, [projectIndex]: previewUrl };
                        });
                        try {
                          const imageUrl = await uploadContractorProfileImage(file);
                          setForm((prev) => ({
                            ...prev,
                            portfolioProjects: prev.portfolioProjects.map((item, index) => index === projectIndex ? { ...item, imageUrl } : item),
                          }));
                        } catch {
                          setError('Unable to upload selected project image.');
                        }
                      }}
                    />
                    <div className="cp-project-image-preview">
                      {projectImagePreviews[projectIndex] || resolveImageUrl(project.imageUrl) ? (
                        <img src={projectImagePreviews[projectIndex] || resolveImageUrl(project.imageUrl)} alt="Project preview" />
                      ) : (
                        <span>No preview</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="cp-field">
                  <label className="cp-label">Project link</label>
                  <input
                    className="cp-input"
                    type="url"
                    value={project.projectLink}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      portfolioProjects: prev.portfolioProjects.map((item, index) => index === projectIndex ? { ...item, projectLink: e.target.value } : item),
                    }))}
                    placeholder="https://your-project-host.com"
                  />
                </div>

                <div className="cp-field">
                  <label className="cp-label">Tags</label>
                  <input
                    className="cp-input"
                    value={project.tags.join(', ')}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      portfolioProjects: prev.portfolioProjects.map((item, index) => index === projectIndex ? { ...item, tags: e.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) } : item),
                    }))}
                    placeholder="React, Node.js, UX"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setForm((prev) => ({
              ...prev,
              portfolioProjects: [
                ...prev.portfolioProjects,
                { title: '', description: '', imageUrl: '', projectLink: '', tags: [] },
              ],
            }))}
            style={{ marginTop: 12, width: 'auto', minWidth: 150, padding: '0 18px', height: 42, borderRadius: 12, border: '1px solid #d7dfeb', background: '#fff', color: '#111827', cursor: 'pointer', fontWeight: 700 }}
          >
            Add portfolio project
          </button>
          <div className="cd-profile-form-hint">
            Add a title, description, an uploaded image, a hosted project link, and tags for each portfolio project.
          </div>
        </div>

        <div className="cp-field" style={{ marginBottom: 10 }}>
          <label className="cp-label">FAQ</label>
          {form.faqItems.length === 0 ? (
            <div style={{ marginBottom: 12, color: '#64748b', fontSize: 13 }}>
              Add FAQ entries one at a time below.
            </div>
          ) : null}
          <div style={{ display: 'grid', gap: 16 }}>
            {form.faqItems.map((item, faqIndex) => (
              <div key={faqIndex} className="cd-profile-form-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>FAQ {faqIndex + 1}</div>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({
                      ...prev,
                      faqItems: prev.faqItems.filter((_, index) => index !== faqIndex),
                    }))}
                    style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Remove
                  </button>
                </div>
                <div className="cp-field">
                  <label className="cp-label">Question</label>
                  <input
                    className="cp-input"
                    value={item.question}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      faqItems: prev.faqItems.map((faqItem, index) => index === faqIndex ? { ...faqItem, question: e.target.value } : faqItem),
                    }))}
                    placeholder="What do companies need to know?"
                  />
                </div>
                <div className="cp-field">
                  <label className="cp-label">Answer</label>
                  <textarea
                    className="cp-textarea"
                    style={{ minHeight: 90 }}
                    value={item.answer}
                    onChange={(e) => setForm((prev) => ({
                      ...prev,
                      faqItems: prev.faqItems.map((faqItem, index) => index === faqIndex ? { ...faqItem, answer: e.target.value } : faqItem),
                    }))}
                    placeholder="Provide a concise, helpful answer."
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setForm((prev) => ({
              ...prev,
              faqItems: [...prev.faqItems, { question: '', answer: '' }],
            }))}
            style={{ marginTop: 12, width: 'auto', minWidth: 150, padding: '0 18px', height: 42, borderRadius: 12, border: '1px solid #d7dfeb', background: '#fff', color: '#111827', cursor: 'pointer', fontWeight: 700 }}
          >
            Add FAQ item
          </button>
          <div className="cd-profile-form-hint">
            Add one FAQ item per block above. Each entry appears separately on your marketplace profile.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              width: 'auto',
              minWidth: 130,
              padding: '0 24px',
              height: 46,
              borderRadius: 12,
              border: '1px solid #d7dfeb',
              background: '#fff',
              color: '#475569',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
            onClick={handleCancelEdit}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cp-btn-primary"
            style={{ width: 'auto', minWidth: 150, padding: '0 24px' }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContractorDashboard({
  previewProfile = null,
  onLogoutOverride,
  initialPage = 'dashboard',
  flashMessage = '',
}: ContractorDashboardProps) {
  const [page, setPage] = useState<ContractorPage>(() => getContractorPageFromQuery(initialPage));
  const [profile, setProfile] = useState<ContractorProfile | null>(null);
  const [, setInvoices] = useState<ContractorInvoice[]>([]);
  const [notifications, setNotifications] = useState<ContractorNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [profileEditRequested, setProfileEditRequested] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(flashMessage);
  const isPreviewMode = Boolean(previewProfile);

  useEffect(() => {
    setPage(getContractorPageFromQuery(initialPage));
  }, [initialPage]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', page);
    if(page!=='work-updates')params.delete('task');
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `/talent/dashboard?${nextQuery}` : '/talent/dashboard';
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  }, [page]);

  useEffect(() => {
    setBannerMessage(flashMessage);
  }, [flashMessage]);

  useEffect(() => {
    if (!bannerMessage) {
      return;
    }

    const timer = window.setTimeout(() => {
      setBannerMessage('');
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [bannerMessage]);

  useEffect(() => {
    if (previewProfile) {
      setProfile(normalizeContractorProfile(previewProfile));
      setInvoices([]);
      setNotifications([]);
      setLoadError('');
      setLoading(false);
      return;
    }

    let isMounted = true;

    const handleSessionExpired = () => {
      contractorTokenStore.clear();
      window.location.href = '/talent/login';
    };

    window.addEventListener('dechub:contractor-session-expired', handleSessionExpired);

    (async () => {
      try {
        const [profileResult, invoicesResult, notificationsResult] = await Promise.allSettled([
          getContractorProfile(),
          getMyInvoices(),
          getContractorNotifications(),
        ]);

        if (!isMounted) {
          return;
        }

        if (profileResult.status === 'rejected') {
          const message = profileResult.reason instanceof Error
            ? profileResult.reason.message
            : 'Failed to load your dashboard. Please log in again.';

          if (message.toLowerCase().includes('session expired')) {
            handleSessionExpired();
            return;
          }

          setLoadError(message);
          setLoading(false);
          return;
        }

        if (!profileResult.value.kycDocumentsSubmitted) {
          window.location.replace('/talent/signup?resume=1');
          return;
        }
        setProfile(normalizeContractorProfile(profileResult.value));
        setLoadError('');

        if (invoicesResult.status === 'fulfilled') {
          setInvoices(Array.isArray(invoicesResult.value) ? invoicesResult.value : []);
        } else {
          setInvoices([]);
        }

        if (notificationsResult.status === 'fulfilled') {
          setNotifications(Array.isArray(notificationsResult.value) ? notificationsResult.value : []);
        } else {
          setNotifications([]);
        }

        setLoading(false);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error
          ? error.message
          : 'Failed to load your dashboard. Please log in again.';

        if (message.toLowerCase().includes('session expired')) {
          handleSessionExpired();
          return;
        }

        setLoadError(message);
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
      window.removeEventListener('dechub:contractor-session-expired', handleSessionExpired);
    };
  }, [previewProfile]);

  useEffect(() => {
    if (isPreviewMode) return;
    let active = true;
    const refresh = () => { void Promise.allSettled([getContractorNotifications(), getMyInvoices()]).then(([alerts,invoices]) => { if (!active) return; if(alerts.status==='fulfilled')setNotifications(alerts.value);if(invoices.status==='fulfilled')setInvoices(invoices.value); }); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [isPreviewMode]);

  const notificationReads=useRef(new Set<string>());
  useEffect(()=>{notificationReads.current.clear();},[profile?.email]);
  useEffect(()=>{if(isPreviewMode)return;const pending=notificationReads.current;return observeVisibleUpdates(element=>{const resource=element.dataset.updateResource,noticeId=element.dataset.updateNotice;const rows=notifications.filter(n=>!n.readAt&&!pending.has(n._id)&&(noticeId===n._id||!!resource&&updateResource(n.actionUrl||'')===resource&&new URL(n.actionUrl||'',location.origin).searchParams.get('tab')===page));for(const n of rows){pending.add(n._id);void markContractorNotificationRead(n._id).then(()=>setNotifications(items=>items.map(item=>item._id===n._id?{...item,readAt:new Date().toISOString()}:item))).catch(()=>{}).finally(()=>pending.delete(n._id));}});},[notifications,page,isPreviewMode]);
  const handleLogout = () => {
    if (onLogoutOverride) {
      onLogoutOverride();
      return;
    }
    contractorTokenStore.clear();
    window.location.href = '/';
  };

  const handleSaveProfile = async (payload: {
    firstName: string;
    lastName: string;
    marketplaceTitle: string;
    yearsOfExperience: number;
    marketplaceBio: string;
    marketplaceAvailability: ContractorProfile['marketplaceAvailability'];
    marketplaceMonthlyRate?: number | null;
    city: string;
    country: string;
    responseTimeHours: number;
    skills: string[];
    languages: string[];
    profilePhotoUrl?: string;
    bannerImageUrl?: string;
    portfolioProjects: ContractorProfile['portfolioProjects'];
    faqItems: ContractorProfile['faqItems'];
  }) => {
    if (isPreviewMode) {
      setProfile((prev) => (prev ? {
        ...prev,
        ...payload,
        profilePhotoUrl: payload.profilePhotoUrl ?? prev.profilePhotoUrl,
        bannerImageUrl: payload.bannerImageUrl ?? prev.bannerImageUrl,
        marketplaceAvailabilityLabel:
          MARKETPLACE_AVAILABILITY_OPTIONS.find((option) => option.value === payload.marketplaceAvailability)?.label
          ?? prev.marketplaceAvailabilityLabel,
      } : prev));
      return;
    }

    const savedProfile = await updateContractorProfile(payload);
    setProfile(savedProfile);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="cp-spinner dark" style={{ width: 28, height: 28, borderWidth: 3, margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
        <div style={{ maxWidth: 420, width: '100%', background: '#ffffff', border: '1px solid #fecaca', borderRadius: 20, padding: 24, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
          <h2 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: 24, fontWeight: 800 }}>Unable to load dashboard</h2>
          <p style={{ margin: '0 0 20px', color: '#475569', lineHeight: 1.7 }}>
            {loadError || 'We could not finish loading your contractor dashboard. Please log in again and retry.'}
          </p>
          <button
            type="button"
            className="cp-btn-primary"
            onClick={() => {
              contractorTokenStore.clear();
              window.location.href = '/talent/login';
            }}
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const initials = `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase();
  const unreadNotificationCount = notifications.filter((item) => !item.readAt).length;
  const nav: { id: ContractorPage; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'projects', label: 'Projects' },
    { id: 'work-updates', label: 'Work Updates' },

    { id: 'contract', label: 'Contracts' },
    { id: 'equipment', label: 'My Equipment' },
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: unreadNotificationCount > 0 ? `Notifications (${unreadNotificationCount})` : 'Notifications' },
  ];

  return (
    <div className="cd-shell"><DashboardHelp audience="contractor"/>
      <header className="cd-topbar">
        <div className="cd-logo"><BridgeLogo className="cd-bridge-logo" /></div>

        <nav className="cd-nav">
          {nav.map((item) => (
            <button
              key={item.id}
              className={`cd-nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              {item.label}{notifications.some(notification=>!notification.readAt&&(item.id==='notifications'||new URL(notification.actionUrl||'',window.location.origin).searchParams.get('tab')===item.id))&&<AttentionDot/>}
            </button>
          ))}
        </nav>

        <div className="cd-user">
          <div>
            <div className="cd-user-name">{profile.firstName} {profile.lastName}</div>
            <div className="cd-user-role">{profile.companyName}</div>
          </div>
          <div className="cd-avatar">{initials}</div>
          <SignOutButton className="contractor-signout-button" onConfirm={handleLogout} />
        </div>
      </header>

      {!isPreviewMode && <ContractorNotificationPopup notifications={notifications} account={profile.email} viewingNotifications={page === 'notifications'} onRead={id=>setNotifications(items=>items.map(item=>item._id===id?{...item,readAt:new Date().toISOString()}:item))} />}
      {page === 'dashboard' && <ContractorProfileReminder profile={profile} readOnly={isPreviewMode} onComplete={() => { setProfileEditRequested(true); setPage('profile'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      {bannerMessage ? (
        <div style={{ margin: '18px 28px 0', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', borderRadius: 12, padding: '14px 18px', fontSize: 14, fontWeight: 600 }}>
          {bannerMessage}
        </div>
      ) : null}

      {page === 'dashboard' && (
        <DashboardHome
          notifications={notifications}
          readOnly={isPreviewMode}
          profile={profile}
          onNavigate={setPage}
        />
      )}

      {page === 'equipment' && <main className="cd-page"><EquipmentSection role="contractor" readOnly={isPreviewMode} unreadIds={notifications.filter(n=>!n.readAt&&n.actionUrl?.includes('tab=equipment')).map(n=>new URL(n.actionUrl!,window.location.origin).searchParams.get('request')||'')} onViewed={id=>{notifications.filter(n=>!n.readAt&&n.actionUrl?.includes('request='+id)).forEach(n=>{void markContractorNotificationRead(n._id).then(()=>setNotifications(rows=>rows.map(row=>row._id===n._id?{...row,readAt:new Date().toISOString()}:row)));});}}/></main>}
      {page === 'projects' && <ProjectTasksPage unreadProjectIds={notifications.filter(n=>!n.readAt&&n.actionUrl?.includes('tab=projects')).map(n=>new URL(n.actionUrl!,window.location.origin).searchParams.get('project')||'')} readOnly={isPreviewMode} onNavigate={(tab, projectId, taskId) => { const params = new URLSearchParams(window.location.search); params.set('project', projectId); if(taskId) params.set('task',taskId); else params.delete('task'); params.set('tab', tab); window.history.replaceState({}, '', window.location.pathname + '?' + params.toString()); setPage(tab); }} />}

      {page === 'work-updates' && <WorkUpdatesPage readOnly={isPreviewMode} />}


      {page === 'contract' && <><ProjectTasksPage contracts readOnly={isPreviewMode} onNavigate={(tab, projectId, taskId) => { const params = new URLSearchParams(window.location.search); params.set('project', projectId); if(taskId) params.set('task',taskId); else params.delete('task'); params.set('tab', tab); window.history.replaceState({}, '', window.location.pathname + '?' + params.toString()); setPage(tab); }} /><ContractPage profile={profile} readOnly={isPreviewMode} /></>}

      {page === 'profile' && (
        <ProfilePage
          profile={profile}
          readOnly={isPreviewMode}
          onSave={handleSaveProfile}
          editRequested={profileEditRequested}
          onEditStarted={() => setProfileEditRequested(false)}
        />
      )}


      {page === 'notifications' && (
        <div className="cd-page">
          <div className="cd-page-title">Notifications</div>
          <div className="cd-page-sub">Updates about your contracts and account</div>
          <div className="cd-card" style={{ padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 32, color: '#64748b' }}>You do not have any notifications yet.</div>
            ) : notifications.map((notification) => (
              <button
                key={notification._id}
                data-update-notice={notification._id}
                type="button"
                onClick={async () => {
                  if (!notification.readAt) {
                    await markContractorNotificationRead(notification._id);
                    setNotifications((current) => current.map((item) => (
                      item._id === notification._id ? { ...item, readAt: new Date().toISOString() } : item
                    )));
                  }
                  const destination = talentDashboardLink(notification.actionUrl);
                  if (destination) window.location.assign(destination);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderBottom: '1px solid #eef2f7',
                  background: notification.readAt ? '#fff' : '#f8fbff',
                  padding: '18px 24px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{notification.title}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6 }}>{notification.message}</div>
              </button>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
