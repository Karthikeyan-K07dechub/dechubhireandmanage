import {useEffect,useRef,useState} from 'react';
import RequirementBriefEditor,{cleanBrief,type RequirementBrief} from './RequirementBriefEditor';
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
 const [brief,setBrief]=useState(''),[email,setEmail]=useState(''),[phone,setPhone]=useState(''),[company,setCompany]=useState(''),[website,setWebsite]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[sent,setSent]=useState(false);
 const [step,setStep]=useState<'requirement'|'review'|'contact'>('requirement');
 const [draft,setDraft]=useState<RequirementBrief|null>(null);
 const [generating,setGenerating]=useState(false);
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
 useEffect(()=>{if(step==='contact'){emailRef.current?.focus({preventScroll:true});emailRef.current?.scrollIntoView({block:'center',behavior:'smooth'});}else if(expanded&&!draft){document.getElementById('bl-brief-input')?.focus({preventScroll:true});}if(step==='review')document.querySelector('.bl-ai-editor')?.scrollIntoView({block:'start',behavior:'smooth'});},[expanded,step]);
 async function generate(){if(submitting.current||!brief.trim())return;submitting.current=true;setGenerating(true);setError('');try{const response=await api.post('/workers/marketplace/landing-requirements/brief',{requirement:brief.trim()},{timeout:35000});setDraft(response.data.data.brief);setStep('review');onExpand();}catch(e){setError(normalizeError(e).message||'Unable to generate a brief. Please try again.');}finally{submitting.current=false;setGenerating(false);}}
 async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();if(submitting.current)return;setError('');if(!brief.trim()){setError('Please describe what you are looking to build.');return;}if(!draft){await generate();return;}if(!draft.title.trim()||!draft.summary.trim()){setError('Add a role/project title and summary before continuing.');return;}if(!draft.location.trim()||!draft.experience.trim()||!draft.duration.trim()){setError('Please complete Location, Experience, and Duration.');return;}if(step!=='contact'){setDraft(cleanBrief(draft));setStep('contact');return;}if(personalDomains.has(email.trim().toLowerCase().split('@')[1])){setError('Please enter your work email rather than a personal email.');emailRef.current?.focus();return;}const digits=phone.replace(/\D/g,'').length;if(!/^\+?[\d\s()-]+$/.test(phone.trim())||digits<7||digits>15){setError('Please enter a valid phone number.');return;}if(!company.trim()){setError('Please enter your company name.');return;}
  submitting.current=true;setBusy(true);try{await api.post('/workers/marketplace/landing-requirements',{requirement:brief.trim(),email:email.trim(),phone:phone.trim(),companyName:company.trim(),companyWebsite:website.trim(),brief:cleanBrief(draft)});setSent(true);}catch(e){setError(normalizeError(e).message||'Unable to submit. Please try again.');}finally{submitting.current=false;setBusy(false);}
 }
 if(sent)return <div className="bl-brief bl-thanks" role="status"><span className="bl-thanks-check" aria-hidden="true">✓</span><h3>Thanks for reaching out!</h3><p>The Bridge team will contact you about your requirement.</p><small>We’ll reach you at {email.trim()}.</small></div>;
 return <form className="bl-brief" onSubmit={event=>void submit(event)} aria-busy={busy||generating}><label htmlFor="bl-brief-input">What are you looking to build?</label><div className="bl-animated-input"><textarea id="bl-brief-input" onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} onKeyDown={event=>{if(event.key!=='Enter'||event.shiftKey||event.ctrlKey||event.altKey||event.metaKey||event.nativeEvent.isComposing||event.nativeEvent.keyCode===229)return;event.preventDefault();if(!event.repeat&&!busy&&!generating&&brief.trim())void generate();}} required rows={2} maxLength={3000} disabled={busy||generating} value={brief} onChange={e=>{setBrief(e.target.value);setDraft(null);setStep('requirement');setError('');}} placeholder={focused||reducedMotion?requirementExamples[exampleIndex]:''}/>{!brief&&!focused&&!reducedMotion&&<div className="bl-typewriter" aria-hidden="true"><span>{typedExample}</span><span className="bl-typewriter-cursor"/></div>}</div>
  <div className="bl-brief-bottom"><span>{generating?'Reading your requirement and drafting your brief...':'Describe your role or project, then review the AI draft.'}</span><button className="bl-button" type={draft?'button':'submit'} disabled={busy||generating} onClick={draft?()=>void generate():undefined}>{generating?'Generating brief...':draft?'Regenerate brief':'Send a requirement'} <span aria-hidden="true">&#8594;</span></button></div>
  {generating&&<div className="bl-ai-loading" role="status"><span/><span/><span/> Preparing your editable brief</div>}
  {draft&&<><RequirementBriefEditor brief={draft} onChange={setDraft} disabled={busy||generating}/>{step==='review'&&<div className="bl-ai-submit-row"><span>Happy with the brief? Submit it to add your contact details.</span><button type="submit" className="bl-button" disabled={busy||generating}>Submit brief</button></div>}</>}
  {draft&&step==='contact'&&<div className="bl-contact-fields"><div className="bl-contact-heading"><h3>How can we reach you?</h3><p>Submit your brief and contact details to the Bridge team.</p></div><div className="bl-contact-grid"><label htmlFor="bl-work-email">Work email<input ref={emailRef} id="bl-work-email" type="email" autoComplete="email" maxLength={254} required disabled={busy||generating} value={email} onChange={e=>{setEmail(e.target.value);setError('');}} placeholder="you@company.com"/></label><label htmlFor="bl-phone">Phone number<input id="bl-phone" type="tel" autoComplete="tel" maxLength={25} required disabled={busy||generating} value={phone} onChange={e=>{setPhone(e.target.value);setError('');}} placeholder="+971 50 123 4567"/></label><label htmlFor="bl-company">Company name<input id="bl-company" autoComplete="organization" maxLength={180} required disabled={busy||generating} value={company} onChange={e=>{setCompany(e.target.value);setError('');}} placeholder="Your company name"/></label><label htmlFor="bl-company-website">Company website (optional)<input id="bl-company-website" autoComplete="url" maxLength={500} disabled={busy||generating} value={website} onChange={e=>{setWebsite(e.target.value);setError('');}} placeholder="e.g. company.com"/></label></div><div className="bl-contact-footer"><small>By submitting, you agree that Bridge may contact you about your requirement. <a href="/legal-pages/privacy-policy">Privacy policy</a></small><button className="bl-button" type="submit" disabled={busy||generating}>{busy?'Submitting...':'Submit requirement'}</button></div></div>}
  {error&&<p className="bl-form-error" role="alert">{error}</p>}
 </form>;
}
