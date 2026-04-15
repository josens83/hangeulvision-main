import type { Request, Response } from "express";
import type { ExamCategory, Prisma, SessionMode } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { notFound, unauthorized } from "../utils/http";
import { initialState, schedule, type Grade } from "../utils/srs";
import { computeStreakDays } from "../utils/streak";

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

const MODES = ["learn", "review", "quiz", "flashcard"] as const;

const queueQuery = z.object({
  exam: z.enum(EXAMS).optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const startSessionBody = z.object({
  mode: z.enum(MODES).default("review"),
  exam: z.enum(EXAMS).optional(),
  // Legacy alias accepted by the spec (body: { exam, wordsStudied, duration }).
  wordsStudied: z.coerce.number().int().min(0).optional(),
  duration: z.coerce.number().int().min(0).optional(),
});

const recordProgressBody = z.object({
  // Accept any non-empty id — Prisma default is cuid(), but the content
  // pipeline may backfill legacy or imported IDs (e.g. w_bap).
  wordId: z.string().min(1).max(64),
  grade: z.coerce.number().int().min(0).max(5),
});

const completeBody = z.object({
  cardsSeen: z.coerce.number().int().min(0).optional(),
  cardsKnown: z.coerce.number().int().min(0).optional(),
  cardsHard: z.coerce.number().int().min(0).optional(),
  cardsMissed: z.coerce.number().int().min(0).optional(),
});

// ─── Shared include ────────────────────────────────────────────────────────

const wordInclude = {
  etymology: true,
  mnemonic: true,
  examples: { orderBy: { position: "asc" as const } },
  collocations: true,
  visuals: true,
  examLevels: true,
} satisfies Prisma.WordInclude;

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

// ─── Handlers ──────────────────────────────────────────────────────────────

/**
 * GET /learning/queue
 *
 * Builds the next study batch for the authenticated user:
 *   1. Due words (UserProgress.dueAt ≤ now) — oldest-due first.
 *   2. Fresh words (no UserProgress row yet) — fills remaining slots.
 *
 * Also creates a LearningSession row up front so subsequent grading
 * calls can attribute reviews to this session.
 */
export async function reviewQueue(req: Request, res: Response) {
  const userId = uid(req);
  const q = queueQuery.parse(req.query);
  const now = new Date();

  const wordWhere: Prisma.WordWhereInput = { active: true };
  if (q.exam) wordWhere.exam = q.exam as ExamCategory;
  if (q.level !== undefined) wordWhere.level = q.level;

  // Phase 1 — due words with their fresh progress data.
  const dueRows = await prisma.userProgress.findMany({
    where: {
      userId,
      dueAt: { lte: now },
      word: wordWhere,
    },
    include: { word: { include: wordInclude } },
    orderBy: { dueAt: "asc" },
    take: q.limit,
  });

  const words = dueRows.map((r) => r.word);

  // Phase 2 — top up with words the user has never studied.
  const remaining = q.limit - words.length;
  if (remaining > 0) {
    const seenWordIds = await prisma.userProgress.findMany({
      where: { userId },
      select: { wordId: true },
    });
    const seenIds = new Set(seenWordIds.map((r) => r.wordId));
    const fresh = await prisma.word.findMany({
      where: {
        ...wordWhere,
        id: { notIn: [...seenIds, ...words.map((w) => w.id)] },
      },
      include: wordInclude,
      orderBy: [{ level: "asc" }, { word: "asc" }],
      take: remaining,
    });
    words.push(...fresh);
  }

  // Open a session so grade calls can attach to it.
  const session = await prisma.learningSession.create({
    data: {
      userId,
      mode: "review",
      exam: (q.exam as ExamCategory) ?? null,
    },
  });

  res.json({
    words,
    sessionId: session.id,
    due: dueRows.length,
    fresh: words.length - dueRows.length,
  });
}

/**
 * POST /learning/sessions
 * Spec body: { exam, wordsStudied, duration } — stores what the client
 * sends, auto-completes the session if `wordsStudied`/`duration` are
 * present (they imply the session already finished).
 */
export async function startSession(req: Request, res: Response) {
  const userId = uid(req);
  const body = startSessionBody.parse(req.body);
  const now = new Date();

  const data: Prisma.LearningSessionUncheckedCreateInput = {
    userId,
    mode: body.mode as SessionMode,
    exam: (body.exam as ExamCategory) ?? null,
    cardsSeen: body.wordsStudied ?? 0,
  };
  if (body.wordsStudied !== undefined) {
    data.completedAt = now;
  }

  const session = await prisma.learningSession.create({ data });
  res.status(201).json({ session });
}

/** GET /learning/sessions/:id */
export async function getSession(req: Request, res: Response) {
  const userId = uid(req);
  const session = await prisma.learningSession.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!session) throw notFound("Session not found.");
  res.json({ session });
}

/**
 * POST /learning/sessions/:id/progress
 * Grades a single word *within* a session — runs SM-2, upserts the
 * user's progress row, bumps the session tally.
 */
export async function recordProgress(req: Request, res: Response) {
  const userId = uid(req);
  const { id: sessionId } = req.params;
  const body = recordProgressBody.parse(req.body);
  const g = body.grade as Grade;
  const now = new Date();

  const session = await prisma.learningSession.findFirst({
    where: { id: sessionId, userId },
    select: { id: true },
  });
  if (!session) throw notFound("Session not found.");

  const existing = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId: body.wordId } },
  });
  const prevState = existing
    ? {
        ease: existing.ease,
        interval: existing.interval,
        reps: existing.reps,
        dueAt: existing.dueAt,
      }
    : initialState();
  const next = schedule(prevState, g);

  const field = g >= 4 ? "cardsKnown" : g === 3 ? "cardsHard" : "cardsMissed";

  const [progressRow] = await prisma.$transaction([
    prisma.userProgress.upsert({
      where: { userId_wordId: { userId, wordId: body.wordId } },
      create: {
        userId,
        wordId: body.wordId,
        ease: next.ease,
        interval: next.interval,
        reps: next.reps,
        dueAt: next.dueAt,
        lastGrade: g,
        lastReviewedAt: now,
      },
      update: {
        ease: next.ease,
        interval: next.interval,
        reps: next.reps,
        dueAt: next.dueAt,
        lastGrade: g,
        lastReviewedAt: now,
      },
    }),
    prisma.learningSession.update({
      where: { id: sessionId },
      data: {
        cardsSeen: { increment: 1 },
        [field]: { increment: 1 },
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { lastActiveAt: now } }),
  ]);

  res.json({ progress: progressRow });
}

