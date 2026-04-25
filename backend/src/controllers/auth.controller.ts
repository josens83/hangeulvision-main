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

  // Fire-and-forget welcome email
  import("../services/email.service").then((m) =>
    m.sendWelcomeEmail(user.email, user.name),
  ).catch(() => {});

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
// ─── Google OAuth ──────────────────────────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function hasGoogleConfig(): boolean {
  return !!(config.google.clientId && config.google.clientSecret);
}

/** GET /auth/google — redirect to Google consent screen */
export async function googleStart(req: Request, res: Response) {
  if (!hasGoogleConfig()) {
    res.status(501).json({ error: "google_not_configured" });
    return;
  }

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
}

/** GET /auth/callback/google?code=... — exchange code, create/link user, redirect with JWT */
export async function googleCallback(req: Request, res: Response) {
  const code = req.query.code as string | undefined;
  const frontendOrigin = config.google.frontendOrigin;

  if (!code) {
    res.redirect(`${frontendOrigin}/auth/callback/google?error=no_code`);
    return;
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text().catch(() => "");
      // eslint-disable-next-line no-console
      console.error("[google] token exchange failed:", tokenRes.status, err.slice(0, 200));
      res.redirect(`${frontendOrigin}/auth/callback/google?error=token_exchange_failed`);
      return;
    }

    const tokenData = (await tokenRes.json()) as { access_token: string };

    // Fetch user info
    const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      res.redirect(`${frontendOrigin}/auth/callback/google?error=userinfo_failed`);
      return;
    }

    const profile = (await userInfoRes.json()) as {
      sub: string;
      email: string;
      name: string;
      picture?: string;
    };

    if (!profile.email) {
      res.redirect(`${frontendOrigin}/auth/callback/google?error=no_email`);
      return;
    }

    // Find or create user
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: profile.sub }, { email: profile.email.toLowerCase() }] },
    });

    if (user) {
      // Link Google ID if not yet linked
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.sub, avatarUrl: profile.picture ?? user.avatarUrl },
        });
      }
    } else {
      // Auto-create account
      user = await prisma.user.create({
        data: {
          email: profile.email.toLowerCase(),
          name: profile.name || profile.email.split("@")[0],
          provider: "GOOGLE",
          googleId: profile.sub,
          avatarUrl: profile.picture ?? null,
          locale: "en",
          lastActiveAt: new Date(),
        },
      });
    }

    // Issue tokens
    const tokens = issueTokens(user);

    // Redirect to frontend callback with tokens
    const params = new URLSearchParams({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    res.redirect(`${frontendOrigin}/auth/callback/google?${params.toString()}`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[google] OAuth error:", err);
    res.redirect(`${frontendOrigin}/auth/callback/google?error=server_error`);
  }
}
export const updateMe = stub("auth.updateMe");
export const changePassword = stub("auth.changePassword");
export const deleteAccount = stub("auth.deleteAccount");
export const requestVerification = stub("auth.requestVerification");
export const confirmVerification = stub("auth.confirmVerification");
/** POST /auth/password/forgot */
export async function forgotPassword(req: Request, res: Response) {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  // Always return success to prevent email enumeration.
  if (!user) { res.json({ sent: true }); return; }

  const crypto = await import("crypto");
  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 3600_000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExp: expiry },
  });

  import("../services/email.service").then((m) =>
    m.sendPasswordResetEmail(user.email, token),
  ).catch(() => {});

  res.json({ sent: true });
}

/** POST /auth/password/reset */
export async function resetPassword(req: Request, res: Response) {
  const body = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(8).max(128),
  }).parse(req.body);

  const user = await prisma.user.findFirst({
    where: { resetToken: body.token, resetTokenExp: { gte: new Date() } },
  });
  if (!user) { res.status(400).json({ error: "invalid_token", message: "Token is invalid or expired." }); return; }

  const hash = await bcrypt.hash(body.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hash, resetToken: null, resetTokenExp: null },
  });

  res.json({ message: "Password reset successfully." });
}
