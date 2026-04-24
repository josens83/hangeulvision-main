import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

function todayUTC(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isSameDay(a: Date | null | undefined, b: Date): boolean {
  if (!a) return false;
  const da = new Date(a);
  return (
    da.getUTCFullYear() === b.getUTCFullYear() &&
    da.getUTCMonth() === b.getUTCMonth() &&
    da.getUTCDate() === b.getUTCDate()
  );
}

function isYesterday(a: Date | null | undefined, today: Date): boolean {
  if (!a) return false;
  const yesterday = new Date(today.getTime() - 86_400_000);
  return isSameDay(a, yesterday);
}

/**
 * Resets dailyProgress at midnight if needed, and recalculates streak.
 * Called on every goal/progress read so the state is always fresh.
 */
async function ensureFreshGoals(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      dailyGoal: true,
      dailyProgress: true,
      lastGoalReset: true,
      lastStudyDate: true,
      streakDays: true,
      bestStreak: true,
    },
  });
  if (!user) return null;

  const today = todayUTC();
  const needsReset = !isSameDay(user.lastGoalReset, today);

  if (needsReset) {
    // Recalculate streak: if lastStudyDate was yesterday, keep it;
    // if it was today already (shouldn't happen here), keep it;
    // otherwise reset streak to 0.
    let streak = user.streakDays;
    if (!isYesterday(user.lastStudyDate, today) && !isSameDay(user.lastStudyDate, today)) {
      streak = 0;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        dailyProgress: 0,
        lastGoalReset: today,
        streakDays: streak,
      },
      select: {
        dailyGoal: true,
        dailyProgress: true,
        streakDays: true,
        bestStreak: true,
        lastStudyDate: true,
      },
    });
    return updated;
  }

  return user;
}

/** GET /goals/daily */
export async function getDailyGoal(req: Request, res: Response) {
  const userId = uid(req);
  const goals = await ensureFreshGoals(userId);
  if (!goals) {
    res.status(404).json({ error: "not_found", message: "User not found" });
    return;
  }
  const pct = goals.dailyGoal > 0 ? Math.round((goals.dailyProgress / goals.dailyGoal) * 100) : 0;
  res.json({
    dailyGoal: goals.dailyGoal,
    dailyProgress: goals.dailyProgress,
    percentage: Math.min(100, pct),
    streakDays: goals.streakDays,
    bestStreak: goals.bestStreak,
    completed: goals.dailyProgress >= goals.dailyGoal,
  });
}

const updateGoalBody = z.object({
  goal: z.coerce.number().int().min(1).max(100),
});

/** PUT /goals/daily */
export async function updateDailyGoal(req: Request, res: Response) {
  const userId = uid(req);
  const body = updateGoalBody.parse(req.body);
  const user = await prisma.user.update({
    where: { id: userId },
    data: { dailyGoal: body.goal },
    select: { dailyGoal: true, dailyProgress: true },
  });
  res.json({ dailyGoal: user.dailyGoal, dailyProgress: user.dailyProgress });
}

/** POST /goals/progress — call after grading a card */
export async function incrementProgress(req: Request, res: Response) {
  const userId = uid(req);
  await ensureFreshGoals(userId);

  const today = todayUTC();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyProgress: true, dailyGoal: true, lastStudyDate: true, streakDays: true, bestStreak: true },
  });
  if (!user) { res.status(404).json({ error: "not_found" }); return; }

  const wasStudyToday = isSameDay(user.lastStudyDate, today);
  let streak = user.streakDays;

  if (!wasStudyToday) {
    // First card of the day — bump streak
    if (isYesterday(user.lastStudyDate, today)) {
      streak = user.streakDays + 1;
    } else if (!user.lastStudyDate) {
      streak = 1;
    } else {
      streak = 1; // gap > 1 day, restart
    }
  }

  const bestStreak = Math.max(user.bestStreak, streak);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      dailyProgress: { increment: 1 },
      lastStudyDate: today,
      streakDays: streak,
      bestStreak,
      lastActiveAt: new Date(),
    },
    select: { dailyGoal: true, dailyProgress: true, streakDays: true, bestStreak: true },
  });

  const pct = updated.dailyGoal > 0 ? Math.round((updated.dailyProgress / updated.dailyGoal) * 100) : 0;
  res.json({
    dailyGoal: updated.dailyGoal,
    dailyProgress: updated.dailyProgress,
    percentage: Math.min(100, pct),
    streakDays: updated.streakDays,
    bestStreak: updated.bestStreak,
    completed: updated.dailyProgress >= updated.dailyGoal,
  });
}

/** GET /goals/stats — extended stats for /statistics page */
export async function getStats(req: Request, res: Response) {
  const userId = uid(req);
  await ensureFreshGoals(userId);

  const [user, progressRows, totalWords, sessions] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyGoal: true,
        dailyProgress: true,
        streakDays: true,
        bestStreak: true,
      },
    }),
    prisma.userProgress.findMany({
      where: { userId },
      select: { wordId: true, reps: true, ease: true, lastReviewedAt: true, word: { select: { exam: true } } },
    }),
    prisma.word.count({ where: { active: true } }),
    prisma.learningSession.findMany({
      where: { userId, completedAt: { not: null } },
      select: { completedAt: true, cardsSeen: true },
      orderBy: { completedAt: "desc" },
      take: 30,
    }),
  ]);

  if (!user) { res.status(404).json({ error: "not_found" }); return; }

  const mastered = progressRows.filter((r) => r.reps >= 3 && r.ease >= 2.5).length;
  const learning = progressRows.filter((r) => r.reps > 0 && !(r.reps >= 3 && r.ease >= 2.5)).length;

  // Per-exam breakdown
  const examProgress: Record<string, { seen: number; total: number }> = {};
  for (const r of progressRows) {
    const exam = r.word.exam;
    if (!examProgress[exam]) examProgress[exam] = { seen: 0, total: 0 };
    examProgress[exam].seen += 1;
  }
  // Fill totals from DB
  const examCounts = await prisma.word.groupBy({
    by: ["exam"],
    _count: { _all: true },
    where: { active: true },
    orderBy: { exam: "asc" },
  });
  for (const ec of examCounts) {
    const c = ec._count as { _all?: number } | undefined;
    const key = ec.exam;
    if (!examProgress[key]) examProgress[key] = { seen: 0, total: 0 };
    examProgress[key].total = c?._all ?? 0;
  }

  // Weekly activity (last 7 days)
  const weekly: Array<{ date: string; cards: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    const dayCards = sessions
      .filter((s) => s.completedAt && s.completedAt.toISOString().slice(0, 10) === key)
      .reduce((a, s) => a + s.cardsSeen, 0);
    weekly.push({ date: key, cards: dayCards });
  }

  res.json({
    dailyGoal: user.dailyGoal,
    dailyProgress: user.dailyProgress,
    streakDays: user.streakDays,
    bestStreak: user.bestStreak,
    totalWords,
    seen: progressRows.length,
    mastered,
    learning,
    newWords: Math.max(0, totalWords - progressRows.length),
    examProgress,
    weekly,
  });
}
