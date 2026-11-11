import { useEffect, useState, type FormEvent } from 'react';
import { api, tokenStore, unwrapApiData, normalizeError } from '../../api/client';
import { getMyCompany, updateCompanyProfile, type MyCompanyData } from '../../api/company.api';
import { resolveImageUrl } from '../../utils/imageUrl';
import { faqs } from '../components/DashboardHelp';
import './settings.css';

const companyFields = [
  ['companyName', 'Company name', 'text'], ['companyWebsite', 'Website', 'url'],
  ['addressLine1', 'Business address', 'text'], ['addressCity', 'City', 'text'],
  ['addressZip', 'Postal code', 'text'], ['companyCountry', 'Country', 'text'],
  ['taxId', 'Registration / Tax ID', 'text'],
  ['itManagement', 'IT management', 'select'],
] as const;
const supportEmails = ['prasanna@dechub.in', 'dechubai@gmail.com'];

export default function SettingsPage() {
  const [account, setAccount] = useState<MyCompanyData | null>(null);
  const [company, setCompany] = useState<Record<string, string>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changing, setChanging] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [issue, setIssue] = useState({ subject: '', description: '' });
  const [issueMessage, setIssueMessage] = useState('');

  useEffect(() => {
    let active = true;
    getMyCompany().then(result => {
      if (!active) return;
      setAccount(result);
      setCompany(Object.fromEntries(companyFields.map(([key]) => [key, String(result.company[key] || '')])));
      setLogoUrl(String(result.company.companyLogoUrl || ''));
    }).catch(error => { if (active) setProfileError(normalizeError(error).message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!logo) { setLogoPreview(''); return; }
    const url = URL.createObjectURL(logo); setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  async function saveCompany(event: FormEvent) {
    event.preventDefault(); if (saving || !account) return;
    setSaving(true); setProfileError(''); setProfileMessage('');
    try {
      const result = await updateCompanyProfile({ company });
      setAccount(result);
      setCompany(Object.fromEntries(companyFields.map(([key]) => [key, String(result.company[key] || '')])));
      window.dispatchEvent(new CustomEvent('dechub:company-profile-updated', { detail: result.company }));
      setProfileMessage('Company details saved.');
    } catch (error) { setProfileError(normalizeError(error).message); }
    finally { setSaving(false); }
  }
  async function uploadLogo() {
    if (!logo || uploading) return;
    setUploading(true); setProfileError(''); setProfileMessage('');
    try {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(logo.type) || logo.size > 2 * 1024 * 1024) throw new Error('Choose a PNG, JPEG, or WebP logo up to 2 MB.');
      const form = new FormData(); form.append('logo', logo);
      const response = await api.post('/company/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      const result = unwrapApiData<{ companyLogoUrl: string }>(response.data);
      setLogoUrl(result.companyLogoUrl); setLogo(null);
      window.dispatchEvent(new CustomEvent('dechub:company-profile-updated', { detail: { companyLogoUrl: result.companyLogoUrl } }));
      const logoInput = document.getElementById('settings-logo') as HTMLInputElement | null; if (logoInput) logoInput.value = ''; setProfileMessage('Company logo saved.');
    } catch (error) { setProfileError(normalizeError(error).message); }
    finally { setUploading(false); }
  }
  async function changePassword(event: FormEvent) {
    event.preventDefault(); if (changing) return;
    setPasswordError(''); setPasswordMessage('');
    if (passwords.newPassword !== passwords.confirmPassword) { setPasswordError('The new passwords do not match.'); return; }
    if (passwords.newPassword === passwords.currentPassword) { setPasswordError('Choose a different new password.'); return; }
    setChanging(true);
    try {
      const response = await api.post('/company/change-password', passwords);
      const result = unwrapApiData<{ accessToken: string; refreshToken: string }>(response.data);
      tokenStore.set(result.accessToken, result.refreshToken);
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password changed successfully.');
    } catch (error) { setPasswordError(normalizeError(error).message); }
    finally { setChanging(false); }
  }
  function reportIssue(event: FormEvent) {
    event.preventDefault();
    if (!issue.subject.trim() || !issue.description.trim()) { setIssueMessage('Enter a subject and describe the issue.'); return; }
    const subject = 'Bridge support: ' + issue.subject.trim();
    const body = ['Company: ' + (company.companyName || 'Not provided'), 'Account: ' + (account?.user.email || ''), '', issue.description.trim()].join('\n');
    window.location.href = 'mailto:' + supportEmails.join(',') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    setIssueMessage('Your email app will open with a draft. Send the email to submit your report.');
  }
  return <div className="db-page db-settings">
    <header className="db-page-header"><div><h1 className="db-page-title">Settings</h1><p className="db-page-sub">Manage your company details, password, and support.</p></div></header>
    <section className="db-card db-settings-card" id="company-profile" aria-labelledby="settings-company-title">
      <h2 id="settings-company-title">Company profile</h2><p>These details are shared with your company profile.</p>
      {profileError && <p className="db-settings-error" role="alert">{profileError}</p>}{profileMessage && <p className="db-settings-success" role="status">{profileMessage}</p>}
      {loading ? <p>Loading company details...</p> : account && <>
        <div className="db-settings-logo-row"><div className="db-settings-logo">{logoPreview || logoUrl ? <img src={logoPreview || resolveImageUrl(logoUrl)} alt="Company logo" /> : <span>{(company.companyName || 'Company').slice(0, 1).toUpperCase()}</span>}</div><div><label className="db-label" htmlFor="settings-logo">Company logo</label><input id="settings-logo" type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={event => { setLogo(event.target.files?.[0] || null); setProfileMessage(''); }} /><p>PNG, JPEG, or WebP. Maximum 2 MB.</p><button className="db-btn-secondary" type="button" disabled={!logo || uploading} onClick={() => void uploadLogo()}>{uploading ? 'Uploading...' : 'Upload logo'}</button></div></div>
        <form onSubmit={saveCompany}><div className="db-settings-grid">{companyFields.map(([key, label, type]) => <label key={key} className="db-form-group" htmlFor={'settings-' + key}><span className="db-label">{label}</span>{key==='itManagement'?<select className="db-input" id={'settings-'+key} value={company.itManagement||''} onChange={event=>setCompany(previous=>({...previous,itManagement:event.target.value}))}><option value="">Not specified</option><option value="Yes">Yes, we have IT management</option><option value="No">No, we do not have IT management</option></select>:<input className="db-input" id={'settings-' + key} type={type} maxLength={type === 'url' ? 1000 : 500} value={company[key] || ''} placeholder={'Enter your ' + label.toLowerCase()} onChange={event => setCompany(previous => ({ ...previous, [key]: event.target.value }))} />}</label>)}</div><div className="db-settings-actions"><button className="db-btn-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save company details'}</button><a className="db-btn-secondary" href="/company/profile">Complete company profile</a></div></form>
      </>}
    </section>
    <section className="db-card db-settings-card" aria-labelledby="settings-security-title"><h2 id="settings-security-title">Account &amp; security</h2><p>Change the password you use to sign in.</p>
      {passwordError && <p className="db-settings-error" role="alert">{passwordError}</p>}{passwordMessage && <p className="db-settings-success" role="status">{passwordMessage}</p>}
      {account?.user.canChangePassword === false ? <p>This account uses Google sign-in. Manage your password through your Google account.</p> : <form className="db-settings-password" onSubmit={changePassword}><div className="db-settings-grid">{([['currentPassword', 'Current password', 'current-password'], ['newPassword', 'New password', 'new-password'], ['confirmPassword', 'Confirm new password', 'new-password']] as const).map(([key, label, autoComplete]) => <label className="db-form-group" htmlFor={'settings-' + key} key={key}><span className="db-label">{label}</span><input className="db-input" id={'settings-' + key} type="password" autoComplete={autoComplete} required minLength={key === 'currentPassword' ? 1 : 8} maxLength={key === 'currentPassword' ? 512 : 72} value={passwords[key]} onChange={event => setPasswords(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}</div><p>Use 8–72 characters for your new password.</p><button type="submit" className="db-btn-primary" disabled={changing || loading || !account}>{changing ? 'Changing...' : 'Change password'}</button></form>}
    </section>
    <section className="db-card db-settings-card" aria-labelledby="settings-support-title"><h2 id="settings-support-title">Support</h2><h3>Frequently asked questions</h3><div className="db-settings-faqs">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div><h3>Contact support</h3><p>Email our team with questions about your account or projects.</p><div className="db-settings-actions">{supportEmails.map(email => <a className="db-btn-secondary" key={email} href={'mailto:' + email}>{email}</a>)}</div>
      <h3>Report an issue</h3><p>Describe what happened and the steps to reproduce it. Please leave passwords and other sensitive information out of your report.</p><form className="db-settings-report" onSubmit={reportIssue}><label className="db-form-group" htmlFor="settings-issue-subject"><span className="db-label">Subject</span><input className="db-input" id="settings-issue-subject" required maxLength={150} value={issue.subject} onChange={event => setIssue(previous => ({ ...previous, subject: event.target.value }))} /></label><label className="db-form-group" htmlFor="settings-issue-description"><span className="db-label">What went wrong?</span><textarea className="db-textarea" id="settings-issue-description" required maxLength={3000} rows={5} value={issue.description} onChange={event => setIssue(previous => ({ ...previous, description: event.target.value }))} /></label><button className="db-btn-primary" type="submit">Prepare support email</button><p>Your email app opens a draft. Send it to submit your report.</p>{issueMessage && <p role="status">{issueMessage}</p>}</form>
    </section>
  </div>;
}
