import { PrismaClient } from "@prisma/client";
import { logger } from "./utils/logger";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

function buildDatasourceUrl(): { url: string } | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    const isPooler = u.hostname.includes("pooler.supabase.com");
    if (isPooler) {
      u.searchParams.set("pgbouncer", "true");
      u.searchParams.set("connection_limit", process.env.NODE_ENV === "production" ? "15" : "5");
      u.searchParams.set("pool_timeout", "20");
    }
    return { url: u.toString() };
  } catch {
    return undefined;
  }
}

const dsOverride = buildDatasourceUrl();

export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["warn", "error"] : ["warn", "error"],
    ...(dsOverride ? { datasourceUrl: dsOverride.url } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}

logger.info(
  `Prisma client initialised (pooler=${dsOverride?.url?.includes("pgbouncer=true") ?? false})`,
);
