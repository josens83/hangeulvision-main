"use client";

import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string | null;
  threshold: number;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ achievements: Achievement[] }>("/achievements").then((res) => {
      if (res.ok && res.data) setAchievements(res.data.achievements);
      setLoading(false);
    });
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Achievements</h1>
          <p className="text-sm text-ink-500">
            {unlockedCount} / {achievements.length} unlocked
          </p>
        </div>
        {getAuthToken() && (
          <button
            onClick={async () => {
              const res = await api.post<{ newlyUnlocked: Array<{ name: string }> }>("/achievements/check");
              if (res.ok && res.data?.newlyUnlocked?.length) {
                // Reload to show new unlocks
                const r2 = await api.get<{ achievements: Achievement[] }>("/achievements");
                if (r2.ok && r2.data) setAchievements(r2.data.achievements);
              }
            }}
            className="btn-outline"
          >
            Check progress
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card h-32 bg-gray-200" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`card p-5 transition ${
                a.unlocked ? "border-brand-200 shadow-card" : "opacity-60 grayscale"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-4xl">{a.unlocked ? (a.icon ?? "🏅") : "🔒"}</div>
                <div className="flex-1">
                  <div className="font-bold text-ink-900">{a.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{a.description}</div>
                  {a.unlocked && a.unlockedAt ? (
                    <div className="mt-2 text-[10px] font-semibold text-brand-600">
                      Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-ink-500">
                        <span>{a.progress} / {a.threshold}</span>
                        <span>{Math.min(100, Math.round((a.progress / a.threshold) * 100))}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full rounded-full bg-gray-400 transition-all"
                          style={{ width: `${Math.min(100, (a.progress / a.threshold) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
