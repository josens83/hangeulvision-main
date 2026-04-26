import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

const TIERS = ["BRONZE", "SILVER", "GOLD", "SAPPHIRE", "RUBY", "EMERALD", "AMETHYST", "PEARL", "OBSIDIAN", "DIAMOND"] as const;

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

function currentWeekRange() {
  const now = new Date();
  const day = now.getUTCDay();
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - ((day + 6) % 7));
  monday.setUTCHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

async function ensureLeagueAndMembership(userId: string) {
  const { start, end } = currentWeekRange();
  const slug = `bronze-${start.toISOString().slice(0, 10)}`;

  // Race-safe: try find → create with P2002 catch (concurrent requests
  // both see null and both try to insert).
  let league = await prisma.league.findUnique({ where: { slug } });
  if (!league) {
    try {
      league = await prisma.league.create({
        data: { slug, name: "Bronze League", tier: 1, startsAt: start, endsAt: end },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        league = await prisma.league.findUnique({ where: { slug } });
      }
      if (!league) throw err;
    }
  }

  let membership = await prisma.leagueParticipant.findUnique({
    where: { userId_leagueId: { userId, leagueId: league.id } },
  });
  if (!membership) {
    try {
      membership = await prisma.leagueParticipant.create({
        data: { userId, leagueId: league.id, score: 0 },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        membership = await prisma.leagueParticipant.findUnique({
          where: { userId_leagueId: { userId, leagueId: league.id } },
        });
      }
      if (!membership) throw err;
    }
  }

  return { league, membership };
}

/** GET /league */
export async function getLeague(req: Request, res: Response) {
  const userId = uid(req);
  const { league } = await ensureLeagueAndMembership(userId);

  const members = await prisma.leagueParticipant.findMany({
    where: { leagueId: league.id },
    orderBy: { score: "desc" },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  const tierName = TIERS[Math.min(league.tier - 1, TIERS.length - 1)];
  const rank = members.findIndex((m) => m.userId === userId) + 1;
  const { end } = currentWeekRange();
  const msLeft = Math.max(0, end.getTime() - Date.now());

  res.json({
    league: { id: league.id, tier: league.tier, tierName, startsAt: league.startsAt, endsAt: league.endsAt },
    members: members.map((m, i) => ({
      rank: i + 1,
      userId: m.userId,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      xp: m.score,
      isMe: m.userId === userId,
      zone: i < 3 ? "promote" : i >= members.length - 3 ? "demote" : "safe",
    })),
    myRank: rank,
    resetIn: msLeft,
  });
}

const xpBody = z.object({ xp: z.coerce.number().int().min(1).max(100) });

/** POST /league/xp */
export async function addXp(req: Request, res: Response) {
  const userId = uid(req);
  const body = xpBody.parse(req.body);
  const { membership } = await ensureLeagueAndMembership(userId);

  const updated = await prisma.leagueParticipant.update({
    where: { id: membership.id },
    data: { score: { increment: body.xp } },
  });
  res.json({ xp: updated.score });
}
