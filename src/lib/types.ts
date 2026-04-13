import type { ExamCategory, Tier } from "./exams";

export type PartOfSpeech =
  | "NOUN"
  | "VERB"
  | "ADJ"
  | "ADV"
  | "PARTICLE"
  | "INTERJ"
  | "DET"
  | "PRONOUN"
  | "NUMERAL";

export type OriginLanguage = "Sino-Korean" | "Native" | "Loanword";

export interface Hanja {
  char: string;       // 抛
  meaning: string;    // 던질
  sound: string;      // 포
}

export interface Etymology {
  origin: string;                 // 抛棄 / 마음 / コップ
  language: OriginLanguage;
  rootWords: Hanja[] | string[];
  evolution?: string;
  originEn?: string;
}

export interface Example {
  sentence: string;       // Korean sentence
  translation: string;    // English translation
  highlight?: string;     // The target form appearing in the sentence
}

export interface Mnemonic {
  englishHint: string;    // PO-GI → POst it and GO, ...
  syllables: string[];    // ["포", "기", "하", "다"]
  imageUrl?: string;
}

export interface Collocation {
  phrase: string;         // "꿈을 포기하다"
  translation: string;    // "to give up on a dream"
}

export interface Word {
  id: string;
  word: string;               // 포기하다
  romanization: string;       // pogihada
  ipa: string;                // /po̞.ɡi.ɦa̠.da/
  definitionEn: string;
  definitionJa?: string;
  definitionVi?: string;
  definitionZh?: string;
  partOfSpeech: PartOfSpeech;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  exam: ExamCategory;
  conceptImageUrl?: string;
  mnemonic?: Mnemonic;
  etymology?: Etymology;
  morphology?: {
    prefix?: string;
    root?: string;
    suffix?: string;
    note?: string;
  };
  examples: Example[];
  collocations: Collocation[];
  synonyms?: string[];
  antonyms?: string[];
  tags?: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  tier: Tier;
  purchases: ExamCategory[];
  createdAt: string;
  locale: "en" | "ja" | "vi" | "zh" | "ko";
  streakDays: number;
  lastActive?: string;
}

export interface ProgressEntry {
  wordId: string;
  ease: number;       // SM-2 ease factor (default 2.5)
  interval: number;   // days until next review
  reps: number;
  dueAt: string;      // ISO
  lastGrade?: 0 | 1 | 2 | 3 | 4 | 5;
  lastReviewedAt?: string;
}

export interface Payment {
  id: string;
  userId: string;
  provider: "toss" | "paddle" | "mock";
  kind: "subscription" | "one-time";
  productId: string;
  amountUSD: number;
  status: "paid" | "pending" | "refunded";
  createdAt: string;
}
