interface MarketplaceWorker {
  contractorProfile?: {
    marketplaceTitle?: string; marketplaceBio?: string; marketplaceRate?: number | null;
    city?: string; address?: { city?: string; country?: string }; skills?: string[];
    servicePackages?: Array<{ price?: number | string | null }>;
  } | null;
  payRate?: number | null; country?: string; status?: string; kycStatus?: string;
  kycData?: { idFrontPath?: string } | null;
}
const defaultBios = new Set([
  'Tell companies about your strongest skills and the kind of freelance work you want.',
  'Experienced freelancer available for contract work.',
  'Self-signup freelancer profile',
]);
export function marketplaceProfileCompletion(worker: MarketplaceWorker) {
  const profile = worker.contractorProfile;
  const title = profile?.marketplaceTitle?.trim() || '';
  const bio = profile?.marketplaceBio?.trim() || '';
  const city = profile?.city?.trim() || profile?.address?.city?.trim();
  const country = profile?.address?.country?.trim() || worker.country?.trim();
  const checks: [string, boolean][] = [
    ['Professional title', Boolean(title && title.toLowerCase() !== 'freelancer')],
    ['Professional bio', Boolean(bio && !defaultBios.has(bio))],
    ['Rate greater than zero', Number(profile?.marketplaceRate ?? worker.payRate ?? 0) > 0],
    ['City', Boolean(city)], ['Country', Boolean(country && country.toLowerCase() !== 'unknown')],
    ['At least one skill', Boolean(profile?.skills?.some(skill => typeof skill === 'string' && skill.trim()))],
    ['At least one service package with a price', Boolean(profile?.servicePackages?.some(pkg => Number(pkg?.price) > 0))],
  ];
  return { complete: checks.every(([, ready]) => ready), missingFields: checks.filter(([, ready]) => !ready).map(([name]) => name) };
}
export function isMarketplaceEligible(worker: MarketplaceWorker) {
  return marketplaceProfileCompletion(worker).complete && Boolean(worker.kycData?.idFrontPath)
    && worker.kycStatus !== 'rejected' && !['invited', 'terminated'].includes(worker.status || '');
}
