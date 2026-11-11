import Stripe from 'stripe';
import {env} from '../config/env';
import {Invoice,IInvoice} from '../models/Invoice';
import {Company} from '../models/Company';
import {CompanyAuth} from '../models/CompanyAuth';
import {AppError} from '../utils/response';
export function stripeClient(){if(!env.STRIPE_SECRET_KEY)throw new AppError('Stripe is not configured. Add STRIPE_SECRET_KEY to the backend environment.',503,'STRIPE_NOT_CONFIGURED');return new Stripe(env.STRIPE_SECRET_KEY,{apiVersion:'2023-10-16',timeout:15000,maxNetworkRetries:1});}
export function trustedInvoiceUrl(value:string|null|undefined){if(!value)return undefined;const url=new URL(value);if(url.protocol!=='https:'||url.hostname!=='invoice.stripe.com'||url.username||url.password)throw new AppError('Stripe returned an invalid invoice payment URL.',502,'INVALID_STRIPE_URL');return url.toString();}
export function stripeInvoiceFields(invoice:Stripe.Invoice){
 if(!['aed','usd','inr'].includes(invoice.currency))throw new AppError('This invoice currency is not supported. Use AED, USD, or INR.',422,'STRIPE_CURRENCY_UNSUPPORTED');
 return {stripeInvoiceId:invoice.id,stripeInvoiceNumber:invoice.number||invoice.id,stripeHostedInvoiceUrl:trustedInvoiceUrl(invoice.hosted_invoice_url),stripeStatus:invoice.status||'draft',stripeAmountPaid:invoice.amount_paid/100,stripeAmountRemaining:invoice.amount_remaining/100,stripePaidAt:invoice.status==='paid'&&invoice.status_transitions.paid_at?new Date(invoice.status_transitions.paid_at*1000):null,stripeDueAt:invoice.due_date?new Date(invoice.due_date*1000):null};
}
let indexes:Promise<unknown>|undefined;
export function ensureStripeInvoiceIndex(){return indexes ||= Invoice.collection.createIndex({stripeInvoiceId:1},{unique:true,sparse:true}).catch(error=>{indexes=undefined;throw error;});}
export async function linkStripeInvoice(original:IInvoice,id:string){
 const remote=await stripeClient().invoices.retrieve(id);
 if(remote.status!=='open'||!remote.hosted_invoice_url)throw new AppError('Use a finalized, unpaid Stripe invoice with an open payment page.',422,'STRIPE_INVOICE_NOT_OPEN');
 if(remote.currency.toUpperCase()!==original.currency.toUpperCase())throw new AppError('Stripe invoice currency must match the selected Bridge invoice.',422,'STRIPE_CURRENCY_MISMATCH');
 const company=await Company.findById(original.companyId);const owner=company?await CompanyAuth.findById(company.ownerId):null;
 const allowed=[company?.billingEmail,owner?.email].filter(Boolean).map(value=>value!.trim().toLowerCase());
 if(!remote.customer_email||!allowed.includes(remote.customer_email.trim().toLowerCase()))throw new AppError('Stripe customer email must match this company’s billing email or account email.',422,'STRIPE_CUSTOMER_MISMATCH');
 const duplicate=await Invoice.exists({stripeInvoiceId:id,_id:{$ne:original._id}});if(duplicate)throw new AppError('This Stripe invoice is already linked to another Bridge invoice.',409,'STRIPE_INVOICE_ALREADY_LINKED');
 await ensureStripeInvoiceIndex();
 return {...stripeInvoiceFields(remote),clientTotal:remote.total/100};
}
