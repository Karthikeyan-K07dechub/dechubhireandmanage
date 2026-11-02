import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { CompanyNotification } from '../models/CompanyNotification';
import { ContractorNotification } from '../models/ContractorNotification';
import { Project } from '../models/Project';
import { ProjectTask } from '../models/ProjectTask';
import { TalentRequest } from '../models/TalentRequest';
import { Worker } from '../models/Worker';
import { env } from '../config/env';
import { AppError, Errors, created, ok } from '../utils/response';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';

const teamMemberSchema = z.object({
  workerId: z.string().trim().min(1),
  role: z.string().trim().min(2).max(120),
});

const projectSchema = z.object({
  talentRequestId: z.string().trim().min(1).optional(),
  companyId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(5000),
  scope: z.string().trim().min(10).max(5000),
  budget: z.coerce.number().min(0),
  currency: z.enum(['USD', 'INR', 'AED']),
  paymentTerms: z.string().trim().min(3).max(1200),
  startDate: z.string().datetime().optional().nullable(),
  targetEndDate: z.string().datetime().optional().nullable(),
  deliverables: z.array(z.string().trim().min(1).max(600)).min(1).max(50),
  teamMembers: z.array(teamMemberSchema).min(1).max(20),
}).refine((value) => Boolean(value.talentRequestId || value.companyId), {
  message: 'A talent request or company is required.',
  path: ['companyId'],
});

const taskSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(5000).default(''),
  assigneeWorkerIds: z.array(z.string().trim().min(1)).min(1).max(20),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional().nullable(),
});

function getAdminEmails(): string[] {
  return env.DECHUB_ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean);
}

async function getCompanyForUser(userId: string) {
  const account = await CompanyAuth.findById(userId).select('companyId');
  const company = account?.companyId ? await Company.findById(account.companyId) : await Company.findOne({ ownerId: userId });
  if (!company) throw Errors.NotFound('Company');
  return company;
}

async function getWorkerFromRequest(req: Request) {
  const workerId = req.worker?.sub;
  if (!workerId) throw Errors.Unauthorized();
  const worker = await Worker.findById(workerId);
  if (!worker) throw Errors.NotFound('Team member');
  return worker;
}

function projectActionUrl(projectId: string): string {
  return `/dashboard?tab=projects&project=${projectId}`;
}

async function notifyWorkers(project: InstanceType<typeof Project>, title: string, message: string, destination?: string): Promise<void> {
  const actionUrl = destination ?? `/contractor/dashboard?tab=projects&project=${project._id}`;
  await ContractorNotification.insertMany(project.teamMembers.map((member) => ({
    workerId: member.workerId,
    type: 'general',
    title,
    message,
    actionUrl,
  })));

  const workers = await Worker.find({ _id: { $in: project.teamMembers.map((member) => member.workerId) } }).select('email firstName');
  await Promise.allSettled(workers.map((worker) => sendEmail(
    worker.email,
    title,
    `<p>Hi ${worker.firstName},</p><p>${message}</p><p>Open Dechub-Bridge to view your project and assigned tasks.</p>`,
  )));
}

async function sendAdminEmail(subject: string, message: string): Promise<void> {
  const emails = getAdminEmails();
  await Promise.allSettled(emails.map((email) => sendEmail(email, subject, `<p>${message}</p>`, { includeLogo: false })));
}

function serializeProject(project: InstanceType<typeof Project>) {
  return project.toObject();
}

