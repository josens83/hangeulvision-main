import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { badRequest, unauthorized } from "../utils/http";
import { stub } from "./_stub";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

function serializeUser(u: {
  id: string; email: string; name: string; tier: string; role: string;
  locale: string; streakDays: number; dailyGoal: number; createdAt: Date;
}) {
  return {
    id: u.id, email: u.email, name: u.name, tier: u.tier, role: u.role,
    locale: u.locale, streakDays: u.streakDays, dailyGoal: u.dailyGoal,
    createdAt: u.createdAt,
  };
}

// ─── Profile ───────────────────────────────────────────────────────────────

/** GET /user/me */
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({ where: { id: uid(req) } });
  if (!user) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ user: serializeUser(user) });
}

const updateProfileBody = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  locale: z.enum(["en", "ja", "vi", "zh", "ko"]).optional(),
});

/** PUT /user/me — update name and/or locale */
export async function updateMe(req: Request, res: Response) {
  const body = updateProfileBody.parse(req.body);
  if (!body.name && !body.locale) throw badRequest("Nothing to update.");
  const user = await prisma.user.update({
    where: { id: uid(req) },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.locale ? { locale: body.locale } : {}),
    },
  });
  res.json({ user: serializeUser(user) });
}

// ─── Password ──────────────────────────────────────────────────────────────

const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters.").max(128),
});

/** PUT /user/password */
export async function changePassword(req: Request, res: Response) {
  const body = changePasswordBody.parse(req.body);
  const user = await prisma.user.findUnique({
    where: { id: uid(req) },
    select: { id: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) throw unauthorized("Cannot change password for this account.");

  const ok = await bcrypt.compare(body.currentPassword, user.passwordHash);
  if (!ok) throw badRequest("Current password is incorrect.");

  const hash = await bcrypt.hash(body.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
  res.json({ message: "Password updated successfully." });
}

// ─── Account deletion ──────────────────────────────────────────────────────

const deleteAccountBody = z.object({
  password: z.string().min(1, "Password is required to confirm deletion."),
});

/** DELETE /user/account */
export async function deleteAccount(req: Request, res: Response) {
  const body = deleteAccountBody.parse(req.body);
  const userId = uid(req);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });
  if (!user || !user.passwordHash) throw unauthorized();

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw badRequest("Incorrect password.");

  // Cascade delete: Prisma schema has onDelete: Cascade on all relations
  // that reference User, so a single delete wipes Progress, Bookmarks,
  // Sessions, Payments, etc.
  await prisma.user.delete({ where: { id: userId } });
  res.json({ message: "Account deleted." });
}

// ─── Stubs (remaining features) ────────────────────────────────────────────

export const myStats = stub("user.myStats");
export const myStreak = stub("user.myStreak");
export const uploadAvatar = stub("user.uploadAvatar");
export const setLocale = stub("user.setLocale");
export const getPreferences = stub("user.getPreferences");
export const updatePreferences = stub("user.updatePreferences");
export const listBookmarks = stub("user.listBookmarks");
export const addBookmark = stub("user.addBookmark");
export const removeBookmark = stub("user.removeBookmark");
export const listCollections = stub("user.listCollections");
export const createCollection = stub("user.createCollection");
export const listDecks = stub("user.listDecks");
export const createDeck = stub("user.createDeck");
export const listAchievements = stub("user.listAchievements");
export const listNotifications = stub("user.listNotifications");
export const markNotificationRead = stub("user.markNotificationRead");
export const getGoals = stub("user.getGoals");
export const setGoals = stub("user.setGoals");
export const exportData = stub("user.exportData");
export const deleteMe = deleteAccount;
