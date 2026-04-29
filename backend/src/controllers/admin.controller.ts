import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { invalidateAll } from "../utils/cache";
import { stub } from "./_stub";

// Dashboards
export const stats = stub("admin.stats");
export const contentInventory = stub("admin.contentInventory");

// Users
export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: { id: true, email: true, name: true, tier: true, role: true, subscriptionStatus: true, subscriptionPlan: true, subscriptionEnd: true, streakDays: true, createdAt: true },
  });
  res.json({ users });
}

export const getUser = stub("admin.getUser");
export const updateUser = stub("admin.updateUser");
export const deleteUser = stub("admin.deleteUser");

// Words CRUD
export async function listWords(req: Request, res: Response) {
  const page = Number(req.query.page ?? 1);
  const limit = Math.min(50, Number(req.query.limit ?? 20));
  const search = (req.query.search as string) ?? "";
  const where: any = { active: true };
  if (search) where.OR = [
    { word: { contains: search, mode: "insensitive" } },
    { definitionEn: { contains: search, mode: "insensitive" } },
  ];
  const [total, words] = await prisma.$transaction([
    prisma.word.count({ where }),
    prisma.word.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: "desc" }, select: { id: true, word: true, romanization: true, definitionEn: true, exam: true, level: true, partOfSpeech: true, active: true, createdAt: true } }),
  ]);
  res.json({ words, total, page, limit });
}

export async function createWord(req: Request, res: Response) {
  const data = req.body;
  const word = await prisma.word.create({ data: { word: data.word, romanization: data.romanization ?? "", definitionEn: data.definitionEn ?? "", partOfSpeech: data.partOfSpeech ?? "NOUN", level: data.level ?? 1, exam: data.exam ?? "TOPIK_I", tags: data.tags ?? [] } });
  res.status(201).json({ word });
}

export async function getWord(req: Request, res: Response) {
  const word = await prisma.word.findUnique({ where: { id: req.params.id }, include: { etymology: true, mnemonic: true, examples: true, visuals: true } });
  if (!word) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ word });
}

export async function updateWord(req: Request, res: Response) {
  const { id } = req.params;
  const data = req.body;
  const word = await prisma.word.update({ where: { id }, data: { word: data.word, romanization: data.romanization, definitionEn: data.definitionEn, level: data.level, active: data.active } });
  res.json({ word });
}

export async function deleteWord(req: Request, res: Response) {
  await prisma.word.update({ where: { id: req.params.id }, data: { active: false } });
  res.status(204).end();
}

// Image queue
export const imageQueue = stub("admin.imageQueue");
export const retryImage = stub("admin.retryImage");

// Payments audit
export const listPayments = stub("admin.listPayments");

/** GET /admin/monitoring/health — system health */
export async function monitoringHealth(_req: Request, res: Response) {
  const mem = process.memoryUsage();
  let dbOk = false;
  try { await prisma.$queryRaw`SELECT 1`; dbOk = true; } catch {}

  res.json({
    uptime: Math.round(process.uptime()),
    memory: { rss: Math.round(mem.rss / 1024 / 1024), heap: Math.round(mem.heapUsed / 1024 / 1024), heapTotal: Math.round(mem.heapTotal / 1024 / 1024) },
    database: dbOk ? "connected" : "disconnected",
    nodeVersion: process.version,
    env: process.env.NODE_ENV ?? "development",
  });
}

/** POST /admin/cache/clear */
export async function cacheClear(_req: Request, res: Response) {
  invalidateAll();
  res.json({ cleared: true });
}
