import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { Worker } from '../models/Worker';
import { marketplaceProfileCompletion } from './marketplaceEligibility.service';
import { sendEmail } from '../utils/email';
import { escapeMessageHtml } from './messageAlerts.service';
import { env } from '../config/env';
import { logger } from '../utils/logger';

type AccountKind = 'client' | 'contractor';
async function deliver(kind:AccountKind,id:string,event:'login'|'profile completed') {
  const client=kind==='client'?await CompanyAuth.findById(id):null;
  const worker=kind==='contractor'?await Worker.findById(id):null;
  if(!client&&!worker)return;
  const company=client?await Company.findOne({ownerId:client._id}):worker?.companyId?await Company.findById(worker.companyId):null;
  const person=client||worker!;
  const name=[person.firstName,person.lastName].filter(Boolean).join(' ');
  const heading=kind==='client'?'Client':'Contractor';
  const subject=`${heading} ${event}: ${kind==='client'?(company?.companyName||name):name}`;
  const time=new Intl.DateTimeFormat('en-IN',{dateStyle:'medium',timeStyle:'long',timeZone:'Asia/Kolkata'}).format(new Date());
  const rows:Array<[string,unknown]>=[['Event',event],['Name',name],['Email',person.email],['Phone',person.phone],['Time (India)',time],['Company',company?.companyName],['IT access management',company?.itManagement||'Not specified'],['Company country',company?.companyCountry],['Company type',company?.companyType],['Company size',company?.companySize],['Industry',company?.companyIndustry],['Website',company?.companyWebsite],['Business address',[company?.addressLine1,company?.addressCity,company?.addressZip].filter(Boolean).join(', ')],['Registration / Tax ID',company?.taxId],['Billing email',company?.billingEmail],['Company verification',company?.kybStatus]];
  if(worker)rows.push(['Role',worker.roleTitle],['Country',worker.country],['KYC status',worker.kycStatus],['Profile complete',marketplaceProfileCompletion(worker).complete?'Yes':'No']);
  const html='<h2>'+escapeMessageHtml(subject)+'</h2><table style="border-collapse:collapse;width:100%">'+rows.map(([key,value])=>'<tr><th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">'+escapeMessageHtml(key)+'</th><td style="padding:8px;border-bottom:1px solid #e2e8f0">'+escapeMessageHtml(String(value||'Not provided'))+'</td></tr>').join('')+'</table><p><a href="'+escapeMessageHtml(env.CLIENT_URL.replace(/\/$/,'')+'/admin/talent-requests')+'">Open Bridge admin dashboard</a></p>';
  const recipients=[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(value=>value.trim().toLowerCase()).filter(Boolean))];
  if(!recipients.length)throw new Error('No admin email recipient configured');
  await Promise.all(recipients.map(to=>sendEmail(to,subject,html)));
}

export function notifyAdminLogin(kind:AccountKind,id:string):void {
  void deliver(kind,id,'login').catch(error=>logger.error('Admin login email failed',error));
}

export function notifyAdminProfileCompletion(kind:AccountKind,id:string):void {
  void (async()=>{
    const model=kind==='client'?Company:Worker;
    const record=kind==='client'?await Company.findOne({ownerId:id}):await Worker.findById(id);
    if(!record)return;
    const complete=kind==='client'?Boolean((record as any).signupCompleted):marketplaceProfileCompletion(record as any).complete;
    if(!complete)return;
    const claim=new Date();
    const claimed=await (model as any).findOneAndUpdate({_id:record._id,adminProfileNotifiedAt:null},{$set:{adminProfileNotifiedAt:claim}},{new:true});
    if(!claimed)return;
    try { await deliver(kind,id,'profile completed'); }
    catch(error){await (model as any).updateOne({_id:record._id,adminProfileNotifiedAt:claim},{$set:{adminProfileNotifiedAt:null}});throw error;}
  })().catch(error=>logger.error('Admin profile completion email failed',error));
}
