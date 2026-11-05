import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { logger } from '../utils/logger';

function unavailable(res: Response): void {
  res.status(503).json({ ok: false, error: 'service_unavailable' });
}

export function requireAiToolSecret(req: Request, res: Response, next: NextFunction): void {
  const expected = env.AI_TOOL_SECRET;
  if (!expected) {
    logger.warn('AI tool request rejected because AI_TOOL_SECRET is not configured');
    unavailable(res);
    return;
  }

  const supplied = req.header('X-AI-Tool-Secret');
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied ?? '');
  const matches = expectedBuffer.length === suppliedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);

  if (!matches) {
    res.status(401).json({ ok: false, error: 'unauthorized' });
    return;
  }

  next();
}

function routeKey(req: Request): string {
  return req.path;
}

export const aiVisitorRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: routeKey,
  handler: (_req, res) => res.status(429).json({ ok: false, error: 'rate_limited' }),
});

export const elevenLabsWebhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: routeKey,
  handler: (_req, res) => res.status(429).json({ ok: false, error: 'rate_limited' }),
});

export function requireElevenLabsWebhookSecret(_req: Request, res: Response, next: NextFunction): void {
  if (!env.ELEVENLABS_WEBHOOK_SECRET) {
    logger.warn('ElevenLabs webhook rejected because ELEVENLABS_WEBHOOK_SECRET is not configured');
    unavailable(res);
    return;
  }
  next();
}
