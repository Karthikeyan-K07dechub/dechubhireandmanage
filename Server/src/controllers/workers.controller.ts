import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { Worker } from '../models/Worker';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { Contract } from '../models/Contract';
import { MarketplaceOrderDraft } from '../models/MarketplaceOrderDraft';
import { ok, created, Errors, AppError } from '../utils/response';
import { logger } from '../utils/logger';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

const MARKETPLACE_AVAILABILITY_LABELS = {
  available_now: 'Available now',
  this_week: 'Available this week',
  two_weeks: '2 weeks notice',
  next_month: 'Available next month',
  not_available: 'Not available',
} as const;

const DEFAULT_MARKETPLACE_TITLE = 'Freelancer';
const DEFAULT_MARKETPLACE_BIOS = new Set([
  'Tell companies about your strongest skills and the kind of freelance work you want.',
  'Experienced freelancer available for contract work.',
  'Self-signup freelancer profile',
]);

const DEFAULT_RESPONSE_TIME_HOURS = 2;

const DEFAULT_SERVICE_PACKAGES = [
  {
    name: 'Basic',
    price: 0,
    description: 'Share a simple starter package for companies browsing your profile.',
    deliveryDays: 5,
    revisions: 1,
    features: ['Scope outline', 'Starter delivery'],
  },
  {
    name: 'Standard',
    price: 0,
    description: 'Describe your most common package and what clients typically receive.',
    deliveryDays: 7,
    revisions: 2,
    features: ['Expanded scope', 'Progress updates'],
  },
  {
    name: 'Premium',
    price: 0,
    description: 'Use this for your most complete offer with your best turnaround.',
    deliveryDays: 14,
    revisions: 3,
    features: ['Full delivery', 'Priority collaboration'],
  },
];

function normalizeStringList(values: unknown, limit = 30): string[] {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean),
    ),
  ).slice(0, limit);
}

function normalizePortfolioProjects(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => {
      const project = item as Record<string, unknown>;
      const title = typeof project?.title === 'string' ? project.title.trim() : '';
      const description = typeof project?.description === 'string' ? project.description.trim() : '';
      const imageUrl = typeof project?.imageUrl === 'string' ? project.imageUrl.trim() : '';
      const tags = normalizeStringList(project?.tags, 8);

      if (!title || !description || !imageUrl) {
        return null;
      }

      return { title, description, imageUrl, tags };
    })
    .filter(Boolean);
}

function normalizeServicePackages(values: unknown) {
  if (!Array.isArray(values) || values.length === 0) {
    return [];
  }

  const packages = values
    .map((item, index) => {
      const current = item as Record<string, unknown>;
      const fallback = DEFAULT_SERVICE_PACKAGES[index] ?? DEFAULT_SERVICE_PACKAGES[DEFAULT_SERVICE_PACKAGES.length - 1];
      
      // Use provided values if present, otherwise fall back for missing non-price fields only
      const name = typeof current?.name === 'string' && current.name.trim()
        ? current.name.trim()
        : fallback.name;
      const description = typeof current?.description === 'string' && current.description.trim()
        ? current.description.trim()
        : fallback.description;
      const price = typeof current?.price === 'number' ? current.price : Number(current?.price ?? NaN);
      const deliveryDays = typeof current?.deliveryDays === 'number'
        ? current.deliveryDays
        : Number(current?.deliveryDays ?? fallback.deliveryDays);
      const revisions = typeof current?.revisions === 'number'
        ? current.revisions
        : Number(current?.revisions ?? fallback.revisions);
      const features = normalizeStringList(current?.features, 12);

      return {
        name,
        price: Number.isFinite(price) ? price : fallback.price,
        description,
        deliveryDays: Number.isFinite(deliveryDays) ? deliveryDays : fallback.deliveryDays,
        revisions: Number.isFinite(revisions) ? revisions : fallback.revisions,
        features: features.length ? features : fallback.features,
      };
    })
    .slice(0, 3);

  return packages;
}

function createMarketplaceOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `MKT-${stamp}-${suffix}`;
}

function normalizeFaqItems(values: unknown) {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => {
      const faq = item as Record<string, unknown>;
      const question = typeof faq?.question === 'string' ? faq.question.trim() : '';
      const answer = typeof faq?.answer === 'string' ? faq.answer.trim() : '';
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter(Boolean);
}

// ─── Email transporter ────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
});

