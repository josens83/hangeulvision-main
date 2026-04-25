import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

/** GET /notifications */
export async function list(req: Request, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { userId: uid(req) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json({ notifications });
}

/** GET /notifications/unread-count */
export async function unreadCount(req: Request, res: Response) {
  const count = await prisma.notification.count({
    where: { userId: uid(req), readAt: null },
  });
  res.json({ count });
}

/** PUT /notifications/:id/read */
export async function markRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: uid(req) },
    data: { readAt: new Date() },
  });
  res.json({ read: true });
}

/** PUT /notifications/read-all */
export async function markAllRead(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { userId: uid(req), readAt: null },
    data: { readAt: new Date() },
  });
  res.json({ read: true });
}