async function serializeCompanyProjects(projects: Array<InstanceType<typeof Project>>) {
  const workerIds = [...new Set(projects.flatMap((project) => project.teamMembers.map((member) => member.workerId.toString())))];
  const projectIds = projects.map((project) => project._id);
  const requestIds = projects.flatMap(project => project.talentRequestId ? [project.talentRequestId] : []);
  const [workers, tasks, requests] = await Promise.all([
    Worker.find({ _id: { $in: workerIds } }).select('firstName lastName email country track kycStatus status lastLoginAt'),
    ProjectTask.find({ projectId: { $in: projectIds } }).select('projectId assigneeWorkerIds status'),
    TalentRequest.find({ _id: { $in: requestIds }, companyId: { $in: projects.map(project => project.companyId) } }).select('companyId expectedStartDate expectedEndDate'),
  ]);
  const workersById = new Map(workers.map((worker) => [worker._id.toString(), worker]));
  const requestsById = new Map(requests.map(request => [`${request.companyId}:${request._id}`, request]));

  return projects.map((project) => {
    const request = requestsById.get(`${project.companyId}:${project.talentRequestId}`);
    const projectTasks = tasks.filter((task) => task.projectId.toString() === project._id.toString());
    return {
      ...serializeProject(project),
      startDate: project.startDate ?? request?.expectedStartDate ?? null,
      targetEndDate: project.targetEndDate ?? request?.expectedEndDate ?? null,
      teamAccess: project.teamMembers.map((member) => {
        const worker = workersById.get(member.workerId.toString());
        const memberTasks = projectTasks.filter((task) => task.assigneeWorkerIds.some((workerId) => workerId.toString() === member.workerId.toString()));
        return {
          workerId: member.workerId.toString(),
          role: member.role,
          name: worker ? `${worker.firstName} ${worker.lastName}` : 'Delivery team member',
          firstName: worker?.firstName,
          lastName: worker?.lastName,
          country: worker?.country,
          track: worker?.track,
          kycStatus: worker?.kycStatus,
          email: worker?.email ?? '',
          accountStatus: worker?.status ?? 'inactive',
          lastLoginAt: worker?.lastLoginAt ?? null,
          projectAccess: project.status === 'active' ? (project.contractorAcceptances?.some(entry => entry.workerId.toString() === member.workerId.toString()) ? 'active' : 'pending contractor acceptance') : project.status === 'contract_sent' ? 'pending client acceptance' : project.status,
          taskSummary: {
            total: memberTasks.length,
            todo: memberTasks.filter((task) => task.status === 'todo').length,
            inProgress: memberTasks.filter((task) => task.status === 'in_progress').length,
            completed: memberTasks.filter((task) => task.status === 'completed').length,
          },
        };
      }),
    };
  });
}

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = projectSchema.parse(req.body);
    let companyId = data.companyId;
    let talentRequestId: string | undefined;
    let startDate = data.startDate ? new Date(data.startDate) : null;
    let targetEndDate = data.targetEndDate ? new Date(data.targetEndDate) : null;

    if (data.talentRequestId) {
      const request = await TalentRequest.findById(data.talentRequestId);
      if (!request?.companyId) throw new AppError('The selected request is not linked to a signed-up company.', 400, 'COMPANY_REQUIRED');
      companyId = request.companyId.toString();
      talentRequestId = request._id.toString();
      if (request.shortlistedWorkerIds?.length && !request.clientSelectionSubmittedAt && !request.workerId) {
        throw new AppError('Wait for the client to submit their shortlist decisions before preparing the contract.', 400, 'CLIENT_SELECTION_REQUIRED');
      }
      if (request.clientSelectionSubmittedAt) {
        const acceptedIds = request.clientDecisions.filter(decision => decision.decision === 'accepted').map(decision => decision.workerId.toString());
        if (!acceptedIds.length || data.teamMembers.some(member => !acceptedIds.includes(member.workerId))) {
          throw new AppError('The project team must contain only candidates accepted by the client. Send a new shortlist if another candidate is needed.', 400, 'CLIENT_SELECTION_REQUIRED');
        }
      }
      startDate = startDate ?? request.expectedStartDate ?? null;
      targetEndDate = targetEndDate ?? request.expectedEndDate ?? null;
    }

    const company = await Company.findById(companyId);
    if (!company) throw Errors.NotFound('Client company');

    const uniqueWorkerIds = [...new Set(data.teamMembers.map((member) => member.workerId))];
    if (startDate && targetEndDate && targetEndDate < startDate) {
      throw new AppError('Project end date must be on or after its start date.', 400, 'INVALID_PROJECT_DATES');
    }
    if (uniqueWorkerIds.length !== data.teamMembers.length) throw new AppError('A team member can be added only once.', 400, 'DUPLICATE_TEAM_MEMBER');
    const workers = await Worker.find({ _id: { $in: uniqueWorkerIds }, status: { $ne: 'terminated' } }).select('_id');
    if (workers.length !== uniqueWorkerIds.length) throw new AppError('One or more selected team members are unavailable.', 400, 'INVALID_TEAM_MEMBER');

    const project = await Project.create({
      ...data,
      companyId: company._id,
      talentRequestId: talentRequestId ?? null,
      startDate,
      targetEndDate,
      createdByAdminEmail: req.user!.email,
    });

    created(res, serializeProject(project));
  } catch (error) {
    if (error instanceof AppError || error instanceof z.ZodError) {
      next(error);
      return;
    }
    next(new AppError(
      `Project could not be created: ${error instanceof Error ? error.message : 'Unknown database error'}`,
      500,
      'PROJECT_CREATE_FAILED',
    ));
  }
}