async function sendWorkerInvite(
  toEmail: string,
  workerName: string,
  companyName: string,
  roleTitle: string,
  token: string,
): Promise<void> {
  const inviteUrl = `${env.CLIENT_URL}/worker/join?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head><style>
body { font-family: 'DM Sans', Arial, sans-serif; background: #f8fafc; }
.wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 16px rgba(0,0,0,0.08); }
.header { background: linear-gradient(135deg, #0a1628, #162d54); padding: 32px 40px; }
.logo { color: #00c9a7; font-size: 22px; font-weight: 700; }
.content { padding: 36px 40px; color: #0f172a; }
h1 { font-size: 22px; font-weight: 700; margin: 0 0 14px; }
p { font-size: 15px; color: #475569; line-height: 1.65; margin: 0 0 16px; }
.btn { display: inline-block; background: #0a1628; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
.detail { background: #f8fafc; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; }
.detail-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px solid #e2e8f0; }
.detail-row:last-child { border: none; }
.dk { color: #64748b; }
.dv { font-weight: 600; color: #0f172a; }
.footer { padding: 20px 40px; background: #f8fafc; font-size: 12px; color: #94a3b8; }
</style></head>
<body>
<div class="wrap">
  <div class="header"><span class="logo">Dechub</span></div>
  <div class="content">
    <h1>You've been invited to work with ${companyName}</h1>
    <p>Hi ${workerName},</p>
    <p>${companyName} has invited you to join their team on Dechub as a <strong>${roleTitle}</strong>.</p>
    <div class="detail">
      <div class="detail-row"><span class="dk">Company</span><span class="dv">${companyName}</span></div>
      <div class="detail-row"><span class="dk">Role</span><span class="dv">${roleTitle}</span></div>
      <div class="detail-row"><span class="dk">Platform</span><span class="dv">Dechub — Global HR & Payroll</span></div>
    </div>
    <p>Click below to accept the invitation, complete your profile, and get started:</p>
    <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
    <p style="font-size:12px;color:#94a3b8;">This invite link expires in 7 days. If you didn't expect this, you can safely ignore it.</p>
  </div>
  <div class="footer">© ${new Date().getFullYear()} Dechub Pvt. Ltd. · Bengaluru, India</div>
</div>
</body>
</html>`.trim();

  try {
    await transporter.sendMail({
      from:    env.EMAIL_FROM,
      to:      toEmail,
      subject: `You're invited to join ${companyName} on Dechub`,
      html,
    });
  } catch (err) {
    logger.warn(`Worker invite email failed for ${toEmail}`, err);
    // Don't throw — worker record is created; email failure is non-fatal
  }
}

// ─── Invite worker schema ─────────────────────────────────────────────────────

const inviteSchema = z.object({
  workerType:       z.enum(['contractor', 'full_time_employee']),
  track:            z.enum(['track_1_india', 'track_2_us']),
  firstName:        z.string().min(1).max(50),
  lastName:         z.string().min(1).max(50),
  email:            z.string().email(),
  roleTitle:        z.string().min(1).max(200),
  country:          z.string().min(1),
  department:       z.string().default(''),
  selectedServices: z.array(z.string()).min(1),
  payRate:          z.number().positive(),
  payCurrency:      z.string().length(3).default('USD'),
  payFrequency:     z.enum(['monthly', 'biweekly', 'hourly']).default('monthly'),
  startDate:        z.string().min(1),
  endDate:          z.string().optional(),
  noticePeriodDays: z.number().int().min(0).default(30),
  scopeOfWork:      z.string().min(1),
});

