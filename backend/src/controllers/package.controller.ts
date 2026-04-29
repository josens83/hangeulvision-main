import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";
import { stub } from "./_stub";

/** GET /packages — active packages with word counts */
export async function list(_req: Request, res: Response) {
  const packages = await prisma.productPackage.findMany({
    where: { active: true },
    orderBy: { priceUSD: "asc" },
    include: { _count: { select: { words: true } } },
  });
  res.json({
    packages: packages.map((p) => ({
      id: p.id, slug: p.slug, name: p.name, nameEn: p.nameEn,
      description: p.description, exam: p.exam, priceUSD: p.priceUSD,
      priceKRW: p.priceKRW, durationDays: p.durationDays,
      paddlePriceId: p.paddlePriceId, paddleProductId: p.paddleProductId,
      wordCount: p._count.words,
    })),
  });
}

/** GET /packages/:slug */
export async function getBySlug(req: Request, res: Response) {
  const pkg = await prisma.productPackage.findUnique({
    where: { slug: req.params.slug },
    include: { _count: { select: { words: true } } },
  });
  if (!pkg) { res.status(404).json({ error: "not_found" }); return; }
  res.json({
    package: {
      id: pkg.id, slug: pkg.slug, name: pkg.name, nameEn: pkg.nameEn,
      description: pkg.description, exam: pkg.exam, priceUSD: pkg.priceUSD,
      priceKRW: pkg.priceKRW, durationDays: pkg.durationDays,
      paddlePriceId: pkg.paddlePriceId, paddleProductId: pkg.paddleProductId,
      wordCount: pkg._count.words,
    },
  });
}

export const words = stub("package.words");

/** GET /packages/me/access */
export async function myAccess(req: Request, res: Response) {
  const userId = req.user?.sub;
  if (!userId) throw unauthorized();
  const purchases = await prisma.userPurchase.findMany({
    where: { userId, expiresAt: { gte: new Date() } },
    include: {
      package: { select: { slug: true, name: true, nameEn: true, exam: true } },
    },
  });
  res.json({ purchases });
}