export async function listAdminProjects(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const projects = await Project.find().sort({ createdAt: -1 }).limit(200);
    ok(res, projects.map(serializeProject));
  } catch (error) { next(error); }
}

export async function sendProjectContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw Errors.NotFound('Project');
    if (project.status !== 'draft') throw new AppError('Only draft projects can be sent for client acceptance.', 400, 'INVALID_PROJECT_STATUS');
    if (project.talentRequestId) {
      const request = await TalentRequest.findById(project.talentRequestId);
      if (request?.clientSelectionSubmittedAt) {
        const acceptedIds = request.clientDecisions.filter(decision => decision.decision === 'accepted').map(decision => decision.workerId.toString());
        if (!acceptedIds.length || project.teamMembers.some(member => !acceptedIds.includes(member.workerId.toString()))) {
          throw new AppError('The client selection changed. Update the project team to accepted candidates before sending the contract.', 409, 'CLIENT_SELECTION_CHANGED');
        }
      } else if (request?.shortlistedWorkerIds?.length && !request.workerId) {
        throw new AppError('Wait for the client to submit their candidate decisions before sending this contract.', 409, 'CLIENT_SELECTION_REQUIRED');
      }
    }

    const company = await Company.findById(project.companyId);
    if (!company) throw Errors.NotFound('Client company');

    // Older sign-up records may have a company owner but no CompanyAuth.companyId.
    // Resolve that legacy link before sending the contract and repair it once found.
    let account = await CompanyAuth.findOne({ companyId: project.companyId }).sort({ createdAt: 1 });
    if (!account && company.ownerId) {
      account = await CompanyAuth.findById(company.ownerId);
    }
    if (!account && project.talentRequestId) {
      const request = await TalentRequest.findById(project.talentRequestId).select('email');
      if (request?.email) {
        account = await CompanyAuth.findOne({ email: request.email.trim().toLowerCase() });
      }
    }
    if (!account) throw new AppError('Client company account is not available. Ask the client to complete signup with the request email before sending the contract.', 400, 'COMPANY_ACCOUNT_REQUIRED');
    if (!account.companyId || account.companyId.toString() !== company._id.toString()) {
      account.companyId = company._id;
      await account.save();
    }

    project.status = 'contract_sent';
    project.contractSentAt = new Date();
    await project.save();

    const actionUrl = `/dashboard?tab=contracts#project-contract-${project._id.toString()}`;
    await CompanyNotification.create({
      companyId: project.companyId,
      projectId: project._id,
      type: 'project_contract',
      title: 'Project contract ready for review',
      message: `The Dechub-Bridge project contract for ${project.title} is ready for your acceptance.`,
      actionUrl,
    });
    let emailSent = true;
    try {
      await sendEmail(account.email, `Review project contract: ${project.title}`, `<p>Hi ${account.firstName},</p><p>Your Dechub-Bridge project contract is ready for review and acceptance.</p><p><strong>Project:</strong> ${project.title}</p><p><strong>Budget:</strong> ${project.currency} ${project.budget.toLocaleString()}</p><p>Open your dashboard to review and accept it.</p>`);
    } catch (emailError) {
      emailSent = false;
      logger.error(`Project contract email failed for ${project._id.toString()}`, emailError);
    }

    ok(res, { ...serializeProject(project), emailSent });
  } catch (error) {
    if (error instanceof AppError || error instanceof z.ZodError) {
      next(error);
      return;
    }
    next(new AppError(
      `Project contract could not be sent: ${error instanceof Error ? error.message : 'Unknown database error'}`,
      500,
      'PROJECT_SEND_FAILED',
    ));
  }
}

