import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { z } from 'zod';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken, hashToken } from '../utils/jwt';
import { AppError, Errors, ok } from '../utils/response';

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(512),
  newPassword: z.string().min(8).max(72).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes.'),
  confirmPassword: z.string(),
}).strict().refine(data => data.newPassword === data.confirmPassword, { message: 'The new passwords do not match.', path: ['confirmPassword'] });

export async function changeCompanyPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = passwordSchema.parse(req.body);
    const account = await CompanyAuth.findById(req.user!.sub);
    if (!account) throw Errors.NotFound('Company account');
    if (!account.passwordHash) throw new AppError('This account uses Google sign-in. Manage your password through Google.', 409, 'EXTERNAL_SIGN_IN');
    if (!await account.comparePassword(data.currentPassword)) throw new AppError('Your current password is incorrect.', 403, 'INCORRECT_PASSWORD');
    if (data.currentPassword === data.newPassword) throw new AppError('Choose a different new password.', 422, 'PASSWORD_UNCHANGED');
    const passwordHash = await bcrypt.hash(data.newPassword, 12);
    const accessToken = signAccessToken({ sub: String(account._id), email: account.email, role: account.role, companyId: account.companyId ? String(account.companyId) : null, signupStep: account.signupStep });
    const refreshToken = signRefreshToken({ sub: String(account._id), jti: randomUUID() });
    const updated = await CompanyAuth.findOneAndUpdate({ _id: account._id, passwordHash: account.passwordHash }, { $set: { passwordHash, refreshTokenHash: await hashToken(refreshToken), passwordResetToken: null, passwordResetExpires: null } }, { new: true });
    if (!updated) throw new AppError('Your account changed. Sign in again before changing your password.', 409, 'ACCOUNT_CHANGED');
    res.setHeader('Cache-Control', 'no-store');
    ok(res, { accessToken, refreshToken });
  } catch (error) { next(error); }
}

export function logoExtension(bytes: Buffer): 'png' | 'jpg' | 'webp' | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'jpg';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

export async function uploadCompanyLogo(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await Company.findOne({ ownerId: req.user!.sub });
    if (!company) throw Errors.NotFound('Company');
    const file = req.file;
    const extension = file ? logoExtension(file.buffer) : null;
    if (!file || !extension || file.size > 2 * 1024 * 1024) throw new AppError('Choose a PNG, JPEG, or WebP logo up to 2 MB.', 422, 'INVALID_LOGO');
    const directory = path.resolve(env.UPLOAD_DIR, 'company-logos');
    await fs.mkdir(directory, { recursive: true });
    const filename = `${company._id}-${randomUUID()}.${extension}`;
    const target = path.join(directory, filename);
    await fs.writeFile(target, file.buffer, { flag: 'wx' });
    try {
      company.companyLogoUrl = `/uploads/company-logos/${filename}`;
      await company.save();
    } catch (error) { await fs.unlink(target).catch(() => undefined); throw error; }
    ok(res, { companyLogoUrl: company.companyLogoUrl });
  } catch (error) { next(error); }
}
