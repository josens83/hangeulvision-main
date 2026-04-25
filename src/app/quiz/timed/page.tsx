"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface Q { wordId: string; word: string; options: string[]; correctIndex: number; }

export default function TimedQuiz() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [exam, setExam] = useState("TOPIK_I");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  useEffect(() => {
    if (phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setPhase("done"); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const start = useCallback(async () => {
    setLoading(true);
    const r = await api.get<{ questions: Q[] }>(`/quiz/questions?exam=${exam}&count=20&type=timed`);
    setLoading(false);
    if (r.ok && r.data?.questions?.length) {
      setQuestions(r.data.questions); setIdx(0); setScore(0); setTimeLeft(60); setSelected(null); setPhase("playing");
    }
  }, [exam]);

  const pick = (i: number) => {
    if (selected !== null || phase !== "playing") return;
    const q = questions[idx];
    const correct = i === q.correctIndex;
    if (correct) setScore((s) => s + 10);
    setSelected(i);
    setTimeout(() => {
      if (idx + 1 >= questions.length) setPhase("done");
      else { setIdx(idx + 1); setSelected(null); }
    }, 600);
  };

  if (!user) return null;

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-6xl">⏱️</div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Timed Challenge</h1>
        <p className="mt-2 text-ink-500">60 seconds. +10 points per correct answer.</p>
        <div className="card mx-auto mt-6 max-w-sm space-y-4 p-6 text-left">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="inp w-full">
              {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV"].map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select></label>
          <button onClick={start} disabled={loading} className="btn-primary w-full">{loading ? "Loading…" : "Start (60s)"}</button>
        </div>
        <Link href="/quiz" className="mt-4 inline-block text-sm text-brand-600 font-semibold">← All modes</Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-7xl">⏱️</div>
        <h1 className="mt-4 text-4xl font-bold text-brand-600">{score} points</h1>
        <p className="mt-2 text-ink-500">{idx + (selected !== null ? 1 : 0)} questions answered in 60 seconds.</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button onClick={() => setPhase("setup")} className="btn-primary w-full max-w-xs">Try again</button>
          <Link href="/quiz" className="text-sm text-ink-500 font-semibold">All modes</Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const urgent = timeLeft <= 10;

  return (
    <div className="mx-auto max-w-md py-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900">Score: {score}</span>
        <span className={`text-2xl font-bold ${urgent ? "text-rose-600 animate-pulse" : "text-ink-900"}`}>{timeLeft}s</span>
      </div>
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-rose-500" : "bg-brand-500"}`} style={{ width: `${(timeLeft / 60) * 100}%` }} />
      </div>

      <div className="card p-6 text-center">
        <div className="korean text-4xl font-bold text-ink-900">{q.word}</div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)} disabled={selected !== null}
            className={`card p-3 text-left text-xs font-medium transition ${selected !== null ? (i === q.correctIndex ? "border-green-500 bg-green-50" : i === selected ? "border-rose-500 bg-rose-50" : "opacity-40") : "hover:border-brand-300"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