export async function acceptProjectContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const account = await CompanyAuth.findById(req.user!.sub).select('firstName lastName email');
    if (!account) throw Errors.NotFound('Company account');
    const project = await Project.findOne({ _id: req.params.id, companyId: company._id });
    if (!project) throw Errors.NotFound('Project');
    if (project.status !== 'contract_sent') throw new AppError('This project contract is not awaiting acceptance.', 400, 'INVALID_PROJECT_STATUS');

    if (project.talentRequestId && (!project.startDate || !project.targetEndDate)) {
      const request = await TalentRequest.findOne({ _id: project.talentRequestId, companyId: company._id });
      project.startDate = project.startDate ?? request?.expectedStartDate ?? null;
      project.targetEndDate = project.targetEndDate ?? request?.expectedEndDate ?? null;
    }

    project.status = 'active';
    project.clientAcceptedAt = new Date();
    project.clientAcceptedBy = account.email;
    await project.save();
    if (project.talentRequestId) await TalentRequest.updateOne({ _id: project.talentRequestId, companyId: company._id }, { $set: { unread: true } });


    void notifyWorkers(project, 'Review your project contract', `The client has approved ${project.title}. Open Contracts in your contractor dashboard to review and accept.`, `/contractor/dashboard?tab=contract&project=${project._id}`).catch(error => logger.error('Worker project contract email failed', error));
    await sendAdminEmail(`Client accepted project: ${project.title}`, `${company.companyName ?? 'Client company'} accepted the project contract for ${project.title}.`);
    await CompanyNotification.create({
      companyId: company._id,
      projectId: project._id,
      type: 'project_active',
      title: 'Project is active',
      message: `${project.title} is active. You can now create tasks for the delivery team.`,
      actionUrl: projectActionUrl(project._id.toString()),
    });

    ok(res, serializeProject(project));
  } catch (error) { next(error); }
}

export async function listCompanyProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const projects = await Project.find({ companyId: company._id }).sort({ createdAt: -1 });
    ok(res, await serializeCompanyProjects(projects));
  } catch (error) { next(error); }
}

export async function createProjectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = taskSchema.parse(req.body);
    const company = await getCompanyForUser(req.user!.sub);
    const project = await Project.findOne({ _id: req.params.id, companyId: company._id, status: 'active' });
    if (!project) throw new AppError('Only active projects can receive tasks.', 400, 'PROJECT_NOT_ACTIVE');

    const permittedWorkerIds = new Set(project.teamMembers.map((member) => member.workerId.toString()));
    if (data.assigneeWorkerIds.some((workerId) => !permittedWorkerIds.has(workerId))) throw Errors.Forbidden();

    if (project.deliveryCompletedAt || project.deliveryCompletions?.some(entry => data.assigneeWorkerIds.includes(entry.workerId.toString()))) throw new AppError('Delivery is completed for an assigned worker. Completed delivery cannot receive new tasks.', 409, 'DELIVERY_COMPLETED');
    const task = await ProjectTask.create({
      ...data,
      projectId: project._id,
      companyId: company._id,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      createdByCompanyUserId: req.user!.sub,
    });

    created(res, task.toObject());

    // Delivery notifications must not delay or fail an already saved task.
    void (async () => {
      const workers = await Worker.find({ _id: { $in: data.assigneeWorkerIds } }).select('email firstName');
      await ContractorNotification.insertMany(data.assigneeWorkerIds.map((workerId) => ({
        workerId,
        type: 'general',
        title: 'New project task assigned',
        message: `You have been assigned "${task.title}" in ${project.title}.`,
        actionUrl: `/contractor/dashboard?tab=projects&project=${project._id}`,
      })));
      await Promise.all(workers.map((worker) => sendEmail(worker.email, `New task: ${task.title}`, `<p>Hi ${worker.firstName},</p><p>You have a new task in ${project.title}: <strong>${task.title}</strong>.</p>`)));

    })().catch((error) => logger.error('Project task notification failed', { taskId: task._id.toString(), error }));

  } catch (error) { next(error); }
}

export async function listCompanyProjectTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const project = await Project.findOne({ _id: req.params.id, companyId: company._id });
    if (!project) throw Errors.NotFound('Project');
    const tasks = await ProjectTask.find({ projectId: project._id }).sort({ createdAt: -1 });
    ok(res, tasks.map((task) => task.toObject()));
  } catch (error) { next(error); }
}

