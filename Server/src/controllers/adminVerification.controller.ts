import { Request, Response, NextFunction } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { Worker } from '../models/Worker';
import { Project } from '../models/Project';
import { env } from '../config/env';
import { Errors, ok } from '../utils/response';
import { downloadVerificationFile } from '../services/verificationStorage.service';

const id = z.string().regex(/^[a-f\d]{24}$/i);
const fields = ['idFront', 'idBack', 'selfie'] as const;
export async function listProjectKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await Project.findById(id.parse(req.params.id)); if (!project) throw Errors.NotFound('Project');
    const workers = await Worker.find({ _id: { $in: project.teamMembers.map(m => m.workerId) } });
    ok(res, workers.map(worker => ({ workerId: worker._id, name: `${worker.firstName} ${worker.lastName}`, status: worker.kycStatus, idType: worker.kycData?.idType, documents: fields.filter(field => worker.kycData?.privateFiles?.[field] || worker.kycData?.[`${field}Path`]).map(field => ({ field, fileName: worker.kycData?.privateFiles?.[field]?.fileName || `${field} document` })) })));
  } catch (error) { next(error); }
}
export async function downloadWorkerKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const worker = await Worker.findById(id.parse(req.params.id)); if (!worker) throw Errors.NotFound('Worker');
    const field = z.enum(fields).parse(req.params.field); const document = worker.kycData?.privateFiles?.[field];
    let bytes: Buffer; let name: string; let mime = 'application/octet-stream';
    if (document) { bytes = await downloadVerificationFile(document); name = document.fileName; mime = document.mimeType; }
    else {
      const storedPath = worker.kycData?.[`${field}Path`]; if (!storedPath) throw Errors.NotFound('Document');
      const root = path.resolve(env.UPLOAD_DIR); const nameOnly = path.basename(storedPath.replace(/\\/g, '/'));
      const file = path.resolve(root, nameOnly); if (!file.startsWith(root + path.sep)) throw Errors.NotFound('Document');
      bytes = await fs.readFile(file); name = nameOnly;
    }
    res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); res.type(mime);
    res.setHeader('Content-Disposition', `attachment; filename="${name.replace(/[^a-zA-Z0-9._ -]/g, '_')}"`); res.send(bytes);
  } catch (error) { next(error); }
}
