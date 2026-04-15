"use client";

/**
 * useStudyBootstrap
 * ─────────────────
 * Minimal first-paint payload for the /learn study surface:
 *   • the current session summary (due count, total words, streak)
 *   • the *single* first word that should render as the hero card
 *
 * Anything else (image pre-render, next 3 word buffer, stats panel) is
 * deferred to useStudyQueue / lazy components. This mirrors the HAR
 * pattern where the critical request resolves in <1s and the rest of
 * the payload arrives asynchronously.
 *
 * staleTime: 5 minutes. A module-level cache serves repeat mounts
 * instantly; grading a word invalidates via `invalidateStudyBootstrap()`.
 */

import { useEffect, useState } from "react";
import { useStore } from "./store";
import { SEED_WORDS } from "./words.seed";
import type { Word } from "./types";

export interface StudyBootstrap {
  firstWord: Word | null;
  dueCount: number;
  totalWords: number;
  streakDays: number;
  tier: "free" | "basic" | "premium";
}

const STALE_TIME_MS = 5 * 60 * 1000;

interface CacheEntry {
  key: string;
  data: StudyBootstrap;
  loadedAt: number;
}

let cache: CacheEntry | null = null;

function cacheKeyFor(userId: string | null, dueIds: readonly string[]): string {
  return `${userId ?? "anon"}::${dueIds.length}::${dueIds[0] ?? "-"}`;
}

export function invalidateStudyBootstrap(): void {
  cache = null;
}

export function useStudyBootstrap(): {
  data: StudyBootstrap | null;
  isLoading: boolean;
  error: Error | null;
} {
  // Pull the minimum slice of store state needed to derive the bootstrap.
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const dueIds = useStore((s) => s.dueToday());

  const cacheKey = cacheKeyFor(currentUserId, dueIds);
  const fresh =
    cache && cache.key === cacheKey && Date.now() - cache.loadedAt < STALE_TIME_MS
      ? cache.data
      : null;

  const [data, setData] = useState<StudyBootstrap | null>(fresh);
  const [isLoading, setLoading] = useState<boolean>(!fresh);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Cache hit → no work needed.
    if (cache && cache.key === cacheKey && Date.now() - cache.loadedAt < STALE_TIME_MS) {
      setData(cache.data);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);

    // Simulates an async fetch — swaps to a real fetch('/learning/queue')
    // call when the NestJS backend comes online.
    Promise.resolve()
      .then(() => {
        const user = currentUserId ? users[currentUserId] : null;
        const firstId = dueIds[0] ?? SEED_WORDS[0]?.id ?? null;
        const firstWord = firstId
          ? (SEED_WORDS.find((w) => w.id === firstId) ?? null)
          : null;

        const bootstrap: StudyBootstrap = {
          firstWord,
          dueCount: dueIds.length,
          totalWords: SEED_WORDS.length,
          streakDays: user?.streakDays ?? 0,
          tier: (user?.tier ?? "free") as StudyBootstrap["tier"],
        };

        cache = { key: cacheKey, data: bootstrap, loadedAt: Date.now() };
        if (alive) {
          setData(bootstrap);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (alive) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [cacheKey, currentUserId, users, dueIds]);

  return { data, isLoading, error };
}
