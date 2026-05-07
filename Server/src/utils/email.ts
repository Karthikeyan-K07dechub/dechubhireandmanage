import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host:   env.SMTP_HOST,
  port:   Number(env.SMTP_PORT),
  secure: Number(env.SMTP_PORT) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify().then(() => {
  logger.info('✅  SMTP transporter ready');
}).catch((err) => {
  logger.warn('⚠️  SMTP transporter not ready — emails will fail', err);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseTemplate(body: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 16px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0a1628, #162d54); padding: 32px 40px; }
    .logo { color: #00c9a7; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
    .content { padding: 40px; color: #0f172a; line-height: 1.65; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #0f172a; }
    p { margin: 0 0 16px; font-size: 15px; color: #475569; }
    .btn { display: inline-block; background: #0a1628; color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .otp { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00c9a7; text-align: center; padding: 24px; background: #f0fdf4; border-radius: 10px; margin: 24px 0; }
    .footer { padding: 20px 40px; background: #f8fafc; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
    .muted { font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header"><span class="logo">Dechub</span></div>
    <div class="content">${body}</div>
    <div class="footer">© ${new Date().getFullYear()} Dechub Pvt. Ltd. · J.P. Nagar, Bengaluru</div>
  </div>
</body>
</html>`.trim();
}

async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    await transporter.sendMail({ from: env.EMAIL_FROM, to, subject, html });
    logger.debug(`Email sent: "${subject}" → ${to}`);
  } catch (err) {
    logger.error(`Email failed: "${subject}" → ${to}`, err);
    throw new Error('Failed to send email');
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  otp: string,
): Promise<void> {
  const html = baseTemplate(`
    <h1>Verify your email</h1>
    <p>Hi ${firstName},</p>
    <p>Thanks for signing up with Dechub. Use the code below to verify your email address:</p>
    <div class="otp">${otp}</div>
    <p class="muted">This code expires in 15 minutes. If you didn't sign up, ignore this email.</p>
  `);
  await send(to, 'Verify your Dechub account', html);
}

export async function sendWelcomeEmail(
  to: string,
  firstName: string,
): Promise<void> {
  const html = baseTemplate(`
    <h1>Welcome to Dechub 🎉</h1>
    <p>Hi ${firstName},</p>
    <p>Your account is set up and your KYB verification is in progress. You'll receive another email once it's approved — usually within 2–5 minutes.</p>
    <p>Once approved, you can:</p>
    <ul style="color:#475569;font-size:15px;padding-left:20px;line-height:2;">
      <li>Invite workers and send offer letters</li>
      <li>Auto-generate compliant contracts</li>
      <li>Pay your team via Wise in 50+ currencies</li>
    </ul>
    <a href="${env.CLIENT_URL}/dashboard" class="btn">Go to Dashboard →</a>
    <p class="muted">Questions? Reply to this email and we'll help you out.</p>
  `);
  await send(to, 'Welcome to Dechub — you\'re all set!', html);
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
): Promise<void> {
  const html = baseTemplate(`
    <h1>Reset your password</h1>
    <p>Hi ${firstName},</p>
    <p>Someone requested a password reset for your Dechub account. Click the button below to reset it. The link expires in 30 minutes.</p>
    <a href="${resetUrl}" class="btn">Reset Password</a>
    <p class="muted">If you didn't request this, you can safely ignore this email.</p>
  `);
  await send(to, 'Reset your Dechub password', html);
}