import type { Request, Response } from "express";
import { z } from "zod";
import { config } from "../config";
import { prisma } from "../prisma";
import { badRequest, unauthorized } from "../utils/http";
import { logger } from "../utils/logger";
import { stub } from "./_stub";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

function hasPaddleConfig(): boolean {
  return !!(config.paddle.apiKey && config.paddle.webhookSecret);
}

const PRICE_MAP: Record<string, string> = {
  basic_monthly: config.paddle.prices.basicMonthly,
  basic_yearly: config.paddle.prices.basicYearly,
  premium_monthly: config.paddle.prices.premiumMonthly,
  premium_yearly: config.paddle.prices.premiumYearly,
};

function tierFromPlan(plan: string): "basic" | "premium" {
  return plan.startsWith("premium") ? "premium" : "basic";
}

const checkoutBody = z.object({
  plan: z.enum(["basic", "premium"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

/** POST /paddle/checkout — create a Paddle transaction */
export async function createCheckout(req: Request, res: Response) {
  if (!hasPaddleConfig()) {
    res.status(501).json({
      error: "not_configured",
      message: "Paddle API key not set. Configure PADDLE_API_KEY in Railway.",
    });
    return;
  }

  const userId = uid(req);
  const body = checkoutBody.parse(req.body);
  const planKey = `${body.plan}_${body.billingCycle}`;
  const priceId = PRICE_MAP[planKey];

  if (!priceId) {
    throw badRequest(`Price ID not configured for plan: ${planKey}. Set PADDLE_PRICE_ID_${planKey.toUpperCase()} in Railway.`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  if (!user) throw unauthorized();

  try {
    // Use Paddle API directly (REST) — simpler than the SDK for transaction creation.
    const paddleRes = await fetch("https://api.paddle.com/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.paddle.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        customer_email: user.email,
        custom_data: { userId, plan: planKey },
      }),
    });

    const data = await paddleRes.json() as {
      data?: { id: string };
      error?: { detail: string };
    };

    if (!paddleRes.ok || !data.data?.id) {
      logger.error(`Paddle create-checkout failed: ${JSON.stringify(data.error ?? data)}`);
      res.status(502).json({
        error: "paddle_error",
        message: data.error?.detail ?? "Failed to create checkout.",
      });
      return;
    }

    res.json({ transactionId: data.data.id, plan: planKey });
  } catch (err) {
    logger.error(`Paddle checkout error: ${err}`);
    res.status(500).json({ error: "internal_error", message: "Paddle API unreachable." });
  }
}

/** POST /paddle/webhook — Paddle calls this on subscription events */
export async function webhook(req: Request, res: Response) {
  if (!hasPaddleConfig()) {
    res.status(200).json({ received: true }); // Don't block Paddle retries
    return;
  }

  // Signature verification
  const signature = req.headers["paddle-signature"] as string | undefined;
  const rawBody = (req as Request & { rawBody?: string }).rawBody;

  if (!signature || !rawBody) {
    logger.warn("Paddle webhook missing signature or rawBody");
    res.status(200).json({ received: true });
    return;
  }

  // Parse timestamp + signature from header: ts=xxx;h1=xxx
  const parts = Object.fromEntries(
    signature.split(";").map((p) => p.split("=") as [string, string]),
  );
  const ts = parts.ts;
  const h1 = parts.h1;

  if (!ts || !h1) {
    logger.warn("Paddle webhook: malformed signature header");
    res.status(200).json({ received: true });
    return;
  }

  // HMAC verification
  const crypto = await import("crypto");
  const expected = crypto
    .createHmac("sha256", config.paddle.webhookSecret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  if (h1 !== expected) {
    logger.warn("Paddle webhook: signature mismatch");
    res.status(200).json({ received: true });
    return;
  }

  const event = JSON.parse(rawBody) as {
    event_type: string;
    data: {
      id: string;
      status: string;
      custom_data?: { userId?: string; plan?: string; type?: string; slug?: string };
      current_billing_period?: { ends_at: string };
      scheduled_change?: { action: string } | null;
    };
  };

  const eventType = event.event_type;
  const subData = event.data;
  const userId = subData.custom_data?.userId;
  const plan = subData.custom_data?.plan;

  logger.info(`Paddle webhook: ${eventType} sub=${subData.id} user=${userId}`);

  if (!userId) {
    logger.warn("Paddle webhook: no userId in custom_data");
    res.status(200).json({ received: true });
    return;
  }

  try {
    switch (eventType) {
      case "subscription.activated":
      case "subscription.updated": {
        const endDate = subData.current_billing_period?.ends_at
          ? new Date(subData.current_billing_period.ends_at)
          : null;
        const isCancelling = subData.scheduled_change?.action === "cancel";

        await prisma.user.update({
          where: { id: userId },
          data: {
            tier: tierFromPlan(plan ?? "basic"),
            subscriptionStatus: isCancelling ? "CANCELLED" : "ACTIVE",
            subscriptionId: subData.id,
            subscriptionPlan: plan ?? null,
            subscriptionEnd: endDate,
            autoRenewal: !isCancelling,
          },
        });
        // Send subscription welcome email
        if (!isCancelling) {
          const subUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
          if (subUser) {
            import("../services/email.service").then((m) =>
              m.sendSubscriptionWelcome(subUser.email, subUser.name, tierFromPlan(plan ?? "basic"), plan ?? "basic", ""),
            ).catch(() => {});
            // In-app notification
            import("../services/notification.service").then((m) =>
              m.createNotification(userId, "system", "Subscription activated!", `Welcome to ${tierFromPlan(plan ?? "basic")} plan.`),
            ).catch(() => {});
          }
        }
        break;
      }

      case "subscription.canceled": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "CANCELLED",
            autoRenewal: false,
          },
        });
        break;
      }

      case "subscription.past_due":
      case "subscription.paused": {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "EXPIRED",
            tier: "free",
            autoRenewal: false,
          },
        });
        break;
      }

      // Standalone pack purchase (one-time transaction)
      case "transaction.completed": {
        const slug = subData.custom_data?.slug;
        const type = subData.custom_data?.type;
        if (type === "package" && slug) {
          const pkg = await prisma.productPackage.findUnique({ where: { slug } });
          if (pkg) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + pkg.durationDays);
            await prisma.userPurchase.upsert({
              where: { userId_packageId: { userId, packageId: pkg.id } },
              create: { userId, packageId: pkg.id, exam: pkg.exam, expiresAt },
              update: { expiresAt },
            });
            logger.info(`Paddle standalone purchase: user=${userId} pkg=${slug} expires=${expiresAt.toISOString()}`);
            // Send receipt email
            const buyer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
            if (buyer) {
              import("../services/email.service").then((m) =>
                m.sendPurchaseReceipt(buyer.email, buyer.name, pkg, String(pkg.priceUSD), subData.id, expiresAt.toLocaleDateString()),
              ).catch(() => {});
            }
            // In-app notification
            import("../services/notification.service").then((m) =>
              m.createNotification(userId, "system", "Purchase confirmed!", `${pkg.nameEn ?? pkg.name} is now active.`),
            ).catch(() => {});
          }
        }
        break;
      }

      // Refund
      case "adjustment.updated": {
        const slug = subData.custom_data?.slug;
        const type = subData.custom_data?.type;
        if (type === "package" && slug) {
          const pkg = await prisma.productPackage.findUnique({ where: { slug } });
          if (pkg) {
            await prisma.userPurchase.updateMany({
              where: { userId, packageId: pkg.id },
              data: { expiresAt: new Date() },
            });
            logger.info(`Paddle refund: user=${userId} pkg=${slug}`);
          }
        } else {
          await prisma.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "CANCELLED", tier: "free", autoRenewal: false },
          });
        }
        break;
      }

      // Payment failure
      case "transaction.payment_failed": {
        const failUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (failUser) {
          import("../services/email.service").then((m) =>
            m.sendPasswordResetEmail(failUser.email, ""), // Reuse as generic notification — TODO: dedicated payment failure email
          ).catch(() => {});
        }
        logger.warn(`Paddle payment failed: user=${userId}`);
        break;
      }
    }
  } catch (err) {
    logger.error(`Paddle webhook processing error: ${err}`);
  }

  res.status(200).json({ received: true });
}

/** GET /paddle/prices — return configured price IDs for the frontend */
export async function listPrices(_req: Request, res: Response) {
  const configured = Object.fromEntries(
    Object.entries(PRICE_MAP).filter(([, v]) => v.length > 0),
  );
  res.json({
    prices: configured,
    configured: Object.keys(configured).length > 0,
  });
}

export const customerPortal = stub("paddle.customerPortal");
