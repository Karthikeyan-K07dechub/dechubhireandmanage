import { Worker } from '../models/Worker';
import { ContractorNotification } from '../models/ContractorNotification';
import { sendEmail } from '../utils/email';
import { escapeMessageHtml } from '../services/messageAlerts.service';
import { env } from '../config/env';
import { uploadInvoiceDocument, removeInvoiceDocument, invoiceView } from '../services/invoiceStorage.service';
import { Company } from '../models/Company';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Invoice } from '../models/Invoice';
import { CompanyNotification } from '../models/CompanyNotification';
import { invoicePdf, clientInvoicePdf, notifyInvoiceAdmin, notifyInvoiceClient } from '../services/invoiceReview.service';
import { AppError, Errors, ok } from '../utils/response';
import { logger } from '../utils/logger';
export async function listAdminInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoices = await Invoice.find(req.query.projectId ? { projectId: z.string().regex(/^[a-f0-9]{24}$/i).parse(req.query.projectId) } : {}).sort({ createdAt: -1 }).limit(100);
    const companies = await Company.find({ _id: { $in: invoices.map(invoice => invoice.companyId) } }).select('companyName');
    ok(res, invoices.map(invoice => ({ ...invoiceView(invoice.toObject()), companyName: companies.find(company => String(company._id) === String(invoice.companyId))?.companyName || 'Company details incomplete' })));
  } catch (error) { next(error); }
}
export async function downloadAdminInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const invoice = await Invoice.findById(req.params.id); if (!invoice) throw Errors.NotFound('Invoice');
    res.setHeader('Content-Type', invoice.clientDocument?.mimeType || 'application/pdf'); res.setHeader('Content-Disposition', 'attachment; filename="' + (invoice.clientDocument?.fileName || invoice.invoiceNumber + '.pdf') + '"'); res.setHeader('Cache-Control', 'no-store');
    res.send(invoice.clientSentAt ? await clientInvoicePdf(invoice) : await invoicePdf(invoice));
  } catch (error) { next(error); }
}
export async function sendInvoiceToClient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({ serviceCharge: z.coerce.number().finite().min(0).max(100000000).default(0) }).parse(req.body);
    const original = await Invoice.findById(req.params.id); if (!original) throw Errors.NotFound('Invoice');
    if (original.clientSentAt || !['pending_admin', 'submitted'].includes(original.status)) throw new AppError('Invoice already sent or unavailable for review.', 409, 'INVOICE_ALREADY_REVIEWED');
    if (!req.file) throw new AppError('Select the final invoice PDF or image before sending.', 422, 'INVOICE_PDF_REQUIRED');
    const document = await uploadInvoiceDocument(req.file, String(original.companyId), String(original._id));
    const serviceCharge = Math.round(data.serviceCharge * 100) / 100;
    const clientTotal = Math.round((original.amountGross + serviceCharge) * 100) / 100;
    let invoice;
    try { invoice = await Invoice.findOneAndUpdate({ _id: original._id, clientSentAt: null, status: { $in: ['pending_admin', 'submitted'] } }, { $set: {
      status: 'submitted', clientDocument: document, serviceCharge, clientTotal, clientSentAt: new Date(), adminReviewedBy: req.user!.email,
    } }, { new: true, runValidators: true });
    } catch (error) {
      await removeInvoiceDocument(document).catch(() => logger.error('Orphan invoice upload cleanup failed'));
      throw error;
    }
    if (!invoice) await removeInvoiceDocument(document).catch(() => logger.error('Orphan invoice upload cleanup failed'));
    if (!invoice) throw new AppError('This invoice has already been sent or cannot be sent in its current status.', 409, 'INVOICE_ALREADY_REVIEWED');
    await CompanyNotification.create({ companyId: invoice.companyId, type: 'general', title: 'Invoice ready for your approval', message: invoice.invoiceNumber + ' has been verified by Dechub and is ready for your review.', actionUrl: '/dashboard?tab=invoices' }).catch(error => logger.error('Client invoice dashboard notification failed', error));
    void notifyInvoiceClient(invoice).catch(error => logger.error('Reviewed invoice client email failed', error));
    ok(res, invoiceView(invoice.toObject()));
  } catch (error) { next(error); }
}
export async function retryInvoiceEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { recipient } = z.object({ recipient: z.enum(['admin', 'client']) }).parse(req.body);
    const invoice = await Invoice.findById(req.params.id); if (!invoice) throw Errors.NotFound('Invoice');
    if (recipient === 'client' && !invoice.clientSentAt) throw new AppError('Verify and send this invoice before emailing the client.', 409, 'INVOICE_NOT_REVIEWED');
    await (recipient === 'admin' ? notifyInvoiceAdmin(invoice) : notifyInvoiceClient(invoice));
    ok(res, invoiceView((await Invoice.findById(invoice._id))!.toObject()));
  } catch (error) { next(error); }
}

export async function reviewContractorInvoice(req:Request,res:Response,next:NextFunction){try{
 const data=z.object({decision:z.enum(['approve','changes']),reason:z.string().trim().max(2000).optional()}).parse(req.body);
 if(data.decision==='changes'&&!data.reason)throw new AppError('Explain which invoice details need correcting.',422,'REASON_REQUIRED');
 const invoice=await Invoice.findOneAndUpdate({_id:z.string().regex(/^[a-f0-9]{24}$/i).parse(req.params.id),clientSentAt:null,status:{$in:['pending_admin','submitted']},adminReviewStatus:{$ne:'approved'}},{$set:{adminReviewStatus:data.decision==='approve'?'approved':'changes_requested',adminReviewReason:data.reason||null,adminReviewedAt:new Date(),adminReviewedBy:req.user!.email,...(data.decision==='changes'?{status:'disputed',disputeReason:data.reason}:{})}},{new:true,runValidators:true});
 if(!invoice)throw new AppError('Invoice has already been reviewed or sent. Refresh the list.',409,'INVOICE_ALREADY_REVIEWED');
 const title=data.decision==='approve'?'Invoice approved by admin':'Invoice changes requested';
 const message=invoice.invoiceNumber+(data.reason?' - '+data.reason:' has been reviewed and approved by Dechub.');
 void ContractorNotification.create({workerId:invoice.workerId,type:'general',title,message:message.slice(0,1200),actionUrl:'/contractor/dashboard?tab=invoices'}).catch(error=>logger.error('Invoice decision notification failed',error));
 void (async()=>{const worker=await Worker.findById(invoice.workerId).select('email');if(worker?.email)await sendEmail(worker.email,title,'<p>'+escapeMessageHtml(message)+'</p><p><a href="'+escapeMessageHtml(env.CLIENT_URL+'/contractor/dashboard?tab=invoices')+'">Open invoices</a></p>');})().catch(error=>logger.error('Invoice decision email failed',error));
 ok(res,invoiceView(invoice.toObject()));
}catch(error){next(error);}}
