import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AiCallbackRequest } from '../models/AiCallbackRequest';
import { AiConversation } from '../models/AiConversation';
import { AiTalentSearch, type AiTalentMatchType } from '../models/AiTalentSearch';
import { TalentRequest } from '../models/TalentRequest';
import { Worker } from '../models/Worker';
import { isMarketplaceEligible } from '../services/marketplaceEligibility.service';
import { queueBookDemoSubmissionToGoogleSheets } from '../services/googleSheets.service';
import { sendAiCallbackAdminNotificationEmail, sendTalentRequestAdminNotificationEmail } from '../utils/email';
import { logger } from '../utils/logger';

const ADMIN_NOTIFICATION_TO = 'karthik@dechub.in';
const TEN_MINUTES_MS = 10 * 60 * 1000;
const SENSITIVE_FIELD_PATTERN = /passport|iban|card|bank|ssn|emirates_id|aadhaar/i;
const PROJECT_TYPES = [
  'Hire freelance talent',
  'Build a remote team',
  'UI/UX Design',
  'Web Development',
  'Mobile App',
  'Ongoing support',
] as const;
const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com']);

function booleanInput(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === 'no') return false;
  return value;
}

const booleanSchema = z.preprocess(booleanInput, z.boolean());
const phoneSchema = z.string().trim().min(7).max(20).regex(/^[+\d -]+$/, 'phone is not valid');
const websiteSchema = z.string().trim().min(1).max(300).transform((value, ctx) => {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    new URL(candidate);
    return candidate;
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'company_website is not valid' });
    return z.NEVER;
  }
});
const optionalWebsiteSchema = z.union([websiteSchema, z.literal('')]).optional().default('');
const projectTypeSchema = z.string().trim().min(1).max(100).transform((value, ctx) => {
  const match = PROJECT_TYPES.find((item) => item.toLowerCase() === value.toLowerCase());
  if (!match) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'project_type is not supported' });
    return z.NEVER;
  }
  return match;
});

const demoRequestSchema = z.object({
  company_name: z.string().trim().max(150).optional().default(''),
  company_website: optionalWebsiteSchema,
  contact_name: z.string().trim().min(1).max(100),
  work_email: z.string().trim().toLowerCase().email('work_email is not valid').max(200),
  project_type: projectTypeSchema,
  phone: phoneSchema.optional(),
  project_details: z.string().trim().min(10).max(2000),
  consent_contact: booleanSchema.refine((value) => value === true, 'consent_contact must be true'),
  consent_marketing_email: booleanSchema.optional().default(false),
  consent_marketing_whatsapp: booleanSchema.optional().default(false),
  channel: z.enum(['chat', 'voice']).optional().default('chat'),
  conversation_id: z.string().trim().max(200).optional(),
  search_id: z.string().trim().max(80).optional(),
});

const talentSearchSchema = z.object({
  role: z.string().trim().min(2).max(100),
  skills: z.array(z.string().trim().min(1).max(50)).max(10).optional().default([]),
  level: z.string().trim().min(1).max(50).optional(),
  conversation_id: z.string().trim().max(200).optional(),
});

const callbackSchema = z.object({
  contact_name: z.string().trim().min(1).max(100),
  work_email: z.string().trim().toLowerCase().email('work_email is not valid').max(200),
  phone: phoneSchema.optional(),
  question: z.string().trim().min(5).max(1000),
  consent_contact: booleanSchema.refine((value) => value === true, 'consent_contact must be true'),
  channel: z.enum(['chat', 'voice']).optional().default('chat'),
  conversation_id: z.string().trim().max(200).optional(),
});

function firstError(result: z.SafeParseReturnType<unknown, unknown>): string | null {
  if (result.success) return null;
  return result.error.issues[0]?.message || 'request is not valid';
}

function hasSensitiveKey(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => hasSensitiveKey(item));
  return Object.entries(value as Record<string, unknown>).some(([key, item]) => (
    SENSITIVE_FIELD_PATTERN.test(key) || hasSensitiveKey(item)
  ));
}

function requestId(prefix: 'DR' | 'CB' | 'TS'): string {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${new Date().getUTCFullYear()}-${suffix}`;
}

function matchWords(value: string): string[] {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])).filter((word) => word.length > 1);
}

function requiresVerifiedTalent(): boolean {
  return env.AI_TALENT_REQUIRE_VERIFIED.trim().toLowerCase() === 'true';
}

function anonymizedName(firstName: string, lastName: string): string {
  const first = firstName.trim();
  const initial = lastName.trim().slice(0, 1).toUpperCase();
  return initial ? `${first} ${initial}.` : first;
}

function deriveAiCompanyDetails(companyName: string, companyWebsite: string, workEmail: string) {
  const domain = workEmail.split('@')[1]?.trim().toLowerCase() ?? '';
  const isBusinessDomain = Boolean(domain) && !PUBLIC_EMAIL_DOMAINS.has(domain);
  return {
    companyName: companyName.trim() || (isBusinessDomain ? domain : 'Not provided'),
    companyWebsite: companyWebsite.trim() || (isBusinessDomain ? `https://${domain}` : ''),
  };
}

