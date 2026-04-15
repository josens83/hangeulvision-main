import type { Request, Response } from "express";
import type { ExamCategory, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";
import { initialState, isMastered, schedule, type Grade } from "../utils/srs";
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

const listQuery = z.object({
  exam: z.enum(EXAMS).optional(),
  level: z.coerce.number().int().min(1).max(6).optional(),
});

const gradeBody = z.object({
  grade: z.coerce.number().int().min(0).max(5),
  sessionId: z.string().min(1).max(64).optional(),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

/**
 * Buckets progress rows into { mastered, learning, new } for the stats card.
 *   • mastered  → reps ≥ 3 and ease ≥ 2.5
 *   • learning  → has any review history (reps ≥ 1) but not yet mastered
 *   • new       → seeded in the library but never reviewed
 */
function tally(rows: Array<{ reps: number; ease: number }>, totalWords: number) {
  const mastered = rows.filter(isMastered).length;
  const learning = rows.filter((r) => r.reps > 0 && !isMastered(r)).length;
  const seen = rows.length;
  const isNew = Math.max(0, totalWords - seen);
  return { total: totalWords, seen, mastered, learning, new: isNew };
}

// ─── Handlers ──────────────────────────────────────────────────────────────

/** GET /progress — list user's progress rows + summary counts */
export async function list(req: Request, res: Response) {
  const userId = uid(req);
  const q = listQuery.parse(req.query);

  const where: Prisma.UserProgressWhereInput = { userId };
  if (q.exam || q.level !== undefined) {
    where.word = {};
    if (q.exam) where.word.exam = q.exam as ExamCategory;
    if (q.level !== undefined) where.word.level = q.level;
  }

  const [rows, totalWords] = await prisma.$transaction([
    prisma.userProgress.findMany({
      where,
      orderBy: { dueAt: "asc" },
      include: {
        word: {
          select: {
            id: true,
            word: true,
            romanization: true,
            definitionEn: true,
            level: true,
            exam: true,
            partOfSpeech: true,
          },
        },
      },
    }),
    prisma.word.count({
      where: {
        active: true,
        ...(q.exam ? { exam: q.exam as ExamCategory } : {}),
        ...(q.level !== undefined ? { level: q.level } : {}),
      },
    }),
  ]);

  res.json({
    progress: rows,
    stats: tally(rows, totalWords),
  });
}

/** GET /progress/:wordId — single row */
export async function getOne(req: Request, res: Response) {
  const userId = uid(req);
  const { wordId } = req.params;

  const row = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId } },
  });
  res.json({ progress: row });
}

/**
 * POST /progress/:wordId/grade
 * Applies SM-2 and upserts the user's progress row. Optionally links the
 * review to an in-flight LearningSession (bumps its tally).
 */
export async function grade(req: Request, res: Response) {
  const userId = uid(req);
  const { wordId } = req.params;
  const body = gradeBody.parse(req.body);
  const g = body.grade as Grade;

  // Confirm the word exists before we spin up a progress row.
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    select: { id: true },
  });
  if (!word) {
    res.status(404).json({ error: "not_found", message: "Word not found." });
    return;
  }

  const existing = await prisma.userProgress.findUnique({
    where: { userId_wordId: { userId, wordId } },
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
  const now = new Date();

  const updated = await prisma.userProgress.upsert({
    where: { userId_wordId: { userId, wordId } },
    create: {
      userId,
      wordId,
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
  });

  // Bump session tallies + user's last-active timestamp in parallel.
  const bumps: Prisma.PrismaPromise<unknown>[] = [
    prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: now },
    }),
  ];
  if (body.sessionId) {
    const field =
      g >= 4 ? "cardsKnown" : g === 3 ? "cardsHard" : "cardsMissed";
    bumps.push(
      prisma.learningSession.updateMany({
        where: { id: body.sessionId, userId },
        data: {
          cardsSeen: { increment: 1 },
          [field]: { increment: 1 },
        },
      }),
    );
  }
  await prisma.$transaction(bumps);

  res.json({ progress: updated });
}

/** DELETE /progress/:wordId — reset the SRS row for a single word */
export async function reset(req: Request, res: Response) {
  const userId = uid(req);
  const { wordId } = req.params;
  await prisma.userProgress
    .delete({ where: { userId_wordId: { userId, wordId } } })
    .catch(() => {
      /* idempotent — missing row is fine */
    });
  res.status(204).end();
}

/** GET /progress/summary — global stats + streak (alias: /progress/stats) */
export async function summary(req: Request, res: Response) {
  const userId = uid(req);
  const now = new Date();

  const [rows, totalWords, sessionDates] = await prisma.$transaction([
    prisma.userProgress.findMany({
      where: { userId },
      select: { reps: true, ease: true, lastReviewedAt: true, dueAt: true },
    }),
    prisma.word.count({ where: { active: true } }),
    prisma.learningSession.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true },
      orderBy: { completedAt: "desc" },
      take: 365,
    }),
  ]);

  const activityDates: Date[] = [
    ...rows.map((r) => r.lastReviewedAt).filter((d): d is Date => !!d),
    ...sessionDates.map((s) => s.completedAt).filter((d): d is Date => !!d),
  ];
  const streakDays = computeStreakDays(activityDates, now);
  const dueCount = rows.filter((r) => r.dueAt.getTime() <= now.getTime()).length;

  res.json({
    stats: {
      ...tally(rows, totalWords),
      streakDays,
      dueCount,
    },
  });
}
