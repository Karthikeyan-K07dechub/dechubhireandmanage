export function talentDashboardLink(link?: string | null): string | null {
  if (!link) return null;
  const pathname = link.split(/[?#]/, 1)[0];
  // Older notifications can still contain the pre-rename destination.
  if (!/^\/(talent|contractor|freelancer)\/dashboard$/.test(pathname)) return null;
  return '/talent/dashboard' + link.slice(pathname.length);
}
