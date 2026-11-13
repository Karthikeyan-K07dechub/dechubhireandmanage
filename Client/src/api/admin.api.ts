import { api, ApiResponse, normalizeError, unwrapApiData } from './client';

export interface TalentRequestItem {
  deliveryProject?: { deliveryMode?:'client_managed'|'bridge_managed'; _id: string; title: string; status: string; startDate: string | null; endDate: string | null; completedAt: string | null; paymentVerifiedAt?: string | null; clientAcceptedAt?: string | null; contractSentAt?:string|null; workers: Array<{ workerId: string; name?:string; role: string; contractSentAt?:string|null; acceptedAt?: string | null; completedAt: string | null }> } | null;
  clientContractApprovedAt?: string | null;
  projectCompleted?: boolean;
  contractorContractApproved?: boolean;
  contractorAcceptedCount?: number;
  contractorTotalCount?: number;
  clientDecisions?: Array<{ workerId: string; decision: 'accepted' | 'rejected';reason?:string|null }>;
  clientSelectionSubmittedAt?: string | null;
  deliveryMode?:'client_managed'|'bridge_managed'|null;
  projectStage?:'existing_project'|'new_project'|null;
  updatedAt?:string;
  projectName?: string;
  expectedStartDate?: string | null;
  expectedEndDate?: string | null;
  _id: string;
  companyId: string | null;
  workerId: string | null;
  originalWorkerId?: string | null;
  suggestedWorkerId?: string | null;
  workerName: string;
  workerRole: string;
  workerProfileUrl?: string;
  talentProfile?: {
    location: string;
    availabilityLabel: string;
    profilePhotoUrl: string;
    phone: string;
    email: string;
    responseTimeHours: number | null;
    skills: string[];
    languages: string[];
    profileOverview: string;
    servicePackages: Array<{
      name: string;
      price: number;
      description: string;
      deliveryDays: number | null;
      revisions: number | null;
      features: string[];
    }>;
    portfolioProjects: Array<{
      title: string;
      description: string;
      imageUrl: string;
      tags: string[];
    }>;
  } | null;
  suggestedTalentProfile?: {
    workerId: string;
    workerName: string;
    workerRole: string;
    profilePhotoUrl: string;
    location: string;
    availabilityLabel: string;
  } | null;
  shortlistedTalentProfiles?: Array<{
    workerId: string;
    workerName: string;
    workerRole: string;
    profilePhotoUrl: string;
    location: string;
    availabilityLabel: string;
  }>;
  shortlistHistory?: Array<{
    sentAt: string;
    note: string;
    profiles: Array<{
      workerId: string;
      workerName: string;
      workerRole: string;
      profilePhotoUrl: string;
      location: string;
      availabilityLabel: string;
    }>;
  }>;
  companyName: string;
  companyWebsite?: string;
  contactFirstName: string;
  contactLastName: string;
  phoneNumber: string;
  email: string;
  projectType: string;
  budget: string;
  projectDescription: string;
  status: string;
  reviewNotes?: string;
  shortlistSentAt?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  hiredAt?: string | null;
  talentHiredAt?: string | null;
  unread: boolean;
  createdAt: string;
}

export interface AdminMarketplaceCandidateItem {
  workerId: string;
  name: string;
  role: string;
  location: string;
  country: string;
  availability: 'available_now' | 'this_week' | 'two_weeks' | 'next_month' | 'not_available';
  availabilityLabel: string;
  skills: string[];
  profilePhotoUrl: string;
  profileOverview: string;
  packagePrice: number;
  currency: string;
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

export async function updateTalentRequestStatus(
  id: string,
  payload: { status: string; suggestedWorkerId?: string; reviewNotes?: string },
) {
  try {
    const res = await api.patch<ApiResponse<any>>(`/admin/talent-requests/${id}/status`, payload);
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function markAsRead(id: string, updatedAt?:string) {
  try {
    const res = await api.post<ApiResponse<any>>(`/admin/talent-requests/${id}/mark-as-read`,{updatedAt});
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function sendTalentRequestShortlist(
  id: string,
  payload: { shortlistedWorkerIds: string[]; reviewNotes?: string },
) {
  try {
    const res = await api.post<ApiResponse<TalentRequestItem>>(`/admin/talent-requests/${id}/send-shortlist`, payload);
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function listMarketplaceCandidatesForAdmin(params: {
  requestId: string;
  q?: string;
  availability?: string;
  country?: string;
  page?: number;
  perPage?: number;
}) {
  try {
    const res = await api.get<ApiResponse<{
      total: number;
      page: number;
      perPage: number;
      items: AdminMarketplaceCandidateItem[];
      filters: {
        countries: string[];
      };
    }>>('/admin/marketplace-candidates', { params });
    return unwrapApiData(res.data);
  } catch (err) { throw normalizeError(err); }
}

export async function updateAdminProjectPaymentStatus(projectId: string, done: boolean) {
  try { return unwrapApiData((await api.patch<ApiResponse<{ status: string; paymentVerifiedAt: string | null }>>('/admin/projects/' + projectId + '/payment-status', { done })).data); }
  catch (error) { throw normalizeError(error); }
}
