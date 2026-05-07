import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT:                  z.string().default('4000'),
  NODE_ENV:              z.enum(['development', 'production', 'test']).default('development'),
  PAYMENT_PROVIDER:      z.enum(['dummy', 'stripe']).default('dummy'),
  CLIENT_URL:            z.string().url(),
  MONGODB_URI:           z.string().min(1),
  JWT_SECRET:            z.string().min(32),
  JWT_REFRESH_SECRET:    z.string().min(32),
  JWT_EXPIRES_IN:        z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN:z.string().default('7d'),
  GOOGLE_CLIENT_ID:      z.string().min(1),
  GOOGLE_CLIENT_SECRET:  z.string().min(1),
  GOOGLE_CALLBACK_URL:   z.string().url(),
  STRIPE_SECRET_KEY:     z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  SMTP_HOST:             z.string().min(1),
  SMTP_PORT:             z.string().default('587'),
  SMTP_USER:             z.string().min(1),
  SMTP_PASS:             z.string().min(1),
  EMAIL_FROM:            z.string().min(1),
  UPLOAD_DIR:            z.string().default('uploads'),
  MAX_FILE_SIZE_MB:      z.string().default('10'),
  DOCUSIGN_INTEGRATION_KEY: z.string().default(''),
  DOCUSIGN_ACCOUNT_ID:      z.string().default(''),
  DOCUSIGN_USER_ID:         z.string().default(''),
  DOCUSIGN_PRIVATE_KEY:     z.string().default(''),
  DOCUSIGN_BASE_URL:        z.string().default('https://demo.docusign.net'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
