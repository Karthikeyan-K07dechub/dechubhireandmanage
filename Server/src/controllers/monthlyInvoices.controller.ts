import {Invoice} from '../models/Invoice';
﻿import {Request,Response,NextFunction} from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import {MonthlyInvoice,ensureMonthlyInvoiceIndexes,monthlyInvoiceView} from '../models/MonthlyInvoice';
import {Project} from '../models/Project';
import {Company} from '../models/Company';
import {CompanyNotification} from '../models/CompanyNotification';
import {uploadInvoiceDocument,removeInvoiceDocument,downloadInvoiceDocument} from '../services/invoiceStorage.service';
import {processMonthlyInvoiceEmails} from '../services/monthlyInvoiceEmail.service';
import {AppError,Errors,ok} from '../utils/response';
import {logger} from '../utils/logger';
const month=z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
function legacyMonthFilter(billingMonth:string){const [year,m]=billingMonth.split('-').map(Number);return {clientSentAt:{$ne:null},periodStart:{$gte:new Date(Date.UTC(year,m-1,1)-330*60000),$lt:new Date(Date.UTC(year,m,1)-330*60000)}};}
const id=z.string().regex(/^[a-f\d]{24}$/i);
const input=z.object({projectId:id,billingMonth:month,invoiceNumber:z.string().trim().min(1).max(120),amount:z.coerce.number().finite().min(0.01).max(100000000).refine(value=>Math.abs(value*100-Math.round(value*100))<0.00001,'Use at most two decimal places.'),currency:z.enum(['AED','USD','INR']),dueDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),message:z.string().trim().max(5000).default(''),kind:z.enum(['original','additional','correction']).default('original'),correctionOf:id.nullable().optional(),action:z.enum(['draft','send']),version:z.number().int().min(0).optional()});
const audit=(action:string,req:Request,note='')=>({action,at:new Date(),by:req.user!.email,note});
function kickEmails(){void processMonthlyInvoiceEmails().catch(error=>logger.error('Invoice email queue failed',error));}
export async function listMonthlyInvoices(req:Request,res:Response,next:NextFunction){try{
 const billingMonth=month.parse(req.query.month);
 const [projects,invoices,companies,legacy]=await Promise.all([Project.find().sort({createdAt:-1}).select('title companyId currency status startDate targetEndDate paymentVerifiedAt paymentSubmittedAt').lean(),MonthlyInvoice.find({billingMonth}).sort({createdAt:-1}).lean(),Company.find().select('companyName billingEmail').lean(),Invoice.find(legacyMonthFilter(billingMonth)).sort({createdAt:-1}).lean()]);
 const byCompany=new Map(companies.map(c=>[String(c._id),c]));
 ok(res,{projects:projects.map(project=>({...project,companyName:byCompany.get(String(project.companyId))?.companyName||'Company',billingEmail:byCompany.get(String(project.companyId))?.billingEmail||''})),invoices:[...invoices.map(monthlyInvoiceView),...legacy.map(item=>{const project=projects.find(p=>String(p._id)===String(item.projectId));const paidAt=project?.paymentVerifiedAt||(!item.projectId?item.paidAt:null);return {_id:item._id,projectId:item.projectId,legacy:true,billingMonth,invoiceNumber:item.invoiceNumber,amount:item.clientTotal??item.amountGross,currency:item.currency,kind:'original',status:paidAt?'paid':'sent',sentAt:item.clientSentAt,paidAt,dueDate:null,message:item.description,documentName:item.clientDocument?.fileName||item.invoiceNumber+'.pdf',emailStatus:item.clientEmailSentAt?'sent':item.clientEmailError?'failed':'pending',emailNextAt:null,history:[{action:'legacy_invoice_sent',at:item.clientSentAt,by:'admin',note:'Existing project invoice; original payment workflow preserved.'}]};})]});
}catch(error){next(error);}}
export async function saveMonthlyInvoice(req:Request,res:Response,next:NextFunction){let uploaded:Awaited<ReturnType<typeof uploadInvoiceDocument>>|undefined;let committed=false;try{
 let payload:unknown;try{payload=JSON.parse(req.body.payload||'{}');}catch{throw new AppError('Invalid invoice form. Refresh and try again.',422,'INVALID_INVOICE_FORM');}
 const data=input.parse(payload);const project=await Project.findById(data.projectId);if(!project)throw Errors.NotFound('Project');
 const company=await Company.findById(project.companyId);if(!company)throw Errors.NotFound('Company');
 const dueDate=data.dueDate?new Date(data.dueDate+'T23:59:59.999+05:30'):null;if(dueDate&&(!Number.isFinite(dueDate.getTime())||new Date(data.dueDate+'T00:00:00Z').toISOString().slice(0,10)!==data.dueDate))throw new AppError('Choose a valid due date.',422,'INVALID_DUE_DATE');
 await ensureMonthlyInvoiceIndexes();
 let invoice=req.params.id?await MonthlyInvoice.findById(id.parse(req.params.id)):new MonthlyInvoice();if(!invoice)throw Errors.NotFound('Invoice');
 const isNew=invoice.isNew;
 if(!isNew&&(invoice.status!=='draft'||String(invoice.projectId)!==data.projectId||invoice.billingMonth!==data.billingMonth||invoice.kind!==data.kind||String(invoice.correctionOf||'')!==String(data.correctionOf||'')))throw new AppError('Only drafts can be edited. Refresh and try again.',409,'INVOICE_CONFLICT');
 if(!isNew&&invoice.__v!==data.version)throw new AppError('This draft changed. Reload before editing.',409,'INVOICE_CONFLICT');
 if(data.kind==='correction'&&!data.correctionOf)throw new AppError('Select the invoice being corrected.',422,'CORRECTION_REQUIRED');
 if(data.kind!=='correction'&&data.correctionOf)throw new AppError('Only corrected invoices can reference another invoice.',422,'INVALID_CORRECTION');
 const legacyExists=await Invoice.exists({projectId:project._id,companyId:project.companyId,...legacyMonthFilter(data.billingMonth)});
 if(isNew&&data.kind==='original'&&legacyExists)throw new AppError('This project already has a sent invoice for the month. Use Additional invoice.',409,'ORIGINAL_EXISTS');
 if(data.kind==='additional'&&!legacyExists&&!await MonthlyInvoice.exists({projectId:project._id,billingMonth:data.billingMonth,sentAt:{$ne:null},status:{$ne:'void'}}))throw new AppError('Send the first invoice before adding an additional invoice.',409,'ORIGINAL_REQUIRED');
 if(data.kind==='correction'&&!await MonthlyInvoice.exists({_id:data.correctionOf,projectId:project._id,billingMonth:data.billingMonth,status:'sent'}))throw new AppError('Only an unpaid, sent invoice for this project and month can be corrected.',409,'INVALID_CORRECTION');
 const previous=invoice.document;
 if(req.file)uploaded=await uploadInvoiceDocument(req.file,String(project.companyId),String(invoice._id));
 Object.assign(invoice,{companyId:project.companyId,projectId:project._id,projectName:project.title,companyName:company.companyName||'Company',billingMonth:data.billingMonth,invoiceNumber:data.invoiceNumber,amount:data.amount,currency:data.currency,dueDate,message:data.message,kind:data.kind,correctionOf:data.correctionOf||null,document:uploaded||previous});
 if(data.action==='send'&&!invoice.document)throw new AppError('Attach the invoice before sending.',422,'INVOICE_FILE_REQUIRED');
 invoice.history.push(audit(data.action==='send'?'sent':isNew?'draft_created':'draft_updated',req));
 if(data.action==='send'){invoice.status='sent';invoice.sentAt=new Date();invoice.emailStatus='pending';invoice.emailNextAt=new Date();invoice.emailAttempts=0;invoice.emailVersion++;}
 if(data.kind==='correction'&&data.action==='send'){
  await mongoose.connection.transaction(async session=>{
   const original=await MonthlyInvoice.findOneAndUpdate({_id:data.correctionOf,projectId:project._id,billingMonth:data.billingMonth,status:'sent'},{$set:{status:'void',emailNextAt:null},$inc:{__v:1},$push:{history:audit('superseded',req,'Replaced by '+invoice!.invoiceNumber)}},{session});if(!original)throw new AppError('The original invoice can no longer be corrected.',409,'INVOICE_CONFLICT');
   await invoice!.save({session});
  });
 }else await invoice.save();
 committed=true;if(uploaded&&previous)void removeInvoiceDocument(previous).catch(error=>logger.error('Old draft document cleanup failed',error));
 if(data.action==='send'){
  void CompanyNotification.create({companyId:invoice.companyId,projectId:invoice.projectId,type:'general',title:'Monthly invoice received',message:invoice.invoiceNumber+' for '+invoice.billingMonth+' is ready for review.',actionUrl:'/dashboard?tab=invoices'}).catch(error=>logger.error('Monthly invoice notification failed',error));kickEmails();
 }
 ok(res,monthlyInvoiceView(invoice));
}catch(error){if(uploaded&&!committed)await removeInvoiceDocument(uploaded).catch(()=>{});if((error as {code?:number}).code===11000)next(new AppError('An original invoice for this project/month or a correction already exists. Open its details instead.',409,'DUPLICATE_MONTHLY_INVOICE'));else if((error as Error).name==='VersionError')next(new AppError('Invoice changed. Reload and try again.',409,'INVOICE_CONFLICT'));else next(error);}}
export async function remindMonthlyInvoice(req:Request,res:Response,next:NextFunction){try{
 const retry=req.body.action==='retry';const now=new Date();
 const invoice=await MonthlyInvoice.findOneAndUpdate({_id:id.parse(req.params.id),status:'sent',$and:[{$or:[{emailLeaseUntil:null},{emailLeaseUntil:{$lt:now}}]},{$or:[{emailNextAt:null},{emailStatus:'failed'}]}]},{$set:{emailStatus:'pending',emailAction:retry?'invoice':'reminder',emailAttempts:0,emailNextAt:now},$inc:{emailVersion:1,__v:1},$push:{history:audit(retry?'email_retry_requested':'reminder_requested',req)}},{new:true});
 if(!invoice)throw new AppError('Only unpaid, sent invoices can be reminded. An email may already be queued.',409,'REMINDER_UNAVAILABLE');kickEmails();ok(res,monthlyInvoiceView(invoice));
}catch(error){next(error);}}
export async function markMonthlyInvoicePaid(req:Request,res:Response,next:NextFunction){try{
 const data=z.object({reference:z.string().trim().min(3).max(240),confirmed:z.literal(true)}).parse(req.body);
 const invoice=await MonthlyInvoice.findOneAndUpdate({_id:id.parse(req.params.id),status:'sent'},{$set:{status:'paid',paidAt:new Date(),paymentReference:data.reference,emailNextAt:null},$inc:{__v:1},$push:{history:audit('payment_verified',req,data.reference)}},{new:true});if(!invoice)throw new AppError('Only sent unpaid invoices can be marked paid.',409,'INVOICE_CONFLICT');ok(res,monthlyInvoiceView(invoice));
}catch(error){next(error);}}
export async function downloadMonthlyAdmin(req:Request,res:Response,next:NextFunction){try{const invoice=await MonthlyInvoice.findById(id.parse(req.params.id));if(!invoice?.document)throw Errors.NotFound('Invoice document');res.setHeader('Content-Type',invoice.document.mimeType||'application/pdf');res.setHeader('Content-Disposition','attachment; filename="'+invoice.document.fileName+'"');res.setHeader('Cache-Control','no-store');res.send(await downloadInvoiceDocument(invoice.document));}catch(error){next(error);}}
