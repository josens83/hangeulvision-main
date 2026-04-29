import type { NextFunction, Request, Response } from "express";

/**
 * Creates a rate limiter for a specific route group.
 * Stricter than the global 60/min — use on auth and generate endpoints.
 */
export function strictRateLimit(maxRequests: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }, 600_000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }

    entry.count += 1;

    if (entry.count > maxRequests) {
      res.status(429).json({
        error: "too_many_requests",
        message: `Rate limit: max ${maxRequests} requests per ${Math.round(windowMs / 1000)}s.`,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
}

// Pre-built limiters
export const authLimiter = strictRateLimit(10, 15 * 60 * 1000);  // 10 per 15 min
export const generateLimiter = strictRateLimit(5, 60 * 1000);     // 5 per min
