"use client";

/**
 * Client-side session + progress store.
 *
 * Source-of-truth plan:
 *   • Auth       → HangeulVision API (Railway). localStorage fallback lets
 *                  the existing demo accounts keep working if the API is
 *                  unreachable, so /signup and /signin never hard-fail.
 *   • Progress   → optimistic local write + fire-and-forget API POST to
 *                  /progress/:wordId/grade. The local SM-2 schedule keeps
 *                  the UI responsive; the server re-computes server-side.
 *   • Payments   → stays local (mock checkout flow) until TossPayments /
 *                  Paddle are wired in a follow-up.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  api,
  clearAuthTokens,
  setAuthTokens,
  type ApiUser,
  type AuthEnvelope,
} from "./api";
import type { ExamCategory, Tier } from "./exams";
import type { Payment, ProgressEntry, User } from "./types";
import { initialProgress, schedule, type Grade } from "./srs";

interface AuthSlice {
  currentUserId: string | null;
  users: Record<string, User>;
  /** True while a network call is in-flight (signup / login / hydrate). */
  authLoading: boolean;
  signUp: (
    email: string,
    name: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  /** Hydrate `currentUserId`/`users` from `GET /auth/me` if a token exists. */
  hydrate: () => Promise<void>;
  currentUser: () => User | null;
  updateTier: (tier: Tier) => void;
  addPurchase: (exam: ExamCategory) => void;
}

interface ProgressSlice {
  progress: Record<string, Record<string, ProgressEntry>>; // userId → wordId → entry
  gradeWord: (wordId: string, grade: Grade) => void;
  getEntry: (wordId: string) => ProgressEntry | undefined;
  dueToday: () => string[];
}

interface PaymentsSlice {
  payments: Payment[];
  recordPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
}

type Store = AuthSlice & ProgressSlice & PaymentsSlice;

// Non-cryptographic hash used only for the local-fallback demo accounts.
function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  return `h$${h.toString(36)}$${pw.length}`;
}

// ─── API → local user shape ────────────────────────────────────────────────

