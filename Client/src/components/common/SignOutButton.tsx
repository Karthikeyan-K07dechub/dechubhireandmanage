import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { tokenStore } from '../../api/client';
import './sign-out-button.css';

export default function SignOutButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const confirm = useRef<HTMLButtonElement>(null);
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancel.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape); };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className={className} aria-haspopup="dialog" onClick={() => setOpen(true)}>Sign out</button>
    {open && createPortal(<div className="signout-overlay" onClick={close}>
      <section className="signout-dialog" role="alertdialog" aria-modal="true" aria-labelledby="signout-title" aria-describedby="signout-description" onClick={event => event.stopPropagation()} onKeyDown={event => {
        if (event.key !== 'Tab') return;
        if (event.shiftKey && document.activeElement === cancel.current) { event.preventDefault(); confirm.current?.focus(); }
        else if (!event.shiftKey && document.activeElement === confirm.current) { event.preventDefault(); cancel.current?.focus(); }
      }}>
        <h2 id="signout-title">Sign out?</h2>
        <p id="signout-description">Are you sure you want to sign out of your account?</p>
        <div className="signout-actions"><button ref={cancel} type="button" className="signout-cancel" onClick={close}>Cancel</button><button ref={confirm} type="button" className="signout-confirm" onClick={() => { tokenStore.clear(); window.location.href = '/'; }}>Sign out</button></div>
      </section>
    </div>, document.body)}
  </>;
}
