import {MonthlyInvoice} from '../models/MonthlyInvoice';
import {Company} from '../models/Company';
import {CompanyAuth} from '../models/CompanyAuth';
import {downloadInvoiceDocument} from './invoiceStorage.service';
import {sendEmail} from '../utils/email';
import {env} from '../config/env';
import {escapeMessageHtml as esc} from './messageAlerts.service';
import {logger} from '../utils/logger';
let running=false;
export async function processMonthlyInvoiceEmails(){
 if(running)return;running=true;
 try{for(let count=0;count<5;count++){
 const now=new Date();const invoice=await MonthlyInvoice.findOneAndUpdate({status:{$in:['sent','paid']},emailStatus:{$in:['pending','failed']},emailNextAt:{$ne:null,$lte:now},$or:[{emailLeaseUntil:null},{emailLeaseUntil:{$lt:now}}]},{$set:{emailLeaseUntil:new Date(Date.now()+5*60000)}},{new:true});
 if(!invoice)break;
 try{
 const company=await Company.findById(invoice.companyId);const owner=company?await CompanyAuth.findById(company.ownerId):null;const recipient=company?.billingEmail||owner?.email;
 if(!recipient||!invoice.document)throw Error('Billing recipient or invoice document is unavailable.');
 const reminder=invoice.emailAction==='reminder';const subject=(reminder?'Payment reminder: ':'Your monthly invoice: ')+invoice.invoiceNumber;
 await sendEmail(recipient,subject,'<h2>'+esc(subject)+'</h2><p>Hello '+esc(invoice.companyName)+',</p><p>'+esc(invoice.projectName)+' — billing month '+esc(invoice.billingMonth)+'</p><p><strong>Total:</strong> '+esc(invoice.currency)+' '+invoice.amount.toFixed(2)+'<br/><strong>Due:</strong> '+(invoice.dueDate?esc(invoice.dueDate.toLocaleDateString('en-GB',{timeZone:'Asia/Kolkata'})):'As stated in the invoice')+'</p><p>'+esc(invoice.message).replace(/\n/g,'<br/>')+'</p><p>Please review the attached invoice.</p>'+((invoice.stripeHostedInvoiceUrl&&invoice.status==='sent'&&invoice.stripeStatus==='open')?'<p><a href="'+esc(invoice.stripeHostedInvoiceUrl)+'">Pay invoice securely with Stripe</a></p>':'')+'<p><a href="'+esc(env.CLIENT_URL.replace(/\/$/,'')+'/dashboard?tab=invoices')+'">View invoice in Bridge</a></p><p>Thank you,<br/>The Bridge team</p>',{attachments:[{filename:invoice.document.fileName,content:await downloadInvoiceDocument(invoice.document),contentType:invoice.document.mimeType||'application/pdf'}]});
 await MonthlyInvoice.updateOne({_id:invoice._id,emailVersion:invoice.emailVersion},{$set:{emailStatus:'sent',emailNextAt:null,emailLeaseUntil:null},$push:{history:{action:reminder?'reminder_emailed':'invoice_emailed',at:new Date(),by:'system',note:'Delivered to billing email'}}});
 }catch(error){const attempts=invoice.emailAttempts+1;await MonthlyInvoice.updateOne({_id:invoice._id,emailVersion:invoice.emailVersion},{$set:{emailStatus:'failed',emailAttempts:attempts,emailLeaseUntil:null,emailNextAt:attempts<5?new Date(Date.now()+Math.min(attempts*60000,10*60000)):null},$push:{history:{action:'email_failed',at:new Date(),by:'system',note:'Email delivery failed; retry available.'}}});logger.error('Monthly invoice email failed',error);}
 }}finally{running=false;}
}
export function startMonthlyInvoiceEmails(){void processMonthlyInvoiceEmails().catch(error=>logger.error('Invoice email queue failed',error));const timer=setInterval(()=>void processMonthlyInvoiceEmails().catch(error=>logger.error('Invoice email queue failed',error)),30000);timer.unref();}
