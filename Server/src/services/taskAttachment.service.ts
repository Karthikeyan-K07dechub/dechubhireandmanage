import { createHash, randomUUID } from 'crypto';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export const VERIFICATION_MAX_BYTES = 2 * 1024 * 1024;
export interface TaskAttachmentFile { bucket: string; path: string; fileName: string; mimeType: string; size: number; sha256: string }
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
async function request(endpoint: string, init: RequestInit = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new AppError('TaskAttachment storage is not configured.', 503, 'STORAGE_UNAVAILABLE');
  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/${endpoint}`, { ...init, headers: { apikey: env.SUPABASE_SECRET_KEY, ...(env.SUPABASE_SECRET_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` } : {}), ...init.headers }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Storage request failed');
    return response;
  } catch { throw new AppError('TaskAttachment storage is unavailable. Please try again.', 502, 'STORAGE_UNAVAILABLE'); }
}
async function requirePrivate(bucket: string) {
  const response = await request(`bucket/${encodeURIComponent(bucket)}`);
  if ((await response.json() as { public?: boolean }).public !== false) throw new AppError('Payment proof buckets must be private.', 503, 'PRIVATE_BUCKET_REQUIRED');
}
const objectPath = (file: TaskAttachmentFile) => [file.bucket, ...file.path.split('/')].map(encodeURIComponent).join('/');
export function validateTaskAttachmentFile(file: Express.Multer.File,maxBytes=10*1024*1024) {
 if (!file.buffer?.length || file.buffer.length > maxBytes) throw new AppError('Choose a file up to '+Math.floor(maxBytes/1024/1024)+' MB.',422,'INVALID_ATTACHMENT');
 return { mime: 'application/octet-stream', extension: file.originalname.split('.').pop()?.replace(/[^a-zA-Z0-9]/g,'').slice(0,10) || 'bin' };
}
export async function uploadTaskAttachmentFile(file: Express.Multer.File, ownerId: string, docType: string,maxBytes=10*1024*1024, bucket=env.SUPABASE_INVOICE_BUCKET): Promise<TaskAttachmentFile> {
  const type = validateTaskAttachmentFile(file,maxBytes);
  const folder = ownerId;
  const document = { bucket, path: `${folder}/${docType}/${randomUUID()}.${type.extension}`, fileName: file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(-160), mimeType: type.mime, size: file.buffer.length, sha256: digest(file.buffer) };
  await requirePrivate(bucket);
  await request(`object/${objectPath(document)}`, { method: 'POST', headers: { 'Content-Type': type.mime, 'x-upsert': 'false' }, body: new Uint8Array(file.buffer) });
  return document;
}
export async function downloadTaskAttachmentFile(file: TaskAttachmentFile) {
  await requirePrivate(file.bucket);
  const response = await request(`object/authenticated/${objectPath(file)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== file.size || digest(bytes) !== file.sha256) throw new AppError('TaskAttachment document integrity check failed.', 502, 'INVALID_STORED_DOCUMENT');
  return bytes;
}
export async function removeTaskAttachmentFile(file: TaskAttachmentFile) {
  await request(`object/${encodeURIComponent(file.bucket)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [file.path] }) });
}