/** POST /learning/sessions/:id/complete */
export async function completeSession(req: Request, res: Response) {
  const userId = uid(req);
  const body = completeBody.parse(req.body);

  const session = await prisma.learningSession.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!session) throw notFound("Session not found.");

  const updated = await prisma.learningSession.update({
    where: { id: session.id },
    data: {
      completedAt: new Date(),
      ...(body.cardsSeen !== undefined ? { cardsSeen: body.cardsSeen } : {}),
      ...(body.cardsKnown !== undefined ? { cardsKnown: body.cardsKnown } : {}),
      ...(body.cardsHard !== undefined ? { cardsHard: body.cardsHard } : {}),
      ...(body.cardsMissed !== undefined ? { cardsMissed: body.cardsMissed } : {}),
    },
  });
  res.json({ session: updated });
}

/** GET /learning/stats — lightweight streak + session counts */
export async function stats(req: Request, res: Response) {
  const userId = uid(req);
  const now = new Date();

  const [sessionCount, sessionDates, progressDates] = await prisma.$transaction([
    prisma.learningSession.count({ where: { userId, completedAt: { not: null } } }),
    prisma.learningSession.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 365,
    }),
    prisma.userProgress.findMany({
      where: { userId, lastReviewedAt: { not: null } },
      select: { lastReviewedAt: true },
      orderBy: { lastReviewedAt: "desc" },
      take: 365,
    }),
  ]);

  const activity: Date[] = [
    ...sessionDates.map((s) => s.completedAt).filter((d): d is Date => !!d),
    ...progressDates.map((p) => p.lastReviewedAt).filter((d): d is Date => !!d),
  ];

  res.json({
    sessions: sessionCount,
    streakDays: computeStreakDays(activity, now),
  });
}
