import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { notFound } from "../utils/http";

/** GET /collections — public collections */
export async function list(_req: Request, res: Response) {
  const collections = await prisma.collection.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { words: true } } },
  });
  res.json({
    collections: collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isPublic: c.isPublic,
      wordCount: c._count.words,
    })),
  });
}

/** GET /collections/:id */
export async function getOne(req: Request, res: Response) {
  const col = await prisma.collection.findFirst({
    where: { id: req.params.id, isPublic: true },
    include: {
      words: {
        orderBy: { position: "asc" },
        include: { word: { select: { id: true, word: true, romanization: true, definitionEn: true, level: true, exam: true } } },
      },
    },
  });
  if (!col) throw notFound("Collection not found.");
  res.json({ collection: col });
}

const createBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().default(true),
});

/** POST /admin/collections */
export async function adminCreate(req: Request, res: Response) {
  const body = createBody.parse(req.body);
  // Admin collections use a special userId "ADMIN"
  const col = await prisma.collection.create({
    data: { userId: "ADMIN", name: body.name, description: body.description ?? null, isPublic: body.isPublic },
  });
  res.status(201).json({ collection: col });
}

/** DELETE /admin/collections/:id */
export async function adminDelete(req: Request, res: Response) {
  await prisma.collection.deleteMany({ where: { id: req.params.id } });
  res.status(204).end();
}
