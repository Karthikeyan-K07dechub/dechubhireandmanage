import { Project } from '../models/Project';
import { buildPdfBuffer, buildContractLines, wrapText } from '../services/contractPdf.service';
import { Request, Response, NextFunction } from 'express';
import { Contract } from '../models/Contract';
import { Company } from '../models/Company';
import { Worker } from '../models/Worker';
import { TalentRequest } from '../models/TalentRequest';
import { ContractorNotification } from '../models/ContractorNotification';
import { ok, AppError, Errors } from '../utils/response';
import { sendContractActivatedEmail } from '../utils/email';
import { syncContractPdf } from '../services/contractPdf.service';

async function getCompanyForUser(userId: string) {
  const company = await Company.findOne({ ownerId: userId });
  if (!company) throw Errors.NotFound('Company');
  return company;
}

async function markTalentRequestAsTalentHired(contract: { companyId: unknown; workerId: unknown }) {
  const talentRequest = await TalentRequest.findOne({
    companyId: contract.companyId,
    workerId: contract.workerId,
    status: { $in: ['hired', 'talent_hired'] },
  }).sort({ updatedAt: -1, createdAt: -1 });

  if (!talentRequest || talentRequest.status === 'talent_hired') {
    return;
  }

  talentRequest.status = 'talent_hired';
  talentRequest.talentHiredAt = new Date();
  await talentRequest.save();
}

export async function listContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const contracts = await Contract.find({ companyId: company._id }).sort({ createdAt: -1 });

    await Promise.all(contracts.map(async (contract) => {
      if (!contract.pdfUrl && (contract.workerSigned || contract.companySigned || contract.status === 'active')) {
        await syncContractPdf(contract, serverBaseUrl);
      }
    }));

    ok(res, contracts.map((contract) => ({
      ...contract.toObject(),
      workerRole: contract.roleTitle,
      track: contract.track === 'track_2_us' ? 'track_2' : 'track_1',
      contractType: contract.contractType === 'full_time_employee' ? 'employment' : 'contractor',
    })));
  } catch (err) {
    next(err);
  }
}

export async function countersignContract(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const serverBaseUrl = `${req.protocol}://${req.get('host')}`;
    const contract = await Contract.findOne({ _id: req.params.id, companyId: company._id });
    if (!contract) throw Errors.NotFound('Contract');
    if (!contract.workerSigned) {
      throw new AppError('The contractor must sign before you countersign.', 400, 'WORKER_SIGNATURE_REQUIRED');
    }
    if (contract.companySigned || contract.status === 'active') {
      ok(res, contract);
      return;
    }

    contract.companySigned = true;
    contract.companySignedAt = contract.companySignedAt ?? new Date();
    contract.status = 'active';
    await contract.save();
    await syncContractPdf(contract, serverBaseUrl, { force: true });

    const worker = await Worker.findById(contract.workerId);
    if (!worker) throw Errors.NotFound('Worker');

    worker.status = 'active';
    worker.kycStatus = 'approved';
    await worker.save();

    await ContractorNotification.create({
      workerId: worker._id,
      type: 'contract_activated',
      title: 'Contract active',
      message: `Your contract with ${contract.companyName} is now fully signed and active.`,
      actionUrl: '/contractor/dashboard?tab=contract',
    });

    try {
      await sendContractActivatedEmail(worker.email, worker.firstName, contract.companyName);
    } catch {
      // Countersigning should succeed even if email delivery fails.
    }
    await markTalentRequestAsTalentHired(contract);

    ok(res, {
      ...contract.toObject(),
      workerRole: contract.roleTitle,
      track: contract.track === 'track_2_us' ? 'track_2' : 'track_1',
      contractType: contract.contractType === 'full_time_employee' ? 'employment' : 'contractor',
    });
  } catch (err) {
    next(err);
  }
}

export async function exportContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const company = await getCompanyForUser(req.user!.sub);
    const [contracts, projects] = await Promise.all([
      Contract.find({ companyId: company._id }).sort({ createdAt: -1 }),
      Project.find({ companyId: company._id, status: { $ne: 'draft' } }).sort({ createdAt: -1 }),
    ]);
    if (!contracts.length && !projects.length) throw new AppError('No contracts are available to download yet.', 404, 'NO_CONTRACTS');
    const lines: string[] = [];
    const append = (content: string[]) => {
      if (lines.length % 42) lines.push(...Array(42 - lines.length % 42).fill(''));
      lines.push(...content);
    };
    for (const project of projects) {
      const workers = await Worker.find({ _id: { $in: project.teamMembers.map(member => member.workerId) } }).select('firstName lastName');
      const date = (value: Date | null) => value ? value.toISOString().slice(0, 10) : 'Not provided';
      append([
        'Dechub Bridge - Project contract',
        ...wrapText('Company: ' + (company.companyName || 'Not provided')),
        ...wrapText('Project: ' + project.title), 'Contract ID: ' + project._id,
        'Status: ' + project.status.replace(/_/g, ' '),
        'Client acceptance: ' + (project.clientAcceptedAt ? project.clientAcceptedAt.toISOString() : 'Awaiting signature'),
        'Start date: ' + date(project.startDate), 'End date: ' + date(project.targetEndDate),
        'Budget: ' + project.currency + ' ' + project.budget,
        '', 'Description:', ...wrapText(project.description), '', 'Scope:', ...wrapText(project.scope),
        '', 'Deliverables:', ...project.deliverables.flatMap(item => wrapText('- ' + item)),
        '', 'Payment terms:', ...wrapText(project.paymentTerms),
        '', 'Assigned workers:', ...workers.flatMap(worker => wrapText(worker.firstName + ' ' + worker.lastName)),
        '', 'Contractor acceptance:', ...project.teamMembers.flatMap(member => {
          const accepted = project.contractorAcceptances?.find(entry => entry.workerId.toString() === member.workerId.toString());
          const worker = workers.find(entry => entry._id.toString() === member.workerId.toString());
          return wrapText((worker ? worker.firstName + ' ' + worker.lastName : member.role) + ': ' + (accepted ? 'Accepted on ' + accepted.acceptedAt.toISOString() : 'Pending'));
        }),
      ]);
    }
    for (const contract of contracts) append(['Contract ID: ' + contract._id, ...buildContractLines(contract)]);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="dechub-contracts.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    res.send(buildPdfBuffer(lines));
  } catch (error) { next(error); }
}
