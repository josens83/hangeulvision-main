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
  const [tally, setTally] = useState({ know: 0, hard: 0, dontKnow: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    setIdx(0);
    setTally({ know: 0, hard: 0, dontKnow: 0 });
    setDone(false);
  }, [queue.length]);

  const current = queue[idx];

  const handleAction = (action: FlashAction, grade: Grade) => {
    if (current && user) gradeWord(current.id, grade);
    setTally((t) => ({ ...t, [action]: t[action] + 1 }));
    if (idx + 1 >= queue.length) setDone(true);
    else setIdx(idx + 1);
  };

  if (!current) return <EmptyState />;

  if (done) {
    return (
      <div className="py-16 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Session complete!</h1>
        <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2 text-sm">
          <div className="card p-3"><div className="font-bold text-brand-600">{tally.know}</div><div className="text-xs text-ink-500">Known</div></div>
          <div className="card p-3"><div className="font-bold text-amber-600">{tally.hard}</div><div className="text-xs text-ink-500">Hard</div></div>
          <div className="card p-3"><div className="font-bold text-rose-600">{tally.dontKnow}</div><div className="text-xs text-ink-500">Missed</div></div>
        </div>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/dashboard" className="btn-outline">Dashboard</Link>
          <button className="btn-primary" onClick={() => { setIdx(0); setDone(false); setTally({know:0,hard:0,dontKnow:0}); }}>
            Practice again
          </button>
        </div>
      </div>
    );
  }

  const progress = Math.round(((idx) / queue.length) * 100);

  return (
    <div className="py-4 sm:py-6">
      <div className="mb-3 flex items-center justify-between text-xs text-ink-500">
        <span>
          Card <span className="font-semibold text-ink-900">{idx + 1}</span> / {queue.length}
        </span>
        {!user ? (
          <Link href="/signin" className="font-semibold text-brand-600">
            Sign in to save progress →
          </Link>
        ) : null}
      </div>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <FlashCardGesture word={current} onAction={handleAction} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="text-6xl">📭</div>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">No words in queue</h1>
      <Link href="/learn" className="btn-primary mt-4">
        Browse the library
      </Link>
    </div>
  );
}
