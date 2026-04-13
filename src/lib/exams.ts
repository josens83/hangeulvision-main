// Exam / product taxonomy. Mirrors the ExamCategory enum from the spec.
export type ExamCategory =
  | "TOPIK_I"
  | "TOPIK_II_MID"
  | "TOPIK_II_ADV"
  | "KIIP"
  | "EPS_TOPIK"
  | "THEME";

export type Tier = "free" | "basic" | "premium";

export interface ExamDef {
  id: ExamCategory;
  name: string;
  nameEn: string;
  levelRange: string;
  description: string;
  wordCount: number;
  tiers: Tier[];           // subscription tiers that unlock this exam
  oneTimePriceUSD?: number; // if purchasable as a one-time pack
  color: string;
  emoji: string;
}

export const EXAMS: ExamDef[] = [
  {
    id: "TOPIK_I",
    name: "TOPIK I (1-2급)",
    nameEn: "TOPIK I · Beginner",
    levelRange: "Level 1-2",
    description:
      "National Institute of Korean Language standard beginner vocabulary — 2,000 core words for TOPIK I.",
    wordCount: 2000,
    tiers: ["basic", "premium"],
    color: "from-sky-400 to-brand-500",
    emoji: "🌱",
  },
  {
    id: "TOPIK_II_MID",
    name: "TOPIK II 중급 (3-4급)",
    nameEn: "TOPIK II · Intermediate",
    levelRange: "Level 3-4",
    description:
      "Intermediate vocabulary for university admission and professional settings.",
    wordCount: 3000,
    tiers: ["premium"],
    oneTimePriceUSD: 6.99,
    color: "from-indigo-400 to-purple-500",
    emoji: "🌿",
  },
  {
    id: "TOPIK_II_ADV",
    name: "TOPIK II 고급 (5-6급)",
    nameEn: "TOPIK II · Advanced",
    levelRange: "Level 5-6",
    description:
      "Advanced and academic vocabulary for graduate study and professional Korean.",
    wordCount: 4000,
    tiers: ["premium"],
    oneTimePriceUSD: 9.99,
    color: "from-rose-400 to-pink-500",
    emoji: "🌳",
  },
  {
    id: "KIIP",
    name: "사회통합프로그램 (KIIP)",
    nameEn: "Korea Immigration & Integration",
    levelRange: "Stages 1-5",
    description:
      "Vocabulary for the KIIP program — required for F-2 residency and naturalization.",
    wordCount: 1500,
    tiers: ["premium"],
    color: "from-amber-400 to-orange-500",
    emoji: "🏛️",
  },
  {
    id: "EPS_TOPIK",
    name: "고용허가제 (EPS-TOPIK)",
    nameEn: "Employment Permit System",
    levelRange: "Manufacturing / Agriculture / Construction",
    description:
      "Occupational vocabulary for the EPS-TOPIK test taken by foreign workers.",
    wordCount: 1000,
    tiers: ["premium"],
    oneTimePriceUSD: 6.99,
    color: "from-emerald-400 to-teal-500",
    emoji: "🛠️",
  },
  {
    id: "THEME",
    name: "Theme Learning",
    nameEn: "Daily life · Work · K-Culture",
    levelRange: "All levels",
    description:
      "Thematic word packs: K-pop lyrics, K-drama phrases, daily life, business Korean.",
    wordCount: 2000,
    tiers: ["premium"],
    color: "from-fuchsia-400 to-rose-500",
    emoji: "🎤",
  },
];

export function examById(id: ExamCategory): ExamDef | undefined {
  return EXAMS.find((e) => e.id === id);
}
