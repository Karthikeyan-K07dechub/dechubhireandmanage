import Stripe from 'stripe';
import {logger} from '../utils/logger';
import {Request,Response,NextFunction} from 'express';
import {MonthlyInvoice} from '../models/MonthlyInvoice';
import {CompanyAuth} from '../models/CompanyAuth';
import {env} from '../config/env';
import {stripeClient,trustedInvoiceUrl} from './stripeInvoices.service';
import {AppError} from '../utils/response';

// Always retrieve current state; webhook delivery order is not guaranteed.
export async function verifyMonthlyStripe(id:string, company:any, amount:number, currency:string, number:string){
 const remote=await stripeClient().invoices.retrieve(id);
 const owner=await CompanyAuth.findById(company.ownerId);
 const emails=[company.billingEmail,owner?.email].filter(Boolean).map(v=>v.trim().toLowerCase());
 if(!remote.customer_email||!emails.includes(remote.customer_email.trim().toLowerCase()))throw new AppError('Stripe customer email must match the company billing or account email.',422,'STRIPE_CUSTOMER_MISMATCH');
 if(remote.currency.toUpperCase()!==currency||remote.total!==Math.round(amount*100)||remote.number!==number)throw new AppError('Invoice number, total and currency must match the Stripe invoice exactly.',422,'STRIPE_INVOICE_MISMATCH');
 if(remote.status!=='open'||!remote.hosted_invoice_url)throw new AppError('Select a finalized, unpaid Stripe invoice.',422,'STRIPE_INVOICE_NOT_OPEN');
 return {stripeInvoiceId:id,stripeHostedInvoiceUrl:trustedInvoiceUrl(remote.hosted_invoice_url),stripeStatus:remote.status,stripeLiveMode:remote.livemode};
}
export async function synchronizeMonthlyStripe(id:string){
 const local=await MonthlyInvoice.findOne({stripeInvoiceId:id,sentAt:{$ne:null}});
 if(!local)return;
 const remote=await stripeClient().invoices.retrieve(id);
 if(remote.livemode!==local.stripeLiveMode||remote.currency.toUpperCase()!==local.currency||remote.total!==Math.round(local.amount*100))throw new Error('Linked Stripe invoice changed; admin review required.');
 const paid=remote.status==='paid';
 const set:any={stripeStatus:remote.status,stripeHostedInvoiceUrl:trustedInvoiceUrl(remote.hosted_invoice_url)||null};
 if(paid){set.status='paid';set.paidAt=new Date((remote.status_transitions.paid_at||Math.floor(Date.now()/1000))*1000);set.paymentReference=id;}
 else if(remote.status==='void'||remote.status==='uncollectible'){set.status='void';set.emailNextAt=null;}
 // Optimistic concurrency also prevents overlapping deliveries from queuing duplicate receipts.
 const changed=remote.status!==local.stripeStatus||paid&&local.status!=='paid';
 if(!changed)return;
 if(paid&&local.status!=='paid'){set.receiptPending=true;set.receiptNextAt=new Date();}
 const result=await MonthlyInvoice.updateOne({_id:local._id,__v:local.__v},{$set:set,$inc:{__v:1},$push:{history:{action:'stripe_'+remote.status,at:new Date(),by:'Stripe',note:id}}});
 if(!result.matchedCount)throw new Error('Invoice changed during Stripe synchronization; retry event.');
}
export async function monthlyStripeWebhook(req:Request,res:Response,next:NextFunction){
 if(!env.STRIPE_WEBHOOK_SECRET){res.status(503).json({error:'Stripe webhook is not configured'});return;}
 let event:Stripe.Event;
 try{event=stripeClient().webhooks.constructEvent(req.body,req.get('stripe-signature')||'',env.STRIPE_WEBHOOK_SECRET);}catch{res.status(400).json({error:'Invalid Stripe signature'});return;}
 try{if(['invoice.paid','invoice.payment_failed','invoice.voided','invoice.marked_uncollectible','invoice.updated'].includes(event.type))await synchronizeMonthlyStripe((event.data.object as Stripe.Invoice).id);res.json({received:true});}catch(error){next(error);}
}

let reconciling=false;
export function startStripeReconciliation(){const run=async()=>{if(reconciling||!env.STRIPE_SECRET_KEY)return;reconciling=true;try{const invoices=await MonthlyInvoice.find({status:'sent',stripeInvoiceId:{$exists:true}}).sort({updatedAt:1}).limit(50);for(const invoice of invoices){try{await synchronizeMonthlyStripe(invoice.stripeInvoiceId!);}catch{logger.warn('Stripe invoice reconciliation requires retry or admin review: '+invoice._id);}await MonthlyInvoice.updateOne({_id:invoice._id},{$set:{updatedAt:new Date()}});}}catch{ /* Webhooks remain primary; retry transient API failures next interval. */ }finally{reconciling=false;}};void run();const timer=setInterval(()=>void run(),60000);timer.unref();}
