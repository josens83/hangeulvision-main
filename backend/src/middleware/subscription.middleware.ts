import type { ExamCategory } from "@prisma/client";
import { prisma } from "../prisma";

type Tier = "free" | "basic" | "premium";

const ACCESS_MAP: Record<Tier, Set<ExamCategory>> = {
  free: new Set(["TOPIK_I"]),
  basic: new Set(["TOPIK_I", "TOPIK_II_MID", "KIIP"]),
  premium: new Set([
    "TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV",
    "KIIP", "EPS_TOPIK", "THEME", "GENERAL",
  ]),
};

const LEVEL_LIMIT: Record<Tier, number> = {
  free: 1,
  basic: 6,
  premium: 6,
};

/**
 * Checks content access by subscription tier + standalone purchases.
 * A user with a TOPIK II Intermediate pack can access TOPIK_II_MID
 * even on the free tier.
 */
export async function checkContentAccessWithPurchases(
  userId: string | null,
  tier: Tier,
  exam: ExamCategory,
  level?: number,
): Promise<{ allowed: true } | { allowed: false; reason: string; requiredTier: Tier }> {
  // Subscription check first
  const subResult = checkContentAccess(tier, exam, level);
  if (subResult.allowed) return subResult;

  // Check standalone purchases
  if (userId) {
    const purchase = await prisma.userPurchase.findFirst({
      where: {
        userId,
        package: { exam, active: true },
        expiresAt: { gte: new Date() },
      },
    });
    if (purchase) return { allowed: true };
  }

  return subResult;
}

export function checkContentAccess(
  tier: Tier,
  exam: ExamCategory,
  level?: number,
): { allowed: true } | { allowed: false; reason: string; requiredTier: Tier } {
  const allowed = ACCESS_MAP[tier] ?? ACCESS_MAP.free;

  if (!allowed.has(exam)) {
    const requiredTier = ACCESS_MAP.premium.has(exam) ? "premium" : "basic";
    return { allowed: false, reason: `${exam} requires ${requiredTier} plan.`, requiredTier };
  }

  const maxLevel = LEVEL_LIMIT[tier];
  if (level !== undefined && level > maxLevel) {
    return { allowed: false, reason: `Level ${level} requires basic or premium plan.`, requiredTier: "basic" };
  }

  return { allowed: true };
}
