import { Router } from 'express';
import {
  listWorkers,
  getMarketplaceTalent,
  inviteWorker,
  getWorker,
  terminateWorker,
  resendInvite,
  getDashboardStats,
} from '../controllers/workers.controller';
import { requireAuth } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// All routes require auth
router.use(requireAuth);

const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hour
  max: 30,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many invites sent' } },
});

// ── Workers ────────────────────────────────────────────────────────────────────
router.get  ('/marketplace',      getMarketplaceTalent);
router.get  ('/',                listWorkers);
router.post ('/', inviteLimiter, inviteWorker);
router.get  ('/:id',             getWorker);
router.post ('/:id/terminate',   terminateWorker);
router.post ('/:id/resend-invite', resendInvite);

export default router;

// ── Dashboard stats route (separate router export) ────────────────────────────
export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get('/stats', getDashboardStats);
