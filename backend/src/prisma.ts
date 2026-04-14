import { PrismaClient } from "@prisma/client";

// Single Prisma instance shared across the process. In dev (tsx watch) we
// attach to globalThis so hot-reloads don't exhaust the connection pool.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