export async function submitProjectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({ paymentReference: z.string().trim().min(3).max(240), paymentProofUrl: z.string().trim().url().max(1000).optional() }).parse(req.body);
    const company = await getCompanyForUser(req.user!.sub);
    const project = await Project.findOne({ _id: req.params.id, companyId: company._id });
    if (!project) throw Errors.NotFound('Project');
    if (project.status !== 'active') throw new AppError('Payment can be submitted only for an active project.', 400, 'INVALID_PROJECT_STATUS');

    project.status = 'payment_submitted';
    project.paymentReference = data.paymentReference;
    project.paymentProofUrl = data.paymentProofUrl ?? null;
    project.paymentSubmittedAt = new Date();
    await project.save();
    await sendAdminEmail(`Payment submitted: ${project.title}`, `Client payment reference ${data.paymentReference} was submitted for ${project.title}. Verify it in the admin dashboard.`);
    ok(res, serializeProject(project));
  } catch (error) { next(error); }
}

export async function verifyProjectPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) throw Errors.NotFound('Project');
    if (project.status !== 'payment_submitted') throw new AppError('No payment submission is awaiting verification.', 400, 'INVALID_PROJECT_STATUS');

    project.status = 'completed';
    project.paymentVerifiedAt = new Date();
    project.paymentVerifiedBy = req.user!.email;
    project.completedAt = new Date();
    await project.save();

    await CompanyNotification.create({ companyId: project.companyId, projectId: project._id, type: 'project_completed', title: 'Project completed', message: `${project.title} has been marked completed after payment verification.`, actionUrl: projectActionUrl(project._id.toString()) });
    await notifyWorkers(project, 'Project completed', `${project.title} is complete and payment has been verified.`);
    await sendAdminEmail(`Project completed: ${project.title}`, `Payment was verified and ${project.title} is now completed.`);
    ok(res, serializeProject(project));
  } catch (error) { next(error); }
}

async function serializeWorkerProject(project: InstanceType<typeof Project>, workerId: string) {
  const company = await Company.findById(project.companyId).select('companyName companyWebsite companyCountry addressLine1 addressCity');
  const acceptance = project.contractorAcceptances?.find(entry => entry.workerId.toString() === workerId);
  return {
    _id: project._id, title: project.title, description: project.description, scope: project.scope,
    deliverables: project.deliverables, budget: project.budget, currency: project.currency,
    paymentTerms: project.paymentTerms, startDate: project.startDate, targetEndDate: project.targetEndDate,
    status: project.status, createdAt: project.createdAt, teamMembers: project.teamMembers,
    clientAcceptedAt: project.clientAcceptedAt, contractorAcceptedAt: acceptance?.acceptedAt ?? null,
    deliveryCompletedAt: project.deliveryCompletedAt,
    contractorCompletedAt: project.deliveryCompletions?.find(entry => entry.workerId.toString() === workerId)?.completedAt ?? null,
    assignedRole: project.teamMembers.find(member => member.workerId.toString() === workerId)?.role ?? '',
    companyDetails: company ? { name: company.companyName, website: company.companyWebsite, country: company.companyCountry, address: [company.addressLine1, company.addressCity].filter(Boolean).join(', ') } : null,
  };
}

export async function listWorkerProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worker = await getWorkerFromRequest(req);
    const projects = await Project.find({ 'teamMembers.workerId': worker._id, clientAcceptedAt: { $ne: null }, status: { $in: ['active', 'payment_submitted', 'completed'] } }).sort({ updatedAt: -1 });
    ok(res, await Promise.all(projects.map(project => serializeWorkerProject(project, worker._id.toString()))));
  } catch (error) { next(error); }
}

