"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAuthToken } from "./api";

export interface DailyGoal {
  dailyGoal: number;
  dailyProgress: number;
  percentage: number;
  streakDays: number;
  bestStreak: number;
  completed: boolean;
}

export interface FullStats {
  dailyGoal: number;
  dailyProgress: number;
  streakDays: number;
  bestStreak: number;
  totalWords: number;
  seen: number;
  mastered: number;
  learning: number;
  newWords: number;
  examProgress: Record<string, { seen: number; total: number }>;
  weekly: Array<{ date: string; cards: number }>;
}

export function useDailyGoal() {
  const [goal, setGoal] = useState<DailyGoal | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    const res = await api.get<DailyGoal>("/goals/daily");
    if (res.ok && res.data) setGoal(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateGoal = useCallback(async (value: number) => {
    const res = await api.put<{ dailyGoal: number }>("/goals/daily", { goal: value });
    if (res.ok) load();
  }, [load]);

  const increment = useCallback(async () => {
    const res = await api.post<DailyGoal>("/goals/progress");
    if (res.ok && res.data) setGoal(res.data);
  }, []);

  return { goal, loading, updateGoal, increment, reload: load };
}

export function useFullStats() {
  const [stats, setStats] = useState<FullStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAuthToken()) { setLoading(false); return; }
    api.get<FullStats>("/goals/stats").then((res) => {
      if (res.ok && res.data) setStats(res.data);
      setLoading(false);
    });
  }, []);

  return { stats, loading };
}
