import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";

function uid(req: Request): string {
  const id = req.user?.sub;
  if (!id) throw unauthorized();
  return id;
}

const addBody = z.object({
  wordId: z.string().min(1).max(64),
  note: z.string().max(500).optional(),
});

const toggleBody = z.object({
  wordId: z.string().min(1).max(64),
});

/** GET /bookmarks */
export async function getBookmarks(req: Request, res: Response) {
  const userId = uid(req);
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      word: {
        select: {
          id: true,
          word: true,
          romanization: true,
          definitionEn: true,
          level: true,
          exam: true,
          partOfSpeech: true,
        },
      },
    },
  });
  res.json({ bookmarks, count: bookmarks.length });
}

/** POST /bookmarks */
export async function addBookmark(req: Request, res: Response) {
  const userId = uid(req);
  const body = addBody.parse(req.body);

  const bookmark = await prisma.bookmark.upsert({
    where: { userId_wordId: { userId, wordId: body.wordId } },
    create: { userId, wordId: body.wordId, note: body.note ?? null },
    update: { note: body.note ?? undefined },
    include: {
      word: {
        select: { id: true, word: true, romanization: true, definitionEn: true },
      },
    },
  });
  res.status(201).json({ bookmark });
}

/** DELETE /bookmarks/:wordId */
export async function removeBookmark(req: Request, res: Response) {
  const userId = uid(req);
  const { wordId } = req.params;
  await prisma.bookmark
    .delete({ where: { userId_wordId: { userId, wordId } } })
    .catch(() => {});
  res.status(204).end();
}

/** POST /bookmarks/toggle */
export async function toggleBookmark(req: Request, res: Response) {
  const userId = uid(req);
  const body = toggleBody.parse(req.body);

  const existing = await prisma.bookmark.findUnique({
    where: { userId_wordId: { userId, wordId: body.wordId } },
  });

  if (existing) {
    await prisma.bookmark.delete({
      where: { userId_wordId: { userId, wordId: body.wordId } },
    });
    res.json({ bookmarked: false, wordId: body.wordId });
  } else {
    await prisma.bookmark.create({
      data: { userId, wordId: body.wordId },
    });
    res.json({ bookmarked: true, wordId: body.wordId });
  }
}

/** GET /bookmarks/check?wordIds=id1,id2,id3 */
export async function checkBookmarks(req: Request, res: Response) {
  const userId = uid(req);
  const wordIds = (typeof req.query.wordIds === "string" ? req.query.wordIds : "")
    .split(",")
    .filter(Boolean);
  if (!wordIds.length) {
    res.json({ bookmarked: {} });
    return;
  }
  const rows = await prisma.bookmark.findMany({
    where: { userId, wordId: { in: wordIds } },
    select: { wordId: true },
  });
  const bookmarked: Record<string, boolean> = {};
  for (const id of wordIds) bookmarked[id] = false;
  for (const r of rows) bookmarked[r.wordId] = true;
  res.json({ bookmarked });
}
