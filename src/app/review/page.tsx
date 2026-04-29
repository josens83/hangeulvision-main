"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SEED_WORDS, findWord } from "@/lib/words.seed";
import { useStore } from "@/lib/store";
import type { Word } from "@/lib/types";
import type { Grade } from "@/lib/srs";
import { FlashCardGesture, type FlashAction } from "@/components/FlashCardGesture";

export default function ReviewPage() {
  const user = useStore((s) => s.currentUser());
  const dueIds = useStore((s) => s.dueToday());
  const gradeWord = useStore((s) => s.gradeWord);

  const queue: Word[] = useMemo(() => {
    if (user && dueIds.length) {
      return dueIds.map((id) => findWord(id)).filter(Boolean) as Word[];
    }
    return SEED_WORDS.slice(0, 10);
  }, [user, dueIds]);

  const [idx, setIdx] = useState(0);
  const [tally, setTally] = useState({ know: 0, dontKnow: 0 });
  const [done, setDone] = useState(false);
  const [gradeFlash, setGradeFlash] = useState<"correct" | "wrong" | null>(null);

  useEffect(() => {
    setIdx(0);
    setTally({ know: 0, dontKnow: 0 });
    setDone(false);
  }, [queue.length]);

  const current = queue[idx];

  const handleAction = (action: FlashAction, grade: Grade) => {
    if (current && user) gradeWord(current.id, grade);
    const key = action === "know" ? "know" : "dontKnow";
    setTally((t) => ({ ...t, [key]: t[key] + 1 }));

    const isCorrect = grade >= 3;
    setGradeFlash(isCorrect ? "correct" : "wrong");
    setTimeout(() => setGradeFlash(null), 350);

    if (idx + 1 >= queue.length) {
      setTimeout(() => setDone(true), 200);
    } else {
      setIdx(idx + 1);
    }
  };

  if (!current) return <EmptyState />;

  if (done) {
    const total = tally.know + tally.dontKnow;
    const correct = tally.know;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return <SessionComplete total={total} correct={correct} pct={pct} tally={tally} onRetry={() => { setIdx(0); setDone(false); setTally({ know: 0, dontKnow: 0 }); }} />;
  }

  const progress = Math.round((idx / queue.length) * 100);
  const studied = idx;

  return (
    <div className="py-4 sm:py-6">
      {/* ─── Progress bar ──────────────────────── */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">
          {studied}/{queue.length} words studied
        </span>
        {!user ? (
          <Link href="/signin" className="text-xs font-semibold text-brand-600">
            Sign in to save &rarr;
          </Link>
        ) : (
          <span className="text-xs text-ink-500">
            {tally.know} correct &middot; {tally.dontKnow} missed
          </span>
        )}
      </div>
      <div className="relative mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full w-1 rounded-full bg-brand-400 animate-pulse"
          style={{ left: `${progress}%` }}
        />
      </div>

      {/* ─── Grade flash overlay ───────────────── */}
      {gradeFlash && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
            gradeFlash ? "opacity-100" : "opacity-0"
          }`}
        >
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full text-5xl shadow-2xl ${
              gradeFlash === "correct"
                ? "bg-green-500 text-white"
                : "bg-rose-500 text-white"
            }`}
          >
            {gradeFlash === "correct" ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* ─── Flashcard ─────────────────────────── */}
      <FlashCardGesture word={current} onAction={handleAction} />
    </div>
  );
}

function SessionComplete({
  total,
  correct,
  pct,
  tally,
  onRetry,
}: {
  total: number;
  correct: number;
  pct: number;
  tally: { know: number; dontKnow: number };
  onRetry: () => void;
}) {
  const rating =
    pct >= 90
      ? { emoji: "🏆", text: "Outstanding!", color: "text-brand-600" }
      : pct >= 70
        ? { emoji: "💪", text: "Great work!", color: "text-brand-600" }
        : pct >= 50
          ? { emoji: "👍", text: "Good effort!", color: "text-amber-600" }
          : { emoji: "📚", text: "Keep practicing!", color: "text-rose-600" };

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <div className="text-7xl">{rating.emoji}</div>
      <h1 className={`mt-4 text-3xl font-bold ${rating.color}`}>{rating.text}</h1>
      <p className="mt-2 text-ink-500">
        You studied <span className="font-semibold text-ink-900">{total} words</span> today.
      </p>

      {/* Score ring */}
      <div className="mx-auto mt-6 flex items-center justify-center">
        <ScoreRing pct={pct} />
      </div>
      <p className="mt-2 text-sm text-ink-500">
        {correct}/{total} correct ({pct}%)
      </p>

      {/* Breakdown */}
      <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-3">
          <div className="text-2xl font-bold text-green-600">{tally.know}</div>
          <div className="text-[11px] text-green-700">Got it</div>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
          <div className="text-2xl font-bold text-rose-600">{tally.dontKnow}</div>
          <div className="text-[11px] text-rose-700">Missed</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <button onClick={onRetry} className="btn-primary w-full max-w-xs">
          Continue learning
        </button>
        <Link href="/learn" className="btn-outline w-full max-w-xs">
          Review mistakes
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-ink-500 hover:text-ink-900">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

function ScoreRing({ pct }: { pct: number }) {
  const R = 40;
  const circ = 2 * Math.PI * R;
  const color = pct >= 70 ? "#14a896" : pct >= 50 ? "#d97706" : "#e11d48";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={R} stroke="#e5e7eb" strokeWidth="10" fill="none" />
      <circle
        cx="50"
        cy="50"
        r={R}
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circ * (pct / 100)} ${circ}`}
        transform="rotate(-90 50 50)"
        className="transition-all duration-1000 ease-out"
      />
      <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0b1220">
        {pct}%
      </text>
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="text-6xl">📭</div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">No words in queue</h1>
      <p className="mt-2 text-sm text-ink-500">Start learning some words first, then come back for review.</p>
      <Link href="/learn" className="btn-primary mt-6 inline-block">
        Browse the library
      </Link>
    </div>
  );
}
