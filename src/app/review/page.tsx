"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SEED_WORDS, findWord } from "@/lib/words.seed";
import { useStore } from "@/lib/store";
import type { Word } from "@/lib/types";
import type { Grade } from "@/lib/srs";

export default function ReviewPage() {
  const user = useStore((s) => s.currentUser());
  const dueIds = useStore((s) => s.dueToday());
  const gradeWord = useStore((s) => s.gradeWord);

  const queue: Word[] = useMemo(() => {
    if (!user) return SEED_WORDS.slice(0, 5);
    if (dueIds.length) return dueIds.map((id) => findWord(id)).filter(Boolean) as Word[];
    return SEED_WORDS.slice(0, 10);
  }, [user, dueIds]);

  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIdx(0);
    setFlipped(false);
    setDone(false);
  }, [queue.length]);

  const current = queue[idx];

  const answer = (g: Grade) => {
    if (!current) return;
    if (user) gradeWord(current.id, g);
    if (idx + 1 >= queue.length) setDone(true);
    else {
      setIdx(idx + 1);
      setFlipped(false);
    }
  };

  if (!current) return <EmptyState />;

  if (done) {
    return (
      <div className="py-16 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Session complete!</h1>
        <p className="mt-1 text-ink-500">Come back tomorrow for your next review.</p>
        <Link href="/dashboard" className="btn-primary mt-4">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="mb-4 flex items-center justify-between text-sm text-ink-500">
        <div>Card {idx + 1} of {queue.length}</div>
        {!user ? <Link href="/signin" className="text-brand-600 font-semibold">Sign in to save progress →</Link> : null}
      </div>
      <div
        className="card mx-auto aspect-[4/5] max-w-md cursor-pointer p-8 text-center transition-transform [transform-style:preserve-3d] sm:aspect-[3/4]"
        onClick={() => setFlipped((f) => !f)}
        style={{ transform: flipped ? "rotateY(180deg)" : "none" }}
      >
        <div className={flipped ? "hidden" : "flex h-full flex-col items-center justify-center gap-4"}>
          <div className="chip">{current.exam.replace(/_/g, " ")} · L{current.level}</div>
          <div className="korean text-6xl font-bold text-ink-900">{current.word}</div>
          <div className="text-sm text-ink-500">Tap to reveal meaning</div>
        </div>
        <div
          className={flipped ? "flex h-full flex-col items-center justify-center gap-3" : "hidden"}
          style={{ transform: "rotateY(180deg)" }}
        >
          <div className="text-xs font-semibold text-ink-500">{current.romanization} · {current.ipa}</div>
          <div className="text-2xl font-semibold text-ink-900">{current.definitionEn}</div>
          {current.examples[0] ? (
            <p className="korean mt-3 text-sm text-ink-700">"{current.examples[0].sentence}"</p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto mt-6 grid max-w-md grid-cols-3 gap-2 sm:grid-cols-6">
        {[0, 1, 2, 3, 4, 5].map((g) => (
          <button
            key={g}
            onClick={() => answer(g as Grade)}
            className={`rounded-xl border p-3 text-center text-sm font-semibold ${
              g < 3
                ? "border-rose-200 bg-rose-50 text-rose-600"
                : "border-brand-200 bg-brand-50 text-brand-700"
            }`}
          >
            <div className="text-lg">{g}</div>
            <div className="text-[10px]">{["blank", "wrong", "hard", "ok", "good", "easy"][g]}</div>
          </button>
        ))}
      </div>

      <div className="mx-auto mt-6 max-w-md text-center text-xs text-ink-500">
        SM-2 spaced repetition · grades 0-2 reset the interval, 3-5 extend it.
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="text-6xl">📭</div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">No words in queue</h1>
      <Link href="/learn" className="btn-primary mt-4">Browse the library</Link>
    </div>
  );
}
