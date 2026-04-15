/**
 * Prisma seed script.
 *
 * Loads the 50 TOPIK I L1 words from ./seed-words.ts and upserts them into
 * Postgres. The script is idempotent — it can run on every container boot
 * without producing duplicates, and it preserves any enrichments added by
 * the downstream content pipeline (e.g. Stability AI concept images,
 * Claude-generated mnemonics) for words that already exist.
 *
 * Idempotency strategy
 *   Word        — upsert on (word, partOfSpeech)
 *   Etymology   — upsert on wordId  (1:1)
 *   Mnemonic    — upsert on wordId  (1:1)
 *   Example     — delete + createMany  (position-ordered, seed is source of truth)
 *   Collocation — delete + createMany
 *
 *   Existing WordVisual rows (AI images) are never touched — they survive
 *   re-seeds.
 *
 * Tier gating (spec §4):
 *   The first 10 words get a `tier:free` tag so the free plan can surface
 *   them on /learn without hitting the 800-word quota limit. The remaining
 *   40 words get `tier:basic`. The Word model has no tier column, so tags
 *   are the lightest-weight way to express this for MVP.
 */

import { PrismaClient, type OriginLanguage } from "@prisma/client";
import { SEED_WORDS, type SeedEtymology, type SeedWord } from "./seed-words";

const prisma = new PrismaClient();

const FREE_TIER_COUNT = 10;

function mapLanguage(lang: SeedEtymology["language"]): OriginLanguage {
  switch (lang) {
    case "Sino-Korean":
      return "SINO_KOREAN";
    case "Native":
      return "NATIVE";
    case "Loanword":
      return "LOANWORD";
    default:
      return "UNKNOWN";
  }
}

function tierTagFor(index: number): string {
  return index < FREE_TIER_COUNT ? "tier:free" : "tier:basic";
}

async function seedOne(w: SeedWord, index: number): Promise<void> {
  const tags = Array.from(new Set([...(w.tags ?? []), tierTagFor(index)]));

  // 1. Word — upsert on composite (word, partOfSpeech)
  const word = await prisma.word.upsert({
    where: {
      word_partOfSpeech: { word: w.word, partOfSpeech: w.partOfSpeech },
    },
    create: {
      word: w.word,
      romanization: w.romanization,
      ipa: w.ipa,
      definitionEn: w.definitionEn,
      partOfSpeech: w.partOfSpeech,
      level: w.level,
      exam: w.exam,
      tags,
      active: true,
    },
    update: {
      romanization: w.romanization,
      ipa: w.ipa,
      definitionEn: w.definitionEn,
      level: w.level,
      exam: w.exam,
      tags,
      active: true,
    },
  });

  // 2. Etymology — 1:1 on wordId
  if (w.etymology) {
    await prisma.etymology.upsert({
      where: { wordId: word.id },
      create: {
        wordId: word.id,
        origin: w.etymology.origin,
        language: mapLanguage(w.etymology.language),
        rootWords: w.etymology.rootWords as object,
        evolution: w.etymology.evolution ?? null,
        originEn: w.etymology.originEn ?? null,
      },
      update: {
        origin: w.etymology.origin,
        language: mapLanguage(w.etymology.language),
        rootWords: w.etymology.rootWords as object,
        evolution: w.etymology.evolution ?? null,
        originEn: w.etymology.originEn ?? null,
      },
    });
  }

  // 3. Mnemonic — 1:1 on wordId
  if (w.mnemonic) {
    await prisma.mnemonic.upsert({
      where: { wordId: word.id },
      create: {
        wordId: word.id,
        englishHint: w.mnemonic.englishHint,
        syllables: w.mnemonic.syllables,
      },
      update: {
        englishHint: w.mnemonic.englishHint,
        syllables: w.mnemonic.syllables,
      },
    });
  }

  // 4. Examples — delete + createMany so position ordering stays canonical
  await prisma.example.deleteMany({ where: { wordId: word.id } });
  if (w.examples.length) {
    await prisma.example.createMany({
      data: w.examples.map((e, pos) => ({
        wordId: word.id,
        position: pos,
        sentence: e.sentence,
        translation: e.translation,
        highlight: e.highlight ?? null,
      })),
    });
  }

  // 5. Collocations — delete + createMany
  await prisma.collocation.deleteMany({ where: { wordId: word.id } });
  if (w.collocations.length) {
    await prisma.collocation.createMany({
      data: w.collocations.map((c) => ({
        wordId: word.id,
        phrase: c.phrase,
        translation: c.translation,
      })),
    });
  }
}

async function main(): Promise<void> {
  const start = Date.now();
  // eslint-disable-next-line no-console
  console.log(`[seed] upserting ${SEED_WORDS.length} words…`);

  let ok = 0;
  let failed = 0;
  for (const [i, w] of SEED_WORDS.entries()) {
    try {
      await seedOne(w, i);
      ok += 1;
    } catch (err) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`[seed] failed on ${w.id} (${w.word}):`, err);
    }
  }

  const tierFree = Math.min(FREE_TIER_COUNT, SEED_WORDS.length);
  const tierBasic = Math.max(0, SEED_WORDS.length - FREE_TIER_COUNT);
  const elapsed = Date.now() - start;
  // eslint-disable-next-line no-console
  console.log(
    `[seed] done in ${elapsed}ms · ok=${ok} failed=${failed} ` +
      `· tier:free=${tierFree} tier:basic=${tierBasic}`,
  );
  if (failed > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("[seed] aborted:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