const marketplaceOrderDraftSchema = z.object({
  packageSnapshot: z.object({
    name: z.string().trim().min(1).max(50),
    price: z.number().min(0).max(1_000_000),
    description: z.string().trim().min(1).max(300),
    deliveryDays: z.number().int().min(1).max(365),
    revisions: z.number().int().min(0).max(100),
    features: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  }),
  clientDetails: z.object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    countryCode: z.string().trim().min(2).max(12),
    phoneNumber: z.string().trim().min(6).max(20),
    workEmail: z.string().trim().email(),
    projectType: z.string().trim().min(1).max(100),
    budget: z.string().trim().min(1).max(100),
    projectDescription: z.string().trim().min(150).max(3000),
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCompanyForUser(userId: string) {
  const account = await CompanyAuth.findById(userId);
  if (!account?.companyId) throw Errors.NotFound('Company');
  const company = await Company.findById(account.companyId);
  if (!company) throw Errors.NotFound('Company');
  return { account, company };
}

function mapWorkerToMarketplaceTalent(worker: any) {
  const availability = (
    worker.contractorProfile?.marketplaceAvailability ?? 'available_now'
  ) as keyof typeof MARKETPLACE_AVAILABILITY_LABELS;
  const skills = worker.contractorProfile?.skills ?? [];
  const city = worker.contractorProfile?.city?.trim() || worker.contractorProfile?.address?.city?.trim() || '';
  const country = worker.contractorProfile?.address?.country?.trim() || worker.country || '';
  const servicePackages = normalizeServicePackages(worker.contractorProfile?.servicePackages);
  const basicPackage = servicePackages.find((pkg) => pkg.name.trim().toLowerCase().includes('basic'))
    ?? servicePackages.find((pkg) => pkg.price > 0)
    ?? servicePackages[0];

  return {
    id: worker._id,
    workerId: worker._id,
    name: `${worker.firstName} ${worker.lastName}`.trim(),
    role: worker.contractorProfile?.marketplaceTitle?.trim() || worker.roleTitle || 'Freelancer',
    location: city ? `${city}${country ? `, ${country}` : ''}` : (country || 'Remote'),
    city,
    country,
    skills,
    rate: basicPackage?.price && basicPackage.price > 0
      ? basicPackage.price
      : worker.contractorProfile?.marketplaceRate ?? worker.payRate ?? 0,
    currency: worker.payCurrency ?? 'USD',
    availability,
    availabilityLabel: MARKETPLACE_AVAILABILITY_LABELS[availability],
    blurb:
      worker.contractorProfile?.marketplaceBio?.trim()
      || worker.scopeOfWork?.trim()
      || 'Freelancer profile is being completed.',
    profilePhotoUrl: worker.contractorProfile?.profilePhotoUrl ?? '',
    bannerImageUrl: worker.contractorProfile?.bannerImageUrl ?? '',
    servicePackages,
  };
}

function mapWorkerToMarketplaceTalentDetail(worker: any) {
  const baseProfile = mapWorkerToMarketplaceTalent(worker);
  const languages = normalizeStringList(worker.contractorProfile?.languages, 8);
  const portfolioProjects = normalizePortfolioProjects(worker.contractorProfile?.portfolioProjects);
  const servicePackages = normalizeServicePackages(worker.contractorProfile?.servicePackages);
  const faqItems = normalizeFaqItems(worker.contractorProfile?.faqItems);

  return {
    ...baseProfile,
    email: worker.email,
    responseTimeHours:
      typeof worker.contractorProfile?.responseTimeHours === 'number' && worker.contractorProfile.responseTimeHours > 0
        ? worker.contractorProfile.responseTimeHours
        : DEFAULT_RESPONSE_TIME_HOURS,
    languages,
    profileOverview:
      worker.contractorProfile?.profileOverview?.trim()
      || worker.contractorProfile?.marketplaceBio?.trim()
      || worker.scopeOfWork?.trim()
      || 'Profile overview is being completed.',
    profilePhotoUrl: worker.contractorProfile?.profilePhotoUrl ?? '',
    bannerImageUrl: worker.contractorProfile?.bannerImageUrl ?? '',
    portfolioProjects,
    servicePackages,
    faqItems,
    memberSince: worker.createdAt instanceof Date ? worker.createdAt.toISOString() : new Date(worker.createdAt).toISOString(),
  };
}

function hasCompletedMarketplaceProfile(worker: any): boolean {
  const title = worker.contractorProfile?.marketplaceTitle?.trim() ?? '';
  const bio = worker.contractorProfile?.marketplaceBio?.trim() ?? '';
  const rate = worker.contractorProfile?.marketplaceRate ?? worker.payRate ?? 0;
  const city = worker.contractorProfile?.city?.trim() || worker.contractorProfile?.address?.city?.trim() || '';
  const country = worker.contractorProfile?.address?.country?.trim() || worker.country?.trim() || '';
  const skills = Array.isArray(worker.contractorProfile?.skills) ? worker.contractorProfile.skills : [];
  const servicePackages = Array.isArray(worker.contractorProfile?.servicePackages) 
    ? worker.contractorProfile.servicePackages 
    : [];
  const hasServicePackagePrice = servicePackages.some((pkg: { price?: number | string } | null | undefined) => (
    pkg?.price !== undefined && Number(pkg.price) > 0
  ));

  return Boolean(
    title
    && title !== DEFAULT_MARKETPLACE_TITLE
    && bio
    && !DEFAULT_MARKETPLACE_BIOS.has(bio)
    && Number(rate) > 0
    && city
    && country
    && country.toLowerCase() !== 'unknown'
    && skills.length > 0
    && hasServicePackagePrice,
  );
}

async function ensureDraftContract(worker: InstanceType<typeof Worker>, company: InstanceType<typeof Company>) {
  const existing = await Contract.findOne({ workerId: worker._id });
  if (existing) {
    if (!worker.contractId || worker.contractId.toString() !== existing._id.toString()) {
      worker.contractId = existing._id;
      await worker.save();
    }
    return existing;
  }

  const contract = await Contract.create({
    companyId:        company._id,
    workerId:         worker._id,
    workerName:       `${worker.firstName} ${worker.lastName}`,
    workerEmail:      worker.email,
    companyName:      company.companyName ?? 'Your Company',
    roleTitle:        worker.roleTitle,
    contractType:     worker.workerType,
    track:            worker.track,
    payRate:          worker.payRate ?? 0,
    payCurrency:      worker.payCurrency,
    payFrequency:     worker.payFrequency,
    startDate:        worker.startDate ?? new Date(),
    endDate:          worker.endDate,
    noticePeriodDays: worker.noticePeriodDays,
    scopeOfWork:      worker.scopeOfWork,
    status:           'draft',
  });

  worker.contractId = contract._id;
  await worker.save();

  return contract;
}

// ─── Controllers ─────────────────────────────────────────────────────────────

export async function listWorkers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const workers = await Worker.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .lean();
    ok(res, workers);
  } catch (err) { next(err); }
}

