"use client";
// Client-side store. For the MVP we persist auth, progress and payments to
// localStorage so the app is fully usable without a backend. The shapes match
// the Supabase / Postgres schema from the spec (via src/lib/types.ts).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExamCategory, Tier } from "./exams";
import type { Payment, ProgressEntry, User } from "./types";
import { initialProgress, schedule, type Grade } from "./srs";

interface AuthSlice {
  currentUserId: string | null;
  users: Record<string, User>;
  signUp: (email: string, name: string, password: string) => { ok: boolean; error?: string };
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
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

// Very lightweight non-cryptographic hash so demo passwords aren't stored in plain-text
function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (Math.imul(31, h) + pw.charCodeAt(i)) | 0;
  return `h$${h.toString(36)}$${pw.length}`;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // --- auth
      currentUserId: null,
      users: {},
      signUp(email, name, password) {
        email = email.trim().toLowerCase();
        if (!email || !password || !name) return { ok: false, error: "Please fill every field." };
        const exists = Object.values(get().users).some((u) => u.email === email);
        if (exists) return { ok: false, error: "An account already exists for this email." };
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
        set((s) => ({ users: { ...s.users, [id]: user }, currentUserId: id }));
        return { ok: true };
      },
      signIn(email, password) {
        email = email.trim().toLowerCase();
        const user = Object.values(get().users).find((u) => u.email === email);
        if (!user || user.passwordHash !== hashPassword(password)) {
          return { ok: false, error: "Invalid email or password." };
        }
        set({ currentUserId: user.id });
        return { ok: true };
      },
      signOut() {
        set({ currentUserId: null });
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

      // --- progress
      progress: {},
      gradeWord(wordId, grade) {
        const uid = get().currentUserId;
        if (!uid) return;
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

      // --- payments
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
    { name: "hangeulvision-store", version: 1 },
  ),
);
