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
}

export async function getMarketplaceTalent(): Promise<MarketplaceTalentProfile[]> {
  try {
    const res = await api.get<ApiResponse<MarketplaceTalentProfile[]>>('/workers/marketplace');
    return unwrapApiData(res.data);
  } catch (err) {
    throw normalizeError(err);
  }
}
