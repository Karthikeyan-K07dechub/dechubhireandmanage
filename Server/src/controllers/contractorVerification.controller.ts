import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { Worker, type IWorker } from '../models/Worker';
import { downloadVerificationFile, removeVerificationFile, uploadVerificationFile, validateVerificationFile, type VerificationFile } from '../services/verificationStorage.service';
import { logger } from '../utils/logger';
import { AppError, Errors, ok } from '../utils/response';

const fields = ['idFront', 'idBack', 'selfie'] as const;

async function ownWorker(req: Request) {
  if (!req.worker) throw Errors.Unauthorized();
  const worker = await Worker.findById(req.worker.sub);
  if (!worker) throw Errors.NotFound('Contractor');
  return worker;
}

function verificationView(worker: Pick<IWorker, 'kycData' | 'kycStatus' | 'status'>) {
  const { kycData, kycStatus } = worker;
  return {
    status: kycStatus,
    idType: kycData?.idType ?? null,
    canEdit: worker.status !== 'terminated' && Boolean(kycData?.idType && kycData.idNumber),
    documents: fields.flatMap(field => {
      const file = kycData?.privateFiles?.[field];
      const legacyPath = kycData?.[`${field}Path`];
      return file || legacyPath ? [{ field, fileName: file?.fileName ?? path.posix.basename(legacyPath!.replace(/\\/g, '/')) }] : [];
    }),
  };
}

export async function listMyVerificationDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const worker = await ownWorker(req);
    res.setHeader('Cache-Control', 'no-store');
    ok(res, verificationView(worker));
  } catch (error) { next(error); }
}

export async function downloadMyVerificationDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const worker = await ownWorker(req);
    const field = fields.find(candidate => candidate === req.params.field);
    if (!field) throw Errors.NotFound('Document');
    const stored = worker.kycData?.privateFiles?.[field];
    const legacyPath = worker.kycData?.[`${field}Path`];
    if (!stored && !legacyPath) throw Errors.NotFound('Document');

    const name = stored?.fileName ?? path.posix.basename(legacyPath!.replace(/\\/g, '/'));
    let bytes: Buffer;
    if (stored) {
      bytes = await downloadVerificationFile(stored);
    } else {
      const root = path.resolve(env.UPLOAD_DIR);
      const file = path.resolve(root, name);
      if (path.dirname(file) !== root) throw Errors.NotFound('Document');
      bytes = await fs.readFile(file).catch(error => {
        if (error.code === 'ENOENT') throw Errors.NotFound('Document');
        throw error;
      });
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(stored?.mimeType ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/[^a-zA-Z0-9._ -]/g, '_')}"`);
    res.send(bytes);
  } catch (error) { next(error); }
}

export async function replaceMyVerificationDocuments(req: Request, res: Response, next: NextFunction) {
  const uploaded: VerificationFile[] = [];
  let committed = false;
  try {
    const worker = await ownWorker(req);
    if (worker.status === 'terminated') throw Errors.Forbidden();
    const previous = worker.kycData;
    if (!previous?.idType || !previous.idNumber) {
      throw new AppError('Complete your initial identity verification before replacing documents.', 409, 'KYC_REQUIRED');
    }
    const files = req.files as Partial<Record<typeof fields[number], Express.Multer.File[]>> | undefined;
    const entries = fields.flatMap(field => files?.[field]?.[0] ? [{ field, file: files[field][0] }] : []);
    const removal = req.body?.remove;
    const requested = typeof removal === 'string' ? removal.split(',') : [];
    const removed = fields.filter(field => requested.includes(field));
    if ((removal !== undefined && typeof removal !== 'string') || removed.length !== requested.length || removed.some(field => files?.[field]?.[0])) {
      throw new AppError('Choose which verification documents to remove or replace.', 422, 'INVALID_DOCUMENT_CHANGES');
    }
    if (!entries.length && !removed.length) throw new AppError('Choose at least one verification file to add, replace, or remove.', 422, 'FILE_REQUIRED');
    for (const { file } of entries) validateVerificationFile(file);

    const updated = { ...previous, privateFiles: { ...previous.privateFiles }, submittedAt: new Date() };
    for (const field of removed) {
      delete updated.privateFiles[field];
      if (field === 'idFront') updated.idFrontPath = '';
      else updated[`${field}Path`] = null;
    }
    for (const { field, file } of entries) {
      const document = await uploadVerificationFile(file, 'contractor', String(worker._id), field, `${worker.firstName} ${worker.lastName}`);
      uploaded.push(document);
      updated.privateFiles[field] = document;
      updated[`${field}Path`] = document.path;
    }
    const saved = await Worker.findOneAndUpdate(
      { _id: worker._id, status: { $ne: 'terminated' }, 'kycData.submittedAt': previous.submittedAt ?? null, 'kycData.idFrontPath': previous.idFrontPath ?? null, 'kycData.idBackPath': previous.idBackPath ?? null, 'kycData.selfiePath': previous.selfiePath ?? null },
      { $set: { kycData: updated, kycStatus: 'pending' } },
      { new: true },
    );
    if (!saved) throw new AppError('Your verification documents changed. Reload and try again.', 409, 'KYC_CHANGED');
    committed = true;
    // Other engagements can share the previous storage objects through copied KYC records.
    res.setHeader('Cache-Control', 'no-store');
    ok(res, verificationView(saved));
  } catch (error) {
    if (!committed) await Promise.all(uploaded.map(file => removeVerificationFile(file).catch(() => logger.error('Contractor verification upload cleanup failed'))));
    next(error);
  }
}
