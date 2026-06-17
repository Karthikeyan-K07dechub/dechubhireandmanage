import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { TalentRequest } from '../models/TalentRequest';
import { ok, Errors, AppError } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    }).parse(req.body);

    const normalizedEmail = email.trim().toLowerCase();
    const adminEmails = (env.DECHUB_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(normalizedEmail)) {
      throw Errors.InvalidCredentials();
    }

    if (!env.DECHUB_ADMIN_PASSWORD || password !== env.DECHUB_ADMIN_PASSWORD) {
      throw Errors.InvalidCredentials();
    }

    const accessToken = signAccessToken({
      sub: normalizedEmail,
      email: normalizedEmail,
      role: 'dechub_admin',
      companyId: null,
    });
    const refreshToken = signRefreshToken({ sub: normalizedEmail });

    ok(res, { accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
    const payload = verifyRefreshToken(refreshToken);
    const normalizedEmail = payload.sub.trim().toLowerCase();
    const adminEmails = (env.DECHUB_ADMIN_EMAILS || '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    if (!adminEmails.includes(normalizedEmail)) {
      throw Errors.InvalidToken();
    }

    const accessToken = signAccessToken({
      sub: normalizedEmail,
      email: normalizedEmail,
      role: 'dechub_admin',
      companyId: null,
    });
    const newRefreshToken = signRefreshToken({ sub: normalizedEmail });

    ok(res, { accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
}

export async function listTalentRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search = '', status = '', page = '1', perPage = '20', sort = 'createdAt' } = req.query as Record<string, string>;
    const pageNum = Math.max(1, Number(page) || 1);
    const per = Math.max(1, Math.min(200, Number(perPage) || 20));

    const filter: Record<string, unknown> = {};
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { companyName: regex },
        { workerName: regex },
        { 'email': regex },
      ];
    }
    if (status) filter.status = status;

    const total = await TalentRequest.countDocuments(filter);
    const items = await TalentRequest.find(filter)
      .sort({ [sort]: -1 })
      .skip((pageNum - 1) * per)
      .limit(per)
      .lean();

    ok(res, { total, page: pageNum, perPage: per, items });
  } catch (err) { next(err); }
}

export async function getTalentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const item = await TalentRequest.findById(id);
    if (!item) throw Errors.NotFound('Talent request');
    // mark as read when fetched by admin
    if (item.unread) {
      item.unread = false;
      await item.save();
    }
    ok(res, item);
  } catch (err) { next(err); }
}

export async function updateTalentRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const { status } = req.body as { status?: string };
    if (!status) throw new AppError('Status is required', 400, 'INVALID_REQUEST');
    const allowed = ['new', 'contacted', 'in_discussion', 'closed'];
    if (!allowed.includes(status)) throw new AppError(`Invalid status: ${status}. Allowed values are: ${allowed.join(', ')}`, 400, 'INVALID_REQUEST');

    const item = await TalentRequest.findById(id);
    if (!item) throw Errors.NotFound('Talent request');
    item.status = status as any;
    await item.save();
    ok(res, item);
  } catch (err) { next(err); }
}

export async function unreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await TalentRequest.countDocuments({ unread: true });
    ok(res, { unread: count });
  } catch (err) { next(err); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const item = await TalentRequest.findById(id);
    if (!item) throw Errors.NotFound('Talent request');
    item.unread = false;
    await item.save();
    ok(res, { success: true });
  } catch (err) { next(err); }
}
