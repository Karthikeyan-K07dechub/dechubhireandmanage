import { useId,useRef,useState } from 'react';
import { contractorApi } from './api/contractor.api';
import { documentError } from '../api/documents.api';
import './request-it-access.css';

export default function RequestITAccessButton({projectId,projectTitle,disabled=false}:{projectId:string;projectTitle:string;disabled?:boolean}){
  const dialog=useRef<HTMLDialogElement>(null),submitting=useRef(false);
  const titleId=useId(),messageId=useId();
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
  async function submit(event:React.FormEvent){
    event.preventDefault();if(submitting.current||!message.trim()||disabled)return;
    submitting.current=true;setBusy(true);setError('');
    try{const response=await contractorApi.post('/projects/'+projectId+'/it-access-requests',{message:message.trim()},{timeout:60000});setSuccess(response.data.data.message);setMessage('');}
    catch(reason){setError(documentError(reason));}
    finally{submitting.current=false;setBusy(false);}
  }
  return <>
    <button type="button" className="ctp-request-it-button" disabled={disabled} onClick={()=>{setError('');setSuccess('');dialog.current?.showModal();}}>Request IT access</button>
    <dialog ref={dialog} className="it-access-dialog" aria-labelledby={titleId} onCancel={event=>{if(busy)event.preventDefault();}}>
      <header><h2 id={titleId}>Request IT access</h2><button type="button" className="it-access-close" aria-label="Close IT access request" disabled={busy} onClick={()=>dialog.current?.close()}>Close</button></header>
      <p className="it-access-project">{projectTitle}</p>
      {success?<><p className="it-access-success" role="status">{success}</p><footer><button type="button" onClick={()=>dialog.current?.close()}>Done</button></footer></>:<form onSubmit={event=>void submit(event)}>
        <label htmlFor={messageId}>What access do you need?</label>
        <textarea id={messageId} required maxLength={5000} value={message} disabled={busy} onChange={event=>setMessage(event.target.value)} placeholder="Describe the tools, accounts, repositories, or permissions you need for this project."/>
        <p>Your request will be emailed to the client or the Dechub team, based on the company's IT management setup.</p>
        {error&&<p role="alert" className="it-access-error">{error}</p>}
        <footer><button type="button" className="it-access-cancel" disabled={busy} onClick={()=>dialog.current?.close()}>Cancel</button><button type="submit" disabled={busy||!message.trim()}>{busy?'Sending...':'Submit request'}</button></footer>
      </form>}
    </dialog>
  </>;
}
