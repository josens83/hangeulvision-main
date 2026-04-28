import type { Request, Response } from "express";
import { prisma } from "../prisma";
import { unauthorized } from "../utils/http";
import { stub } from "./_stub";

/** GET /packages */
export async function list(_req: Request, res: Response) {
  const packages = await prisma.productPackage.findMany({
    where: { active: true },
    orderBy: { priceUSD: "asc" },
    select: {
      id: true, slug: true, name: true, nameEn: true,
      description: true, exam: true, priceUSD: true, priceKRW: true, durationDays: true,
    },
  });
  res.json({ packages });
}

/** GET /packages/:slug */
export async function getBySlug(req: Request, res: Response) {
  const pkg = await prisma.productPackage.findUnique({
    where: { slug: req.params.slug },
    select: {
      id: true, slug: true, name: true, nameEn: true,
      description: true, exam: true, priceUSD: true, priceKRW: true, durationDays: true,
    },
  });
  if (!pkg) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ package: pkg });
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
