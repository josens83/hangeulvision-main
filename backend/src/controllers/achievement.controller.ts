import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

function uid(req: Request): string | null {
  return req.user?.sub ?? null;
}

/** GET /achievements — list all + user unlock status */
export async function list(req: Request, res: Response) {
  const userId = uid(req);
  const achievements = await prisma.achievement.findMany({
    orderBy: { threshold: "asc" },
  });

  let unlocked: Record<string, { unlockedAt: Date; progress: number }> = {};
  if (userId) {
    const rows = await prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, unlockedAt: true, progress: true },
    });
    unlocked = Object.fromEntries(
      rows.map((r) => [r.achievementId, { unlockedAt: r.unlockedAt, progress: r.progress }]),
    );
  }

  const result = achievements.map((a) => ({
    ...a,
    unlocked: !!unlocked[a.id],
    unlockedAt: unlocked[a.id]?.unlockedAt ?? null,
    progress: unlocked[a.id]?.progress ?? 0,
  }));

  res.json({ achievements: result });
}

/** POST /achievements/check — evaluate and unlock new achievements */
export async function check(req: Request, res: Response) {
  const userId = uid(req);
  if (!userId) throw unauthorized();

  // Gather user stats in parallel
  const [
    wordsLearned,
    user,
    bookmarkCount,
    perfectQuizzes,
    masteredCount,
  ] = await prisma.$transaction([
    prisma.userProgress.count({ where: { userId } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { streakDays: true },
    }),
    prisma.bookmark.count({ where: { userId } }),
    prisma.quiz.count({
      where: { userId, score: { gt: 0 }, completedAt: { not: null } },
    }),
    prisma.userProgress.count({
      where: { userId, interval: { gte: 21 } },
    }),
  ]);

  // Check if any perfect quiz exists (score === total)
  const hasPerfect = await prisma.quiz.findFirst({
    where: { userId, completedAt: { not: null } },
    select: { score: true, total: true },
    orderBy: { completedAt: "desc" },
  }).then((q) => q && q.total > 0 && q.score === q.total);

  const streak = user?.streakDays ?? 0;

  // Achievement check rules — slug → current value
  const checks: Record<string, number> = {
    first_step: wordsLearned,
    quick_learner: wordsLearned,
    bookworm: wordsLearned,
    on_fire: streak,
    blazing: streak,
    collector: bookmarkCount,
    perfect_score: hasPerfect ? 1 : 0,
    master: masteredCount,
  };

  // Fetch all achievements + already unlocked
  const allAchievements = await prisma.achievement.findMany();
  const alreadyUnlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const unlockedSet = new Set(alreadyUnlocked.map((u) => u.achievementId));

  const newlyUnlocked: Array<{ id: string; slug: string; name: string; icon: string | null }> = [];

  for (const a of allAchievements) {
    if (unlockedSet.has(a.id)) continue;
    const currentValue = checks[a.slug] ?? 0;
    if (currentValue >= a.threshold) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: a.id, progress: currentValue },
      });
      newlyUnlocked.push({ id: a.id, slug: a.slug, name: a.name, icon: a.icon });
    }
  }

  res.json({ newlyUnlocked, checked: Object.keys(checks).length });
}
