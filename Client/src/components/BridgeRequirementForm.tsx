import {useEffect,useRef,useState} from 'react';
import {api,normalizeError} from '../api/client';
const requirementExamples = [
 'We need a frontend developer for our existing project...',
 'We are looking for a UI/UX designer to work with our team...',
 'We need backend development support for a new project...',
 'We want the Bridge team to build our web application...',
 'We are looking for talents to help deliver our mobile app...',
 'We need a remote development team for our next project...',
];
const personalDomains=new Set(['gmail.com','googlemail.com','yahoo.com','yahoo.co.in','yahoo.co.uk','ymail.com','hotmail.com','hotmail.co.uk','outlook.com','outlook.in','icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me','pm.me','live.com','live.in','msn.com','mail.com','gmx.com','gmx.net','yandex.com','yandex.ru','rediffmail.com','rediff.com']);
export default function BridgeRequirementForm({expanded,onExpand}:{expanded:boolean;onExpand:()=>void}){
 const [brief,setBrief]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[company,setCompany]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const [exampleIndex,setExampleIndex]=useState(0);
 const [typedExample,setTypedExample]=useState('');
 const [deleting,setDeleting]=useState(false);
 const [focused,setFocused]=useState(false);
 const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReducedMotion(preference.matches);preference.addEventListener('change',update);return()=>preference.removeEventListener('change',update);},[]);
 useEffect(()=>{
  if(brief||sent||focused||reducedMotion)return;
  const example=requirementExamples[exampleIndex];
  const delay=deleting?Math.max(1,Math.round(500/example.length)):typedExample.length===example.length?1500:55;
  const timer=window.setTimeout(()=>{
   if(!deleting&&typedExample.length===example.length){setDeleting(true);return;}
   if(deleting&&typedExample.length===0){setDeleting(false);setExampleIndex(index=>(index+1)%requirementExamples.length);return;}
   setTypedExample(deleting?typedExample.slice(0,-1):example.slice(0,typedExample.length+1));
  },delay);
  return()=>window.clearTimeout(timer);
 },[brief,sent,focused,reducedMotion,exampleIndex,typedExample,deleting]);
 const submitting=useRef(false);const emailRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{if(expanded)emailRef.current?.focus({preventScroll:true});},[expanded]);
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(submitting.current)return;setError('');if(!brief.trim()){setError('Please describe what you are looking to build.');return;}if(!expanded){onExpand();return;}if(personalDomains.has(email.trim().toLowerCase().split('@')[1])){setError('Please enter your work email rather than a personal email.');emailRef.current?.focus();return;}const digits=phone.replace(/\D/g,'').length;if(!/^\+?[\d\s()-]+$/.test(phone.trim())||digits<7||digits>15){setError('Please enter a valid phone number.');return;}if(!company.trim()){setError('Please enter your company name.');return;}
  submitting.current=true;setBusy(true);try{await api.post('/workers/marketplace/landing-requirements',{requirement:brief.trim(),email:email.trim(),phone:phone.trim(),companyName:company.trim()});setSent(true);}catch(e){setError(normalizeError(e).message||'Unable to submit. Please try again.');}finally{submitting.current=false;setBusy(false);}
 }
 if(sent)return <div className="bl-brief bl-thanks" role="status"><span className="bl-thanks-check" aria-hidden="true">✓</span><h3>Thanks for reaching out!</h3><p>The Bridge team will contact you about your requirement.</p><small>We’ll reach you at {email.trim()}.</small></div>;
 return <form className="bl-brief" onSubmit={event=>void submit(event)} aria-busy={busy}><label htmlFor="bl-brief-input">What are you looking to build?</label><div className="bl-animated-input"><textarea id="bl-brief-input" onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} required rows={2} maxLength={3000} disabled={busy} value={brief} onChange={e=>setBrief(e.target.value)} placeholder={focused||reducedMotion?requirementExamples[exampleIndex]:''}/>{!brief&&!focused&&!reducedMotion&&<div className="bl-typewriter" aria-hidden="true"><span>{typedExample}</span><span className="bl-typewriter-cursor"/></div>}</div>
  {!expanded?<div className="bl-brief-bottom"><span>Start with your project or talent requirement</span><button className="bl-button" type="submit">Send a requirement <span aria-hidden="true">→</span></button></div>:<div className="bl-contact-fields"><div className="bl-contact-heading"><h3>How can we reach you?</h3><p>Share your details and the Bridge team will get in touch.</p></div><div className="bl-contact-grid"><label htmlFor="bl-work-email">Work email<input ref={emailRef} id="bl-work-email" type="email" autoComplete="email" maxLength={254} required disabled={busy} value={email} onChange={e=>{setEmail(e.target.value);setError('');}} placeholder="you@company.com"/></label><label htmlFor="bl-phone">Phone number<input id="bl-phone" type="tel" autoComplete="tel" maxLength={25} required disabled={busy} value={phone} onChange={e=>{setPhone(e.target.value);setError('');}} placeholder="+971 50 123 4567"/></label><label className="bl-company-field" htmlFor="bl-company">Company name<input id="bl-company" autoComplete="organization" maxLength={180} required disabled={busy} value={company} onChange={e=>{setCompany(e.target.value);setError('');}} placeholder="Your company name"/></label></div><div className="bl-contact-footer"><small>By submitting, you agree that Bridge may contact you about your requirement. <a href="/legal-pages/privacy-policy">Privacy policy</a></small><button className="bl-button" type="submit" disabled={busy}>{busy?'Submitting…':'Submit requirement'}</button></div></div>}
  {error&&<p className="bl-form-error" role="alert">{error}</p>}
 </form>;
}
