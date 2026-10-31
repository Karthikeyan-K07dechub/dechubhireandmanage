import { Company } from '../models/Company';
import { CompanyAuth } from '../models/CompanyAuth';
import { TalentRequest } from '../models/TalentRequest';

type RequestDetails = {
  companyId?: unknown; companyName?: string | null; companyWebsite?: string | null;
  contactFirstName?: string; contactLastName?: string; phoneNumber?: string; email?: string;
};
const value = (input?: string | null) => input?.trim() ?? '';
const companyName = (input?: string | null) => /^company name not provided$/i.test(value(input)) ? '' : value(input);

// Resolve missing request details without rewriting the original demo or company profile.
export async function resolveCompanyRequestDetails(source: RequestDetails) {
  if (!source.companyId) return {};
  const company = await Company.findById(source.companyId).lean();
  if (!company) return {};
  const account = await CompanyAuth.findById(company.ownerId).lean();
  const email = value(account?.email).toLowerCase();
  const demo = await TalentRequest.findOne({
    $and: [
      { companyName: { $nin: ['', 'Company name not provided', null] } },
      { $or: [
        { companyId: company._id },
        ...(email ? [{ companyId: null, email }] : []),
      ] },
    ],
  }).sort({ createdAt: -1 }).lean();
  return {
    companyName: companyName(company.companyName) || companyName(source.companyName) || companyName(demo?.companyName) || 'Company name not provided',
    companyWebsite: value(company.companyWebsite) || value(source.companyWebsite) || value(demo?.companyWebsite),
    contactFirstName: value(account?.firstName) || value(source.contactFirstName) || value(demo?.contactFirstName),
    contactLastName: value(account?.lastName) || value(source.contactLastName) || value(demo?.contactLastName),
    phoneNumber: value(account?.phone) || value(source.phoneNumber) || value(demo?.phoneNumber),
    email: value(source.email) || email || value(demo?.email),
  };
}
