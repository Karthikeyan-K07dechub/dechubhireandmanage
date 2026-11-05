import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { Company } from '../models/Company';
import { Errors } from '../utils/response';

// Legacy verification files must not bypass admin authorization through /uploads.
export async function blockPublicVerificationFiles(req: Request, _res: Response, next: NextFunction) {
  try {
    const name = path.basename(decodeURIComponent(req.path).replace(/\\/g, '/'));
    if (/^kyc-/i.test(name) || await Company.exists({ $or: [{ 'kybDocuments.storagePath': name }, { privateLegacyDocumentPaths: name }] })) throw Errors.Forbidden();
    next();
  } catch (error) { next(error); }
}
