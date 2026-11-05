import { downloadVerificationFile } from '../services/verificationStorage.service';
import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { z } from 'zod';
import { Company, type ICompany } from '../models/Company';
import { Project } from '../models/Project';
import { Worker } from '../models/Worker';
import { Contract } from '../models/Contract';
import { Invoice } from '../models/Invoice';
import { ProjectDocument } from '../models/ProjectDocument';
import { CompanyNotification } from '../models/CompanyNotification';
import { uploadInvoiceDocument, downloadInvoiceDocument, removeInvoiceDocument } from '../services/invoiceStorage.service';
import { buildPdfBuffer, buildContractLines, wrapText } from '../services/contractPdf.service';
import { clientInvoicePdf } from '../services/invoiceReview.service';
import { env } from '../config/env';
import { Errors, AppError, ok } from '../utils/response';
import { logger } from '../utils/logger';

const id = z.string().regex(/^[a-f\d]{24}$/i);
async function ownCompany(req: Request) {
  const company = await Company.findOne({ ownerId: req.user!.sub });
  if (!company) throw Errors.NotFound('Company');
  return company;
}
export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await ownCompany(req);
    const [projects, contracts, invoices, documents] = await Promise.all([
      Project.find({ companyId: company._id, status: { $ne: 'draft' } }),
      Contract.find({ companyId: company._id, companySigned: true, workerSigned: true }),
      Invoice.find({ companyId: company._id, clientSentAt: { $ne: null }, clientDocument: { $ne: null }, status: { $nin: ['pending_admin', 'draft'] } }),
      ProjectDocument.find({ companyId: company._id }),
    ]);
    const workers = await Worker.find({ companyId: company._id }).select('firstName lastName');
    const rows: Record<string, unknown>[] = [];
    const add = (key: string, category: string, name: string, status: string, date: Date, projectId: unknown = null, workerName = '', extra = {}) => {
      const project = projects.find(p => String(p._id) === String(projectId));
      rows.push({ _id: key, category, documentType: category, fileName: name, status, uploadedAt: date, companyName: company.companyName || 'Company', projectId, projectName: project?.title || '', workerId: null, workerName: workerName || project?.teamMembers.map(m => {
        const w = workers.find(w => String(w._id) === String(m.workerId));
        return w ? `${w.firstName} ${w.lastName}` : m.role;
      }).join(', ') || '', downloadUrl: category === 'verification' ? null : `/documents/${key}/file`, adminOnly: category === 'verification', ...extra });
    };
    for (const p of projects.filter(p => p.clientAcceptedAt)) add(`project-contract-${p._id}`, 'contract', `${p.title} - signed project contract.pdf`, p.teamMembers.every(m => p.contractorAcceptances.some(a => String(a.workerId) === String(m.workerId))) ? 'signed' : 'client_approved', p.clientAcceptedAt!, p._id, '', { uploadedBy: 'Dechub' });
    for (const c of contracts) add(`contract-${c._id}`, 'contract', `${c.workerName} - signed contract.pdf`, 'signed', c.companySignedAt || c.updatedAt, null, c.workerName, { uploadedBy: 'Dechub' });
    for (const i of invoices) {
      const project = projects.find(p => String(p._id) === String(i.projectId));
      add(`invoice-${i._id}`, 'invoice', i.clientDocument!.fileName, project?.paymentVerifiedAt ? 'paid' : i.status, i.clientSentAt!, i.projectId, i.workerName, { projectName: project?.title || i.projectName, uploadedBy: 'Dechub', invoiceNumber: i.invoiceNumber });
    }
    company.kybDocuments.forEach((d) => add(`verification-${d.docType}`, 'verification', d.fileName, company.kybStatus, d.uploadedAt, null, '', { uploadedBy: 'Company', documentType: d.docType }));
    documents.forEach(d => add(`project-${d._id}`, 'project', d.file.fileName, d.status, d.createdAt, d.projectId, '', { uploadedBy: d.uploadedBy, replacementReason: d.replacementReason }));
    ok(res, rows.sort((a, b) => new Date(String(b.uploadedAt)).getTime() - new Date(String(a.uploadedAt)).getTime()));
  } catch (error) { next(error); }
}
export async function documentFile(req: Request, res: Response, next: NextFunction) {
  try { if (String(req.params.key).startsWith('verification-')) throw Errors.Forbidden(); await sendCompanyDocument(req, res, await ownCompany(req)); } catch (error) { next(error); }
}
export async function adminDocumentFile(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(id.parse(req.params.id)); if (!project) throw Errors.NotFound('Project');
    const company = await Company.findById(project.companyId); if (!company) throw Errors.NotFound('Company');
    if (!String(req.params.key).startsWith('verification-') && !await ProjectDocument.exists({ _id: id.parse(String(req.params.key).replace(/^project-/, '')), projectId: project._id, companyId: company._id })) throw Errors.NotFound('Document');
    await sendCompanyDocument(req, res, company);
  } catch (error) { next(error); }
}
async function sendCompanyDocument(req: Request, res: Response, company: ICompany) {
    const key = String(req.params.key);
    let bytes: Buffer; let name: string; let mime = 'application/pdf';
    if (key.startsWith('verification-')) {
      const doc = company.kybDocuments.find(doc => doc.docType === key.slice(13)); if (!doc) throw Errors.NotFound('Document');
      if (doc.privateFile) bytes = await downloadVerificationFile(doc.privateFile);
      else { const root = path.resolve(env.UPLOAD_DIR); const file = path.resolve(root, doc.storagePath); if (!file.startsWith(root + path.sep)) throw Errors.NotFound('Document'); bytes = await fs.readFile(file); }
      name = doc.fileName; mime = ['application/pdf', 'image/png', 'image/jpeg'].includes(doc.mimeType) ? doc.mimeType : 'application/octet-stream';
    } else if (key.startsWith('invoice-')) {
      const invoice = await Invoice.findOne({ _id: id.parse(key.slice(8)), companyId: company._id, clientSentAt: { $ne: null }, clientDocument: { $ne: null }, status: { $nin: ['pending_admin', 'draft'] } });
      if (!invoice) throw Errors.NotFound('Document'); bytes = await clientInvoicePdf(invoice); name = invoice.clientDocument!.fileName; mime = invoice.clientDocument?.mimeType || 'application/pdf';
    } else if (key.startsWith('project-contract-')) {
      const project = await Project.findOne({ _id: id.parse(key.slice(17)), companyId: company._id, clientAcceptedAt: { $ne: null }, status: { $ne: 'draft' } });
      if (!project) throw Errors.NotFound('Document');
      name = `${project.title} - contract.pdf`;
      bytes = buildPdfBuffer(['Dechub Bridge - Project contract', ...wrapText('Company: ' + (company.companyName || 'Company')), ...wrapText('Project: ' + project.title), 'Contract ID: ' + project._id, 'Client accepted: ' + project.clientAcceptedAt!.toISOString(), 'Start: ' + (project.startDate?.toISOString().slice(0, 10) || 'Not provided'), 'End: ' + (project.targetEndDate?.toISOString().slice(0, 10) || 'Not provided'), 'Budget: ' + project.currency + ' ' + project.budget, 'Scope:', ...wrapText(project.scope), 'Deliverables:', ...project.deliverables.flatMap(d => wrapText(d)), 'Payment terms:', ...wrapText(project.paymentTerms), 'Contractor approvals:', ...project.teamMembers.flatMap(m => wrapText(m.role + ': ' + (project.contractorAcceptances.find(a => String(a.workerId) === String(m.workerId))?.acceptedAt.toISOString() || 'Pending')))]);
    } else if (key.startsWith('contract-')) {
      const contract = await Contract.findOne({ _id: id.parse(key.slice(9)), companyId: company._id, companySigned: true, workerSigned: true });
      if (!contract) throw Errors.NotFound('Document'); bytes = buildPdfBuffer(buildContractLines(contract)); name = `${contract.workerName} - contract.pdf`;
    } else {
      const document = await ProjectDocument.findOne({ _id: id.parse(key.replace(/^project-/, '')), companyId: company._id });
      if (!document) throw Errors.NotFound('Document'); bytes = await downloadInvoiceDocument(document.file); name = document.file.fileName;
    }
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.type(mime);
    res.setHeader('Content-Disposition', `${req.query.view === '1' ? 'inline' : 'attachment'}; filename="${name.replace(/[^a-zA-Z0-9._ -]/g, '_')}"`);
    res.send(bytes);
}
export async function adminProjectDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(id.parse(req.params.id)); if (!project) throw Errors.NotFound('Project');
    const documents = await ProjectDocument.find({ projectId: project._id }).sort({ createdAt: -1 });
    const company = await Company.findById(project.companyId);
    ok(res, { documents: documents.map(d => ({ _id: d._id, fileName: d.file.fileName, status: d.status, replacementReason: d.replacementReason, createdAt: d.createdAt })), verificationStatus: company?.kybStatus, verificationDocuments: company?.kybDocuments.map(d => ({ _id: 'verification-' + d.docType, fileName: d.fileName })) || [] });
  } catch (error) { next(error); }
}
export async function uploadProjectDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(id.parse(req.params.id)); if (!project) throw Errors.NotFound('Project');
    if (!req.file) throw new AppError('Choose a PDF file.', 422, 'FILE_REQUIRED');
    const documentId = new mongoose.Types.ObjectId();
    const file = await uploadInvoiceDocument(req.file, String(project.companyId), `documents/${project._id}/${documentId}`);
    let document;
    try { document = await ProjectDocument.create({ _id: documentId, companyId: project.companyId, projectId: project._id, file, uploadedBy: req.user!.email }); }
    catch (error) { await removeInvoiceDocument(file).catch(() => logger.error('Document cleanup failed')); throw error; }
    await CompanyNotification.create({ companyId: project.companyId, projectId: project._id, type: 'general', title: 'New project document', message: `${file.fileName} was added to ${project.title}.`, actionUrl: `/dashboard?tab=documents&project=${project._id}` }).catch(error => logger.error('Document notification failed', error));
    ok(res, { _id: document._id, fileName: file.fileName });
  } catch (error) { next(error); }
}
export async function reviewProjectDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(id.parse(req.params.id)); if (!project) throw Errors.NotFound('Project');
    const data = z.object({ documentId: z.string(), status: z.enum(['approved', 'rejected', 'replacement_requested']), reason: z.string().trim().max(1000).default('') }).parse(req.body);
    if (data.status !== 'approved' && !data.reason) throw new AppError('Enter the reason for this request.', 422, 'REASON_REQUIRED');
    if (data.documentId === 'verification') {
      await Company.updateOne({ _id: project.companyId }, { $set: { kybStatus: data.status === 'approved' ? 'approved' : 'rejected', kybApprovedAt: data.status === 'approved' ? new Date() : null } });
    } else {
      const document = await ProjectDocument.findOneAndUpdate({ _id: id.parse(data.documentId), projectId: project._id, companyId: project.companyId }, { $set: { status: data.status === 'approved' ? 'available' : 'replacement_requested', replacementReason: data.reason } });
      if (!document) throw Errors.NotFound('Document');
    }
    await CompanyNotification.create({ companyId: project.companyId, projectId: project._id, type: 'general', title: data.status === 'approved' ? 'Document approved' : 'Document replacement requested', message: `${project.title}: ${data.reason || 'Company verification approved.'}`, actionUrl: '/dashboard?tab=documents' });
    ok(res, { status: data.status });
  } catch (error) { next(error); }
}
export async function replaceProjectDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await ownCompany(req);
    const original = await ProjectDocument.findOne({ _id: id.parse(String(req.params.key).replace(/^project-/, '')), companyId: company._id, status: 'replacement_requested' });
    if (!original) throw Errors.NotFound('Replacement request');
    if (!req.file) throw new AppError('Choose a PDF file.', 422, 'FILE_REQUIRED');
    const file = await uploadInvoiceDocument(req.file, String(company._id), `documents/${original.projectId}/${original._id}`);
    let updated;
    try { updated = await ProjectDocument.findOneAndUpdate({ _id: original._id, companyId: company._id, status: 'replacement_requested', 'file.path': original.file.path }, { $set: { file, status: 'available', replacementReason: '', uploadedBy: 'Company' } }, { new: true }); }
    catch (error) { await removeInvoiceDocument(file).catch(() => logger.error('Document cleanup failed')); throw error; }
    if (!updated) { await removeInvoiceDocument(file).catch(() => logger.error('Document cleanup failed')); throw new AppError('This document has changed. Refresh and try again.', 409, 'DOCUMENT_CHANGED'); }
    await removeInvoiceDocument(original.file).catch(() => logger.error('Old document cleanup failed'));
    ok(res, { _id: updated._id });
  } catch (error) { next(error); }
}
