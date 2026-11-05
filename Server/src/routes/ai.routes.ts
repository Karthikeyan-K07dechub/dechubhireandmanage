import { Router } from 'express';
import { createAiCallbackRequest, createAiDemoRequest } from '../controllers/aiVisitor.controller';
import { aiVisitorRateLimiter, requireAiToolSecret } from '../middleware/aiTool.middleware';

const router = Router();

router.post('/visitor/demo-request', aiVisitorRateLimiter, requireAiToolSecret, createAiDemoRequest);
router.post('/visitor/callback', aiVisitorRateLimiter, requireAiToolSecret, createAiCallbackRequest);

export default router;
