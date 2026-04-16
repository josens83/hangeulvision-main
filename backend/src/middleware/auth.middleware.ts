import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { forbidden, unauthorized } from "../utils/http";

export interface AuthTokenPayload {
  sub: string;      // user id
  email: string;
  tier: "free" | "basic" | "premium";
  role: "user" | "editor" | "admin";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

/** Verifies a bearer JWT and attaches the payload to req.user. */
export function authRequired(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw unauthorized("Missing bearer token");

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch (err) {
    throw unauthorized("Invalid or expired token");
  }
}

/** Like authRequired but doesn't throw if the token is missing — lets public
 *  endpoints do tier-based customisation without rejecting anonymous users. */
export function authOptional(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next();
  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
  } catch {
    /* ignore — treat as anonymous */
  }
  next();
}

/** Requires the authenticated user to hold one of the given roles. */
export function requireRole(...roles: AuthTokenPayload["role"][]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden("Insufficient role");
    next();
  };
}

/**
 * Protects /internal/* endpoints hit by the content / image pipelines.
 *
 * Accepts the key from either:
 *   • `X-Internal-Key` header  — preferred; used by the POST body flow.
 *   • `?key=…` query param     — convenience for GET URLs that an operator
 *                                 can paste into a browser address bar.
 *
 * Note: query-param auth puts the key in server logs, browser history, and
 * Referer headers. Only acceptable because INTERNAL_API_KEY is a pipeline
 * secret with no user-level data behind it, and the pattern matches the
 * existing VocaVision ops tooling.
 */
export function internalOnly(req: Request, _res: Response, next: NextFunction) {
  if (!config.internalApiKey) throw forbidden("Internal API key not configured.");

  const headerKey = req.headers["x-internal-key"];
  const queryKey = typeof req.query?.key === "string" ? req.query.key : undefined;
  const provided = headerKey ?? queryKey;

  if (provided !== config.internalApiKey) {
    throw forbidden("Invalid internal API key");
  }
  next();
}

/** Helper for controllers that need a signed token. */
export function signAuthToken(payload: AuthTokenPayload, expiresIn = config.jwtExpiresIn): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
}
