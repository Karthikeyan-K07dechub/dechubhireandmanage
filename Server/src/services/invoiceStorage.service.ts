import { createHash, randomUUID } from 'crypto';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export type InvoiceDocument = { bucket: string; path: string; fileName: string; mimeType?: string; size: number; sha256: string };
const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
function configuration() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) throw new AppError('Invoice storage is not configured.', 503, 'STORAGE_UNAVAILABLE');
  return { url: env.SUPABASE_URL.replace(/\/$/, ''), headers: { apikey: env.SUPABASE_SECRET_KEY, ...(env.SUPABASE_SECRET_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}` } : {}) } };
}
async function storageRequest(path: string, init: RequestInit = {}) {
  const config = configuration();
  try {
    const response = await fetch(`${config.url}/storage/v1/${path}`, { ...init, headers: { ...config.headers, ...init.headers }, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('Storage request failed');
    return response;
  } catch { throw new AppError('Invoice storage is unavailable. Please try again.', 502, 'STORAGE_UNAVAILABLE'); }
}
async function requirePrivateBucket(bucket: string) {
  const response = await storageRequest(`bucket/${encodeURIComponent(bucket)}`);
  const details = await response.json() as { public?: boolean };
  if (details.public !== false) throw new AppError('Invoice storage must use a private bucket.', 503, 'PRIVATE_BUCKET_REQUIRED');
}
const objectPath = (document: InvoiceDocument) => [document.bucket, ...document.path.split('/')].map(encodeURIComponent).join('/');
export async function uploadInvoiceDocument(file: Express.Multer.File, companyId: string, invoiceId: string): Promise<InvoiceDocument> {
  const bytes = file.buffer;
  let mimeType = ''; let extension = '';
  if (bytes.subarray(0, 5).toString() === '%PDF-') { mimeType = 'application/pdf'; extension = 'pdf'; }
  else if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mimeType = 'image/png'; extension = 'png'; }
  else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) { mimeType = 'image/jpeg'; extension = 'jpg'; }
  else if (bytes.subarray(0,4).toString() === 'RIFF' && bytes.subarray(8,12).toString() === 'WEBP') { mimeType = 'image/webp'; extension = 'webp'; }
  const suffix = file.originalname.split('.').pop()?.toLowerCase();
  if (!bytes.length || bytes.length > 10 * 1024 * 1024 || file.size > 10 * 1024 * 1024 || !mimeType || file.mimetype !== mimeType || !(extension === 'jpg' ? ['jpg','jpeg'].includes(suffix || '') : suffix === extension)) throw new AppError('Choose a valid PDF, PNG, JPEG, or WebP file up to 10 MB.', 422, 'INVALID_INVOICE_FILE');
  const document = { bucket: env.SUPABASE_INVOICE_BUCKET, path: companyId + '/' + invoiceId + '/' + randomUUID() + '.' + extension, fileName: file.originalname.replace(/[^a-zA-Z0-9._ -]/g, '_').slice(-160), mimeType, size: bytes.length, sha256: digest(bytes) };
  await requirePrivateBucket(document.bucket);
  await storageRequest(`object/${objectPath(document)}`, { method: 'POST', headers: { 'Content-Type': document.mimeType, 'x-upsert': 'false' }, body: new Uint8Array(file.buffer) });
  return document;
}
export async function downloadInvoiceDocument(document: InvoiceDocument): Promise<Buffer> {
  await requirePrivateBucket(document.bucket);
  const response = await storageRequest(`object/authenticated/${objectPath(document)}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== document.size || digest(bytes) !== document.sha256) throw new AppError('Invoice document integrity check failed.', 502, 'INVALID_STORED_INVOICE');
  return bytes;
}
export async function removeInvoiceDocument(document: InvoiceDocument): Promise<void> {
  await storageRequest(`object/${encodeURIComponent(document.bucket)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [document.path] }) });
}
export function invoiceView<T extends { clientDocument?: InvoiceDocument | null }>(invoice: T) {
  const { clientDocument, ...details } = invoice;
  return { ...details, documentName: clientDocument?.fileName ?? null };
}