export async function getMarketplaceTalent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workers = await Worker.find({
      workerType: 'contractor',
      status: { $nin: ['invited', 'terminated'] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    ok(
      res,
      workers
        .filter((worker) => hasCompletedMarketplaceProfile(worker))
        .map((worker) => mapWorkerToMarketplaceTalent(worker)),
    );
  } catch (err) {
    next(err);
  }
}

export async function getMarketplaceTalentProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worker = await Worker.findOne({
      _id: req.params.id,
      workerType: 'contractor',
      status: { $nin: ['invited', 'terminated'] },
    }).lean();

    if (!worker || !hasCompletedMarketplaceProfile(worker)) {
      throw Errors.NotFound('Marketplace profile');
    }

    ok(res, mapWorkerToMarketplaceTalentDetail(worker));
  } catch (err) {
    next(err);
  }
}

export async function createMarketplaceOrderDraft(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = marketplaceOrderDraftSchema.parse(req.body);
    const worker = await Worker.findOne({
      _id: req.params.id,
      workerType: 'contractor',
      status: { $nin: ['invited', 'terminated'] },
    });

    if (!worker || !hasCompletedMarketplaceProfile(worker)) {
      throw Errors.NotFound('Marketplace profile');
    }

    const draft = await MarketplaceOrderDraft.create({
      workerId: worker._id,
      companyId: null,
      orderNumber: createMarketplaceOrderNumber(),
      workerName: `${worker.firstName} ${worker.lastName}`.trim(),
      workerRole: worker.contractorProfile?.marketplaceTitle?.trim() || worker.roleTitle || 'Freelancer',
      packageSnapshot: data.packageSnapshot,
      clientDetails: data.clientDetails,
      status: 'draft',
      paymentStatus: 'pending',
      source: 'marketplace_consultation',
    });

    created(res, {
      id: draft._id,
      orderNumber: draft.orderNumber,
      workerId: worker._id,
      workerName: draft.workerName,
      workerRole: draft.workerRole,
      packageSnapshot: draft.packageSnapshot,
      clientDetails: draft.clientDetails,
      status: draft.status,
      paymentStatus: draft.paymentStatus,
      createdAt: draft.createdAt,
    });
  } catch (err) {
    next(err);
  }
}

