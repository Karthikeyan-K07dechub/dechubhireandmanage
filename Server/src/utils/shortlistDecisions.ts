import { z } from 'zod';

export const shortlistDecisionsSchema = z.object({
  shortlistSentAt: z.string().datetime(),
  decisions: z.array(z.object({ workerId: z.string().regex(/^[a-f\d]{24}$/i), decision: z.enum(['accepted', 'rejected']) })).min(1).max(10),
});

export function decisionsMatchShortlist(shortlistedIds: string[], decisions: Array<{ workerId: string }>) {
  const ids = decisions.map(decision => decision.workerId);
  return ids.length === shortlistedIds.length && new Set(ids).size === ids.length && ids.every(id => shortlistedIds.includes(id));
}
