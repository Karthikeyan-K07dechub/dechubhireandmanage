import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { CompanyAuth } from '../models/CompanyAuth';
import { Invoice } from '../models/Invoice';
import { AppError, Errors, ok } from '../utils/response';

async function companyIdFor(req: Request) {
  const account = await CompanyAuth.findById(req.user!.sub).select('companyId');
  if (!account?.companyId) throw Errors.NotFound('Company');
  return account.companyId;
}

export async function listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = await companyIdFor(req);
    ok(res, await Invoice.find({ companyId }).sort({ createdAt: -1 }).lean());
  } catch (error) { next(error); }
}

async function updateSubmittedInvoice(req: Request, res: Response, changes: Record<string, unknown>) {
  const companyId = await companyIdFor(req);
  if (!mongoose.isValidObjectId(req.params.id)) throw Errors.NotFound('Invoice');
  // Scope both lookup and update to the signed-in company, and prevent concurrent status changes.
  const updated = await Invoice.findOneAndUpdate(
    { _id: req.params.id, companyId, status: 'submitted' },
    { $set: changes }, { new: true, runValidators: true },
  );
  if (!updated) {
    const exists = await Invoice.exists({ _id: req.params.id, companyId });
    if (!exists) throw Errors.NotFound('Invoice');
    throw new AppError('Only submitted invoices can be approved or disputed. Refresh and try again.', 409, 'INVALID_INVOICE_STATUS');
  }
  ok(res, updated);
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
