import {ITAccessRequest} from '../models/ITAccessRequest';
import {Project} from '../models/Project';
import {Worker} from '../models/Worker';
import {Company} from '../models/Company';
import {sendEmail} from '../utils/email';
import {env} from '../config/env';
import {escapeMessageHtml as esc} from './messageAlerts.service';
import {logger} from '../utils/logger';
let running=false;
const label=(value:string)=>value.replace(/_/g,' ');
export async function processITAccessAdminEmails(){
 if(running)return;running=true;
 try{for(let count=0;count<10;count++){
  const now=new Date();
  // The future due time acts as a lease. Return the old document to identify
  // precisely which positional entry was claimed without racing new replies.
  const request=await ITAccessRequest.findOneAndUpdate({entries:{$elemMatch:{adminEmailNextAt:{$ne:null,$lte:now},adminEmailAttempts:{$lt:5}}}},{$set:{'entries.$.adminEmailNextAt':new Date(Date.now()+300000)}},{new:false});
  if(!request)break;
  const entry=request.entries.find(e=>e.adminEmailNextAt&&e.adminEmailNextAt<=now&&(e.adminEmailAttempts||0)<5);if(!entry)continue;
  const filter={_id:request._id,'entries._id':entry._id};
  try{
   const recipients=[...new Set(env.DECHUB_ADMIN_EMAILS.split(',').map(v=>v.trim().toLowerCase()).filter(Boolean))];
   if(!recipients.length)throw Error('Admin email recipients are not configured.');
   const [project,company,worker]=await Promise.all([Project.findById(request.projectId),Company.findById(request.companyId),Worker.findById(request.workerId)]);
   const event=entry.sender==='client'?(entry.status?'Client replied and updated status':'Client replied'):'Contractor replied';
   const status=entry.status||entry.previousStatus||'pending';
   const rows=[['Company',company?.companyName||'Company'],['Project',project?.title||String(request.projectId)],['Contractor',[worker?.firstName,worker?.lastName].filter(Boolean).join(' ')||'Contractor'],['Contractor email',worker?.email||'Not available'],['Event',event],['Sent by',entry.name],['Status',label(status)],...(entry.status?[['Previous status',label(entry.previousStatus||'pending')]]:[]),['Time (India)',entry.createdAt!.toLocaleString('en-GB',{timeZone:'Asia/Kolkata'})],['Request reference',String(request._id)]];
   const html='<h2>IT access update</h2><table>'+rows.map(([key,value])=>'<tr><th style="text-align:left;padding:6px 16px 6px 0">'+esc(key)+'</th><td>'+esc(value)+'</td></tr>').join('')+'</table><h3>Original contractor request</h3><p style="white-space:pre-wrap">'+esc(request.message)+'</p><h3>'+esc(event)+'</h3><p style="white-space:pre-wrap">'+esc(entry.text)+'</p><p>This update was saved in the project’s IT access conversation.</p>';
   for(const recipient of recipients){
    if(entry.adminEmailDelivered.includes(recipient))continue;
    await sendEmail(recipient,'IT access: '+event+' | '+(project?.title||'Project'),html);
    await ITAccessRequest.updateOne(filter,{$addToSet:{'entries.$.adminEmailDelivered':recipient}});
   }
   await ITAccessRequest.updateOne(filter,{$set:{'entries.$.adminEmailNextAt':null}});
  }catch(error){const attempts=(entry.adminEmailAttempts||0)+1;await ITAccessRequest.updateOne(filter,{$set:{'entries.$.adminEmailAttempts':attempts,'entries.$.adminEmailNextAt':attempts<5?new Date(Date.now()+attempts*60000):null}});logger.error('IT access admin email failed; retry recorded',error);}
 }}finally{running=false;}
}
export function startITAccessAdminEmails(){void processITAccessAdminEmails().catch(error=>logger.error('IT access email queue failed',error));const timer=setInterval(()=>void processITAccessAdminEmails().catch(error=>logger.error('IT access email queue failed',error)),15000);timer.unref();}
