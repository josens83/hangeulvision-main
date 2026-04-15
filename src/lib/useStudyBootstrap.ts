"use client";

/**
 * useStudyBootstrap
 * ─────────────────
 * Minimum first-paint payload for /learn. When the user is signed in, this
 * hits `GET /learning/queue?exam=TOPIK_I&limit=1` for an authoritative
 * first word (honors SRS dueAt ordering). When the call fails or the user
 * is anonymous, it falls back to the synchronous seed dataset so the page
 * still lights up.
 *
 *   staleTime: 5 minutes (module-level cache, keyed on user + due signature).
 */

import { useEffect, useState } from "react";
import { api, getAuthToken, type LearningQueueResponse } from "./api";
import { useStore } from "./store";
import { SEED_WORDS } from "./words.seed";
import type { Word } from "./types";

export interface StudyBootstrap {
  firstWord: Word | null;
  dueCount: number;
  totalWords: number;
  streakDays: number;
  tier: "free" | "basic" | "premium";
  sessionId: string | null;     // from /learning/queue, used by later grade calls
  source: "api" | "seed";
}

const STALE_TIME_MS = 5 * 60 * 1000;

interface CacheEntry {
  key: string;
  data: StudyBootstrap;
  loadedAt: number;
}

let cache: CacheEntry | null = null;

function cacheKey(userId: string | null, dueSignature: string, signedIn: boolean): string {
  return `${userId ?? "anon"}::${dueSignature}::${signedIn ? "api" : "seed"}`;
}

export function invalidateStudyBootstrap(): void {
  cache = null;
}

export function useStudyBootstrap(): {
  data: StudyBootstrap | null;
  isLoading: boolean;
  error: Error | null;
} {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const dueIds = useStore((s) => s.dueToday());

  const [data, setData] = useState<StudyBootstrap | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const signedIn = !!getAuthToken();
    const dueSig = `${dueIds.length}::${dueIds[0] ?? "-"}`;
    const key = cacheKey(currentUserId, dueSig, signedIn);

    // Fresh cache → serve immediately, skip the fetch.
    if (cache && cache.key === key && Date.now() - cache.loadedAt < STALE_TIME_MS) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    (async () => {
      const user = currentUserId ? users[currentUserId] : null;
      const tier = (user?.tier ?? "free") as StudyBootstrap["tier"];
      const streakDays = user?.streakDays ?? 0;
      const totalWords = SEED_WORDS.length;

      // Try the API when signed in; always fall back to the seed on failure.
      let firstWord: Word | null = null;
      let dueCount = dueIds.length;
      let sessionId: string | null = null;
      let source: StudyBootstrap["source"] = "seed";

      if (signedIn) {
        const res = await api.get<LearningQueueResponse>(
          "/learning/queue?exam=TOPIK_I&limit=1",
        );
        if (res.ok && res.data) {
          source = "api";
          sessionId = res.data.sessionId;
          dueCount = res.data.due;
          const apiWord = res.data.words[0];
          if (apiWord) {
            // The API returns the full Prisma shape; the UI accepts a
            // superset of the seed `Word` shape, so we pass-through after
            // a light cast. (Fields we don't recognize are ignored.)
            firstWord = apiWord as unknown as Word;
          }
        }
      }

      if (!firstWord) {
        const fallbackId = dueIds[0] ?? SEED_WORDS[0]?.id ?? null;
        firstWord = fallbackId
          ? (SEED_WORDS.find((w) => w.id === fallbackId) ?? null)
          : null;
      }

      const bootstrap: StudyBootstrap = {
        firstWord,
        dueCount,
        totalWords,
        streakDays,
        tier,
        sessionId,
        source,
      };

      cache = { key, data: bootstrap, loadedAt: Date.now() };
      if (alive) {
        setData(bootstrap);
        setLoading(false);
      }
    })().catch((e) => {
      if (alive) {
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      }
    });

    return () => {
      alive = false;
    };
  }, [currentUserId, users, dueIds]);

  return { data, isLoading, error };
}
