import type { ExamCategory } from "@prisma/client";

type Tier = "free" | "basic" | "premium";

const ACCESS_MAP: Record<Tier, Set<ExamCategory>> = {
  free: new Set(["TOPIK_I"]),
  basic: new Set(["TOPIK_I", "TOPIK_II_MID", "KIIP"]),
  premium: new Set([
    "TOPIK_I",
    "TOPIK_II_MID",
    "TOPIK_II_ADV",
    "KIIP",
    "EPS_TOPIK",
    "THEME",
    "GENERAL",
  ]),
};

const LEVEL_LIMIT: Record<Tier, number> = {
  free: 1,    // Free: TOPIK_I Level 1 only
  basic: 6,   // Basic: all levels
  premium: 6, // Premium: all levels
};

export function checkContentAccess(
  tier: Tier,
  exam: ExamCategory,
  level?: number,
): { allowed: true } | { allowed: false; reason: string; requiredTier: Tier } {
  const allowed = ACCESS_MAP[tier] ?? ACCESS_MAP.free;

  if (!allowed.has(exam)) {
    const requiredTier = ACCESS_MAP.premium.has(exam) ? "premium" : "basic";
    return {
      allowed: false,
      reason: `${exam} requires ${requiredTier} plan.`,
      requiredTier,
    };
  }

  const maxLevel = LEVEL_LIMIT[tier];
  if (level !== undefined && level > maxLevel) {
    return {
      allowed: false,
      reason: `Level ${level} requires basic or premium plan.`,
      requiredTier: "basic",
    };
  }

  return { allowed: true };
}
