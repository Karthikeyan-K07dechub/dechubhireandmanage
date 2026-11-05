import { createHash, randomUUID } from 'crypto';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export const VERIFICATION_MAX_BYTES = 2 * 1024 * 1024;
export interface PaymentProofFile { bucket: string; path: string; fileName: string; mimeType: string; size: number; sha256: string }
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
async function request(endpoint: string, init: RequestInit = {}) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new AppError('PaymentProof storage is not configured.', 503, 'STORAGE_UNAVAILABLE');
  try {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/${endpoint}`, { ...init, headers: { apikey: env.SUPABASE_SECRET_KEY, ...(env.SUPABASE_SECRET_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` } : {}), ...init.headers }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Storage request failed');
    return response;
  } catch { throw new AppError('PaymentProof storage is unavailable. Please try again.', 502, 'STORAGE_UNAVAILABLE'); }
}
async function requirePrivate(bucket: string) {
  const response = await request(`bucket/${encodeURIComponent(bucket)}`);
  if ((await response.json() as { public?: boolean }).public !== false) throw new AppError('Payment proof buckets must be private.', 503, 'PRIVATE_BUCKET_REQUIRED');
}
const objectPath = (file: PaymentProofFile) => [file.bucket, ...file.path.split('/')].map(encodeURIComponent).join('/');
export function validatePaymentProofFile(file: Express.Multer.File) {
  const bytes = file.buffer;
  if (!bytes?.length || bytes.length > VERIFICATION_MAX_BYTES || file.size > VERIFICATION_MAX_BYTES) throw new AppError('Each payment proof file must be no larger than 2 MB.', 422, 'INVALID_VERIFICATION_SIZE');
  let type: { mime: string; extension: string } | undefined;
  if (bytes.subarray(0, 5).toString() === '%PDF-') type = { mime: 'application/pdf', extension: 'pdf' };
  else if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) type = { mime: 'image/png', extension: 'png' };
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) type = { mime: 'image/jpeg', extension: 'jpg' };
  else if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') type = { mime: 'image/webp', extension: 'webp' };
  if (!type || !/\.(pdf|png|jpe?g|webp)$/i.test(file.originalname) || file.mimetype !== type.mime) throw new AppError('Choose a valid PDF, PNG, JPEG, or WebP document.', 422, 'INVALID_VERIFICATION_FILE');
  return type;
}
export async function uploadPaymentProofFile(file: Express.Multer.File, ownerId: string, docType: string): Promise<PaymentProofFile> {
  const type = validatePaymentProofFile(file);
  const bucket = 'payment_proofs';
  const folder = ownerId;
  const document = { bucket, path: `${folder}/${docType}/${randomUUID()}.${type.extension}`, fileName: file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(-160), mimeType: type.mime, size: file.buffer.length, sha256: digest(file.buffer) };
  await requirePrivate(bucket);
  await request(`object/${objectPath(document)}`, { method: 'POST', headers: { 'Content-Type': type.mime, 'x-upsert': 'false' }, body: new Uint8Array(file.buffer) });
  return document;
}
export async function downloadPaymentProofFile(file: PaymentProofFile) {
  await requirePrivate(file.bucket);
  const response = await request(`object/authenticated/${objectPath(file)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== file.size || digest(bytes) !== file.sha256) throw new AppError('PaymentProof document integrity check failed.', 502, 'INVALID_STORED_DOCUMENT');
  return bytes;
}
export async function removePaymentProofFile(file: PaymentProofFile) {
  await request(`object/${encodeURIComponent(file.bucket)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [file.path] }) });
}
