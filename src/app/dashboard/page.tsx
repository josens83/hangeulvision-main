"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { EXAMS } from "@/lib/exams";
import { hasExamAccess, planById } from "@/lib/pricing";
import { SEED_WORDS } from "@/lib/words.seed";

export default function DashboardPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const dueIds = useStore((s) => s.dueToday());

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  if (!user) return null;
  const plan = planById(user.tier);

  return (
    <div className="space-y-10 py-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="chip">Welcome back</div>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">안녕, {user.name} 👋</h1>
          <p className="text-sm text-ink-500">
            Plan: <span className="font-semibold text-ink-900">{plan.name}</span> · Streak:{" "}
            <span className="font-semibold text-ink-900">{user.streakDays}일</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/review" className="btn-primary">
            {dueIds.length > 0 ? `Review ${dueIds.length} due` : "Start session"}
          </Link>
          <Link href="/pricing" className="btn-outline">Upgrade</Link>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Words in library" value={SEED_WORDS.length.toString()} />
        <Stat label="Due today" value={dueIds.length.toString()} />
        <Stat label="Tier" value={plan.name} />
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink-900">Your exams</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => {
            const access = hasExamAccess(user.tier, e.id, user.purchases);
            return (
              <div key={e.id} className="card p-5">
                <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl bg-gradient-to-br ${e.color}`}>{e.emoji}</div>
                <div className="font-semibold text-ink-900">{e.name}</div>
                <div className="text-sm text-ink-500">{e.levelRange} · {e.wordCount.toLocaleString()} words</div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`chip ${access ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-ink-500"}`}>
                    {access ? "Unlocked" : "Locked"}
                  </span>
                  {access ? (
                    <Link href={`/exams/${e.id}`} className="text-sm font-semibold text-brand-600">
                      Open →
                    </Link>
                  ) : (
                    <Link href={`/checkout?plan=premium`} className="text-sm font-semibold text-brand-600">
                      Unlock →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink-900">Continue learning</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SEED_WORDS.slice(0, 6).map((w) => (
            <Link href={`/learn/${w.id}`} key={w.id} className="card flex items-center gap-4 p-4 transition hover:shadow-pop">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink-900">{value}</div>
    </div>
  );
}
