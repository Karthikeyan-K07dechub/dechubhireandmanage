import { api, ApiResponse, normalizeError, unwrapApiData } from './client';
import { resolveImageUrl } from '../utils/imageUrl';

export interface MarketplaceTalentProfile {
  id: string;
  workerId: string;
  name: string;
  role: string;
  location: string;
  city: string;
  country: string;
  skills: string[];
  rate: number;
  currency: string;
  availability: 'available_now' | 'this_week' | 'two_weeks' | 'next_month' | 'not_available';
  availabilityLabel: string;
  blurb: string;
  profilePhotoUrl?: string;
  bannerImageUrl?: string;
  servicePackages?: MarketplaceServicePackage[];
}

export interface MarketplacePortfolioProject {
  title: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export interface MarketplaceServicePackage {
  name: string;
  price: number;
  description: string;
  deliveryDays: number;
  revisions: number;
  features: string[];
}

export interface MarketplaceCheckoutSelection {
  workerId: string;
  workerName: string;
  workerRole: string;
  workerAvatarUrl?: string;
  currency: string;
  package: MarketplaceServicePackage;
}

export interface MarketplaceFaqItem {
  question: string;
  answer: string;
}

export interface MarketplaceTalentProfileDetail extends MarketplaceTalentProfile {
  email: string;
  responseTimeHours: number;
  languages: string[];
  profilePhotoUrl?: string;
  bannerImageUrl?: string;
  profileOverview: string;
  portfolioProjects: MarketplacePortfolioProject[];
  servicePackages: MarketplaceServicePackage[];
  faqItems: MarketplaceFaqItem[];
  memberSince: string;
}

export interface MarketplaceOrderDraftClientDetails {
  companyName: string;
  companyWebsite: string;
  projectType: string;
  budget: string;
  projectDescription: string;
}

export interface MarketplaceOrderDraftPayload {
  packageSnapshot: MarketplaceServicePackage;
  clientDetails: MarketplaceOrderDraftClientDetails;
}

export interface MarketplaceOrderDraft {
  id: string;
  orderNumber: string;
  workerId: string;
  workerName: string;
  workerRole: string;
  packageSnapshot: MarketplaceServicePackage;
  clientDetails: MarketplaceOrderDraftClientDetails;
  status: 'draft' | 'pending_payment';
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

function normalizeMarketplaceProfile<T extends MarketplaceTalentProfile>(profile: T): T {
  return {
    ...profile,
    profilePhotoUrl: resolveImageUrl(profile.profilePhotoUrl),
    bannerImageUrl: resolveImageUrl(profile.bannerImageUrl),
    ...('portfolioProjects' in profile && Array.isArray(profile.portfolioProjects)
      ? {
          portfolioProjects: profile.portfolioProjects.map((project) => ({
            ...project,
            imageUrl: resolveImageUrl(project.imageUrl),
          })),
        }
      : {}),
  };
}

export async function getMarketplaceTalent(): Promise<MarketplaceTalentProfile[]> {
  try {
    const res = await api.get<ApiResponse<MarketplaceTalentProfile[]>>('/workers/marketplace', {
      headers: { Authorization: undefined },
    });
    return unwrapApiData(res.data).map(normalizeMarketplaceProfile);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getMarketplaceTalentProfile(workerId: string): Promise<MarketplaceTalentProfileDetail> {
  try {
    const res = await api.get<ApiResponse<MarketplaceTalentProfileDetail>>(`/workers/marketplace/${workerId}`, {
      headers: { Authorization: undefined },
    });
    return normalizeMarketplaceProfile(unwrapApiData(res.data));
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function createMarketplaceOrderDraft(
  workerId: string,
  payload: MarketplaceOrderDraftPayload,
): Promise<MarketplaceOrderDraft> {
  try {
    const res = await api.post<ApiResponse<MarketplaceOrderDraft>>(
      `/workers/marketplace/${workerId}/order-drafts`,
      payload,
    );
    return unwrapApiData(res.data);
  } catch (err) {
    throw normalizeError(err);
  }
}
