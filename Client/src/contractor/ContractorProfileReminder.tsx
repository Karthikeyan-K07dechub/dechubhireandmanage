import type { ContractorProfile } from './types/contractor.types';
import './contractor-profile-reminder.css';

export default function ContractorProfileReminder({ profile, readOnly, onComplete }: { profile: ContractorProfile; readOnly: boolean; onComplete: () => void }) {
  if (readOnly || profile.marketplaceProfileComplete) return null;
  return <section className="cd-profile-reminder" aria-label="Profile completion reminder">
    <div><h2>Complete your profile</h2><p>Complete your public profile so companies can learn about your skills and services.</p>{Boolean(profile.marketplaceMissingFields?.length) && <p className="cd-profile-reminder-missing">To complete: {profile.marketplaceMissingFields!.join(', ')}.</p>}</div>
    <button type="button" onClick={onComplete}>Complete profile</button>
  </section>;
}
