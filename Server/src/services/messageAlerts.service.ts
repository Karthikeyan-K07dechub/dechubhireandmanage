import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { Worker } from '../models/Worker';
import { CompanyNotification } from '../models/CompanyNotification';
import { ContractorNotification } from '../models/ContractorNotification';
import { sendEmail } from '../utils/email';
import { env } from '../config/env';
import { logger } from '../utils/logger';
export const escapeMessageHtml = (s:string) => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
interface Alert {companyId:string;projectId:string;projectTitle:string;senderRole:'client'|'contractor';senderId:string;body:string;fileName?:string;taskId?:string;taskTitle?:string;recipientWorkerIds?:string[];submission?:boolean;}
export async function notifyMessageRecipients(input:Alert){
 const company=await Company.findById(input.companyId);const account=company?await CompanyAuth.findById(company.ownerId):null;
 const sender=input.senderRole==='contractor'?await Worker.findById(input.senderId).select('firstName lastName'):await CompanyAuth.findById(input.senderId);
 const senderName=sender?[sender.firstName,sender.lastName].filter(Boolean).join(' '):input.senderRole;
 const title=(input.submission?'Work submitted by ':'Message from ')+input.senderRole+': '+senderName;
 const preview=(input.body.trim()||('Attachment: '+(input.fileName||'file'))).slice(0,240);
 const message=(input.taskTitle?input.taskTitle+' - ':'')+preview;
 const workers=input.recipientWorkerIds?.length?await Worker.find({_id:{$in:input.recipientWorkerIds}}).select('email'):[];
 const recipients=input.recipientWorkerIds?.length?workers.map(worker=>({email:worker.email,workerId:String(worker._id)})):[{email:account?.email,workerId:null}];
 await Promise.all(recipients.map(async recipient=>{
  const path=recipient.workerId?'/contractor/dashboard?tab=projects&project='+input.projectId:'/dashboard?tab=projects&project='+input.projectId;
  const href=path+(input.taskId?'&task='+input.taskId:recipient.workerId?'&chatPeer='+(input.senderRole==='client'?'client':input.senderId):'&chatWorker='+input.senderId);
  if(recipient.workerId)await ContractorNotification.create({workerId:recipient.workerId,type:'general',title:title.slice(0,140),message:message.slice(0,1200),actionUrl:href});
  else await CompanyNotification.create({companyId:input.companyId,projectId:input.projectId,type:'general',title:title.slice(0,140),message:message.slice(0,1200),actionUrl:href});
  if(recipient.email)void sendEmail(recipient.email,title,'<h2>'+escapeMessageHtml(title)+'</h2><p>Project: '+escapeMessageHtml(input.projectTitle)+'</p>'+(input.taskTitle?'<p>Task: '+escapeMessageHtml(input.taskTitle)+'</p>':'')+'<p>'+escapeMessageHtml(preview)+'</p>'+(input.fileName?'<p>Attachment: '+escapeMessageHtml(input.fileName)+'</p>':'')+'<p><a href="'+escapeMessageHtml(env.CLIENT_URL.replace(/\/$/,'')+href)+'">Open conversation</a></p>').catch(error=>logger.error('Message email delivery failed',error));
 }));
}
