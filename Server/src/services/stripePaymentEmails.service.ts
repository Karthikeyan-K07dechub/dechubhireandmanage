import {MonthlyInvoice} from '../models/MonthlyInvoice';
import {Company} from '../models/Company';
import {CompanyAuth} from '../models/CompanyAuth';
import {env} from '../config/env';
import {sendEmail} from '../utils/email';
import {escapeMessageHtml as esc} from './messageAlerts.service';
import {logger} from '../utils/logger';
let running=false;
export async function processStripePaymentEmails(){
 if(running)return;running=true;
 try{for(let i=0;i<5;i++){
  const invoice=await MonthlyInvoice.findOneAndUpdate({receiptPending:true,receiptNextAt:{$lte:new Date()}},{$set:{receiptNextAt:new Date(Date.now()+300000)}},{new:true});
  if(!invoice)break;
  try{
   const company=await Company.findById(invoice.companyId);const owner=company?await CompanyAuth.findById(company.ownerId):null;
   const client=company?.billingEmail||owner?.email;if(!client)throw Error('Invoice billing recipient missing');
   const recipients=[...new Set([client,...env.DECHUB_ADMIN_EMAILS.split(',')].map(v=>v.trim().toLowerCase()).filter(Boolean))];
   for(const recipient of recipients){
    if(invoice.receiptDelivered.includes(recipient))continue;
    await sendEmail(recipient,'Payment received | '+invoice.invoiceNumber,'<h2>Payment confirmed</h2><p>Thank you. Payment for invoice '+esc(invoice.invoiceNumber)+' has been confirmed by Stripe.</p><p>Company: '+esc(invoice.companyName)+'<br/>Project: '+esc(invoice.projectName)+'<br/>Billing month: '+esc(invoice.billingMonth)+'<br/>Invoice total: '+esc(invoice.currency)+' '+invoice.amount.toFixed(2)+'<br/>Reference: '+esc(invoice.stripeInvoiceId||'')+'</p>');
    await MonthlyInvoice.updateOne({_id:invoice._id},{$addToSet:{receiptDelivered:recipient}});
   }
   await MonthlyInvoice.updateOne({_id:invoice._id},{$set:{receiptPending:false,receiptNextAt:null},$push:{history:{action:'payment_confirmation_emailed',at:new Date(),by:'system',note:'Client and configured admin recipients'}}});
  }catch(error){logger.error('Stripe receipt delivery failed; retry scheduled',error);}
 }}finally{running=false;}
}
export function startStripePaymentEmails(){void processStripePaymentEmails().catch(error=>logger.error('Stripe receipts failed',error));const timer=setInterval(()=>void processStripePaymentEmails().catch(error=>logger.error('Stripe receipts failed',error)),15000);timer.unref();}
