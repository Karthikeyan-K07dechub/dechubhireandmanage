import { api, ApiResponse, normalizeError, unwrapApiData } from './client';

export interface TalentRequestItem {
  _id: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  workerProfileUrl?: string;
  companyName: string;
  contactFirstName: string;
  contactLastName: string;
  phoneNumber: string;
  email: string;
  projectType: string;
  budget: string;
  projectDescription: string;
  status: string;
  unread: boolean;
  createdAt: string;
}

export async function listTalentRequests(params: Record<string, string | number | undefined> = {}) {
  try {
    const res = await api.get<ApiResponse<any>>('/admin/talent-requests', { params });
    return unwrapApiData(res.data);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getTalentRequest(id: string) {
  try {
    const res = await api.get<ApiResponse<TalentRequestItem>>(`/admin/talent-requests/${id}`);
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function unreadCount() {
  try {
    const res = await api.get<ApiResponse<{ unread: number }>>('/admin/talent-requests/unread-count');
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function updateTalentRequestStatus(id: string, status: string) {
  try {
    const res = await api.patch<ApiResponse<any>>(`/admin/talent-requests/${id}/status`, { status });
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function markAsRead(id: string) {
  try {
    const res = await api.post<ApiResponse<any>>(`/admin/talent-requests/${id}/mark-as-read`);
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}
