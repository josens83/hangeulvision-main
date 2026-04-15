import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { config } from "../config";
import { prisma } from "../prisma";
import type { AuthTokenPayload } from "../middleware/auth.middleware";
import { conflict, notFound, unauthorized } from "../utils/http";
import { stub } from "./_stub";

// ─── Validation schemas ────────────────────────────────────────────────────

const signupSchema = z.object({
  email: z
    .string()
    .email("A valid email is required.")
    .transform((s) => s.trim().toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "Password must be at most 128 characters."),
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100)
    .transform((s) => s.trim()),
  locale: z.enum(["en", "ja", "vi", "zh", "ko"]).optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .email()
    .transform((s) => s.trim().toLowerCase()),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required."),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

type PublicUser = {
  id: string;
  email: string;
  name: string;
  tier: string;
  role: string;
  locale: string;
  streakDays: number;
  createdAt: Date;
  lastActiveAt: Date | null;
};

/** Strips password/credential fields so nothing sensitive ever reaches the wire. */
function serializeUser(u: {
  id: string;
  email: string;
  name: string;
  tier: string;
  role: string;
  locale: string;
  streakDays: number;
  createdAt: Date;
  lastActiveAt: Date | null;
}): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    tier: u.tier,
    role: u.role,
    locale: u.locale,
    streakDays: u.streakDays,
    createdAt: u.createdAt,
    lastActiveAt: u.lastActiveAt,
  };
}

/** Issues an access + refresh token pair for a user. */
function issueTokens(user: { id: string; email: string; tier: string; role: string }) {
  const payload: AuthTokenPayload = {
    sub: user.id,
    email: user.email,
    tier: user.tier as AuthTokenPayload["tier"],
    role: user.role as AuthTokenPayload["role"],
  };
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  // Refresh tokens get a `type: "refresh"` discriminator so they can't be
  // accepted as access tokens by `authRequired`.
  const refreshToken = jwt.sign(
    { ...payload, type: "refresh" },
    config.jwtSecret,
    { expiresIn: config.jwtRefreshExpiresIn },
  );
  return { accessToken, refreshToken };
}

// ─── Handlers ──────────────────────────────────────────────────────────────

/** POST /auth/signup */
export async function signup(req: Request, res: Response) {
  const body = signupSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw conflict("An account with this email already exists.");

  const passwordHash = await bcrypt.hash(body.password, 12);

  const user = await prisma.user.create({
    data: {
      email: body.email,
      name: body.name,
      passwordHash,
      locale: body.locale ?? "en",
      lastActiveAt: new Date(),
    },
  });

  const tokens = issueTokens(user);
  res.status(201).json({ user: serializeUser(user), ...tokens });
}

/** POST /auth/login */
export async function login(req: Request, res: Response) {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  // Constant error message prevents email-enumeration attacks.
  if (!user || !user.passwordHash) throw unauthorized("Invalid email or password.");

  const ok = await bcrypt.compare(body.password, user.passwordHash);
  if (!ok) throw unauthorized("Invalid email or password.");

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const tokens = issueTokens(updated);
  res.json({ user: serializeUser(updated), ...tokens });
}

/** GET /auth/me — authRequired middleware already ran */
export async function me(req: Request, res: Response) {
  const uid = req.user?.sub;
  if (!uid) throw unauthorized();

  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) throw notFound("User not found.");

  res.json({ user: serializeUser(user) });
}

/** POST /auth/refresh */
export async function refresh(req: Request, res: Response) {
  const body = refreshSchema.parse(req.body);

  let payload: AuthTokenPayload & { type?: string };
  try {
    payload = jwt.verify(body.refreshToken, config.jwtSecret) as AuthTokenPayload & {
      type?: string;
    };
  } catch {
    throw unauthorized("Invalid or expired refresh token.");
  }

  if (payload.type !== "refresh") {
    throw unauthorized("Token is not a refresh token.");
  }

  // Ensure the user still exists (and, eventually, hasn't been disabled).
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw unauthorized("User no longer exists.");

  const tokens = issueTokens(user);
  res.json(tokens);
}

/** POST /auth/logout — stateless JWT: client drops the tokens. */
export async function logout(_req: Request, res: Response) {
  // When we introduce a refresh-token blocklist (Redis) this endpoint will
  // invalidate the presented token. For now the server has nothing to do.
  res.status(204).end();
}

// ─── Not yet implemented ───────────────────────────────────────────────────
// These follow in their own PRs once the product surface needs them.
export const googleStart = stub("auth.googleStart");
export const googleCallback = stub("auth.googleCallback");
export const updateMe = stub("auth.updateMe");
export const changePassword = stub("auth.changePassword");
export const deleteAccount = stub("auth.deleteAccount");
export const requestVerification = stub("auth.requestVerification");
export const confirmVerification = stub("auth.confirmVerification");
export const forgotPassword = stub("auth.forgotPassword");
export const resetPassword = stub("auth.resetPassword");
