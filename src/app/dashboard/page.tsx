"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EXAMS } from "@/lib/exams";
import { hasExamAccess, planById } from "@/lib/pricing";
import { SEED_WORDS } from "@/lib/words.seed";
import { stableQuery } from "@/lib/stableQuery";

interface DashboardStats {
  totalSeen: number;
  mastered: number;
  due: number;
  streakDays: number;
  tier: string;
  recent: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  // stableQuery — reduces dashboard re-renders the VocaVision way.
  const stats = stableQuery<
    [string | null, Record<string, Record<string, any>>, typeof useStore extends unknown ? any : any],
    DashboardStats
  >(
    (s) => [s.currentUserId, s.progress, s.users] as const,
    ([uid, progress, users]: any) => {
      const u = uid ? users[uid] : null;
      const entries = uid ? Object.values(progress[uid] ?? {}) : [];
      const due = entries.filter((e: any) => new Date(e.dueAt).getTime() <= Date.now()).length;
      const mastered = entries.filter((e: any) => (e.reps ?? 0) >= 3 && (e.ease ?? 0) >= 2.5).length;
      const recent = entries
        .slice()
        .sort((a: any, b: any) =>
          (b.lastReviewedAt ?? "").localeCompare(a.lastReviewedAt ?? ""),
        )
        .slice(0, 4)
        .map((e: any) => e.wordId as string);
      return {
        totalSeen: entries.length,
        mastered,
        due,
        streakDays: u?.streakDays ?? 0,
        tier: u?.tier ?? "free",
        recent,
      };
    },
    { totalSeen: 0, mastered: 0, due: 0, streakDays: 0, tier: "free", recent: [] },
  );

  if (!user) return null;
  const plan = planById(user.tier);
  const target = 20; // daily target cards

  return (
    <div className="space-y-8 py-4 sm:py-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="chip">Welcome back</div>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">안녕, {user.name} 👋</h1>
          <p className="text-sm text-ink-500">
            Plan: <span className="font-semibold text-ink-900">{plan.name}</span> · Streak:{" "}
            <span className="font-semibold text-ink-900">{stats.streakDays}일</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/review" className="btn-primary">
            {stats.due > 0 ? `Review ${stats.due} due` : "Start session"}
          </Link>
          <Link href="/pricing" className="btn-outline hidden sm:inline-flex">
            Upgrade
          </Link>
        </div>
      </header>

      {/* Daily goal ring + stats */}
      <section className="grid gap-4 sm:grid-cols-4">
        <div className="card col-span-1 flex items-center gap-4 p-5 sm:col-span-1">
          <GoalRing value={Math.min(stats.totalSeen, target)} target={target} />
          <div>
            <div className="text-xs text-ink-500">Today's goal</div>
            <div className="text-2xl font-bold text-ink-900">
              {Math.min(stats.totalSeen, target)} / {target}
            </div>
            <div className="text-xs text-ink-500">cards reviewed</div>
          </div>
        </div>
        <Stat label="Due now" value={stats.due.toString()} emoji="⏰" />
        <Stat label="Mastered" value={stats.mastered.toString()} emoji="🎓" />
        <Stat label="Library" value={SEED_WORDS.length.toString()} emoji="📚" />
      </section>

      {/* Exams */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold text-ink-900">Your exams</h2>
          <Link href="/exams" className="text-sm font-semibold text-brand-600">
            Browse all →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => {
            const access = hasExamAccess(user.tier, e.id, user.purchases);
            return (
              <div key={e.id} className="card p-5">
                <div
                  className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl bg-gradient-to-br ${e.color}`}
                >
                  {e.emoji}
                </div>
                <div className="font-semibold text-ink-900">{e.name}</div>
                <div className="text-sm text-ink-500">
                  {e.levelRange} · {e.wordCount.toLocaleString()} words
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`chip ${
                      access ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-ink-500"
                    }`}
                  >
                    {access ? "Unlocked" : "Locked"}
                  </span>
                  {access ? (
                    <Link href={`/exams/${e.id}`} className="text-sm font-semibold text-brand-600">
                      Open →
                    </Link>
                  ) : (
                    <Link
                      href={`/checkout?plan=premium`}
                      className="text-sm font-semibold text-brand-600"
                    >
                      Unlock →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Continue */}
      <section>
        <h2 className="text-xl font-bold text-ink-900">Continue learning</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SEED_WORDS.slice(0, 6).map((w) => (
            <Link
              href={`/learn/${w.id}`}
              key={w.id}
              className="card flex items-center gap-4 p-4 transition hover:shadow-pop"
            >
              <div className="korean text-2xl font-bold text-ink-900">{w.word}</div>
              <div className="flex-1">
                <div className="text-xs text-ink-500">{w.romanization}</div>
                <div className="text-sm text-ink-700">{w.definitionEn}</div>
              </div>
              <div className="chip">L{w.level}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, emoji }: { label: string; value: string; emoji: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">{emoji}</span>
        <div className="text-sm text-ink-500">{label}</div>
      </div>
      <div className="mt-1 text-3xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function GoalRing({ value, target }: { value: number; target: number }) {
  const pct = Math.min(1, value / Math.max(1, target));
  const R = 28;
  const circ = 2 * Math.PI * R;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" className="shrink-0">
      <circle cx="36" cy="36" r={R} stroke="#e5e7eb" strokeWidth="8" fill="none" />
      <circle
        cx="36"
        cy="36"
        r={R}
        stroke="#14a896"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ * pct} ${circ}`}
        transform="rotate(-90 36 36)"
      />
      <text
        x="36"
        y="41"
        textAnchor="middle"
        fontSize="14"
        fontWeight="700"
        fill="#0b1220"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