function apiToLocalUser(u: ApiUser): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    // We don't keep the hash locally for API-authenticated users — auth
    // happens server-side, this field is here only for the offline fallback.
    passwordHash: "",
    tier: u.tier,
    purchases: [],
    createdAt: u.createdAt,
    locale: (u.locale as User["locale"]) ?? "en",
    streakDays: u.streakDays,
    lastActive: u.lastActiveAt ?? undefined,
  };
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // ── auth
      currentUserId: null,
      users: {},
      authLoading: false,

      async signUp(email, name, password) {
        email = email.trim().toLowerCase();
        if (!email || !password || !name) {
          return { ok: false, error: "Please fill every field." };
        }

        set({ authLoading: true });
        const res = await api.post<AuthEnvelope>("/auth/signup", {
          email,
          password,
          name,
          locale: "en",
        });

        if (res.ok && res.data) {
          const { user, accessToken, refreshToken } = res.data;
          setAuthTokens(accessToken, refreshToken);
          const local = apiToLocalUser(user);
          set((s) => ({
            users: { ...s.users, [local.id]: local },
            currentUserId: local.id,
            authLoading: false,
          }));
          return { ok: true };
        }

        // ── Fallback: offline / API unreachable → local demo account
        if (res.status === 0) {
          const exists = Object.values(get().users).some((u) => u.email === email);
          if (exists) {
            set({ authLoading: false });
            return { ok: false, error: "An account already exists for this email." };
          }
          const id = `u_${Date.now().toString(36)}`;
          const user: User = {
            id,
            email,
            name,
            passwordHash: hashPassword(password),
            tier: "free",
            purchases: [],
            createdAt: new Date().toISOString(),
            locale: "en",
            streakDays: 0,
          };
          set((s) => ({
            users: { ...s.users, [id]: user },
            currentUserId: id,
            authLoading: false,
          }));
          return { ok: true };
        }

        set({ authLoading: false });
        return { ok: false, error: res.error ?? "Could not sign up." };
      },

      async signIn(email, password) {
        email = email.trim().toLowerCase();
        if (!email || !password) {
          return { ok: false, error: "Please fill every field." };
        }

        set({ authLoading: true });
        const res = await api.post<AuthEnvelope>("/auth/login", {
          email,
          password,
        });

        if (res.ok && res.data) {
          const { user, accessToken, refreshToken } = res.data;
          setAuthTokens(accessToken, refreshToken);
          const local = apiToLocalUser(user);
          set((s) => ({
            users: { ...s.users, [local.id]: local },
            currentUserId: local.id,
            authLoading: false,
          }));
          return { ok: true };
        }

        // ── Fallback: offline → check local demo accounts
        if (res.status === 0) {
          const user = Object.values(get().users).find((u) => u.email === email);
          if (!user || user.passwordHash !== hashPassword(password)) {
            set({ authLoading: false });
            return { ok: false, error: "Invalid email or password." };
          }
          set({ currentUserId: user.id, authLoading: false });
          return { ok: true };
        }

        set({ authLoading: false });
        return { ok: false, error: res.error ?? "Invalid email or password." };
      },

      signOut() {
        clearAuthTokens();
        set({ currentUserId: null });
      },

      async hydrate() {
        // Only call /auth/me if we have a token; otherwise we're anonymous.
        if (typeof window === "undefined") return;
        const token = window.localStorage.getItem("authToken");
        if (!token) return;

        set({ authLoading: true });
        const res = await api.get<{ user: ApiUser }>("/auth/me");
        if (res.ok && res.data?.user) {
          const local = apiToLocalUser(res.data.user);
          set((s) => ({
            users: { ...s.users, [local.id]: local },
            currentUserId: local.id,
            authLoading: false,
          }));
        } else if (res.status === 401) {
          // api.ts already cleared tokens + will redirect.
          set({ currentUserId: null, authLoading: false });
        } else {
          // Network error — keep whatever currentUserId the persisted store has.
          set({ authLoading: false });
        }
      },

      currentUser() {
        const id = get().currentUserId;
        return id ? get().users[id] ?? null : null;
      },

      updateTier(tier) {
        const id = get().currentUserId;
        if (!id) return;
        set((s) => ({ users: { ...s.users, [id]: { ...s.users[id], tier } } }));
      },

      addPurchase(exam) {
        const id = get().currentUserId;
        if (!id) return;
        set((s) => {
          const user = s.users[id];
          if (!user) return s;
          const purchases = Array.from(new Set([...(user.purchases ?? []), exam]));
          return { users: { ...s.users, [id]: { ...user, purchases } } };
        });
      },

      // ── progress (optimistic local, fire-and-forget API)
      progress: {},
      gradeWord(wordId, grade) {
        const uid = get().currentUserId;
        if (!uid) return;

        // 1. Optimistic local SM-2 update — UI reacts immediately.
        set((s) => {
          const userProgress = s.progress[uid] ?? {};
          const existing = userProgress[wordId] ?? initialProgress(wordId);
          const next = schedule(existing, grade);
          return {
            progress: {
              ...s.progress,
              [uid]: { ...userProgress, [wordId]: next },
            },
          };
        });

        // 2. Fire-and-forget: grade + goal progress + achievement check.
        void api.post(`/progress/${encodeURIComponent(wordId)}/grade`, { grade });
        void api.post("/goals/progress");
        void api.post<{ newlyUnlocked: Array<{ id: string; name: string; icon: string | null }> }>(
          "/achievements/check",
        ).then((res) => {
          if (res.ok && res.data?.newlyUnlocked?.length) {
            // Dynamic import to avoid circular deps
            import("@/components/AchievementToast").then(({ showAchievementToasts }) => {
              showAchievementToasts(res.data!.newlyUnlocked);
            });
          }
        });
      },

      getEntry(wordId) {
        const uid = get().currentUserId;
        if (!uid) return undefined;
        return get().progress[uid]?.[wordId];
      },

      dueToday() {
        const uid = get().currentUserId;
        if (!uid) return [];
        const map = get().progress[uid] ?? {};
        const now = Date.now();
        return Object.values(map)
          .filter((e) => new Date(e.dueAt).getTime() <= now)
          .map((e) => e.wordId);
      },

      // ── payments (local mock until Toss/Paddle wire-in)
      payments: [],
      recordPayment(p) {
        const payment: Payment = {
          ...p,
          id: `pay_${Date.now().toString(36)}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [...s.payments, payment] }));
        return payment;
      },
    }),
    { name: "hangeulvision-store", version: 2 },
  ),
);
