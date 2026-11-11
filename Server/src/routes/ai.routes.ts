import { Router } from 'express';
import { createAiCallbackRequest, createAiDemoRequest, searchAiTalent } from '../controllers/aiVisitor.controller';
import { aiVisitorRateLimiter, requireAiToolSecret } from '../middleware/aiTool.middleware';

const router = Router();

router.post('/visitor/search-talent', aiVisitorRateLimiter, requireAiToolSecret, searchAiTalent);
router.post('/visitor/demo-request', aiVisitorRateLimiter, requireAiToolSecret, createAiDemoRequest);
router.post('/visitor/callback', aiVisitorRateLimiter, requireAiToolSecret, createAiCallbackRequest);

export default router;
