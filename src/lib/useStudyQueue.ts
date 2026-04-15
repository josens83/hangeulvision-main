"use client";

/**
 * useStudyQueue
 * ─────────────
 * Buffers the *next three* words behind the current hero card and
 * pre-warms the browser image cache for each. Strictly gated on
 * `enabled: !!firstWord` so it never races the bootstrap query —
 * this is what keeps card transitions at ~0.2s instead of 0.8-1s.
 *
 *   Render order from /learn:
 *     1. StudySkeleton             (synchronous — 0ms)
 *     2. hero card via bootstrap   (~200ms after mount)
 *     3. queue warms up            (no user-visible cost)
 *     4. user taps "next" → next word is already in memory
 */

import { useEffect, useRef, useState } from "react";
import type { Word } from "./types";
import { SEED_WORDS } from "./words.seed";

const BUFFER_SIZE = 3;

export interface StudyQueue {
  queue: Word[];
  isLoading: boolean;
  /** IDs of words whose images have been pre-fetched. */
  prefetched: string[];
}

export function useStudyQueue(
  firstWord: Word | null | undefined,
  opts: { enabled?: boolean; size?: number } = {},
): StudyQueue {
  const { enabled = true, size = BUFFER_SIZE } = opts;
  const [queue, setQueue] = useState<Word[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [prefetched, setPrefetched] = useState<string[]>([]);
  const prefetchedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !firstWord) {
      setQueue([]);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    Promise.resolve().then(() => {
      const firstIdx = SEED_WORDS.findIndex((w) => w.id === firstWord.id);
      const start = firstIdx >= 0 ? firstIdx + 1 : 0;
      const next = SEED_WORDS.slice(start, start + size);

      if (alive) {
        setQueue(next);
        setLoading(false);
      }

      // Warm the image cache — strictly best-effort, never throws and
      // never blocks render. Only runs in the browser.
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
          setPrefetched((prev) =>
            prev.length + newlyPrefetched.length === prev.length
              ? prev
              : [...prev, ...newlyPrefetched],
          );
        }
      }
    });

    return () => {
      alive = false;
    };
  }, [firstWord, enabled, size]);

  return { queue, isLoading, prefetched };
}
