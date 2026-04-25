import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

const createTicketBody = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
  category: z.enum(["Bug", "Feature", "Account", "Billing", "Other"]),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

/** POST /support/ticket — public (no auth required) */
export async function createTicket(req: Request, res: Response) {
  const body = createTicketBody.parse(req.body);
  const userId = req.user?.sub ?? null;

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      email: body.email,
      name: body.name ?? null,
      category: body.category,
      subject: body.subject,
      message: body.message,
    },
  });
  res.status(201).json({ ticket: { id: ticket.id, status: ticket.status } });
}

/** GET /support/tickets — my tickets (auth required) */
export async function myTickets(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) throw unauthorized();

  const tickets = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, subject: true, category: true, status: true, createdAt: true },
  });
  res.json({ tickets });
}

/** GET /support/tickets/:id — ticket detail (auth) */
export async function ticketDetail(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) throw unauthorized();

  const ticket = await prisma.supportTicket.findFirst({
    where: { id: req.params.id, userId },
  });
  if (!ticket) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ ticket });
}

/** GET /admin/support/tickets — all tickets (admin key) */
export async function adminListTickets(req: Request, res: Response) {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  res.json({ tickets, count: tickets.length });
}

/** PUT /admin/support/tickets/:id — update status */
export async function adminUpdateTicket(req: Request, res: Response) {
  const { status } = z.object({
    status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  }).parse(req.body);

  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json({ ticket });
}
