"use client";

/**
 * useStudyQueue
 * ─────────────
 * Buffers the *next three* words behind the current hero card. When the
 * user is signed in, pulls from `GET /learning/queue?exam=TOPIK_I&limit=5`
 * so the server-side SM-2 engine gets first say. Anonymous / offline
 * users fall back to the synchronous seed, sliced relative to firstWord.
 *
 * Strictly gated on `enabled: !!firstWord` so it never races the bootstrap.
 * Also warms the browser image cache for each buffered word.
 */

import { useEffect, useRef, useState } from "react";
import { api, getAuthToken, type LearningQueueResponse } from "./api";
import type { Word } from "./types";
import { SEED_WORDS } from "./words.seed";

const BUFFER_SIZE = 3;

export interface StudyQueue {
  queue: Word[];
  isLoading: boolean;
  /** IDs of words whose concept images have been pre-fetched. */
  prefetched: string[];
  source: "api" | "seed";
}

export function useStudyQueue(
  firstWord: Word | null | undefined,
  opts: { enabled?: boolean; size?: number } = {},
): StudyQueue {
  const { enabled = true, size = BUFFER_SIZE } = opts;
  const [queue, setQueue] = useState<Word[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [prefetched, setPrefetched] = useState<string[]>([]);
  const [source, setSource] = useState<"api" | "seed">("seed");
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !firstWord) {
      setQueue([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    (async () => {
      let next: Word[] = [];
      let nextSource: "api" | "seed" = "seed";

      if (getAuthToken()) {
        // Ask for one extra so we can drop firstWord if the server returns it.
        const res = await api.get<LearningQueueResponse>(
          `/learning/queue?exam=TOPIK_I&limit=${size + 1}`,
        );
        if (res.ok && res.data?.words?.length) {
          const apiWords = res.data.words
            .filter((w) => w.id !== firstWord.id)
            .slice(0, size);
          next = apiWords as unknown as Word[];
          nextSource = "api";
        }
      }

      if (next.length === 0) {
        const firstIdx = SEED_WORDS.findIndex((w) => w.id === firstWord.id);
        const start = firstIdx >= 0 ? firstIdx + 1 : 0;
        next = SEED_WORDS.slice(start, start + size);
      }

      if (!alive) return;
      setQueue(next);
      setSource(nextSource);
      setLoading(false);

      // Image warm-up — best-effort, never blocks render.
      if (typeof window !== "undefined" && typeof Image !== "undefined") {
        const newlyPrefetched: string[] = [];
        next.forEach((w) => {
          if (!w.conceptImageUrl) return;
          if (prefetchedRef.current.has(w.id)) return;
          try {
            const img = new Image();
            img.decoding = "async";
            img.src = w.conceptImageUrl;
            prefetchedRef.current.add(w.id);
            newlyPrefetched.push(w.id);
          } catch {
            /* silent — image warm-up never breaks study flow */
          }
        });
        if (alive && newlyPrefetched.length) {
          setPrefetched((prev) => [...prev, ...newlyPrefetched]);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [firstWord, enabled, size]);

  return { queue, isLoading, prefetched, source };
}
