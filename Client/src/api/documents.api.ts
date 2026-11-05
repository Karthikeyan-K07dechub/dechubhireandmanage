import { api, unwrapApiData } from './client';
export interface LibraryDocument {
  _id: string; category: 'project' | 'contract' | 'invoice' | 'verification';
  fileName: string; status: string; uploadedAt: string; companyName: string;
  projectId: string | null; projectName: string; workerName: string;
  uploadedBy: string; downloadUrl: string | null; adminOnly?: boolean; replacementReason?: string;
}
export async function listLibraryDocuments(): Promise<LibraryDocument[]> {
  return unwrapApiData((await api.get('/documents')).data);
}
export function documentError(error: unknown): string {
  const failure = error as { message?: string; response?: { data?: { error?: { message?: string } } } };
  return failure.response?.data?.error?.message || failure.message || 'The document action failed. Please try again.';
}
export async function openDocument(item: LibraryDocument, view = false) {
  if (item.adminOnly || !item.downloadUrl) throw new Error('Only Dechub admins can access verification files.');
  const response = await api.get(item.downloadUrl, { responseType: 'blob', params: view ? { view: '1' } : undefined });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a'); anchor.href = url;
  if (view) { anchor.target = '_blank'; anchor.rel = 'noopener'; } else anchor.download = item.fileName;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
