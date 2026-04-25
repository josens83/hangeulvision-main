import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";

// Announcements are stored in the Notification table with userId=null.
// This is a lightweight approach — a dedicated Announcement table can
// be added later if needed, but for MVP reusing the existing table
// avoids a migration.

const SYSTEM_USER_ID = "SYSTEM";

/** GET /announcements — active announcements (public) */
export async function list(_req: Request, res: Response) {
  const items = await prisma.notification.findMany({
    where: {
      userId: SYSTEM_USER_ID,
      readAt: null, // not "expired" (we use readAt as archive flag)
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, title: true, body: true, kind: true, createdAt: true },
  });
  res.json({
    announcements: items.map((n) => ({
      id: n.id,
      title: n.title,
      content: n.body,
      type: n.kind === "system" ? "INFO" : n.kind === "streak" ? "WARNING" : "INFO",
      publishedAt: n.createdAt,
    })),
  });
}

const createBody = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
  type: z.enum(["INFO", "WARNING", "URGENT"]).default("INFO"),
});

/** POST /admin/announcements — create (admin only) */
export async function create(req: Request, res: Response) {
  const body = createBody.parse(req.body);
  const notif = await prisma.notification.create({
    data: {
      userId: SYSTEM_USER_ID,
      kind: "system",
      title: body.title,
      body: body.content,
    },
  });
  res.status(201).json({ announcement: { id: notif.id, title: notif.title } });
}

/** DELETE /admin/announcements/:id */
export async function remove(req: Request, res: Response) {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: SYSTEM_USER_ID },
    data: { readAt: new Date() },
  });
  res.status(204).end();
}
