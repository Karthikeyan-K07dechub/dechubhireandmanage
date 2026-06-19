import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { TalentRequest, type ITalentRequest, type TalentRequestStatus } from '../models/TalentRequest';
import { Worker } from '../models/Worker';
import { ok, Errors, AppError } from '../utils/response';

const ADMIN_AVAILABILITY_LABELS: Record<string, string> = {
  available_now: 'Available now',
  this_week: 'Available this week',
  two_weeks: '2 weeks notice',
  next_month: 'Available next month',
  not_available: 'Not available',
};

function normalizeStringList(value: unknown, limit = 10): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizePortfolioProjects(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const project = entry as Record<string, unknown>;
      const title = typeof project.title === 'string' ? project.title.trim() : '';
      const description = typeof project.description === 'string' ? project.description.trim() : '';
      const imageUrl = typeof project.imageUrl === 'string' ? project.imageUrl.trim() : '';
      const tags = normalizeStringList(project.tags, 8);

      if (!title || !description) {
        return null;
      }

      return { title, description, imageUrl, tags };
    })
    .filter(Boolean);
}

function normalizeServicePackages(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      const item = entry as Record<string, unknown>;
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const price = typeof item.price === 'number' ? item.price : Number(item.price ?? 0);
      const description = typeof item.description === 'string' ? item.description.trim() : '';
      const deliveryDays = typeof item.deliveryDays === 'number' ? item.deliveryDays : Number(item.deliveryDays ?? 0);
      const revisions = typeof item.revisions === 'number' ? item.revisions : Number(item.revisions ?? 0);
      const features = normalizeStringList(item.features, 12);

      if (!name || !Number.isFinite(price) || price <= 0) {
        return null;
      }

      return {
        name,
        price,
        description,
        deliveryDays: Number.isFinite(deliveryDays) && deliveryDays > 0 ? deliveryDays : null,
        revisions: Number.isFinite(revisions) && revisions >= 0 ? revisions : null,
        features,
      };
    })
    .filter(Boolean);
}

function formatTalentProfile(worker: any) {
  if (!worker) {
    return null;
  }

  const city = worker?.contractorProfile?.city?.trim()
    || worker?.contractorProfile?.address?.city?.trim()
    || '';
  const country = worker?.contractorProfile?.address?.country?.trim()
    || worker?.country?.trim()
    || '';
  const availability = worker?.contractorProfile?.marketplaceAvailability ?? 'available_now';
  const overview = worker?.contractorProfile?.profileOverview?.trim()
    || worker?.contractorProfile?.marketplaceBio?.trim()
    || worker?.scopeOfWork?.trim()
    || '';

  return {
    workerId: worker._id?.toString?.() ?? '',
    location: city ? `${city}${country ? `, ${country}` : ''}` : (country || 'Remote'),
    availabilityLabel: ADMIN_AVAILABILITY_LABELS[availability] || 'Not provided',
    profilePhotoUrl: worker.contractorProfile?.profilePhotoUrl ?? '',
    phone: worker.phone ?? '',
    email: worker.email ?? '',
    responseTimeHours:
      typeof worker.contractorProfile?.responseTimeHours === 'number' && worker.contractorProfile.responseTimeHours > 0
        ? worker.contractorProfile.responseTimeHours
        : null,
    skills: normalizeStringList(worker.contractorProfile?.skills, 12),
    languages: normalizeStringList(worker.contractorProfile?.languages, 8),
    profileOverview: overview,
    portfolioProjects: normalizePortfolioProjects(worker.contractorProfile?.portfolioProjects),
    servicePackages: normalizeServicePackages(worker.contractorProfile?.servicePackages),
  };
}

async function serializeTalentRequest(item: ITalentRequest) {
  const [worker, suggestedWorker] = await Promise.all([
    Worker.findById(item.workerId).lean(),
    item.suggestedWorkerId ? Worker.findById(item.suggestedWorkerId).lean() : Promise.resolve(null),
  ]);

  return {
    ...item.toObject(),
    talentProfile: formatTalentProfile(worker),
    suggestedTalentProfile: suggestedWorker
      ? {
          workerId: suggestedWorker._id.toString(),
          workerName: `${suggestedWorker.firstName} ${suggestedWorker.lastName}`.trim(),
          workerRole: suggestedWorker.contractorProfile?.marketplaceTitle?.trim() || suggestedWorker.roleTitle || 'Freelancer',
          profilePhotoUrl: suggestedWorker.contractorProfile?.profilePhotoUrl ?? '',
          location: formatTalentProfile(suggestedWorker)?.location ?? 'Remote',
          availabilityLabel: formatTalentProfile(suggestedWorker)?.availabilityLabel ?? 'Not provided',
        }
      : null,
  };
}

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

    ok(res, await serializeTalentRequest(item));
  } catch (err) { next(err); }
}

export async function updateTalentRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id;
    const { status, suggestedWorkerId, reviewNotes } = req.body as {
      status?: TalentRequestStatus;
      suggestedWorkerId?: string;
      reviewNotes?: string;
    };
    if (!status) throw new AppError('Status is required', 400, 'INVALID_REQUEST');
    const allowed: TalentRequestStatus[] = ['pending_review', 'approved', 'alternative_suggested', 'rejected', 'hired'];
    if (!allowed.includes(status)) throw new AppError(`Invalid status: ${status}. Allowed values are: ${allowed.join(', ')}`, 400, 'INVALID_REQUEST');

    const item = await TalentRequest.findById(id);
    if (!item) throw Errors.NotFound('Talent request');
    item.status = status;
    item.reviewNotes = typeof reviewNotes === 'string' ? reviewNotes.trim() : item.reviewNotes;
    item.reviewedAt = new Date();

    if (status === 'approved') {
      item.approvedAt = new Date();
      item.suggestedWorkerId = null;
    }

    if (status === 'alternative_suggested') {
      if (!suggestedWorkerId) {
        throw new AppError('Suggested worker is required', 400, 'INVALID_REQUEST');
      }

      const suggestedWorker = await Worker.findById(suggestedWorkerId);
      if (!suggestedWorker) {
        throw Errors.NotFound('Suggested worker');
      }

      item.suggestedWorkerId = suggestedWorker._id;
      item.approvedAt = null;
    }

    if (status === 'rejected') {
      item.approvedAt = null;
    }

    await item.save();
    ok(res, await serializeTalentRequest(item));
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