type InternalShownProfile = { name: string; role: string; adminLink: string };

async function findShownProfiles(workerIds: unknown[], adminRequestId: string): Promise<InternalShownProfile[]> {
  if (!workerIds.length) return [];
  const workers = await Worker.find({ _id: { $in: workerIds } })
    .select('firstName lastName roleTitle contractorProfile.marketplaceTitle')
    .lean();
  const byId = new Map(workers.map((worker) => [worker._id.toString(), worker]));
  const adminLink = `${env.CLIENT_URL.replace(/\/$/, '')}/admin/talent-requests/${adminRequestId}`;
  return workerIds.flatMap((id) => {
    const worker = byId.get(String(id));
    if (!worker) return [];
    return [{
      name: `${worker.firstName} ${worker.lastName}`.trim(),
      role: worker.contractorProfile?.marketplaceTitle?.trim() || worker.roleTitle || 'Freelancer',
      adminLink,
    }];
  });
}

function splitContactName(contactName: string): { firstName: string; lastName: string } {
  const parts = contactName.split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || 'Contact', lastName: parts.slice(1).join(' ') || 'Contact' };
}

function normalized(value: string): string {
  return value.trim().toLowerCase();
}

function htmlSafe(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character] || character));
}

function queueDemoNotifications(input: {
  requestId: string;
  companyName: string;
  companyWebsite: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  projectType: string;
  projectDescription: string;
  channel: 'chat' | 'voice';
  conversationId: string;
  aiMatchStatus: 'matched' | 'closest' | 'sourcing_needed';
  shownProfiles: InternalShownProfile[];
}): void {
  const payload = {
    requestId: input.requestId,
    companyName: htmlSafe(input.companyName),
    companyWebsite: htmlSafe(input.companyWebsite || 'Not provided'),
    contactFirstName: htmlSafe(input.contactFirstName),
    contactLastName: htmlSafe(input.contactLastName),
    contactEmail: htmlSafe(input.email),
    phoneNumber: htmlSafe(input.phone),
    projectType: htmlSafe(input.projectType),
    projectDescription: htmlSafe(input.projectDescription),
    requestedServices: [],
    dbSaveSucceeded: true,
    source: 'AI assistant',
    aiMatchStatus: input.aiMatchStatus,
    aiShownProfiles: input.shownProfiles,
  };

  void sendTalentRequestAdminNotificationEmail(ADMIN_NOTIFICATION_TO, payload).catch(() => {
    logger.error('Failed to send AI demo notification email', { requestId: input.requestId });
  });
  const sheetMatchSummary = input.shownProfiles.length
    ? input.shownProfiles.map((profile) => `${profile.name} - ${profile.role} - ${profile.adminLink}`).join(' | ')
    : 'No marketplace profiles shown; sourcing needed.';
  queueBookDemoSubmissionToGoogleSheets({
    submittedAt: new Date().toISOString(),
    companyName: input.companyName,
    companyWebsite: input.companyWebsite || 'Not provided',
    contactName: `${input.contactFirstName} ${input.contactLastName}`.trim(),
    workEmail: input.email,
    phoneNumber: input.phone,
    projectType: input.projectType,
    projectDescription: `${input.projectDescription}\n\nAI match status: ${input.aiMatchStatus}\nAI shown profiles: ${sheetMatchSummary}`,
    requestedServices: [],
    dbSaveStatus: 'saved',
    requestId: input.requestId,
    source: 'AI assistant',
    requestType: 'demo',
    channel: input.channel,
    conversationId: input.conversationId,
    aiMatchStatus: input.aiMatchStatus,
    aiShownProfiles: input.shownProfiles.map((profile) => `${profile.name} - ${profile.role} - ${profile.adminLink}`).join(' | '),
  });
}

