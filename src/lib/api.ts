"use client";

/**
 * Thin fetch wrapper for the HangeulVision API.
 *
 *   • Base URL from NEXT_PUBLIC_API_URL (Railway prod default).
 *   • Reads `authToken` from localStorage on every call and attaches
 *     `Authorization: Bearer <token>`.
 *   • 401 response → clears tokens and redirects to
 *     `/signin?expired=true` (guards against redirect loops).
 *   • Returns a tagged result (`ApiResult<T>`) so callers can gracefully
 *     fall back to localStorage / seed data when the network or the
 *     backend is unavailable. No throws on network failure.
 */

const DEFAULT_API = "https://hangeulvision-main-production.up.railway.app";

export const API_URL: string =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  DEFAULT_API;

export const TOKEN_KEY = "authToken";
export const REFRESH_TOKEN_KEY = "refreshToken";

// ─── Token helpers ─────────────────────────────────────────────────────────

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthTokens(access: string, refresh?: string | null): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthTokens(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Result envelope ───────────────────────────────────────────────────────

export interface ApiResult<T> {
  ok: boolean;
  status: number;          // 0 = network / CORS error
  data: T | null;
  error: string | null;
}

// ─── 401 handler ───────────────────────────────────────────────────────────

function handle401(): void {
  clearAuthTokens();
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  // Never redirect-loop from the sign-in page itself.
  if (path.startsWith("/signin") || path.startsWith("/signup")) return;
  window.location.href = "/signin?expired=true";
}

// ─── Core request ──────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const headers = new Headers(init.headers ?? {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAuthToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const res = await fetch(url, {
      ...init,
      headers,
      credentials: "omit",
    });

    if (res.status === 401) handle401();

    const ct = res.headers.get("content-type") ?? "";
    let data: T | null = null;
    let error: string | null = null;

    if (res.status !== 204) {
      if (ct.includes("application/json")) {
        const payload = (await res.json().catch(() => null)) as
          | (T & { error?: string; message?: string })
          | null;
        if (res.ok) {
          data = (payload ?? null) as T | null;
        } else {
          const p = payload as { error?: string; message?: string } | null;
          error = p?.message ?? p?.error ?? `HTTP ${res.status}`;
        }
      } else if (!res.ok) {
        error = `HTTP ${res.status}`;
      }
    }

    return { ok: res.ok, status: res.status, data, error };
  } catch (e) {
    // Network / CORS / DNS — callers fall back to offline data.
    return {
      ok: false,
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : "network_error",
    };
  }
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>(path, {
      ...init,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>(path, { ...init, method: "DELETE" }),
};

// ─── API response types ────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  tier: "free" | "basic" | "premium";
  role: "user" | "editor" | "admin";
  locale: string;
  streakDays: number;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AuthEnvelope {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface ApiWord {
  id: string;
  word: string;
  romanization: string;
  ipa: string | null;
  phonetic: string | null;
  definitionEn: string;
  partOfSpeech: string;
  level: number;
  exam: string;
  etymology?: unknown;
  mnemonic?: unknown;
  examples?: unknown[];
  collocations?: unknown[];
  visuals?: unknown[];
  examLevels?: unknown[];
}

export interface WordListResponse {
  words: ApiWord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LearningQueueResponse {
  words: ApiWord[];
  sessionId: string;
  due: number;
  fresh: number;
}

export interface ProgressStats {
  total: number;
  seen: number;
  mastered: number;
  learning: number;
  new: number;
  streakDays: number;
  dueCount: number;
}
