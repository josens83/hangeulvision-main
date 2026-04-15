"use client";

/**
 * useWordLibrary
 * ──────────────
 * Fetches the TOPIK I word library from the backend with transparent
 * fallback to the synchronous seed dataset. The seed renders immediately
 * (no network wait) and is swapped for the authoritative API payload
 * once it arrives — this keeps /learn usable during cold Railway boots,
 * offline, or during any backend-side incident.
 */

import { useEffect, useState } from "react";
import { api, type WordListResponse } from "./api";
import type { Word } from "./types";
import { SEED_WORDS } from "./words.seed";

export interface WordLibrary {
  words: Word[];
  total: number;
  source: "api" | "seed";
  isLoading: boolean;
}

const DEFAULT_EXAM = "TOPIK_I";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;

export function useWordLibrary(
  opts: { exam?: string; page?: number; limit?: number } = {},
): WordLibrary {
  const { exam = DEFAULT_EXAM, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = opts;

  // Seed renders synchronously so the first paint is never empty.
  const [words, setWords] = useState<Word[]>(() => SEED_WORDS);
  const [total, setTotal] = useState<number>(SEED_WORDS.length);
  const [source, setSource] = useState<"api" | "seed">("seed");
  const [isLoading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      const qs = new URLSearchParams({
        exam,
        page: String(page),
        limit: String(limit),
      }).toString();
      const res = await api.get<WordListResponse>(`/words?${qs}`);
      if (!alive) return;

      if (res.ok && res.data?.words?.length) {
        setWords(res.data.words as unknown as Word[]);
        setTotal(res.data.total);
        setSource("api");
      }
      // res.ok === false → keep the seed we already set; no need to null anything out.
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [exam, page, limit]);

  return { words, total, source, isLoading };
}
