export function calculateMonthlyCosts(workers: Array<{
  payRate: number | null;
  payFrequency: string;
  payCurrency: string;
}>, defaultCurrency: string) {
  const monthlyCostByCurrency: Record<string, number> = {};
  let hourlyWorkersExcluded = 0;
  for (const worker of workers) {
    if (worker.payFrequency === 'hourly') { hourlyWorkersExcluded++; continue; }
    if (worker.payRate === null || !Number.isFinite(worker.payRate)) continue;
    const currency = worker.payCurrency || defaultCurrency;
    const monthly = worker.payFrequency === 'biweekly' ? worker.payRate * 26 / 12 : worker.payRate;
    monthlyCostByCurrency[currency] = (monthlyCostByCurrency[currency] ?? 0) + monthly;
  }
  for (const currency of Object.keys(monthlyCostByCurrency)) {
    monthlyCostByCurrency[currency] = Math.round(monthlyCostByCurrency[currency] * 100) / 100;
  }
  return { monthlyCostByCurrency, hourlyWorkersExcluded };
}
