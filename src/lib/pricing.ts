import type { ExamCategory, Tier } from "./exams";

export interface Plan {
  id: Tier;
  name: string;
  tagline: string;
  priceUSD: number;
  priceKRW: number;
  period: "free" | "month";
  features: string[];
  examAccess: ExamCategory[];
  highlight?: boolean;
  cta: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Sample the world's first AI-visualized Korean vocabulary.",
    priceUSD: 0,
    priceKRW: 0,
    period: "free",
    features: [
      "TOPIK I · Level 1 (800 words)",
      "AI Concept image for every word",
      "SM-2 spaced repetition",
      "1 daily review session",
    ],
    examAccess: ["TOPIK_I"], // with word-level gating to first 800
    cta: "Start free",
  },
  {
    id: "basic",
    name: "Basic",
    tagline: "Everything you need for TOPIK I.",
    priceUSD: 4.99,
    priceKRW: 6900,
    period: "month",
    features: [
      "All TOPIK I vocabulary (2,000 words)",
      "AI Concept + Mnemonic images",
      "Hanja / etymology breakdown",
      "Collocations & example sentences",
      "KIIP stage 1-2 included",
      "Mobile app (iOS / Android / Web)",
    ],
    examAccess: ["TOPIK_I", "KIIP"],
    cta: "Go Basic",
  },
  {
    id: "premium",
    name: "Premium",
    tagline: "Full library — every TOPIK level, every theme.",
    priceUSD: 7.99,
    priceKRW: 10900,
    period: "month",
    features: [
      "All 13,500+ words across every level",
      "TOPIK I + TOPIK II (중급 & 고급)",
      "KIIP + EPS-TOPIK",
      "K-Pop / K-Drama theme packs",
      "AI tutor & unlimited review",
      "Video lessons (Shorts & Stories)",
      "Priority support",
    ],
    examAccess: [
      "TOPIK_I",
      "TOPIK_II_MID",
      "TOPIK_II_ADV",
      "KIIP",
      "EPS_TOPIK",
      "THEME",
    ],
    highlight: true,
    cta: "Go Premium",
  },
];

export const ONE_TIME_PACKAGES = [
  {
    id: "TOPIK_II_MID",
    name: "TOPIK II Intermediate",
    description: "3-4급 · 3,000 words · 6-month access",
    priceUSD: 6.99,
    priceKRW: 9900,
  },
  {
    id: "TOPIK_II_ADV",
    name: "TOPIK II Advanced",
    description: "5-6급 · 4,000 words · 6-month access",
    priceUSD: 9.99,
    priceKRW: 14900,
  },
  {
    id: "EPS_TOPIK",
    name: "EPS-TOPIK",
    description: "Employment Permit System · 1,000 words · 6-month access",
    priceUSD: 6.99,
    priceKRW: 9900,
  },
] as const;

export function planById(id: Tier): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function hasExamAccess(tier: Tier, exam: ExamCategory, purchases: ExamCategory[] = []): boolean {
  if (purchases.includes(exam)) return true;
  const plan = planById(tier);
  return plan.examAccess.includes(exam);
}
