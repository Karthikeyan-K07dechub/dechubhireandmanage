import './contractor-payment-proof.css';
import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { contractorApi } from '../contractor/api/contractor.api';

export default function ContractorPaymentProof({id,admin=false,sent=false,approved=false,onSent,downloadLabel='Download payment proof'}:{id:string;admin?:boolean;sent?:boolean;approved?:boolean;onSent?:()=>void;downloadLabel?:string}){
  const dialog=useRef<HTMLDialogElement>(null);
  const [preview,setPreview]=useState<{url:string;name:string;mime:string;sentAt:string;approvedAt:string|null}|null>(null);
  useEffect(()=>{if(preview)dialog.current?.showModal();else dialog.current?.close();return()=>{if(preview)URL.revokeObjectURL(preview.url);};},[preview?.url]);
  async function approvePayment(){
    if(!preview||busy)return;setBusy(true);setError('');
    try{const response=await contractorApi.post('/invoices/'+id+'/payment-proof/approve',{sentAt:preview.sentAt});setPreview(current=>current?{...current,approvedAt:response.data.data.approvedAt}:null);onSent?.();}
    catch(e:any){setError(e.response?.data?.error?.message||'Unable to approve payment.');}finally{setBusy(false);}
  }
  function downloadPreview(){if(!preview)return;const link=document.createElement('a');link.href=preview.url;link.download=preview.name;link.click();}
  const [open,setOpen]=useState(false),[file,setFile]=useState<File|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function upload(){
    if(!file||busy)return;
    if(file.size>2*1024*1024){setError('Maximum file size is 2 MB.');return;}
    setBusy(true);setError('');
    try{const form=new FormData();form.append('proof',file);await api.post('/admin/invoices/'+id+'/contractor-payment-proof',form,{headers:{'Content-Type':'multipart/form-data'},timeout:60000});setOpen(false);setFile(null);onSent?.();}
    catch(e:any){setError(e.response?.data?.error?.message||e.message||'Unable to send payment proof.');}finally{setBusy(false);}
  }
  async function download(){setBusy(true);setError('');try{
    const result=await (admin?api:contractorApi).get((admin?'/admin/invoices/':'/invoices/')+id+(admin?'/contractor-payment-proof':'/payment-proof'),{responseType:'blob'});
    const name=/filename="([^"]+)"/.exec(result.headers['content-disposition']||'')?.[1]||'payment-receipt';
    if(!admin){const info=await contractorApi.get('/invoices/'+id+'/payment-proof/info');if(result.headers['x-payment-proof-version']!==info.data.data.sentAt)throw new Error('Receipt changed. Reopen it.');setPreview({url:URL.createObjectURL(result.data),name,mime:result.headers['content-type']||result.data.type,sentAt:info.data.data.sentAt,approvedAt:info.data.data.approvedAt});return;}
    const url=URL.createObjectURL(result.data);const a=document.createElement('a');a.href=url;
    a.download=/filename="([^"]+)"/.exec(result.headers['content-disposition']||'')?.[1]||'payment-receipt';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }catch{setError('Unable to open payment proof.');}finally{setBusy(false);}}
  return <div className={'payout-proof'+(admin?' payout-proof-admin':'')+(open?' is-open':'')}>
    {admin&&<button type="button" disabled={busy||!approved} title={!approved?'Approve invoice first':undefined} onClick={()=>setOpen(!open)}>{sent?'Replace payment proof':'Send payment proof'}</button>}
    {sent&&<button type="button" disabled={busy} onClick={()=>void download()}>{downloadLabel}</button>}
    {open&&<div className="payout-proof-upload">
      <label className="payout-proof-picker"><strong>Payment receipt</strong><span>Choose a PDF, PNG, JPEG, or WebP file up to 2 MB.</span><input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" disabled={busy} onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
      <div className="payout-proof-actions"><button className="payout-proof-send" type="button" disabled={busy||!file} onClick={()=>void upload()}>{busy?'Sending...':'Upload and send'}</button>
      <button type="button" disabled={busy} onClick={()=>setOpen(false)}>Cancel</button></div>
    </div>}
    <dialog ref={dialog} className="payout-proof-preview" aria-labelledby={'proof-title-'+id} onCancel={event=>{event.preventDefault();if(!busy)setPreview(null);}}>
      <header><h2 id={'proof-title-'+id}>Payment proof</h2><button type="button" aria-label="Close payment proof" disabled={busy} onClick={()=>setPreview(null)}>Close</button></header>
      {preview&&<><div className="payout-proof-preview-media">{preview.mime.startsWith('image/')?<img src={preview.url} alt="Payment receipt"/>:<iframe src={preview.url} title="Payment receipt PDF"/>}</div>
        {preview.approvedAt?<p className="payout-proof-confirmed" role="status">Approved by contractor</p>:<p>Review the receipt and approve only after confirming you received the payment.</p>}
        <footer><button type="button" onClick={downloadPreview}>Download</button><button type="button" className="payout-proof-approve" disabled={busy||Boolean(preview.approvedAt)} onClick={()=>void approvePayment()}>{preview.approvedAt?'Approved':busy?'Approving...':'Approve payment'}</button></footer>
      </>}
      {error&&<p role="alert" className="payout-proof-preview-error">{error}</p>}
    </dialog>
    {error&&!preview&&<p role="alert" style={{flexBasis:'100%',color:admin?'#fca5a5':'#b91c1c'}}>{error}</p>}
  </div>;
}
