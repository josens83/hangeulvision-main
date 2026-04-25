import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { badRequest, unauthorized } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

const replyBody = z.object({
  ticketId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

// Rate limit: max 3 replies per ticket per user, 10 min cooldown
const cooldowns = new Map<string, number>();

/** POST /replies */
export async function create(req: Request, res: Response) {
  const userId = uid(req);
  const body = replyBody.parse(req.body);

  const cooldownKey = `${userId}:${body.ticketId}`;
  const lastTime = cooldowns.get(cooldownKey) ?? 0;
  if (Date.now() - lastTime < 600_000) {
    throw badRequest("Please wait 10 minutes between replies.");
  }

  // Store reply as a notification on the ticket (lightweight approach)
  await prisma.notification.create({
    data: {
      userId,
      kind: "system",
      title: `Reply to ticket ${body.ticketId.slice(0, 8)}`,
      body: body.body,
    },
  });

  cooldowns.set(cooldownKey, Date.now());
  res.status(201).json({ sent: true });
}

/** GET /replies/mine */
export async function mine(req: Request, res: Response) {
  const userId = uid(req);
  const replies = await prisma.notification.findMany({
    where: { userId, title: { startsWith: "Reply to ticket" } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json({ replies });
}
