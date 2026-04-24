import type { Request, Response } from "express";
import type { ExamCategory } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { badRequest, notFound } from "../utils/http";
import * as cache from "../utils/cache";

// ─── Validation ────────────────────────────────────────────────────────────

const EXAMS = [
  "TOPIK_I",
  "TOPIK_II_MID",
  "TOPIK_II_ADV",
  "KIIP",
  "EPS_TOPIK",
  "THEME",
  "GENERAL",
] as const;

const examEnum = z.enum(EXAMS);

const listSchema = z.object({
  exam: examEnum.optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
});

const searchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Shared includes ───────────────────────────────────────────────────────

/** Minimal include for list/grid views — enough to render word cards. */
const listInclude = {
  examLevels: true,
  visuals: true,
} satisfies Prisma.WordInclude;

/** Full include for single-word detail views. */
const detailInclude = {
  etymology: true,
  mnemonic: true,
  examples: { orderBy: { position: "asc" as const } },
  collocations: true,
  visuals: true,
  examLevels: true,
  synonyms: { include: { related: true } },
  antonyms: { include: { related: true } },
} satisfies Prisma.WordInclude;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Builds a Prisma `where` clause that matches a word either by its primary
 * classification (Word.exam + Word.level) or by any secondary tag in
 * WordExamLevel. This is the join-based filter the spec calls for.
 */
function examLevelWhere(exam?: ExamCategory, level?: number): Prisma.WordWhereInput {
  if (!exam && level === undefined) return {};
  const primary: Prisma.WordWhereInput = {};
  if (exam) primary.exam = exam;
  if (level !== undefined) primary.level = level;

  const secondary: Prisma.WordExamLevelWhereInput = {};
  if (exam) secondary.exam = exam;
  if (level !== undefined) secondary.level = level;

  return { OR: [primary, { examLevels: { some: secondary } }] };
}

function searchWhere(q: string): Prisma.WordWhereInput {
  const insensitive = Prisma.QueryMode.insensitive;
  return {
    OR: [
      { word: { contains: q, mode: insensitive } },
      { romanization: { contains: q, mode: insensitive } },
      { phonetic: { contains: q, mode: insensitive } },
      { definitionEn: { contains: q, mode: insensitive } },
    ],
  };
}

// ─── Handlers ──────────────────────────────────────────────────────────────

/** GET /words — paged list with optional exam/level/search filter */
export async function list(req: Request, res: Response) {
  const q = listSchema.parse(req.query);

  const where: Prisma.WordWhereInput = {
    active: true,
    ...examLevelWhere(q.exam, q.level),
    ...(q.search ? searchWhere(q.search) : {}),
  };

  const [total, words] = await prisma.$transaction([
    prisma.word.count({ where }),
    prisma.word.findMany({
      where,
      include: listInclude,
      orderBy: [{ level: "asc" }, { word: "asc" }],
      skip: (q.page - 1) * q.limit,
      take: q.limit,
    }),
  ]);

  res.json({
    words,
    total,
    page: q.page,
    limit: q.limit,
    totalPages: Math.max(1, Math.ceil(total / q.limit)),
  });
}

/** GET /words/search?q=foo */
export async function search(req: Request, res: Response) {
  const q = searchSchema.parse(req.query);
  const words = await prisma.word.findMany({
    where: { active: true, ...searchWhere(q.q) },
    include: listInclude,
    take: q.limit,
    orderBy: [{ level: "asc" }, { word: "asc" }],
  });
  res.json({ words, count: words.length, query: q.q });
}

/**
 * GET /words/daily
 * Deterministic per-day selection: same word for every learner on the same
 * UTC day, then rotates at midnight. Seeded index is stable for 24h so the
 * CDN can cache the endpoint.
 */
export async function daily(_req: Request, res: Response) {
  const total = await prisma.word.count({ where: { active: true } });
  if (total === 0) throw notFound("No words available.");

  const dayIndex = Math.floor(Date.now() / 86_400_000) % total;
  const [word] = await prisma.word.findMany({
    where: { active: true },
    include: detailInclude,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    skip: dayIndex,
    take: 1,
  });

  if (!word) throw notFound("Daily word not found.");
  res.json({ word, dayIndex });
}

/**
 * GET /words/count
 * Counts per exam. Returns both the primary classification (Word.exam) and
 * the secondary tag counts (WordExamLevel) so admin dashboards can show both.
 */
export async function count(_req: Request, res: Response) {
  const cached = cache.getWordCount<object>();
  if (cached) {
    res.json(cached);
    return;
  }

  const [primary, secondary, total] = await prisma.$transaction([
    prisma.word.groupBy({
      by: ["exam"],
      _count: { _all: true },
      where: { active: true },
      orderBy: { exam: "asc" },
    }),
    prisma.wordExamLevel.groupBy({
      by: ["exam"],
      _count: { _all: true },
      orderBy: { exam: "asc" },
    }),
    prisma.word.count({ where: { active: true } }),
  ]);

  const buildMap = (rows: Array<{ exam: ExamCategory; _count: unknown }>) =>
    Object.fromEntries(
      rows.map((r) => {
        const c = r._count as { _all?: number } | undefined;
        return [r.exam, c?._all ?? 0];
      }),
    );

  const result = { total, primary: buildMap(primary), secondary: buildMap(secondary) };
  cache.setWordCount(result);
  res.json(result);
}

/** GET /words/by-exam/:exam */
export async function byExam(req: Request, res: Response) {
  const exam = examEnum.safeParse(req.params.exam);
  if (!exam.success) throw badRequest("Unknown exam category.");
  const level = req.query.level
    ? z.coerce.number().int().min(1).max(6).parse(req.query.level)
    : undefined;

  const words = await prisma.word.findMany({
    where: { active: true, ...examLevelWhere(exam.data, level) },
    include: listInclude,
    orderBy: [{ level: "asc" }, { word: "asc" }],
  });
  res.json({ words, count: words.length, exam: exam.data, level: level ?? null });
}

/** GET /words/:id — full word detail */
export async function getById(req: Request, res: Response) {
  const id = req.params.id;
  const word = await prisma.word.findUnique({
    where: { id },
    include: detailInclude,
  });
  if (!word) throw notFound("Word not found.");
  res.json({ word });
}

/** GET /words/:id/examples */
export async function examples(req: Request, res: Response) {
  const examples = await prisma.example.findMany({
    where: { wordId: req.params.id },
    orderBy: { position: "asc" },
  });
  res.json({ examples });
}

/** GET /words/:id/visuals */
export async function visuals(req: Request, res: Response) {
  const visuals = await prisma.wordVisual.findMany({
    where: { wordId: req.params.id },
    orderBy: { kind: "asc" },
  });
  res.json({ visuals });
}

/** GET /words/:id/related — synonyms + antonyms + same-exam neighbors */
export async function related(req: Request, res: Response) {
  const id = req.params.id;
  const word = await prisma.word.findUnique({
    where: { id },
    select: { id: true, exam: true, level: true },
  });
  if (!word) throw notFound("Word not found.");

  const [synonyms, antonyms, neighbors] = await prisma.$transaction([
    prisma.synonym.findMany({
      where: { wordId: id },
      include: { related: true },
    }),
    prisma.antonym.findMany({
      where: { wordId: id },
      include: { related: true },
    }),
    prisma.word.findMany({
      where: { id: { not: id }, exam: word.exam, level: word.level, active: true },
      take: 6,
      orderBy: { word: "asc" },
      select: { id: true, word: true, romanization: true, definitionEn: true, level: true },
    }),
  ]);

  res.json({ synonyms, antonyms, neighbors });
}
