import { Request, Response, NextFunction } from 'express';
import { TalentRequest } from '../models/TalentRequest';
import { Worker } from '../models/Worker';
import { CompanyAuth } from '../models/CompanyAuth';
import { Company } from '../models/Company';
import { ok, Errors, AppError } from '../utils/response';

const AVAILABILITY_LABELS: Record<string, string> = {
  available_now: 'Available now',
  this_week: 'Available this week',
  two_weeks: '2 weeks notice',
  next_month: 'Available next month',
  not_available: 'Not available',
};

async function getCompanyForUser(userId: string) {
  const account = await CompanyAuth.findById(userId);
  if (!account?.companyId) throw Errors.NotFound('Company');
  const company = await Company.findById(account.companyId);
  if (!company) throw Errors.NotFound('Company');
  return { account, company };
}

function buildProfileSummary(worker: any) {
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

  return {
    workerId: worker._id.toString(),
    workerName: `${worker.firstName} ${worker.lastName}`.trim(),
    workerRole: worker.contractorProfile?.marketplaceTitle?.trim() || worker.roleTitle || 'Freelancer',
    profilePhotoUrl: worker.contractorProfile?.profilePhotoUrl ?? '',
    location: city ? `${city}${country ? `, ${country}` : ''}` : (country || 'Remote'),
    availabilityLabel: AVAILABILITY_LABELS[availability] || 'Not provided',
    email: worker.email ?? '',
    country: worker.country ?? country ?? '',
    track: worker.track ?? '',
  };
}

async function serializeRequest(item: any) {
  const source = typeof item?.toObject === 'function' ? item.toObject() : item;

  const [worker, suggestedWorker] = await Promise.all([
    Worker.findById(source.workerId).lean(),
    source.suggestedWorkerId ? Worker.findById(source.suggestedWorkerId).lean() : Promise.resolve(null),
  ]);

  return {
    ...source,
    talentProfile: buildProfileSummary(worker),
    suggestedTalentProfile: buildProfileSummary(suggestedWorker),
  };
}

export async function listCompanyTalentRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const items = await TalentRequest.find({ companyId: company._id }).sort({ createdAt: -1 }).limit(100).lean();
    const serialized = await Promise.all(items.map((item) => serializeRequest(item)));
    ok(res, serialized);
  } catch (err) {
    next(err);
  }
}

export async function getCompanyTalentRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const item = await TalentRequest.findOne({ _id: req.params.id, companyId: company._id });
    if (!item) throw Errors.NotFound('Talent request');
    ok(res, await serializeRequest(item));
  } catch (err) {
    next(err);
  }
}

export async function acceptSuggestedTalent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const item = await TalentRequest.findOne({ _id: req.params.id, companyId: company._id });
    if (!item) throw Errors.NotFound('Talent request');
    if (item.status !== 'alternative_suggested' || !item.suggestedWorkerId) {
      throw new AppError('This request does not have a suggested profile to accept', 400, 'INVALID_REQUEST');
    }

    const suggestedWorker = await Worker.findById(item.suggestedWorkerId);
    if (!suggestedWorker) {
      throw Errors.NotFound('Suggested worker');
    }

    item.originalWorkerId = item.originalWorkerId ?? item.workerId;
    item.workerId = suggestedWorker._id;
    item.workerName = `${suggestedWorker.firstName} ${suggestedWorker.lastName}`.trim();
    item.workerRole = suggestedWorker.contractorProfile?.marketplaceTitle?.trim() || suggestedWorker.roleTitle || 'Freelancer';
    item.workerProfileUrl = `/marketplace/${suggestedWorker._id}`;
    item.status = 'pending_review';
    item.reviewedAt = null;
    item.approvedAt = null;
    item.unread = true;
    item.suggestedWorkerId = null;
    await item.save();

    ok(res, await serializeRequest(item));
  } catch (err) {
    next(err);
  }
}

export async function getTalentRequestHirePrefill(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const item = await TalentRequest.findOne({ _id: req.params.id, companyId: company._id });
    if (!item) throw Errors.NotFound('Talent request');
    if (item.status !== 'approved') {
      throw new AppError('This request is not approved for hiring yet', 400, 'REQUEST_NOT_APPROVED');
    }

    const worker = await Worker.findById(item.workerId).lean();
    if (!worker) throw Errors.NotFound('Talent profile');

    const [firstName, ...rest] = item.workerName.trim().split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ');

    ok(res, {
      talentRequestId: item._id.toString(),
      initialData: {
        workerType: 'contractor',
        track: worker.track ?? 'track_2_us',
        firstName: firstName || worker.firstName || '',
        lastName: lastName || worker.lastName || '',
        email: worker.email ?? '',
        roleTitle: item.workerRole || worker.roleTitle || '',
        country: worker.country || worker.contractorProfile?.address?.country || '',
        department: '',
        selectedServices: [
          'contract_generation',
          'e_signature',
          'document_storage',
          'invoice_management',
          'payment_processing',
          'kyc_verification',
          'completion_certificate',
        ],
        payRate: '',
        payCurrency: 'USD',
        payFrequency: 'monthly',
        startDate: '',
        endDate: '',
        noticePeriodDays: '30',
        scopeOfWork: item.projectDescription || '',
      },
    });
  } catch (err) {
    next(err);
  }
}
