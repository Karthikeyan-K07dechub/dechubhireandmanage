import './client-signup-terms.css';
export const CLIENT_TERMS_VERSION='2026-11-09';
const terms=[
 ['Account accuracy and authority','Provide accurate company and contact details, keep them up to date, and create an account only if you are authorized to act for the company. Keep login credentials secure and report unauthorized access to Bridge support.'],
 ['Company verification','Provide the business and identity documents requested for verification. Bridge may restrict access to services while information is incomplete or under review.'],
 ['Project agreements and starting work','Review and accept the project scope, deliverables, schedule, and responsibilities in the separate project contract. Contractors should begin work after the required client and contractor contract acceptances. Creating this account does not accept a future project contract.'],
 ['Task assignment and review','Assign clear tasks to the appropriate contractors, provide necessary resources, and review submitted work. Give specific feedback or approve completion within the review period agreed for the project. Task approval and closing the entire project are separate actions.'],
 ['Changes to project scope','Discuss additional requirements and changes with Bridge and the contractor. Record and approve revised deliverables and timelines before the changed work begins.'],
 ['Equipment responsibilities','Agree on equipment requirements, ownership, permitted use, delivery, and responsibility for loss or damage before supply. Bridge admin coordinates equipment operations. Contractors confirm receipt, report problems, and cooperate with agreed return arrangements when equipment is no longer needed or the project ends.'],
 ['IT access and security','Confirm whether your company manages IT access. Your authorized IT team, or the agreed support provider, should grant the access needed for assigned work, follow least-privilege practices, and remove access when it is no longer required. Do not share passwords or access tokens through task messages.'],
 ['Confidentiality, documents, and privacy','Share only information and documents you are authorized to provide. Protect confidential company, contractor, and project information. Use personal information only for authorized project purposes and follow the applicable Privacy Policy.'],
 ['Deliverables and intellectual property','Set out ownership, permitted use, and any transfer conditions for deliverables in the separate project contract. Confirm that materials your company supplies can be used for the project. Account creation alone does not transfer intellectual property.'],
 ['Cancellation and disputes','Notify Bridge when you need to pause or cancel a project. Follow the cancellation procedure in the project agreement, document completed and outstanding work, and coordinate equipment recovery and access removal. Raise disputes with Bridge support and preserve relevant project records.'],
 ['Acceptable use','Do not use Bridge for unlawful requests, fraud, harassment, discrimination, unauthorized access, or sharing documents without permission. Respect contractors and communicate professionally. Bridge may restrict accounts that misuse the service.'],
];
export default function ClientSignupTerms({accepted,onChange,error}:{accepted:boolean;onChange:(value:boolean)=>void;error?:string}){
 return <section className="client-signup-terms" aria-labelledby="client-signup-terms-title">
  <h3 id="client-signup-terms-title">Client terms and conditions</h3>
  <div className="client-signup-terms-content" tabIndex={0} role="region" aria-label="Read client terms and conditions">{terms.map(([title,text])=><div key={title}><h4>{title}</h4><p>{text}</p></div>)}</div>
  <label className="client-signup-terms-accept"><input type="checkbox" checked={accepted} onChange={event=>onChange(event.target.checked)} aria-invalid={!!error}/><span>I have read and agree to the client terms and conditions above. <span aria-hidden="true">*</span></span></label>
  {error&&<p className="client-signup-terms-error" role="alert">{error}</p>}
 </section>;
}
