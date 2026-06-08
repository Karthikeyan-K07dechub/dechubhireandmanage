import { api, ApiResponse, normalizeError, unwrapApiData } from './client';

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

export async function getMarketplaceTalent(): Promise<MarketplaceTalentProfile[]> {
  try {
    const res = await api.get<ApiResponse<MarketplaceTalentProfile[]>>('/workers/marketplace', {
      headers: { Authorization: undefined },
    });
    return unwrapApiData(res.data);
  } catch (err) {
    throw normalizeError(err);
  }
}

export async function getMarketplaceTalentProfile(workerId: string): Promise<MarketplaceTalentProfileDetail> {
  try {
    const res = await api.get<ApiResponse<MarketplaceTalentProfileDetail>>(`/workers/marketplace/${workerId}`, {
      headers: { Authorization: undefined },
    });
    return unwrapApiData(res.data);
  } catch (err) {
    throw normalizeError(err);
  }
}
