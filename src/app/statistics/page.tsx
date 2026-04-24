"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useFullStats } from "@/lib/useGoals";

export default function StatisticsPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const { stats, loading } = useFullStats();

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  if (!user) return null;

  if (loading || !stats) {
    return (
      <div className="animate-pulse space-y-6 py-6">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-24 bg-gray-200" />)}
        </div>
      </div>
    );
  }

  const goalPct = stats.dailyGoal > 0 ? Math.min(100, Math.round((stats.dailyProgress / stats.dailyGoal) * 100)) : 0;
  const maxWeekly = Math.max(1, ...stats.weekly.map((w) => w.cards));

  return (
    <div className="space-y-8 py-6">
      <h1 className="text-3xl font-bold text-ink-900">Statistics</h1>

      {/* ─── Top stats ──────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Tile emoji="📚" label="Total words" value={stats.totalWords} />
        <Tile emoji="🎓" label="Mastered" value={stats.mastered} />
        <Tile emoji="📖" label="Learning" value={stats.learning} />
        <Tile emoji="✨" label="New" value={stats.newWords} />
      </section>

      {/* ─── Daily goal + streak ────────── */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card flex items-center gap-6 p-6">
          <GoalRing pct={goalPct} />
          <div>
            <div className="text-sm text-ink-500">Today&apos;s goal</div>
            <div className="text-3xl font-bold text-ink-900">
              {stats.dailyProgress} / {stats.dailyGoal}
            </div>
            <div className="text-xs text-ink-500">cards reviewed ({goalPct}%)</div>
          </div>
        </div>
        <div className="card flex items-center gap-6 p-6">
          <div className="text-5xl">🔥</div>
          <div>
            <div className="text-sm text-ink-500">Current streak</div>
            <div className="text-3xl font-bold text-ink-900">{stats.streakDays} days</div>
            <div className="text-xs text-ink-500">Best: {stats.bestStreak} days</div>
          </div>
        </div>
      </section>

      {/* ─── Exam progress ──────────────── */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-ink-900">Progress by exam</h2>
        <div className="space-y-3">
          {Object.entries(stats.examProgress)
            .filter(([, v]) => v.total > 0)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([exam, v]) => {
              const pct = v.total > 0 ? Math.round((v.seen / v.total) * 100) : 0;
              return (
                <div key={exam} className="card p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink-900">{exam.replace(/_/g, " ")}</span>
                    <span className="text-ink-500">{v.seen} / {v.total} ({pct}%)</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-brand-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      {/* ─── Weekly activity ────────────── */}
      <section>
        <h2 className="mb-4 text-xl font-bold text-ink-900">Last 7 days</h2>
        <div className="card p-6">
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {stats.weekly.map((d) => {
              const h = maxWeekly > 0 ? (d.cards / maxWeekly) * 140 : 0;
              const day = new Date(d.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" });
              return (
                <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                  <div className="text-[10px] font-semibold text-ink-700">{d.cards || ""}</div>
                  <div
                    className="w-full rounded-t-lg bg-brand-400 transition-all"
                    style={{ height: Math.max(4, h) }}
                  />
                  <div className="text-[10px] text-ink-500">{day}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="text-center">
        <Link href="/dashboard" className="btn-outline">Back to dashboard</Link>
      </div>
    </div>
  );
}

function Tile({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-sm text-ink-500">
        <span className="text-lg">{emoji}</span>{label}
      </div>
      <div className="mt-1 text-3xl font-bold text-ink-900">{value.toLocaleString()}</div>
    </div>
  );
}

function GoalRing({ pct }: { pct: number }) {
  const R = 36;
  const circ = 2 * Math.PI * R;
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <circle cx="44" cy="44" r={R} stroke="#e5e7eb" strokeWidth="8" fill="none" />
      <circle
        cx="44" cy="44" r={R}
        stroke="#14a896" strokeWidth="8" fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ * (pct / 100)} ${circ}`}
        transform="rotate(-90 44 44)"
        className="transition-all duration-700"
      />
      <text x="44" y="49" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0b1220">
        {pct}%
      </text>
    </svg>
  );
}
