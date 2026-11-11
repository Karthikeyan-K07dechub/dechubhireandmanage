import {useEffect,useRef,useState} from 'react';
import {api,unwrapApiData} from '../api/client';
import {contractorApi} from '../contractor/api/contractor.api';
import {documentError} from '../api/documents.api';

export type DeliveryInfo={_id:string;projectName:string;status:string;deliveryStatus?:string;deliveryMessage?:string;deliveryUpdatedAt?:string;deliveryFileName?:string;deliveryMimeType?:string;clientDeliveryReadAt?:string|null;contractorDeliveryReadAt?:string|null;returnResponse?:'yes'|'no'|null;returnReason?:string;returnEmailStatus?:string;deliveryHistory?:{status:string;message:string}[];contractorDeliveryConfirmedAt?:string|null};
const labels:Record<string,string>={delivered:'Delivered',ready_to_return:'Ready to return?',return_completed:'Return completed'};
export function deliveryUnread(item:DeliveryInfo,role:string){if(item.deliveryStatus==='ready_to_return')return role==='contractor'&&!item.returnResponse;return role!=='admin'&&!!item.deliveryUpdatedAt&&!(role==='client'?item.clientDeliveryReadAt:item.contractorDeliveryReadAt);}
export default function EquipmentDelivery({item,role,onChanged}:{item:DeliveryInfo;role:'admin'|'client'|'contractor';onChanged:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),lock=useRef(false);
 const [answer,setAnswer]=useState(''),[reason,setReason]=useState('');
 const [editing,setEditing]=useState(''),[text,setText]=useState(''),[file,setFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[preview,setPreview]=useState(''),[seen,setSeen]=useState('');
 const client=role==='contractor'?contractorApi:api;
 const path=(role==='contractor'?'':'/'+(role==='client'?'company':'admin'))+'/equipment-requests/'+item._id;
 const unread=deliveryUnread(item,role)&&(item.deliveryStatus==='ready_to_return'||seen!==item.deliveryUpdatedAt);
 const clientReturn=role==='client'&&item.deliveryStatus==='ready_to_return';
 const shownStatus=clientReturn?'delivered':item.deliveryStatus;
 const shownMessage=clientReturn?(item.deliveryHistory?.find(entry=>entry.status==='delivered')?.message||'Equipment delivered.'):item.deliveryMessage;
 const next=!item.deliveryStatus?'delivered':item.deliveryStatus==='delivered'?'ready_to_return':item.deliveryStatus==='ready_to_return'?'return_completed':'';
 useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview);},[preview]);
 async function open(){
  setEditing('');setError('');setAnswer('');setReason('');dialog.current?.showModal();
  try{
   if(item.deliveryFileName&&(item.deliveryStatus!=='ready_to_return'||clientReturn)){const response=await client.get(path+'/delivery-file',{responseType:'blob'});setPreview(URL.createObjectURL(response.data));}
   if(role!=='admin'&&item.deliveryUpdatedAt){await client.post(path+'/delivery-read',{version:item.deliveryUpdatedAt});setSeen(item.deliveryUpdatedAt);onChanged();}
  }catch(reason){setError(documentError(reason));}
 }
 function close(){if(busy)return;dialog.current?.close();setEditing('');setPreview('');}
 async function submit(event:React.FormEvent){event.preventDefault();if(editing==='return_completed'&&answer!=='yes'){if(answer==='no')close();return;}if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{const body=new FormData();body.append('status',editing);body.append('message',editing==='return_completed'?'Equipment return completed.':text.trim());if(editing==='return_completed')body.append('confirmation','yes');if(file)body.append('file',file);const response=await api.post(path+'/delivery',body,{timeout:60000,headers:{'Content-Type':'multipart/form-data'}});const result=unwrapApiData<{emailWarning?:string}>(response.data);if(result.emailWarning){setError(result.emailWarning);onChanged();return;}setBusy(false);dialog.current?.close();setEditing('');setText('');setFile(null);onChanged();}
  catch(reason){setError(documentError(reason));}finally{lock.current=false;setBusy(false);}
 }
 async function confirm(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await client.post(path+'/delivery-confirm',{version:item.deliveryUpdatedAt});onChanged();}catch(reason){setError(documentError(reason));}finally{lock.current=false;setBusy(false);}}
 async function respond(value:'yes'|'no'){
 if(lock.current)return;lock.current=true;setBusy(true);setError('');
 try{const response=await contractorApi.post(path+'/return-response',{version:item.deliveryUpdatedAt,answer:value,reason:value==='no'?reason.trim():''});const result=unwrapApiData<{emailWarning?:string}>(response.data);if(result.emailWarning)setError(result.emailWarning);onChanged();}
 catch(error){setError(documentError(error));}finally{lock.current=false;setBusy(false);}
 }
 return <div className="equipment-delivery-actions">
  {item.deliveryStatus?<button type="button" className={'equipment-status equipment-delivery-status'+(unread?' equipment-delivery-pulse':'')} onClick={()=>void open()}>{labels[shownStatus||'']}</button>:<span className={'equipment-status '+item.status}>{item.status==='approved'?'Client approved':item.status==='rejected'?(role==='contractor'?'Admin will contact you':'Client rejected'):'Awaiting client review'}</span>}
  {unread&&<span className="equipment-delivery-hint">&#8593; Click to view update</span>}
  {role==='admin'&&next&&item.status!=='pending'&&<details className="equipment-status-menu"><summary aria-label="Update equipment status" title="Update equipment status"><span aria-hidden="true">&#9662;</span></summary><div className="equipment-status-options">{Object.entries(labels).map(([value,label])=><button key={value} type="button" disabled={value!==next} onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');setEditing(value);setAnswer('');setText('');setFile(null);setError('');dialog.current?.showModal();}}>{label}</button>)}</div></details>}
  <dialog ref={dialog} className="equipment-dialog" aria-label="Equipment delivery update" onCancel={event=>{event.preventDefault();close();}}>
   <header><h2>{editing?labels[editing]:labels[shownStatus||'']}</h2><button type="button" disabled={busy} onClick={close}>Close</button></header><p>{item.projectName}</p>
   {editing==='return_completed'?<form onSubmit={event=>void submit(event)}><p>Has the equipment been returned and received?</p><div className="equipment-return-options"><label><input type="radio" name={'return-completion-'+item._id} value="yes" checked={answer==='yes'} disabled={busy} onChange={()=>setAnswer('yes')}/> Yes</label><label><input type="radio" name={'return-completion-'+item._id} value="no" checked={answer==='no'} disabled={busy} onChange={()=>setAnswer('no')}/> No</label></div><footer><button type="submit" className="equipment-primary" disabled={busy||!answer}>{busy?'Submitting...':'Submit'}</button></footer></form>:editing?<form onSubmit={event=>void submit(event)}><label>Message<textarea required maxLength={5000} value={text} disabled={busy} onChange={event=>setText(event.target.value)} placeholder="Add delivery or return details..."/></label>{editing!=='ready_to_return'&&<><label>{editing==='delivered'?'Delivery proof':'Attachment (optional)'}<input key={editing} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" required={editing==='delivered'} disabled={busy} onChange={event=>setFile(event.target.files?.[0]||null)}/></label><p>PDF, PNG, JPEG or WebP. Maximum 2 MB.</p></>}<footer><button type="submit" className="equipment-primary" disabled={busy||!text.trim()||(editing==='delivered'&&!file)}>{busy?'Sending...':'Submit'}</button></footer></form>:<><p className="equipment-delivery-message">{shownMessage}</p>{preview&&(item.deliveryMimeType?.startsWith('image/')?<img className="equipment-delivery-preview" src={preview} alt="Equipment delivery proof"/>:<iframe className="equipment-delivery-preview" src={preview} title="Equipment delivery document"/>)}{preview&&<p><a href={preview} download={item.deliveryFileName}>Download {item.deliveryFileName}</a></p>}{item.deliveryStatus==='ready_to_return'&&!clientReturn&&<section className="equipment-return-response">{item.returnResponse?<><p className="equipment-success">{item.returnResponse==='yes'?(role==='contractor'?'Thanks for confirming!':'Contractor is ready to return the equipment.'):'Contractor is not ready to return the equipment.'}</p>{item.returnReason&&<p>{item.returnReason}</p>}</>:role==='contractor'?<><p>Are you ready to return this equipment?</p><div className="equipment-return-options"><button type="button" disabled={busy} onClick={()=>{setAnswer('yes');void respond('yes');}}>Yes</button><button type="button" disabled={busy} onClick={()=>setAnswer('no')}>No</button></div>{answer==='no'&&<form onSubmit={event=>{event.preventDefault();void respond('no');}}><label>Why are you not ready?<textarea required maxLength={2000} value={reason} disabled={busy} onChange={event=>setReason(event.target.value)}/></label><button type="submit" className="equipment-primary" disabled={busy||!reason.trim()}>{busy?'Submitting...':'Submit'}</button></form>}</>:<p>Waiting for the contractor response.</p>}</section>}{item.contractorDeliveryConfirmedAt&&item.deliveryStatus!=='ready_to_return'?<p className="equipment-success">Delivery confirmed by contractor.</p>:role==='contractor'&&item.deliveryStatus==='delivered'&&<button type="button" className="equipment-primary" disabled={busy||!preview} onClick={()=>void confirm()}>{busy?'Confirming...':'Confirm delivery'}</button>}</>}
   {error&&<p role="alert" className="equipment-error">{error}</p>}
  </dialog>
 </div>;
}
