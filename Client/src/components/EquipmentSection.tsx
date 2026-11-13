import EquipmentDelivery,{deliveryUnread,type DeliveryInfo} from './EquipmentDelivery';
import AttentionDot from './AttentionDot';
import {useCallback,useEffect,useRef,useState} from 'react';
import {api,unwrapApiData} from '../api/client';
import {contractorApi} from '../contractor/api/contractor.api';
import {getTeamMemberProjects,type DeliveryProject} from '../api/projects.api';
import {documentError} from '../api/documents.api';
import './equipment-section.css';

type Role='client'|'contractor'|'admin';
type Equipment=DeliveryInfo & {projectStatus?:string;_id:string;projectId:string;projectName:string;companyName:string;contractorName:string;contractorEmail:string;clientEmail?:string|null;clientPhone?:string|null;equipmentType:string;otherEquipment?:string;reason:string;specifications:string;details:string;status:'pending'|'approved'|'rejected';rejectionReason?:string|null;createdAt:string;reviewedAt?:string;adminReadAt?:string|null;adminEmailStatus?:string};
const statusLabel=(item:Equipment,role:Role)=>item.status==='approved'?'Client approved':item.status==='rejected'?(role==='contractor'?'Admin will contact you':'Client rejected'):'Awaiting client review';