export async function acceptWorkerProjectContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worker = await getWorkerFromRequest(req);
    const project = await Project.findOne({ _id: req.params.id, 'teamMembers.workerId': worker._id, clientAcceptedAt: { $ne: null }, status: { $in: ['active', 'payment_submitted'] } });
    if (!project) throw new AppError('This project contract is not available for your acceptance. The client must approve it first.', 409, 'CONTRACT_NOT_AVAILABLE');
    const updated = await Project.findOneAndUpdate({
      _id: project._id, 'teamMembers.workerId': worker._id, clientAcceptedAt: { $ne: null }, status: { $in: ['active', 'payment_submitted'] },
      'contractorAcceptances.workerId': { $ne: worker._id },
    }, { $push: { contractorAcceptances: { workerId: worker._id, email: worker.email, acceptedAt: new Date() } } }, { new: true, runValidators: true });
    const result = updated ?? await Project.findById(project._id);
    if (!result) throw Errors.NotFound('Project');
    if (updated) {
      if (project.talentRequestId) await TalentRequest.updateOne({ _id: project.talentRequestId, companyId: project.companyId }, { $set: { unread: true } });
      void sendAdminEmail('Contract approved by contractor: ' + project.title, worker.firstName + ' ' + worker.lastName + ' (' + worker.email + ') accepted the project contract for ' + project.title + '.').catch(error => logger.error('Contractor acceptance email failed', error));
      void CompanyNotification.create({ companyId: project.companyId, projectId: project._id, type: 'general', title: 'Contract approved by contractor', message: worker.firstName + ' ' + worker.lastName + ' accepted the contract for ' + project.title + '.', actionUrl: '/dashboard?tab=contracts#project-contract-' + project._id }).catch(error => logger.error('Contractor acceptance notification failed', error));
    }
    ok(res, await serializeWorkerProject(result, worker._id.toString()));
  } catch (error) { next(error); }
}

export async function listWorkerProjectTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worker = await getWorkerFromRequest(req);
    const project = await Project.findOne({ _id: req.params.id, 'teamMembers.workerId': worker._id, clientAcceptedAt: { $ne: null }, status: { $in: ['active', 'payment_submitted', 'completed'] } });
    if (!project) throw Errors.NotFound('Project');
    const tasks = await ProjectTask.find({ projectId: project._id, assigneeWorkerIds: worker._id }).sort({ dueDate: 1, createdAt: -1 });
    ok(res, tasks.map((task) => task.toObject()));
  } catch (error) { next(error); }
}

async function recordWorkerDeliveryCompletion(project: InstanceType<typeof Project>, workerId: string) {
  const updated = await Project.findOneAndUpdate({ _id: project._id, 'teamMembers.workerId': workerId, 'deliveryCompletions.workerId': { $ne: workerId } }, { $push: { deliveryCompletions: { workerId, completedAt: new Date() } } }, { new: true });
  const current = updated ?? await Project.findById(project._id);
  if (!current) throw Errors.NotFound('Project');
  const teamIds = [...new Set(current.teamMembers.map(member => member.workerId.toString()))];
  if (teamIds.length && teamIds.every(id => current.deliveryCompletions.some(entry => entry.workerId.toString() === id))) {
    await Project.updateOne({ _id: current._id, deliveryCompletedAt: null, 'deliveryCompletions.workerId': { $all: teamIds } }, { $set: { deliveryCompletedAt: new Date() } });
  }
  if (updated && current.talentRequestId) await TalentRequest.updateOne({ _id: current.talentRequestId, companyId: current.companyId }, { $set: { unread: true } });
  if (updated) void CompanyNotification.create({ companyId: current.companyId, projectId: current._id, type: 'general', title: 'Contractor delivery completed', message: 'An assigned contractor completed delivery for ' + current.title + '.', actionUrl: projectActionUrl(current._id.toString()) }).catch(error => logger.error('Delivery completion notification failed', error));
  return await Project.findById(current._id);
}

export async function completeWorkerProject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const worker = await getWorkerFromRequest(req);
    const project = await Project.findOne({ _id: req.params.id, 'teamMembers.workerId': worker._id, clientAcceptedAt: { $ne: null }, 'contractorAcceptances.workerId': worker._id, status: { $in: ['active', 'payment_submitted', 'completed'] } });
    if (!project) throw new AppError('Accept this assigned project contract before completing delivery.', 403, 'PROJECT_CONTRACT_REQUIRED');
    const remaining = await ProjectTask.countDocuments({ projectId: project._id, assigneeWorkerIds: worker._id, status: { $ne: 'completed' } });
    if (remaining) throw new AppError('Complete all your assigned tasks before marking this project completed.', 409, 'TASKS_INCOMPLETE');
    const completed = await recordWorkerDeliveryCompletion(project, worker._id.toString());
    if (!completed) throw Errors.NotFound('Project');
    ok(res, await serializeWorkerProject(completed, worker._id.toString()));
  } catch (error) { next(error); }
}

