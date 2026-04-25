import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { invalidateAll } from "../utils/cache";
import { stub } from "./_stub";

// Dashboards
export const stats = stub("admin.stats");
export const contentInventory = stub("admin.contentInventory");

// Users
export const listUsers = stub("admin.listUsers");
export const getUser = stub("admin.getUser");
export const updateUser = stub("admin.updateUser");
export const deleteUser = stub("admin.deleteUser");

// Words CRUD
export const listWords = stub("admin.listWords");
export const createWord = stub("admin.createWord");
export const getWord = stub("admin.getWord");
export const updateWord = stub("admin.updateWord");
export const deleteWord = stub("admin.deleteWord");

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
