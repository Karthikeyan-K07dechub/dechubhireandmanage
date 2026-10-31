import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './dashboard-help.css';

const faqs = [
  ['What is Dechub Bridge?', 'Dechub Bridge helps businesses find suitable talent and manage project delivery, onboarding, contracts, workers, and invoices through one platform.'],
  ['What does "Get a resource in 60 minutes" mean?', 'Our goal is to connect you with a suitable professional in as little as 60 minutes. This refers to talent deployment; project completion follows the agreed scope and timeline. Availability and your requirements affect the deployment time.'],
  ['Do you offer a free trial?', 'Yes, Dechub Bridge offers a 10-day free trial. Contact our team to confirm eligibility, what is included, and the terms before starting.'],
  ['How do I get started?', 'Book a demo and share your requirements, or sign in and select Projects > Create project. Include your project details, required skills, and expected start and end dates so our team can identify suitable candidates.'],
  ['How does Dechub Bridge select suitable talent?', 'Our approach combines AI-assisted matching with human review. The Dechub team reviews your requirements and shares shortlisted profiles for you to evaluate.'],
  ['Can I choose who works on my project?', 'Yes. In Hiring > Manage Requests, review each shortlisted profile, select Accept or Reject, and submit your decisions. You can accept multiple candidates for your project.'],
  ['What happens after I select candidates?', 'The Dechub team reviews your selections and prepares the project contract. You can review the scope, deliverables, budget, and payment terms in Contracts before accepting and starting delivery.'],
  ['How much does hiring through Dechub Bridge cost?', 'Pricing depends on your requirements, selected talent, scope, and engagement duration. The agreed project budget and payment terms are provided for your review before you accept the contract.'],
  ['How do I manage workers and track project progress?', 'Use Projects to view your delivery team, assign tasks, and track task status. The Workers section shows assignments across projects, including project dates and status. Notifications highlight updates and actions requiring your attention.'],
  ['Where can I manage invoices and payment details?', 'Use Invoices to review submitted invoices and approve or dispute them. Visit Payroll to access payment-related information and add payment details.'],
];

export default function DashboardHelp() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', escape); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className="db-icon-btn" aria-label="Help and FAQs" aria-haspopup="dialog" onClick={() => setOpen(true)}>?</button>
    {open && createPortal(<div className="db-help-overlay" onClick={close}>
      <section className="db-help-dialog" role="dialog" aria-modal="true" aria-labelledby="db-help-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, summary, a[href]');
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <header className="db-help-header"><div><h2 id="db-help-title">How can we help?</h2><p>Common questions about Dechub Bridge</p></div><button ref={closeButton} type="button" className="db-btn-secondary" aria-label="Close help" onClick={close}>X</button></header>
        <div className="db-help-content">
          <div className="db-help-faqs">{faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
          <section className="db-help-contact" aria-labelledby="db-help-contact-title"><h3 id="db-help-contact-title">Need more help?</h3><p>Email our team with your question or project details.</p><div><a className="db-btn-primary" href="mailto:prasanna@dechub.in">prasanna@dechub.in</a><a className="db-btn-primary" href="mailto:dechubai@gmail.com">dechubai@gmail.com</a></div></section>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
