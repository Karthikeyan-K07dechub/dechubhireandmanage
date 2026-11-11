import { contractorFaqs } from '../../contractor/contractorFaqs';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './dashboard-help.css';

export const faqs = [
  [
    "How do I create a project?",
    "Open Projects > Create project, enter your requirements, and submit the request for Dechub review."
  ],
  [
    "Where can I review suggested contractors?",
    "Go to Hiring > Manage Requests to review shortlisted profiles and submit your selections."
  ],
  [
    "How do I accept a project contract?",
    "Open Contracts, review the scope, budget, dates, and payment terms, then accept the agreement."
  ],
  [
    "How do I assign tasks to a contractor?",
    "Open the project, find the assigned contractor, and add a task with instructions and an optional attachment."
  ],
  [
    "How can I contact a contractor?",
    "Click Message beside their project assignment, or open a task conversation to share messages, files, and links."
  ],
  [
    "How do I know when work is ready for review?",
    "The task shows Submitted - awaiting your review. Blue dots and the Projects count highlight unread messages and pending reviews."
  ],
  [
    "How do I approve work or request changes?",
    "Open Review submission, check the submitted work, then select Approve completion or Request changes."
  ],
  [
    "How do I mark the whole project completed?",
    "After approving all assigned tasks, select Close and complete project and confirm Yes. You can assign more tasks until the project is closed."
  ],
  [
    "Where do I download invoices and submit payment proof?",
    "Download invoices from Invoices. After paying through the agreed method, upload your receipt and transaction reference in Payroll for admin verification."
  ],
  [
    "Where can I update company details and IT management preferences?",
    "Open Settings > Company profile to update your details, logo, and whether your company has IT management."
  ]
];

export default function DashboardHelp({audience='client'}:{audience?:'client'|'contractor'}) {
  const helpFaqs=audience==='contractor'?contractorFaqs:faqs;
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
    <button ref={trigger} type="button" className={audience==='contractor'?'cd-help-trigger':'db-icon-btn'} aria-label="Help and FAQs" aria-haspopup="dialog" onClick={() => setOpen(true)}>?</button>
    {open && createPortal(<div className={'db-help-overlay'+(audience==='contractor'?' cd-help-overlay':'')} onClick={close}>
      <section className="db-help-dialog" role="dialog" aria-modal="true" aria-labelledby="db-help-title" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button, summary, a[href]');
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        <header className="db-help-header"><div><h2 id="db-help-title">How can we help?</h2><p>{audience==='contractor'?'Help with your Bridge contractor dashboard':'Help with your Bridge client dashboard'}</p></div><button ref={closeButton} type="button" className="db-btn-secondary" aria-label="Close help" onClick={close}>X</button></header>
        <div className="db-help-content">
          <div className="db-help-faqs">{helpFaqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
          <section className="db-help-contact" aria-labelledby="db-help-contact-title"><h3 id="db-help-contact-title">Need more help?</h3><p>Email our team with your question or project details.</p><div><a className="db-btn-primary" href="mailto:prasanna@dechub.in">prasanna@dechub.in</a><a className="db-btn-primary" href="mailto:dechubai@gmail.com">dechubai@gmail.com</a></div></section>
        </div>
      </section>
    </div>, document.body)}
  </>;
}
