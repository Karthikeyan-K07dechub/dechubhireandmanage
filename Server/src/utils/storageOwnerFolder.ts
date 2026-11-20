export function storageOwnerFolder(ownerId: string, ownerName: string, fallback: 'contractor' | 'company'): string {
  const name = ownerName.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 80).replace(/-+$/, '') || fallback;
  return `${name}-${ownerId.slice(-8)}`;
}
