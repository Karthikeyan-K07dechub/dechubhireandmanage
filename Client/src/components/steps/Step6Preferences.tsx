import { useState } from 'react';
import { AppHandlers, AppState } from '../../types/signup';
import ActionButton from '../common/ActionButton';
import { UserIcon } from '../common/Icons';
import RadioCard from '../common/RadioCard';
import ToggleRow from '../common/ToggleRow';

const companyTimezones = [
  ['Asia/Kolkata', 'India - Indian Standard Time (IST)'],
  ['Asia/Dubai', 'UAE - Gulf Standard Time (GST)'],
  ['America/New_York', 'USA - Eastern Time (ET)'],
  ['America/Chicago', 'USA - Central Time (CT)'],
  ['America/Denver', 'USA - Mountain Time (MT)'],
  ['America/Phoenix', 'USA - Arizona (no daylight saving)'],
  ['America/Los_Angeles', 'USA - Pacific Time (PT)'],
  ['America/Anchorage', 'USA - Alaska Time'],
  ['Pacific/Honolulu', 'USA - Hawaii Time'],
];

export default function Step6Preferences({ state, handlers }: { state: AppState; handlers: AppHandlers }) {
  const { formData, errors, loadingAction } = state;
  const { handleInputChange, goToStep, completeSignup, validateEmail } = handlers;
  const [customTimezone, setCustomTimezone] = useState(false);
  const isOtherTimezone = customTimezone || Boolean(formData.companyTimezone && !companyTimezones.some(([value]) => value === formData.companyTimezone));

  return (
    <section className="card screen active">
      <div className="card-icon bg-green">⚙️</div>
      <h2 className="card-title">HR preferences</h2>
      <p className="card-sub">Configure how Dechub runs payroll and contracts for your team.</p>

      <div className="form-group">
        <label>Default pay cycle <span className="req">*</span></label>
        <div className="radio-group">
          <RadioCard selected={formData.payCycle === 'monthly'} title="Monthly" text="Pay on last day" onClick={() => handleInputChange('payCycle', 'monthly')} />
          <RadioCard selected={formData.payCycle === 'biweekly'} title="Bi-weekly" text="Every 2 weeks" onClick={() => handleInputChange('payCycle', 'biweekly')} />
          <RadioCard selected={formData.payCycle === 'weekly'} title="Weekly" text="Every Friday" onClick={() => handleInputChange('payCycle', 'weekly')} />
        </div>
        {errors.payCycle && <div className="field-error show" role="alert">{errors.payCycle}</div>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Default contract currency <span className="req">*</span></label>
          <select value={formData.contractCurrency} onChange={(e) => handleInputChange('contractCurrency', e.target.value)}>
            <option value="">Select a currency...</option>
            <option value="INR">INR</option>
            <option value="AED">AED</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="CAD">🇨🇦 CAD</option>
            <option value="AUD">🇦🇺 AUD</option>
          </select>
          {errors.contractCurrency && <div className="field-error show" role="alert">{errors.contractCurrency}</div>}
        </div>
        <div className="form-group">
          <label>Company timezone <span className="req">*</span></label>
          <select value={isOtherTimezone ? 'OTHER' : formData.companyTimezone} onChange={(e) => { const other = e.target.value === 'OTHER'; setCustomTimezone(other); handleInputChange('companyTimezone', other ? '' : e.target.value); }}>
            <option value="">Select your timezone...</option>
            {companyTimezones.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            <option value="OTHER">Other</option>
          </select>
          {isOtherTimezone && <div style={{ marginTop: 10 }}><label htmlFor="custom-company-timezone">Other timezone <span className="req">*</span></label><input id="custom-company-timezone" value={formData.companyTimezone} onChange={e => handleInputChange('companyTimezone', e.target.value)} placeholder="e.g. Europe/London" maxLength={100} required /><div className="field-hint">Enter the timezone name, for example Europe/London.</div></div>}
          {errors.companyTimezone && <div className="field-error show" role="alert">{errors.companyTimezone}</div>}
        </div>
      </div>

      <div className="form-group">
        <label>HR admin email <span className="req">*</span></label>
        <div className="input-wrap">
          <div className="input-icon"><UserIcon /></div>
          <input type="email" value={formData.hrEmail} onChange={(e) => handleInputChange('hrEmail', e.target.value)} className={errors.hrEmail ? 'error' : validateEmail(formData.hrEmail) ? 'valid' : ''} placeholder="hr@acmecorp.com" />
        </div>
        <div className={`field-error ${errors.hrEmail ? 'show' : ''}`}>{errors.hrEmail}</div>
        <div className="field-hint">This person manages day-to-day worker operations</div>
      </div>

      <div className="form-group">
        <label>Notification preferences</label>
        <div className="toggle-box">
          <ToggleRow title="Invoice approval reminders" text="Get notified when worker invoices are pending" checked={formData.notif1} onChange={(value) => handleInputChange('notif1', value)} />
          <ToggleRow title="Payroll processing alerts" text="Notify before each payroll run" checked={formData.notif2} onChange={(value) => handleInputChange('notif2', value)} />
          <ToggleRow title="Contract signature updates" text="Alert when workers sign or decline contracts" checked={formData.notif3} onChange={(value) => handleInputChange('notif3', value)} />
          <ToggleRow title="KYC / KYB status updates" text="Notify when verification completes" checked={formData.notif4} onChange={(value) => handleInputChange('notif4', value)} last />
        </div>
      </div>

      {Object.keys(errors).length > 0 && <p role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>Please complete the highlighted fields above, then click Complete Setup.</p>}
      {state.serverError && <p role="alert" style={{ color: '#b91c1c', fontSize: 13 }}>{state.serverError}</p>}
      <div className="btn-row">
        <button type="button" className="btn-secondary" onClick={() => goToStep(5)}>← Back</button>
        <ActionButton loading={loadingAction === 'complete'} onClick={completeSignup}>
          Complete Setup →
        </ActionButton>
      </div>
    </section>
  );
}
