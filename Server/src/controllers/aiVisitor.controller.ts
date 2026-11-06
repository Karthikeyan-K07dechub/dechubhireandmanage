import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { AiCallbackRequest } from '../models/AiCallbackRequest';
import { AiConversation } from '../models/AiConversation';
import { TalentRequest } from '../models/TalentRequest';
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
const projectTypeSchema = z.string().trim().min(1).max(100).transform((value, ctx) => {
  const match = PROJECT_TYPES.find((item) => item.toLowerCase() === value.toLowerCase());
  if (!match) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'project_type is not supported' });
    return z.NEVER;
  }
  return match;
});

const demoRequestSchema = z.object({
  company_name: z.string().trim().min(1).max(150),
  company_website: websiteSchema,
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

function requestId(prefix: 'DR' | 'CB'): string {
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${new Date().getUTCFullYear()}-${suffix}`;
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
}): void {
  const payload = {
    requestId: input.requestId,
    companyName: htmlSafe(input.companyName),
    companyWebsite: htmlSafe(input.companyWebsite),
    contactFirstName: htmlSafe(input.contactFirstName),
    contactLastName: htmlSafe(input.contactLastName),
    contactEmail: htmlSafe(input.email),
    phoneNumber: htmlSafe(input.phone),
    projectType: htmlSafe(input.projectType),
    projectDescription: htmlSafe(input.projectDescription),
    requestedServices: [],
    dbSaveSucceeded: true,
    source: 'AI assistant',
  };

  void sendTalentRequestAdminNotificationEmail(ADMIN_NOTIFICATION_TO, payload).catch(() => {
    logger.error('Failed to send AI demo notification email', { requestId: input.requestId });
  });
  queueBookDemoSubmissionToGoogleSheets({
    submittedAt: new Date().toISOString(),
    companyName: input.companyName,
    companyWebsite: input.companyWebsite,
    contactName: `${input.contactFirstName} ${input.contactLastName}`.trim(),
    workEmail: input.email,
    phoneNumber: input.phone,
    projectType: input.projectType,
    projectDescription: input.projectDescription,
    requestedServices: [],
    dbSaveStatus: 'saved',
    requestId: input.requestId,
    source: 'AI assistant',
    requestType: 'demo',
    channel: input.channel,
    conversationId: input.conversationId,
  });
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
    const companyNameNormalized = normalized(data.company_name);
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
    const request = await TalentRequest.create({
      companyId: null,
      workerId: null,
      workerName: 'Open talent request',
      workerRole: 'Best-fit marketplace candidate to be suggested',
      workerProfileUrl: '',
      companyName: data.company_name,
      companyWebsite: data.company_website,
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
    });

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