export default function EquipmentSection({role,readOnly=false,onViewed,unreadIds=[]}:{role:Role;readOnly?:boolean;onViewed?:(id:string)=>void;unreadIds?:string[]}){
 const [items,setItems]=useState<Equipment[]>([]),[projects,setProjects]=useState<DeliveryProject[]>([]);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[loadError,setLoadError]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [selectedId,setSelectedId]=useState('');
 const [rejecting,setRejecting]=useState(false),[rejection,setRejection]=useState('');
 const [form,setForm]=useState({projectId:'',equipmentType:'Laptop',otherEquipment:'',reason:'',specifications:'',details:''});
 const [filter,setFilter]=useState('all');
 const [refreshing,setRefreshing]=useState(false);
 const mounted=useRef(false),loadVersion=useRef(0),manualRefresh=useRef(false);
 const requestDialog=useRef<HTMLDialogElement>(null),viewDialog=useRef<HTMLDialogElement>(null),lock=useRef(false);
 const selected=items.find(item=>item._id===selectedId);
 const client=role==='contractor'?contractorApi:api;
 const path=role==='contractor'?'/equipment-requests':'/'+(role==='client'?'company':'admin')+'/equipment-requests';
 const load=useCallback(async(showFeedback=false)=>{
  if(readOnly){setLoading(false);return;}
  // Polling must not replace the result or feedback of an explicit refresh.
  if(manualRefresh.current&&!showFeedback)return;
  if(showFeedback){if(manualRefresh.current)return;manualRefresh.current=true;setRefreshing(true);setMessage('');}
  const version=++loadVersion.current;
  try{
   const results=await Promise.allSettled([
    client.get(path,{timeout:20000,params:{_refresh:Date.now()}}),
    role==='contractor'?getTeamMemberProjects():Promise.resolve(null),
   ]);
   if(!mounted.current||version!==loadVersion.current)return;
   const [requests,projectList]=results;
   const failures:string[]=[];
   if(requests.status==='fulfilled')setItems(unwrapApiData(requests.value.data));
   else failures.push(documentError(requests.reason));
   if(projectList.status==='fulfilled'){
    if(projectList.value)setProjects(projectList.value.filter(p=>p.contractorAcceptedAt&&['active','payment_submitted'].includes(p.status)));
   }else failures.push('Unable to refresh available projects. '+documentError(projectList.reason));
   setLoadError(failures.join(' '));
   if(showFeedback&&!failures.length)setMessage('Equipment requests and statuses are up to date.');
  }catch(reason){
   if(mounted.current&&version===loadVersion.current)setLoadError(documentError(reason));
  }finally{
   if(showFeedback){manualRefresh.current=false;if(mounted.current)setRefreshing(false);}
   if(mounted.current&&version===loadVersion.current)setLoading(false);
  }
 },[client,path,role,readOnly]);
 useEffect(()=>{
  mounted.current=true;setLoading(true);void load();
  const refresh=()=>{void load();};
  const timer=window.setInterval(refresh,15000);window.addEventListener('focus',refresh);
  return()=>{mounted.current=false;loadVersion.current++;clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[load]);
 useEffect(()=>{if(!selected||viewDialog.current?.open||(role==='contractor'&&selected.deliveryStatus==='ready_to_return'))return;
 viewDialog.current?.showModal();onViewed?.(selected._id);
 if(role==='admin')void api.post(path+'/'+selected._id+'/read').then(()=>{setItems(rows=>rows.map(row=>row._id===selected._id?{...row,adminReadAt:new Date().toISOString()}:row));window.dispatchEvent(new Event('equipment-attention-changed'));}).catch(()=>{});
 },[selectedId,items.length]);
 function needsAttention(item:Equipment){return role==='admin'?(!item.adminReadAt||new Date(item.adminReadAt)<new Date(item.reviewedAt||item.createdAt)):role==='client'?item.status==='pending':unreadIds.includes(item._id);}

 function closeView(){
  if(busy)return;viewDialog.current?.close();setSelectedId('');setRejecting(false);setRejection('');setError('');
  if(role==='admin'){const params=new URLSearchParams(window.location.search);params.set('equipment','all');window.history.replaceState({},'','/admin/talent-requests?'+params.toString());}
 }
 async function request(event:React.FormEvent){
  event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{const response=unwrapApiData<{message:string;emailWarning?:string}>((await contractorApi.post(path,form,{timeout:60000})).data);requestDialog.current?.close();setMessage(response.message+(response.emailWarning?' '+response.emailWarning:''));setForm({projectId:'',equipmentType:'Laptop',otherEquipment:'',reason:'',specifications:'',details:''});await load();}
  catch(reason){setError(documentError(reason));}finally{lock.current=false;setBusy(false);}
 }
 async function review(decision:'approved'|'rejected'){
  if(!selected||lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{const response=unwrapApiData<{emailWarning?:string}>((await api.post(path+'/'+selected._id+'/review',{decision,reason:decision==='rejected'?rejection.trim():undefined},{timeout:60000})).data);setRejecting(false);setRejection('');setMessage('Decision saved. Dechub admin will handle the next steps.'+(response.emailWarning?' '+response.emailWarning:''));await load();}
  catch(reason){setError(documentError(reason));}finally{lock.current=false;setBusy(false);}
 }
 async function retry(item:Equipment){
  if(lock.current)return;lock.current=true;setBusy(true);setError('');
  try{await api.post(path+'/'+item._id+'/retry-email',{}, {timeout:60000});setMessage('Admin email sent.');await load();}
  catch(reason){setError(documentError(reason));}finally{lock.current=false;setBusy(false);}
 }
 const shown=items.filter(item=>filter==='all'||item.status===filter);
 return <section className={'equipment-section'+(role==='admin'?' equipment-admin':'')}>
  <div className="equipment-heading"><div><h2>{role==='contractor'?'My Equipment':role==='client'?'Equipment Management':'Equipment Operations'}</h2><p>Project equipment requests and client decisions.</p></div><div className="equipment-heading-actions"><button type="button" disabled={readOnly||loading||busy||refreshing} aria-busy={refreshing} onClick={()=>void load(true)}>{refreshing?'Refreshing...':'Refresh'}</button>{role==='contractor'&&<button type="button" className="equipment-primary" disabled={readOnly||busy} onClick={()=>{setError('');requestDialog.current?.showModal();}}>Request equipment</button>}</div></div>
  <p className="equipment-info">Dechub admin handles equipment management, supplier coordination, and follow-up. {role==='client'?'Approve or reject the requirement below; admin coordinates the next steps.':'Requests are reviewed by the project client before admin coordinates the next steps.'}</p>
  {loadError&&<p className="equipment-error" role="alert">{loadError}</p>}{error&&!viewDialog.current?.open&&!requestDialog.current?.open&&<p className="equipment-error" role="alert">{error}</p>}{message&&<p className="equipment-success" role="status">{message}</p>}
  <div className="equipment-filters"><label>Show<select value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">All requests ({items.length})</option><option value="pending">Awaiting client review ({items.filter(i=>i.status==='pending').length})</option><option value="approved">Client approved</option><option value="rejected">{role==='contractor'?'Admin follow-up':'Client rejected'}</option></select></label></div>
  {loading?<p>Loading equipment requests...</p>:!shown.length?<div className="equipment-empty">{readOnly?'Equipment requests are unavailable in preview mode.':'No equipment requests to display.'}</div>:<div className="equipment-grid">{shown.map(item=><article className={'equipment-card'+(deliveryUnread(item,role)?' equipment-card-updated':'')} key={item._id}><header><div className="equipment-project-heading"><h3>{item.projectName}{needsAttention(item)&&<AttentionDot label={role==='client'?'Approval needed':'New equipment update'}/>}</h3><span className={'equipment-project-status '+(item.projectStatus==='completed'?'completed':'in-progress')}>{item.projectStatus==='completed'?'Completed':'In progress'}</span></div><EquipmentDelivery item={item} role={role} onChanged={()=>{onViewed?.(item._id);void load();}}/></header>{needsAttention(item)&&<span className="equipment-update-label">{role==='client'?'Action needed':'New update'}</span>}<p><strong>{item.equipmentType==='Other'?(item.otherEquipment||'Other'):item.equipmentType}</strong></p><p>{role==='contractor'?item.companyName:item.contractorName+' - '+item.companyName}</p><p className="equipment-reason-preview">{item.reason}</p><small>Submitted {new Date(item.createdAt).toLocaleString()}</small><footer><button type="button" onClick={()=>{setError('');setRejecting(false);setSelectedId(item._id);}}>View request</button>{role==='client'&&item.status==='pending'&&<span className="equipment-needs-review">Your decision is needed</span>}{role==='admin'&&item.adminEmailStatus==='failed'&&<button type="button" disabled={busy} onClick={()=>void retry(item)}>Retry admin email</button>}</footer></article>)}</div>}
  <dialog ref={requestDialog} className="equipment-dialog" aria-labelledby="equipment-request-title" onCancel={event=>{if(busy)event.preventDefault();}}>
    <header><h2 id="equipment-request-title">Request equipment</h2><button type="button" disabled={busy} onClick={()=>requestDialog.current?.close()}>Close</button></header>
    <form onSubmit={event=>void request(event)}>
      <label>Project<select required disabled={busy} value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})}><option value="">Select project...</option>{projects.map(project=><option key={project._id} value={project._id}>{project.title}</option>)}</select></label>
      {!projects.length&&<p>You need an accepted contract for an open project to request equipment.</p>}
      <label>Equipment type<select disabled={busy} value={form.equipmentType} onChange={e=>setForm({...form,equipmentType:e.target.value,otherEquipment:''})}>{['Laptop','Monitor','Headset','Other'].map(type=><option key={type}>{type}</option>)}</select></label>
      {form.equipmentType==='Other'&&<label>Specify equipment<input type="text" required maxLength={200} disabled={busy} value={form.otherEquipment} onChange={e=>setForm({...form,otherEquipment:e.target.value})} placeholder="Enter the equipment you need"/></label>}
      <label>Why do you need this equipment?<textarea required maxLength={2000} disabled={busy} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Explain why the equipment is needed for this project."/></label>
      <label>Required specifications (optional)<textarea maxLength={3000} disabled={busy} value={form.specifications} onChange={e=>setForm({...form,specifications:e.target.value})} placeholder="Processor, RAM, storage, operating system, or other requirements."/></label>
      <label>Additional details (optional)<textarea maxLength={5000} disabled={busy} value={form.details} onChange={e=>setForm({...form,details:e.target.value})}/></label>
      {error&&<p className="equipment-error" role="alert">{error}</p>}
      <footer><button type="button" disabled={busy} onClick={()=>requestDialog.current?.close()}>Cancel</button><button className="equipment-primary" disabled={busy||!form.projectId||!form.reason.trim()||(form.equipmentType==='Other'&&!form.otherEquipment.trim())}>{busy?'Sending...':'Send request'}</button></footer>
    </form>
  </dialog>
  <dialog data-update-resource={selected?'equipment:'+selected._id:undefined} ref={viewDialog} className="equipment-dialog" aria-labelledby="equipment-detail-title" onCancel={event=>{event.preventDefault();closeView();}}>
   <header><h2 id="equipment-detail-title">Equipment request</h2><button type="button" disabled={busy} onClick={closeView}>Close</button></header>
   {selected&&<><span className={'equipment-status '+selected.status}>{statusLabel(selected,role)}</span><dl>{[['Project',selected.projectName],['Project status',selected.projectStatus==='completed'?'Completed':'In progress'],['Contractor',selected.contractorName],['Company',selected.companyName],...(role==='admin'?[['Client email',selected.clientEmail||'Not provided'],['Client contact number',selected.clientPhone||'Not provided']]:[]),['Equipment',selected.equipmentType==='Other'?(selected.otherEquipment||'Other'):selected.equipmentType],['Reason',selected.reason],['Specifications',selected.specifications||'Not specified'],['Additional details',selected.details||'Not provided'],...(role!=='contractor'?[['Contractor email',selected.contractorEmail]]:[]),...(selected.rejectionReason?[['Rejection reason',selected.rejectionReason]]:[])].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{label==='Client email'&&selected.clientEmail?<a className="equipment-contact-link" href={'mailto:'+selected.clientEmail}>{value}</a>:label==='Client contact number'&&selected.clientPhone?<a className="equipment-contact-link" href={'tel:'+selected.clientPhone.replace(/[^+0-9]/g,'')}>{value}</a>:value}</dd></div>)}</dl>
   <p>Dechub admin will coordinate equipment management and contact the relevant people about next steps.</p>
   {role==='client'&&selected.status==='pending'&&<>{rejecting&&<label>Reason for rejection<textarea required maxLength={2000} disabled={busy} value={rejection} onChange={e=>setRejection(e.target.value)} placeholder="Explain why this equipment request is being rejected."/></label>}<footer>{!rejecting?<><button type="button" disabled={busy} onClick={()=>setRejecting(true)}>Reject</button><button type="button" className="equipment-primary" disabled={busy} onClick={()=>void review('approved')}>{busy?'Saving...':'Approve request'}</button></>:<><button type="button" disabled={busy} onClick={()=>setRejecting(false)}>Cancel rejection</button><button type="button" className="equipment-danger" disabled={busy||!rejection.trim()} onClick={()=>void review('rejected')}>{busy?'Saving...':'Submit rejection'}</button></>}</footer></>}
   {role==='admin'&&selected.adminEmailStatus==='failed'&&<button type="button" disabled={busy} onClick={()=>void retry(selected)}>Retry admin email</button>}
   {error&&<p className="equipment-error" role="alert">{error}</p>}{message&&<p className="equipment-success" role="status">{message}</p>}
   </>}
  </dialog>
 </section>;
}
