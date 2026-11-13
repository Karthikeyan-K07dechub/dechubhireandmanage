import {Invoice} from '../models/Invoice';
import {EmailJob} from '../models/EmailJob';
import {EquipmentRequest} from '../models/EquipmentRequest';
import {ITAccessRequest} from '../models/ITAccessRequest';
import {sendEmail} from '../utils/email';
import {logger} from '../utils/logger';
export type EmailTracking={kind:'equipment_admin'|'equipment_return'|'equipment_response'|'it_request'|'invoice_admin'|'invoice_client';recordId:string;expectedStatus?:string;version?:Date};
type Options={expiresAt?:Date;priority?:number;includeLogo?:boolean;attachments?:{filename:string;content:Buffer;contentType?:string}[];tracking?:EmailTracking};
export async function queueEmail(to:string|string[],subject:string,html:string,options:Options={}){
 const recipients=[...new Set((Array.isArray(to)?to:[to]).map(v=>v.trim().toLowerCase()).filter(Boolean))];
 if(!recipients.length)throw Error('Email recipient is unavailable.');
 if((options.attachments||[]).reduce((n,a)=>n+a.content.length,0)>12*1024*1024)throw Error('Email attachments exceed the queue size limit.');
 await EmailJob.create({to:recipients,subject,html,expiresAt:options.expiresAt,priority:options.priority||0,includeLogo:options.includeLogo!==false,attachments:options.attachments||[],tracking:options.tracking});
 // Return after durable enqueue, never after SMTP delivery.
 setImmediate(()=>void processEmailQueue().catch(error=>logger.error('Email queue failed',error)));
}
async function track(job:any,sent:boolean){
 const t=job.tracking;if(!t?.recordId)return;const filter:any={_id:t.recordId};let set:any;
 if(t.kind==='equipment_admin'){filter.status=t.expectedStatus;set={adminEmailStatus:sent?'sent':'failed',...(sent?{adminEmailSentAt:new Date()}:{})};}
 else if(t.kind==='equipment_return'){filter.deliveryUpdatedAt=t.version;set={returnEmailStatus:sent?'sent':'failed'};}
 else if(t.kind==='equipment_response'){filter.returnRespondedAt=t.version;set={returnResponseEmailStatus:sent?'sent':'failed'};}
 else if(t.kind==='it_request'){set={deliveryStatus:sent?'sent':'failed',...(sent?{emailedAt:new Date()}:{})};}
 if(t.kind==='invoice_admin'||t.kind==='invoice_client'){const prefix=t.kind==='invoice_admin'?'admin':'client';await Invoice.updateOne(filter,{$set:{[prefix+'EmailSentAt']:sent?new Date():null,[prefix+'EmailError']:sent?null:'Email delivery failed; automatic retry scheduled.'}});return;}
 if(set){if(t.kind==='it_request')await ITAccessRequest.updateOne(filter,{$set:set},{timestamps:false});else await EquipmentRequest.updateOne(filter,{$set:set},{timestamps:false});}
}
let running=false;
async function deliverOne(){
 const now=new Date();const job=await EmailJob.findOneAndUpdate({status:{$in:['queued','failed','processing']},attempts:{$lt:5},nextAt:{$lte:now},expiresAt:{$gt:now},$or:[{leaseUntil:null},{leaseUntil:{$lt:now}}]},{$set:{status:'processing',leaseUntil:new Date(Date.now()+300000)}},{new:true,sort:{priority:-1,createdAt:1}});
 if(!job)return false;
 try{
  for(const to of job.to){if(job.delivered.includes(to))continue;await sendEmail(to,job.subject,job.html,{includeLogo:job.includeLogo,attachments:job.attachments.map(a=>({filename:a.filename!,content:Buffer.from(a.content!),contentType:a.contentType||'application/octet-stream'}))});await EmailJob.updateOne({_id:job._id},{$addToSet:{delivered:to},$set:{leaseUntil:new Date(Date.now()+300000)}});}
  await track(job,true);
  await EmailJob.updateOne({_id:job._id},{$set:{status:'sent',leaseUntil:null,html:'',attachments:[]}});
 }catch(error){const attempts=job.attempts+1;await EmailJob.updateOne({_id:job._id},{$set:{status:'failed',attempts,leaseUntil:null,nextAt:new Date(Date.now()+Math.min(30000*2**attempts,600000))}});await track(job,false);logger.error('Email delivery failed; retry saved',error);}
 return true;
}
export async function processEmailQueue(){if(running)return;running=true;try{for(let batch=0;batch<5;batch++){const delivered=await Promise.all([deliverOne(),deliverOne(),deliverOne()]);if(!delivered.some(Boolean))break;}}finally{running=false;}}
export function startEmailQueue(){void EmailJob.createIndexes().catch(error=>logger.error('Email queue indexes failed',error));const run=()=>void processEmailQueue().catch(error=>logger.error('Email queue failed',error));run();const timer=setInterval(run,1000);timer.unref();}