export async function searchAiTalent(req: Request, res: Response): Promise<void> {
  const parsed = talentSearchSchema.safeParse(req.body);
  const validationError = firstError(parsed);
  if (validationError || !parsed.success) {
    res.status(400).json({ ok: false, error: validationError || 'request is not valid' });
    return;
  }

  const data = parsed.data;
  const searchId = requestId('TS');
  try {
    const workers = await Worker.find({
      workerType: 'contractor',
      status: { $nin: ['invited', 'terminated'] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const roleText = data.role.toLowerCase().trim();
    const roleWords = matchWords(roleText);
    const requestedSkills = Array.from(new Set(data.skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean)));
    const levelWords = matchWords(data.level ?? '');

    const scored = workers
      .filter((worker) => isMarketplaceEligible(worker))
      .filter((worker) => !requiresVerifiedTalent() || (worker.status === 'active' && worker.kycStatus === 'approved'))
      .map((worker) => {
        const title = (worker.contractorProfile?.marketplaceTitle?.trim() || worker.roleTitle || 'Freelancer').toLowerCase();
        const titleWords = matchWords(title);
        const skills = Array.isArray(worker.contractorProfile?.skills)
          ? worker.contractorProfile.skills.map((skill) => skill.toLowerCase().trim()).filter(Boolean)
          : [];
        const titleMatches = title === roleText || title.includes(roleText) || roleText.includes(title);
        const titleWordScore = roleWords.filter((word) => titleWords.includes(word)).length * 15;
        const skillOverlap = Array.from(new Set([...requestedSkills, ...roleWords]))
          .filter((wanted) => skills.some((skill) => skill === wanted || skill.includes(wanted) || wanted.includes(skill))).length;
        const levelBonus = levelWords.filter((word) => titleWords.includes(word)).length * 2;
        return {
          worker,
          titleMatches,
          skillOverlap,
          score: (titleMatches ? 200 : 0) + titleWordScore + (skillOverlap * 20) + levelBonus,
        };
      });

    const exact = scored.filter((candidate) => candidate.titleMatches);
    const closest = exact.length ? [] : scored.filter((candidate) => candidate.skillOverlap > 0);
    const selected = (exact.length ? exact : closest)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);
    const matchType: AiTalentMatchType = exact.length ? 'exact' : closest.length ? 'closest' : 'none';

    await AiTalentSearch.create({
      searchId,
      conversationId: data.conversation_id ?? '',
      role: data.role,
      skills: data.skills,
      level: data.level ?? '',
      matchType,
      workerIds: selected.map((candidate) => candidate.worker._id),
    });

    res.status(200).json({
      ok: true,
      search_id: searchId,
      match_type: matchType,
      matches: selected.map((candidate) => ({
        name: anonymizedName(candidate.worker.firstName, candidate.worker.lastName),
        role: candidate.worker.contractorProfile?.marketplaceTitle?.trim() || candidate.worker.roleTitle || 'Freelancer',
        years_of_experience: candidate.worker.contractorProfile?.yearsOfExperience ?? null,
      })),
    });
  } catch (error) {
    logger.error('AI talent search failed', { error: error instanceof Error ? error.name : 'unknown', searchId });
    await AiTalentSearch.create({
      searchId,
      conversationId: data.conversation_id ?? '',
      role: data.role,
      skills: data.skills,
      level: data.level ?? '',
      matchType: 'none',
      workerIds: [],
    }).catch((storageError) => logger.error('Failed to store AI talent search failure', { error: storageError instanceof Error ? storageError.name : 'unknown', searchId }));
    res.status(200).json({ ok: true, search_id: searchId, match_type: 'none', matches: [] });
  }
}

export async function createAiDemoRequest(req: Request, res: Response, _next: NextFunction): Promise<void> {
  if (hasSensitiveKey(req.body)) {
    res.status(400).json({ ok: false, error: 'sensitive information is not accepted' });
    return;
  }
  const parsed = demoRequestSchema.safeParse(req.body);
  const error = firstError(parsed);
  if (error || !parsed.success) {
    res.status(400).json({ ok: false, error: error || 'request is not valid' });
    return;
  }

  try {
    const data = parsed.data;
    const companyDetails = deriveAiCompanyDetails(data.company_name, data.company_website, data.work_email);
    const companyNameNormalized = normalized(companyDetails.companyName);
    const cutoff = new Date(Date.now() - TEN_MINUTES_MS);
    const existing = await TalentRequest.findOne({
      source: 'ai_assistant',
      email: data.work_email,
      aiCompanyNameNormalized: companyNameNormalized,
      createdAt: { $gte: cutoff },
    }).sort({ createdAt: -1 });
    if (existing?.aiRequestId) {
      res.status(200).json({ ok: true, request_id: existing.aiRequestId });
      return;
    }

    const contact = splitContactName(data.contact_name);
    const aiRequestId = requestId('DR');
    const aiSearch = data.search_id
      ? await AiTalentSearch.findOne({ searchId: data.search_id }).sort({ createdAt: -1 })
      : null;
    const linkedSearch = aiSearch ?? (data.conversation_id
      ? await AiTalentSearch.findOne({ conversationId: data.conversation_id }).sort({ createdAt: -1 })
      : null);
    const aiMatchStatus = linkedSearch?.matchType === 'exact'
      ? 'matched'
      : linkedSearch?.matchType === 'closest'
      ? 'closest'
      : 'sourcing_needed';
    const aiShownWorkerIds = linkedSearch?.workerIds ?? [];
    const request = await TalentRequest.create({
      companyId: null,
      workerId: null,
      workerName: 'Open talent request',
      workerRole: 'Best-fit marketplace candidate to be suggested',
      workerProfileUrl: '',
      companyName: companyDetails.companyName,
      companyWebsite: companyDetails.companyWebsite,
      contactFirstName: contact.firstName,
      contactLastName: contact.lastName,
      phoneNumber: data.phone || '',
      email: data.work_email,
      projectType: data.project_type,
      projectDescription: data.project_details,
      requestedServices: [],
      source: 'ai_assistant',
      channel: data.channel,
      conversationId: data.conversation_id || '',
      consentContact: data.consent_contact,
      consentMarketingEmail: data.consent_marketing_email,
      consentMarketingWhatsapp: data.consent_marketing_whatsapp,
      aiRequestId,
      aiCompanyNameNormalized: companyNameNormalized,
      aiMatchStatus,
      aiShownWorkerIds,
    });
    const shownProfiles = await findShownProfiles(aiShownWorkerIds, request._id.toString());

    queueDemoNotifications({
      requestId: aiRequestId,
      companyName: request.companyName,
      companyWebsite: request.companyWebsite,
      contactFirstName: request.contactFirstName,
      contactLastName: request.contactLastName,
      email: request.email,
      phone: request.phoneNumber,
      projectType: request.projectType,
      projectDescription: request.projectDescription,
      channel: data.channel,
      conversationId: data.conversation_id || '',
      aiMatchStatus,
      shownProfiles,
    });
    res.status(200).json({ ok: true, request_id: aiRequestId });
  } catch (error) {
    logger.error('Failed to create AI demo request', { error: error instanceof Error ? error.name : 'unknown' });
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
}

export async function createAiCallbackRequest(req: Request, res: Response, _next: NextFunction): Promise<void> {
  if (hasSensitiveKey(req.body)) {
    res.status(400).json({ ok: false, error: 'sensitive information is not accepted' });
    return;
  }
  const parsed = callbackSchema.safeParse(req.body);
  const error = firstError(parsed);
  if (error || !parsed.success) {
    res.status(400).json({ ok: false, error: error || 'request is not valid' });
    return;
  }

  try {
    const data = parsed.data;
    const questionNormalized = normalized(data.question);
    const existing = await AiCallbackRequest.findOne({
      source: 'ai_assistant',
      workEmail: data.work_email,
      questionNormalized,
      createdAt: { $gte: new Date(Date.now() - TEN_MINUTES_MS) },
    }).sort({ createdAt: -1 });
    if (existing) {
      res.status(200).json({ ok: true, request_id: existing.requestId });
      return;
    }

    const callback = await AiCallbackRequest.create({
      requestId: requestId('CB'),
      contactName: data.contact_name,
      workEmail: data.work_email,
      phone: data.phone || '',
      question: data.question,
      questionNormalized,
      channel: data.channel,
      conversationId: data.conversation_id || '',
      consentContact: data.consent_contact,
    });
    void sendAiCallbackAdminNotificationEmail(ADMIN_NOTIFICATION_TO, {
      contactName: callback.contactName,
      workEmail: callback.workEmail,
      phone: callback.phone,
      question: callback.question,
      requestId: callback.requestId,
    }).catch(() => logger.error('Failed to send AI callback notification email', { requestId: callback.requestId }));
    queueBookDemoSubmissionToGoogleSheets({
      submittedAt: callback.createdAt.toISOString(), companyName: '', companyWebsite: '', contactName: callback.contactName,
      workEmail: callback.workEmail, phoneNumber: callback.phone, projectType: 'Callback request',
      projectDescription: callback.question, requestedServices: [], dbSaveStatus: 'saved', requestId: callback.requestId,
      source: 'AI assistant', requestType: 'callback', channel: callback.channel, conversationId: callback.conversationId,
    });
    res.status(200).json({ ok: true, request_id: callback.requestId });
  } catch (error) {
    logger.error('Failed to create AI callback request', { error: error instanceof Error ? error.name : 'unknown' });
    res.status(500).json({ ok: false, error: 'internal_error' });
  }
}

function flatDataCollection(value: unknown, prefix = '', output: Record<string, string> = {}): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return output;
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    const currentKey = prefix ? `${prefix}.${key}` : key;
    if (item && typeof item === 'object' && !Array.isArray(item) && 'value' in item) {
      const collected = (item as { value?: unknown }).value;
      output[currentKey] = typeof collected === 'string' ? collected : String(collected ?? '');
    } else if (item && typeof item === 'object' && !Array.isArray(item)) {
      flatDataCollection(item, currentKey, output);
    } else {
      output[currentKey] = typeof item === 'string' ? item : String(item ?? '');
    }
  }
  return output;
}

