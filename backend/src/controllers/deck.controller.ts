import type { Request, Response } from "express";
import type { ExamCategory } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized, notFound } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

const createBody = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  exam: z.string().optional(),
});

/** GET /decks */
export async function list(req: Request, res: Response) {
  const decks = await prisma.deck.findMany({
    where: { userId: uid(req) },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { words: true } } },
  });
  res.json({ decks: decks.map((d) => ({ ...d, wordCount: d._count.words })) });
}

/** POST /decks */
export async function create(req: Request, res: Response) {
  const body = createBody.parse(req.body);
  const deck = await prisma.deck.create({
    data: { userId: uid(req), name: body.name, exam: (body.exam as ExamCategory) ?? null },
  });
  res.status(201).json({ deck });
}

/** GET /decks/:id */
export async function getOne(req: Request, res: Response) {
  const deck = await prisma.deck.findFirst({
    where: { id: req.params.id, userId: uid(req) },
    include: {
      words: {
        orderBy: { position: "asc" },
        include: { word: { select: { id: true, word: true, romanization: true, definitionEn: true, level: true, exam: true } } },
      },
    },
  });
  if (!deck) throw notFound("Deck not found.");
  res.json({ deck });
}

/** PUT /decks/:id */
export async function update(req: Request, res: Response) {
  const body = createBody.partial().parse(req.body);
  const deck = await prisma.deck.updateMany({
    where: { id: req.params.id, userId: uid(req) },
    data: { name: body.name },
  });
  res.json({ updated: deck.count });
}

/** DELETE /decks/:id */
export async function remove(req: Request, res: Response) {
  await prisma.deck.deleteMany({ where: { id: req.params.id, userId: uid(req) } });
  res.status(204).end();
}

/** POST /decks/:id/words */
export async function addWord(req: Request, res: Response) {
  const { wordId } = z.object({ wordId: z.string().min(1) }).parse(req.body);
  const userId = uid(req);
  const deck = await prisma.deck.findFirst({ where: { id: req.params.id, userId } });
  if (!deck) throw notFound("Deck not found.");
  const count = await prisma.deckWord.count({ where: { deckId: deck.id } });
  await prisma.deckWord.upsert({
    where: { deckId_wordId: { deckId: deck.id, wordId } },
    create: { deckId: deck.id, wordId, position: count },
    update: {},
  });
  res.json({ added: true });
}

/** DELETE /decks/:id/words/:wordId */
export async function removeWord(req: Request, res: Response) {
  const userId = uid(req);
  const deck = await prisma.deck.findFirst({ where: { id: req.params.id, userId } });
  if (!deck) throw notFound("Deck not found.");
  await prisma.deckWord.deleteMany({ where: { deckId: deck.id, wordId: req.params.wordId } });
  res.status(204).end();
}
