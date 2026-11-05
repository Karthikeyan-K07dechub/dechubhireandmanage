import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompanyAuth } from '../models/CompanyAuth';
import { Company } from '../models/Company';
import { Project } from '../models/Project';
import { Errors, AppError, ok } from '../utils/response';
import { uploadPaymentProofFile, downloadPaymentProofFile, removePaymentProofFile } from '../services/paymentProofStorage.service';
export async function uploadPaymentProof(req: Request, res: Response, next: NextFunction) {
  try {
    const mode = z.enum(['bank_transfer', 'upi', 'card', 'other']).parse(req.body.paymentMode);
    const reference = z.string().trim().min(3).max(240).parse(req.body.paymentReference);
    const account = await CompanyAuth.findById(req.user!.sub).select('companyId');
    const company = account?.companyId ? await Company.findById(account.companyId) : await Company.findOne({ ownerId: req.user!.sub });
    if (!company) throw Errors.NotFound('Company');
    const project = await Project.findOne({ _id: req.params.id, companyId: company._id }).select('+paymentProof');
    if (!project) throw Errors.NotFound('Project');
    if (!['active', 'payment_submitted', 'completed'].includes(project.status) || project.paymentVerifiedAt) throw new AppError('Payment proof cannot be submitted for this project.', 409, 'INVALID_PROJECT_STATUS');
    if (!req.file) throw new AppError('Select a payment proof document.', 422, 'FILE_REQUIRED');
    const document = await uploadPaymentProofFile(req.file, String(company._id), String(project._id));
    const old = project.paymentProof;
    try { project.paymentProof = document; project.paymentMode = mode; project.paymentReference = reference; project.paymentSubmittedAt = new Date(); if (project.status !== 'completed') project.status = 'payment_submitted'; await project.save(); }
    catch (error) { await removePaymentProofFile(document).catch(() => {}); throw error; }
    if (old) await removePaymentProofFile(old).catch(() => {});
    ok(res, { message: 'Payment proof submitted for admin review.' });
  } catch (error) { next(error); }
}
export async function downloadPaymentProof(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(req.params.id).select('+paymentProof');
    if (!project?.paymentProof) throw Errors.NotFound('Payment proof');
    const bytes = await downloadPaymentProofFile(project.paymentProof);
    res.setHeader('Content-Type', project.paymentProof.mimeType);
    res.setHeader('Content-Disposition', 'attachment; filename="' + project.paymentProof.fileName + '"');
    res.setHeader('Cache-Control', 'private, no-store'); res.send(bytes);
  } catch (error) { next(error); }
}

export async function paymentProofInfo(req: Request, res: Response, next: NextFunction) {
  try { const project = await Project.findById(req.params.id).select('+paymentProof'); if (!project) throw Errors.NotFound('Project'); ok(res, { available: Boolean(project.paymentProof), fileName: project.paymentProof?.fileName, paymentMode: project.paymentMode, paymentReference: project.paymentReference }); } catch (error) { next(error); }
}