async function persistElevenLabsConversation(event: Record<string, unknown>): Promise<void> {
  const data = event.data as Record<string, unknown> | undefined;
  const conversationId = typeof data?.conversation_id === 'string' ? data.conversation_id : '';
  if (!conversationId) return;
  const metadata = data?.metadata as Record<string, unknown> | undefined;
  const analysis = data?.analysis as Record<string, unknown> | undefined;
  const dataCollection = flatDataCollection(analysis?.data_collection_results);
  const consent = dataCollection.consent_contact?.trim().toLowerCase() === 'yes';
  const transcript = Array.isArray(data?.transcript) ? data.transcript.map((turn) => {
    const item = turn as Record<string, unknown>;
    return { role: String(item.role || ''), message: String(item.message || ''), timeInCallSecs: Number(item.time_in_call_secs || 0) };
  }) : [];
  const evaluations: Record<string, { result: string; rationale: string }> = {};
  const rawEvaluations = analysis?.evaluation_criteria_results;
  if (rawEvaluations && typeof rawEvaluations === 'object' && !Array.isArray(rawEvaluations)) {
    for (const [criterion, value] of Object.entries(rawEvaluations as Record<string, unknown>)) {
      const item = value as Record<string, unknown>;
      evaluations[criterion] = { result: String(item?.result || ''), rationale: String(item?.rationale || '') };
    }
  }
  const channel = metadata?.phone_call ? 'voice' : 'unknown';
  const startSeconds = Number(metadata?.start_time_unix_secs || 0);
  let requestId = '';
  if (consent) {
    const demo = await TalentRequest.findOne({ conversationId, source: 'ai_assistant' }).sort({ createdAt: -1 });
    const callback = demo ? null : await AiCallbackRequest.findOne({ conversationId, source: 'ai_assistant' }).sort({ createdAt: -1 });
    requestId = demo?.aiRequestId || callback?.requestId || '';
  }
  await AiConversation.findOneAndUpdate(
    { conversationId },
    {
      $set: {
        agentId: String(data?.agent_id || ''), agentName: String(data?.agent_name || 'bridge_visitor'), channel,
        startedAt: startSeconds ? new Date(startSeconds * 1000) : null, durationSecs: Number(metadata?.call_duration_secs || 0),
        status: String(data?.status || ''), transcript, summary: String(analysis?.transcript_summary || ''),
        callSuccessful: String(analysis?.call_successful || 'unknown'), dataCollection, evaluation: evaluations,
        requestId, consentContact: consent,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

function verifiedElevenLabsSignature(req: Request): boolean {
  const signature = req.header('ElevenLabs-Signature');
  const rawBody = Buffer.isBuffer(req.body) ? req.body : null;
  if (!signature || !rawBody || !env.ELEVENLABS_WEBHOOK_SECRET) return false;
  const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=', 2)));
  const timestamp = parts.t;
  const signatureValue = parts.v0;
  if (!timestamp || !signatureValue || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > 30 * 60) return false;
  const expected = crypto.createHmac('sha256', env.ELEVENLABS_WEBHOOK_SECRET).update(`${timestamp}.`).update(rawBody).digest('hex');
  const received = Buffer.from(signatureValue, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}

export function receiveElevenLabsWebhook(req: Request, res: Response): void {
  if (!verifiedElevenLabsSignature(req)) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }
  let event: Record<string, unknown>;
  try {
    event = JSON.parse((req.body as Buffer).toString('utf8')) as Record<string, unknown>;
  } catch {
    res.status(400).json({ ok: false, error: 'invalid_payload' });
    return;
  }
  res.status(200).json({ ok: true });
  if (event.type === 'post_call_transcription') {
    void persistElevenLabsConversation(event).catch((error) => {
      logger.error('Failed to store ElevenLabs conversation', { error: error instanceof Error ? error.name : 'unknown' });
    });
  }
}
