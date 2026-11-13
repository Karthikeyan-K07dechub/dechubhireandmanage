import {MonthlyInvoice} from '../models/MonthlyInvoice';
import {downloadInvoiceDocument} from '../services/invoiceStorage.service';
import { Project } from '../models/Project';
import { Company } from '../models/Company';
import { invoiceView } from '../services/invoiceStorage.service';
import { clientInvoicePdf } from '../services/invoiceReview.service';
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CompanyAuth } from '../models/CompanyAuth';
import { Invoice } from '../models/Invoice';
import { AppError, Errors, ok } from '../utils/response';

const clientVisibleInvoiceFilter = { $or: [{ clientSentAt: { $ne: null } }, { status: { $in: ['approved', 'paid', 'disputed'] } }] };

async function companyIdFor(req: Request) {
  const account = await CompanyAuth.findById(req.user!.sub).select('companyId');
  if (!account?.companyId) throw Errors.NotFound('Company');
  return account.companyId;
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = await companyIdFor(req);
    const company = await Company.findById(companyId).select('companyName');
    const items = await Invoice.find({ companyId, ...clientVisibleInvoiceFilter }).sort({ createdAt: -1 }).lean();
    const paidProjects = await Project.find({ companyId, _id: { $in: items.map(item => item.projectId).filter(Boolean) },  }).select('_id paymentVerifiedAt paymentSubmittedAt paymentReference paymentMode').lean();
    const paidByProject = new Map(paidProjects.map(project => [String(project._id), project]));
    const monthly=await MonthlyInvoice.find({companyId,sentAt:{$ne:null}}).sort({createdAt:-1}).lean();
    const legacy=items.map(item => {
      const paymentProject = item.projectId ? paidByProject.get(String(item.projectId)) : null;
      const projectPaidAt = paymentProject?.paymentVerifiedAt;
      const paymentStatus = projectPaidAt ? 'paid' : paymentProject?.paymentSubmittedAt ? 'verification_pending' : !item.projectId && item.status === 'paid' ? 'paid' : 'unpaid';
      return { ...invoiceView(item), companyName: company?.companyName || '', contractorAmount: item.amountGross, amountGross: item.clientTotal ?? item.amountGross,
        paymentStatus, paymentReference: paymentProject?.paymentReference || null, paymentMode: paymentProject?.paymentMode || null, paymentSubmittedAt: paymentProject?.paymentSubmittedAt || null,
        status: projectPaidAt ? 'paid' : item.status, paidAt: projectPaidAt || (!item.projectId ? item.paidAt : null) };
    });
    const monthlyItems=monthly.map(item=>{
      const [year,month]=item.billingMonth.split('-').map(Number);
      const amountPaid=item.stripeAmountPaid??(item.status==='paid'?item.amount:0);
      const amountRemaining=item.stripeAmountRemaining??(item.status==='paid'?0:item.amount);
      const paymentStatus=item.status==='paid'||item.stripeStatus==='paid'?'paid':amountPaid>0?'partially_paid':'unpaid';
      return {
        _id:item._id,sourceType:'monthly',stripeHostedInvoiceUrl:item.status==='sent'&&item.stripeStatus==='open'?item.stripeHostedInvoiceUrl:null,
        stripeStatus:item.stripeStatus,stripeAmountPaid:amountPaid,stripeAmountRemaining:amountRemaining,monthlyStatus:item.status,billingMonth:item.billingMonth,
        invoiceNumber:item.invoiceNumber,companyName:item.companyName,projectId:item.projectId,projectName:item.projectName,description:item.message,
        workerName:'',workerRole:'',amountGross:item.amount,currency:item.currency,serviceCharge:0,
        periodStart:new Date(Date.UTC(year,month-1,1)),periodEnd:new Date(Date.UTC(year,month,0)),submittedAt:item.sentAt,clientSentAt:item.sentAt,
        dueDate:item.dueDate,paidAt:item.paidAt,paymentReference:item.paymentReference,paymentStatus,
        status:item.status==='paid'?'paid':'approved',documentName:item.document?.fileName||null
      };
    });
    ok(res,[...monthlyItems,...legacy]);
  } catch (error) { next(error); }
}

async function updateSubmittedInvoice(req: Request, res: Response, changes: Record<string, unknown>) {
  const companyId = await companyIdFor(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw Errors.NotFound('Invoice');
  // Scope both lookup and update to the signed-in company, and prevent concurrent status changes.
  const updated = await Invoice.findOneAndUpdate(
    { _id: req.params.id, companyId, status: 'submitted', clientSentAt: { $ne: null } },
    { $set: changes }, { new: true, runValidators: true },
  );
  if (!updated) {
    const exists = await Invoice.exists({ _id: req.params.id, companyId });
    if (!exists) throw Errors.NotFound('Invoice');
    throw new AppError('Only submitted invoices can be approved or disputed. Refresh and try again.', 409, 'INVALID_INVOICE_STATUS');
  }
  ok(res, { ...invoiceView(updated.toObject()), contractorAmount: updated.amountGross, amountGross: updated.clientTotal ?? updated.amountGross });
}

export async function approveInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await updateSubmittedInvoice(req, res, { status: 'approved', approvedAt: new Date(), approvedBy: req.user!.sub, disputeReason: null });
  } catch (error) { next(error); }
}

export async function disputeInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reason } = z.object({ reason: z.string().trim().min(1).max(3000) }).parse(req.body);
    await updateSubmittedInvoice(req, res, { status: 'disputed', disputeReason: reason });
  } catch (error) { next(error); }
}

export async function downloadCompanyInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = await companyIdFor(req);
    const monthly=await MonthlyInvoice.findOne({_id:req.params.id,companyId,sentAt:{$ne:null}});
    if(monthly?.document){res.setHeader('Content-Type',monthly.document.mimeType||'application/pdf');res.setHeader('Content-Disposition','attachment; filename="'+monthly.document.fileName+'"');res.setHeader('Cache-Control','no-store');res.send(await downloadInvoiceDocument(monthly.document));return;}
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId, ...clientVisibleInvoiceFilter });
    if (!invoice) throw Errors.NotFound('Invoice');
    res.setHeader('Content-Type', invoice.clientDocument?.mimeType || 'application/pdf'); res.setHeader('Content-Disposition', 'attachment; filename="' + (invoice.clientDocument?.fileName || invoice.invoiceNumber + '.pdf') + '"'); res.setHeader('Cache-Control', 'no-store');
    res.send(await clientInvoicePdf(invoice));
  } catch (error) { next(error); }
}
