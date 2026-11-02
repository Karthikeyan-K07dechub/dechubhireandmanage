import { resolveImageUrl } from '../utils/imageUrl';
import SignOutButton from '../components/common/SignOutButton';
import { useEffect, useState } from 'react';
import { tokenStore } from '../api/client';
import { getMyCompany, updateCompanyProfile, submitKyb, type MyCompanyData, type KybFiles } from '../api/company.api';
import './company-profile.css';

type Field = { key: string; label: string; type?: string; options?: string[] };
const sections: { title: string; fields: Field[] }[] = [
  { title: 'Company identity', fields: [
    { key: 'companyName', label: 'Legal company name' }, { key: 'companyCountry', label: 'Country of registration' },
    { key: 'companyType', label: 'Company type', options: ['LLC', 'Corp', 'Pvt Ltd', 'Sole Trader', 'Partnership', 'Other'] }, { key: 'taxId', label: 'Registration / Tax ID' },
  ] },
  { title: 'Business details', fields: [
    { key: 'companySize', label: 'Company size', options: ['1-10', '11-50', '51-200', '201-500', '500+'] },
    { key: 'companyIndustry', label: 'Industry' }, { key: 'companyWebsite', label: 'Company website', type: 'url' },
    { key: 'addressLine1', label: 'Business address' }, { key: 'addressCity', label: 'City' }, { key: 'addressZip', label: 'Postal code' }, { key: 'referralSource', label: 'How did you hear about us?' },
  ] },
  { title: 'Billing details', fields: [
    { key: 'billCurrency', label: 'Billing currency', options: ['USD', 'INR', 'AED'] }, { key: 'billingEmail', label: 'Billing email', type: 'email' },
  ] },
  { title: 'HR and workspace preferences', fields: [
    { key: 'payCycle', label: 'Pay cycle' }, { key: 'contractCurrency', label: 'Contract currency', options: ['USD', 'INR', 'AED'] },
    { key: 'companyTimezone', label: 'Company timezone' }, { key: 'hrEmail', label: 'HR email', type: 'email' },
  ] },
];
const notificationLabels = ['Invoice approval reminders', 'Payroll processing alerts', 'Contract signature updates', 'KYC / KYB status updates'];
const documentLabels = ['Certificate of incorporation', 'Tax ID document', 'Owner ID', 'Proof of address'];
export default function CompanyProfilePage() {
  const [data, setData] = useState<MyCompanyData | null>(null);
  const [user, setUser] = useState({ firstName: '', lastName: '', phone: '' });
  const [company, setCompany] = useState<Record<string, string | boolean>>({});
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [success, setSuccess] = useState('');
  const [files, setFiles] = useState<KybFiles>({ doc1: null, doc2: null, doc3: null, doc4: null });
  const [uploading, setUploading] = useState(false);
  function apply(result: MyCompanyData) {
    setData(result); setUser({ firstName: result.user.firstName || '', lastName: result.user.lastName || '', phone: result.user.phone || '' });
    const values: Record<string, string | boolean> = {};
    sections.flatMap(section => section.fields).forEach(field => { values[field.key] = String(result.company[field.key] ?? ''); });
    for (let i = 1; i <= 4; i++) values['notif' + i] = result.company['notif' + i] !== false;
    setCompany(values);
  }
  useEffect(() => {
    if (!tokenStore.getAccess()) { window.location.replace('/company/login'); return; }
    let active = true;
    getMyCompany().then(result => { if (active) apply(result); }).catch(reason => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try { apply(await updateCompanyProfile({ user, company })); setSuccess('Your profile has been saved. You can return later to complete empty fields.'); }
    catch (reason) { setError((reason as Error).message); } finally { setSaving(false); }
  }
  async function upload() {
    setUploading(true); setError(''); setSuccess('');
    try { await submitKyb(files); const latest = await getMyCompany(); setData(latest); setSuccess('Verification documents submitted.'); }
    catch (reason) { setError((reason as Error).message); } finally { setUploading(false); }
  }
  function field(item: Field, value: string, onChange: (value: string) => void) {
    const id = 'profile-' + item.key;
    return <label className="cp-field" key={item.key} htmlFor={id}><span>{item.label}</span>
      {item.options ? <select id={id} value={value} className={!value ? 'cp-missing' : ''} onChange={event => onChange(event.target.value)}><option value="">Please enter your {item.label.toLowerCase()}</option>{!item.options.includes(value) && value && <option value={value}>{value}</option>}{item.options.map(option => <option key={option} value={option}>{option}</option>)}</select>
        : <input id={id} type={item.type || 'text'} value={value} className={!value ? 'cp-missing' : ''} placeholder={'Please enter your ' + item.label.toLowerCase()} onChange={event => onChange(event.target.value)} maxLength={item.type === 'url' ? 1000 : 500} required={item.key === 'firstName'} />}
      {!value && <small className="cp-required">Please enter your {item.label.toLowerCase()}.</small>}
    </label>;
  }
  return <div className="cp-page"><header className="cp-header"><a className="cp-back" href="/dashboard">Back to dashboard</a><a className="cp-back" href="/company/onboarding">Complete company setup</a></header>
    <main className="cp-main"><div className="cp-title"><h1>Company profile</h1><p>Review and edit your account, company details, and workspace preferences.</p></div>
      {error && <div className="cp-error" role="alert">{error}</div>}{success && <div className="cp-success" role="status">{success}</div>}
      {loading ? <p>Loading your company profile...</p> : data && <>
        <section className="cp-card"><h2>Company logo</h2>{data.company.companyLogoUrl ? <img src={resolveImageUrl(String(data.company.companyLogoUrl))} alt="Company logo" style={{ width: 96, height: 96, objectFit: 'contain', marginBottom: 16 }} /> : <p>No company logo uploaded yet.</p>}<p><a href="/dashboard?tab=settings#company-profile">Manage your logo in Settings</a></p></section>
        <form onSubmit={save}>
          <section className="cp-card"><h2>Account details</h2><div className="cp-grid">{([{ key: 'firstName', label: 'First name' }, { key: 'lastName', label: 'Last name' }, { key: 'phone', label: 'Phone number', type: 'tel' }] as Field[]).map(item => field(item, user[item.key as keyof typeof user], value => setUser(previous => ({ ...previous, [item.key]: value }))))}<label className="cp-field"><span>Sign-in email</span><input value={data.user.email} readOnly /><small>Your sign-in email identifies your account.</small></label></div></section>
          {sections.map(section => <section key={section.title} className="cp-card"><h2>{section.title}</h2><div className="cp-grid">{section.fields.map(item => field(item, String(company[item.key] ?? ''), value => setCompany(previous => ({ ...previous, [item.key]: value }))))}</div></section>)}
          <section className="cp-card"><h2>Notification preferences</h2><div className="cp-checks">{notificationLabels.map((label, index) => <label key={label}><input type="checkbox" checked={Boolean(company['notif' + (index + 1)])} onChange={event => setCompany(previous => ({ ...previous, ['notif' + (index + 1)]: event.target.checked }))} />{label}</label>)}</div></section>
          <div className="cp-save"><button disabled={saving} type="submit">{saving ? 'Saving...' : 'Save profile'}</button></div>
        </form>
        <section className="cp-card"><h2>Company verification</h2><p>Status: <strong>{String(data.company.kybStatus || 'pending')}</strong></p><p>Upload company documents for review. Verification status is updated after review.</p>
          {Array.isArray(data.company.kybDocuments) && data.company.kybDocuments.length > 0 && <ul>{(data.company.kybDocuments as { fileName: string }[]).map((document, index) => <li key={index}>{document.fileName}</li>)}</ul>}
          <div className="cp-grid">{documentLabels.map((label, index) => <label key={label} className="cp-field"><span>{label}{index === 0 || index === 2 ? ' (required for submission)' : ''}</span><input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={event => setFiles(previous => ({ ...previous, ['doc' + (index + 1)]: event.target.files?.[0] || null }))} /></label>)}</div>
          <button type="button" disabled={uploading || !files.doc1 || !files.doc3} onClick={() => void upload()}>{uploading ? 'Uploading...' : 'Submit verification documents'}</button>
          <p>Manage payment methods in <a href="/dashboard?tab=payroll">Payroll</a>.</p>
        </section>
      </>}
      <div className="cp-signout"><SignOutButton /></div>
    </main></div>;
}
