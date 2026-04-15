"use client";

/**
 * useProgressStats
 * ────────────────
 * Fetches `/progress/stats` for the authenticated user. Returns the
 * server-authoritative counts (total / seen / mastered / learning / new /
 * streakDays / dueCount). On network/API failure, surfaces `source:"local"`
 * so callers can fall back to the locally-computed stats.
 */

import { useEffect, useState } from "react";
import { api, getAuthToken, type ProgressStats } from "./api";

interface UseProgressStatsResult {
  stats: ProgressStats | null;
  isLoading: boolean;
  source: "api" | "local";
}

export function useProgressStats(): UseProgressStatsResult {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [isLoading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState<"api" | "local">("local");

  useEffect(() => {
    let alive = true;
    setLoading(true);

    (async () => {
      if (!getAuthToken()) {
        if (alive) {
          setStats(null);
          setSource("local");
          setLoading(false);
        }
        return;
      }

      const res = await api.get<{ stats: ProgressStats }>("/progress/stats");
      if (!alive) return;

      if (res.ok && res.data?.stats) {
        setStats(res.data.stats);
        setSource("api");
      } else {
        setStats(null);
        setSource("local");
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { stats, isLoading, source };
}