export async function inviteWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = inviteSchema.parse(req.body);
    const { company } = await getCompanyForUser(req.user!.sub);
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingCompanyAccount = await CompanyAuth.findOne({ email: normalizedEmail });
    if (existingCompanyAccount) {
      throw new AppError(
        'This email is already being used for a company account. Please invite the worker with a different email.',
        409,
        'EMAIL_ALREADY_IN_USE',
      );
    }

    // Check duplicate email within same company
    const existing = await Worker.findOne({ companyId: company._id, email: normalizedEmail });
    if (existing) {
      await ensureDraftContract(existing, company);

      if (existing.status === 'invited') {
        const newToken = crypto.randomBytes(32).toString('hex');
        existing.inviteToken = newToken;
        existing.inviteSentAt = new Date();
        await existing.save();

        sendWorkerInvite(
          existing.email,
          `${existing.firstName} ${existing.lastName}`,
          company.companyName ?? 'Your Company',
          existing.roleTitle,
          newToken,
        );

        logger.info(`Worker invite refreshed: ${existing.email} by company ${company._id}`);
      } else {
        logger.info(`Worker already exists: ${existing.email} status=${existing.status}`);
      }

      ok(res, existing);
      return;
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');

    const worker = await Worker.create({
      companyId:        company._id,
      firstName:        data.firstName,
      lastName:         data.lastName,
      email:            normalizedEmail,
      country:          data.country,
      track:            data.track,
      workerType:       data.workerType,
      roleTitle:        data.roleTitle,
      department:       data.department,
      selectedServices: data.selectedServices,
      payRate:          data.payRate,
      payCurrency:      data.payCurrency,
      payFrequency:     data.payFrequency,
      startDate:        new Date(data.startDate),
      endDate:          data.endDate ? new Date(data.endDate) : null,
      noticePeriodDays: data.noticePeriodDays,
      scopeOfWork:      data.scopeOfWork,
      status:           'invited',
      kycStatus:        'pending',
      inviteToken,
      inviteSentAt:     new Date(),
    });

    await ensureDraftContract(worker, company);

    // Send invite email (non-blocking)
    sendWorkerInvite(
      worker.email,
      `${worker.firstName} ${worker.lastName}`,
      company.companyName ?? 'Your Company',
      worker.roleTitle,
      inviteToken,
    );

    logger.info(`Worker invited: ${worker.email} by company ${company._id}`);
    created(res, worker);
  } catch (err) { next(err); }
}

export async function getWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const worker = await Worker.findOne({ _id: req.params.id, companyId: company._id });
    if (!worker) throw Errors.NotFound('Worker');
    ok(res, worker);
  } catch (err) { next(err); }
}

export async function terminateWorker(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, companyId: company._id },
      { status: 'terminated' },
      { new: true },
    );
    if (!worker) throw Errors.NotFound('Worker');
    logger.info(`Worker terminated: ${worker._id}`);
    ok(res, worker);
  } catch (err) { next(err); }
}

export async function resendInvite(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const worker = await Worker.findOne({ _id: req.params.id, companyId: company._id });
    if (!worker) throw Errors.NotFound('Worker');
    if (worker.status !== 'invited') throw new AppError('Worker has already accepted the invite', 400, 'INVITE_ALREADY_ACCEPTED');

    const newToken = crypto.randomBytes(32).toString('hex');
    worker.inviteToken  = newToken;
    worker.inviteSentAt = new Date();
    await worker.save();

    sendWorkerInvite(
      worker.email,
      `${worker.firstName} ${worker.lastName}`,
      company.companyName ?? 'Your Company',
      worker.roleTitle,
      newToken,
    );

    ok(res, { message: 'Invite resent' });
  } catch (err) { next(err); }
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { company } = await getCompanyForUser(req.user!.sub);
    const companyId = company._id;

    const [activeCount, pendingInvoices, contractsExpiring] = await Promise.all([
      Worker.countDocuments({ companyId, status: 'active' }),
      // Would query Invoice model — returning 0 as placeholder until Invoice model added
      Promise.resolve(0),
      // Workers with contracts ending within 30 days
      Worker.countDocuments({
        companyId,
        status: 'active',
        endDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), $gte: new Date() },
      }),
    ]);

    // Sum pay rates for active workers as monthly cost estimate
    const activeWorkers = await Worker.find({ companyId, status: 'active' }).lean();
    const monthlyTotalCost = activeWorkers.reduce((sum, w) => {
      if (!w.payRate) return sum;
      const rate = w.payFrequency === 'biweekly' ? w.payRate * 2.17 : w.payRate;
      return sum + rate;
    }, 0);

    ok(res, {
      activeWorkers:    activeCount,
      pendingInvoices:  pendingInvoices,
      nextPayrollDate:  null,
      monthlyTotalCost: Math.round(monthlyTotalCost),
      currency:         company.contractCurrency ?? 'USD',
      pendingKyc:       await Worker.countDocuments({ companyId, kycStatus: 'pending', status: { $ne: 'terminated' } }),
      contractsExpiring,
    });
  } catch (err) { next(err); }
}
