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
    const paidProjects = await Project.find({ companyId, _id: { $in: items.map(item => item.projectId).filter(Boolean) }, paymentVerifiedAt: { $ne: null }, status: 'completed' }).select('_id paymentVerifiedAt').lean();
    const paidByProject = new Map(paidProjects.map(project => [String(project._id), project.paymentVerifiedAt]));
    ok(res, items.map(item => {
      const projectPaidAt = item.projectId ? paidByProject.get(String(item.projectId)) : null;
      return { ...invoiceView(item), companyName: company?.companyName || '', contractorAmount: item.amountGross, amountGross: item.clientTotal ?? item.amountGross,
        status: projectPaidAt ? 'paid' : item.status, paidAt: projectPaidAt || item.paidAt };
    }));
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
    const invoice = await Invoice.findOne({ _id: req.params.id, companyId, ...clientVisibleInvoiceFilter });
    if (!invoice) throw Errors.NotFound('Invoice');
    res.setHeader('Content-Type', invoice.clientDocument?.mimeType || 'application/pdf'); res.setHeader('Content-Disposition', 'attachment; filename="' + (invoice.clientDocument?.fileName || invoice.invoiceNumber + '.pdf') + '"'); res.setHeader('Cache-Control', 'no-store');
    res.send(await clientInvoicePdf(invoice));
  } catch (error) { next(error); }
}