export async function updateWorkerProjectTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = z.object({ status: z.enum(['todo', 'in_progress', 'completed']), completionNote: z.string().trim().max(3000).optional() }).parse(req.body);
    const worker = await getWorkerFromRequest(req);
    const task = await ProjectTask.findOne({ _id: req.params.taskId, assigneeWorkerIds: worker._id });
    if (!task) throw Errors.NotFound('Assigned task');
    const project = await Project.findOne({ _id: task.projectId, 'teamMembers.workerId': worker._id });
    if (!project || !project.clientAcceptedAt || !project.contractorAcceptances?.some(entry => entry.workerId.toString() === worker._id.toString())) throw new AppError('Accept the project contract in Contracts before updating tasks.', 403, 'PROJECT_CONTRACT_REQUIRED');
    if (project.status !== 'active') throw new AppError('This task cannot be updated.', 400, 'TASK_NOT_ACTIVE');

    if (project.deliveryCompletions?.some(entry => entry.workerId.toString() === worker._id.toString())) throw new AppError('This delivery has been completed and is ready for invoicing.', 409, 'DELIVERY_COMPLETED');
    task.status = data.status;
    task.completionNote = data.completionNote ?? task.completionNote;
    task.completedAt = data.status === 'completed' ? new Date() : null;
    await task.save();

    if (data.status === 'completed') {
      const remaining = await ProjectTask.countDocuments({ projectId: project._id, assigneeWorkerIds: worker._id, status: { $ne: 'completed' } });
      if (remaining === 0) await recordWorkerDeliveryCompletion(project, worker._id.toString());
      await CompanyNotification.create({ companyId: project.companyId, projectId: project._id, type: 'task_completed', title: 'Task completed', message: `${worker.firstName} completed "${task.title}" in ${project.title}.`, actionUrl: projectActionUrl(project._id.toString()) });
    }
    ok(res, task.toObject());
  } catch (error) { next(error); }
}

export async function listCompanyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const notifications = await CompanyNotification.find({ companyId: company._id }).sort({ createdAt: -1 }).limit(50);
    ok(res, notifications.map(notification => notification.toObject()));
  } catch (error) { next(error); }
}

export async function markCompanyNotificationRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const notification = await CompanyNotification.findOneAndUpdate({ _id: req.params.id, companyId: company._id }, { readAt: new Date() }, { new: true });
    if (!notification) throw Errors.NotFound('Notification');
    ok(res, notification.toObject());
  } catch (error) { next(error); }
}

export async function updateProjectPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { done } = z.object({ done: z.boolean() }).parse(req.body);
    const project = await Project.findById(req.params.id);
    if (!project) throw Errors.NotFound('Project');
    if (!project.deliveryCompletedAt) throw new AppError('Complete project delivery before updating payment status.', 409, 'DELIVERY_NOT_COMPLETED');
    if (!['active', 'payment_submitted', 'completed'].includes(project.status)) throw new AppError('Payment status cannot be changed for this project.', 409, 'INVALID_PROJECT_STATUS');
    const alreadyDone = Boolean(project.paymentVerifiedAt);
    const updated = await Project.findOneAndUpdate({ _id: project._id, deliveryCompletedAt: { $ne: null }, status: { $in: ['active', 'payment_submitted', 'completed'] } }, { $set: {
      status: done ? 'completed' : project.paymentSubmittedAt ? 'payment_submitted' : 'active',
      paymentVerifiedAt: done ? project.paymentVerifiedAt ?? new Date() : null,
      paymentVerifiedBy: done ? req.user!.email : null,
      completedAt: done ? project.completedAt ?? new Date() : null,
    } }, { new: true, runValidators: true });
    if (!updated) throw new AppError('Project status changed. Refresh and try again.', 409, 'PROJECT_CHANGED');
    if (updated.talentRequestId) await TalentRequest.updateOne({ _id: updated.talentRequestId, companyId: updated.companyId }, { $set: { unread: true } });
    if (alreadyDone !== done) {
      void CompanyNotification.create({ companyId: updated.companyId, projectId: updated._id, type: 'general', title: done ? 'Project completed' : 'Project payment pending', message: done ? updated.title + ' is completed and admin confirmed payment.' : 'Admin marked payment as not done for ' + updated.title + '.', actionUrl: projectActionUrl(updated._id.toString()) }).catch(error => logger.error('Payment status notification failed', error));
    }
    ok(res, serializeProject(updated));
  } catch (error) { next(error); }
}
