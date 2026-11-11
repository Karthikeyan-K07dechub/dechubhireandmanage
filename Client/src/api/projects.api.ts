import { api, ApiResponse, normalizeError, unwrapApiData } from './client';
import { contractorApi } from '../contractor/api/contractor.api';

export type ProjectStatus = 'draft' | 'contract_sent' | 'active' | 'payment_submitted' | 'completed' | 'cancelled';
export type ProjectTaskStatus = 'todo' | 'in_progress' | 'submitted' | 'completed';

export interface ProjectTeamMember { workerId: string; role: string; agreedAmount?: number | null; }
export interface ProjectTeamAccess extends ProjectTeamMember {
  firstName?: string;
  lastName?: string;
  country?: string;
  track?: 'track_1_india' | 'track_2_us';
  kycStatus?: 'pending' | 'approved' | 'rejected';
  name: string;
  email: string;
  accountStatus: 'invited' | 'kyc_pending' | 'active' | 'inactive' | 'terminated';
  lastLoginAt: string | null;
  projectAccess: string;
  taskSummary: { total: number; todo: number; inProgress: number; completed: number; };
}
export interface DeliveryProject {
  invoiceBillingMonth?:string;
  agreedAmount?: number | null;
  teamDirectory?: { workerId: string; name: string; role: string; status: string; isSelf: boolean }[];
  talentRequestId?: string | null;
  contractorAcceptances?: Array<{ workerId: string; acceptedAt: string; email: string }>;
  clientAcceptedAt?: string | null;
  contractorAcceptedAt?: string | null;
  contractorCompletedAt?: string | null;
  deliveryCompletedAt?: string | null;
  assignedRole?: string;
  companyDetails?: { name: string | null; website: string | null; country: string | null; address: string } | null;
  completedAt?: string | null;
  _id: string; title: string; description: string; scope: string; budget: number; currency: 'USD' | 'INR' | 'AED';
  paymentTerms: string; startDate: string | null; targetEndDate: string | null; deliverables: string[];
  teamMembers: ProjectTeamMember[]; teamAccess?: ProjectTeamAccess[]; status: ProjectStatus; paymentReference: string | null; paymentProofUrl: string | null; createdAt: string;
}
export interface DeliveryTask {
  attachmentName?: string | null;
  _id: string; projectId: string; title: string; description: string; assigneeWorkerIds: string[];
  priority: 'low' | 'medium' | 'high'; dueDate: string | null; status: ProjectTaskStatus; completionNote: string | null; completedAt: string | null; createdAt: string;
}
export interface CompanyProjectNotification { _id: string; title: string; message: string; actionUrl: string | null; readAt: string | null; createdAt: string; }

async function companyRequest<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try { return unwrapApiData((await request).data); } catch (error) { throw normalizeError(error); }
}
export const getCompanyProjects = () => companyRequest<DeliveryProject[]>(api.get('/company/projects'));
export const acceptProjectContract = (id: string) => companyRequest<DeliveryProject>(api.post(`/company/projects/${id}/accept-contract`));
export const getCompanyProjectTasks = (id: string) => companyRequest<DeliveryTask[]>(api.get(`/company/projects/${id}/tasks`));
export const createCompanyProjectTask = (id: string, payload: { title: string; description: string; assigneeWorkerIds: string[]; priority: 'low' | 'medium' | 'high'; dueDate?: string | null }, attachment?: File) => {
 if (!attachment) return companyRequest<DeliveryTask>(api.post('/company/projects/'+id+'/tasks',payload));
 const form=new FormData();form.append('payload',JSON.stringify(payload));form.append('attachment',attachment);
 return companyRequest<DeliveryTask>(api.post('/company/projects/'+id+'/tasks',form,{headers:{'Content-Type':'multipart/form-data'},timeout:60000}));
};
export const submitCompanyProjectPayment = (id: string, payload: { paymentReference: string; paymentProofUrl?: string }) => companyRequest<DeliveryProject>(api.post(`/company/projects/${id}/payment-submission`, payload));
export const getCompanyProjectNotifications = () => companyRequest<CompanyProjectNotification[]>(api.get('/company/notifications'));
export const markCompanyProjectNotificationRead = (id: string) => companyRequest<CompanyProjectNotification>(api.post(`/company/notifications/${id}/read`));

function contractorRequest<T>(request: Promise<{ data: { success: boolean; data: T } }>): Promise<T> {
  return request.then((response) => response.data.data).catch((error) => { throw normalizeError(error); });
}
export const getTeamMemberProjects = () => contractorRequest<DeliveryProject[]>(contractorApi.get('/projects'));
export const getTeamMemberProjectTasks = (id: string) => contractorRequest<DeliveryTask[]>(contractorApi.get(`/projects/${id}/tasks`));
export const updateTeamMemberProjectTask = (id: string, payload: { status: ProjectTaskStatus; completionNote?: string }) => contractorRequest<DeliveryTask>(contractorApi.patch(`/project-tasks/${id}`, payload));

export interface CreateDeliveryProjectPayload {
  startDate?: string | null;
  targetEndDate?: string | null;
  talentRequestId: string;
  title: string;
  description: string;
  scope: string;
  budget: number;
  currency: 'USD' | 'INR' | 'AED';
  paymentTerms: string;
  deliverables: string[];
  teamMembers: ProjectTeamMember[];
}

export const createAdminProject = (payload: CreateDeliveryProjectPayload) => companyRequest<DeliveryProject>(api.post('/admin/projects', payload));
export const sendAdminProjectContract = (id: string) => companyRequest<DeliveryProject>(api.post(`/admin/projects/${id}/send-contract`));

export const acceptTeamMemberProjectContract = (id: string) => contractorRequest<DeliveryProject>(contractorApi.post(`/projects/${id}/accept-contract`));

export const completeTeamMemberProject = (id: string) => contractorRequest<DeliveryProject>(contractorApi.post(`/projects/${id}/complete`));
