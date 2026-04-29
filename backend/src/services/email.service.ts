import sgMail from "@sendgrid/mail";
import { logger } from "../utils/logger";

const FROM = process.env.EMAIL_FROM ?? "noreply@hangeulvision.app";

function hasMailConfig(): boolean {
  const key = process.env.SENDGRID_API_KEY?.trim();
  if (key) sgMail.setApiKey(key);
  return !!key;
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!hasMailConfig()) {
    logger.info(`[email] skipped (no SENDGRID_API_KEY): to=${to} subject="${subject}"`);
    return;
  }
  try {
    await sgMail.send({ to, from: FROM, subject, html });
    logger.info(`[email] sent to=${to} subject="${subject}"`);
  } catch (err) {
    logger.error(`[email] failed to=${to}: ${err}`);
  }
}

export async function sendWelcomeEmail(to: string, name: string) {
  await send(to, "Welcome to HangeulVision AI!", `
    <h2>Welcome, ${name}! 🎉</h2>
    <p>You've joined the world's first AI-powered Korean vocabulary platform.</p>
    <p>Start with 800 free TOPIK I words — every word gets an AI concept image, hanja breakdown, and mnemonic.</p>
    <p><a href="https://hangeulvision-main.vercel.app/learn" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Start Learning</a></p>
    <p style="color:#6b7280;font-size:12px;">— HangeulVision AI by Unipath</p>
  `);
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const link = `https://hangeulvision-main.vercel.app/auth/reset-password?token=${token}`;
  await send(to, "Reset your password — HangeulVision AI", `
    <h2>Password Reset</h2>
    <p>Click the button below to reset your password. This link expires in 1 hour.</p>
    <p><a href="${link}" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset Password</a></p>
    <p style="color:#6b7280;font-size:12px;">If you didn't request this, ignore this email.</p>
  `);
}

export async function sendGoalAchievedEmail(to: string, name: string, goal: number) {
  await send(to, "Daily goal achieved! 🎯", `
    <h2>Great work, ${name}!</h2>
    <p>You've completed your daily goal of ${goal} cards today. Keep the streak going!</p>
    <p><a href="https://hangeulvision-main.vercel.app/statistics" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Statistics</a></p>
  `);
}

export async function sendStreakEmail(to: string, name: string, streak: number) {
  await send(to, `${streak}-day streak! 🔥`, `
    <h2>${streak} days in a row, ${name}!</h2>
    <p>Your dedication is paying off. Keep learning to maintain your streak.</p>
    <p><a href="https://hangeulvision-main.vercel.app/review" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Continue Learning</a></p>
  `);
}

export async function sendPurchaseReceipt(
  to: string, name: string,
  pkg: { name: string; nameEn?: string | null },
  amount: string, transactionId: string, expiresAt?: string,
) {
  const pkgName = pkg.nameEn ?? pkg.name;
  await send(to, `Receipt — ${pkgName}`, `
    <h2>Thank you, ${name}!</h2>
    <p>Your purchase of <strong>${pkgName}</strong> is confirmed.</p>
    <table style="margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Amount</td><td style="padding:4px 0;">${amount}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Transaction</td><td style="padding:4px 0;">${transactionId}</td></tr>
      ${expiresAt ? `<tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Access until</td><td style="padding:4px 0;">${expiresAt}</td></tr>` : ""}
    </table>
    <p><a href="https://hangeulvision-main.vercel.app/learn" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Start Learning</a></p>
    <p style="color:#6b7280;font-size:12px;">— HangeulVision AI by Unipath</p>
  `);
}

export async function sendSubscriptionWelcome(
  to: string, name: string, tier: string, cycle: string, amount: string,
) {
  await send(to, `Welcome to ${tier} — HangeulVision AI`, `
    <h2>Welcome to ${tier}, ${name}! 🎉</h2>
    <p>Your ${cycle} subscription is now active.</p>
    <table style="margin:16px 0;border-collapse:collapse;">
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Plan</td><td style="padding:4px 0;">${tier} (${cycle})</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280;">Amount</td><td style="padding:4px 0;">${amount}</td></tr>
    </table>
    <p>You now have access to all ${tier === "Premium" ? "13,500+" : "5,000+"} words.</p>
    <p><a href="https://hangeulvision-main.vercel.app/dashboard" style="background:#14a896;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Go to Dashboard</a></p>
  `);
}
