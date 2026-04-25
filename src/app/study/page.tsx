"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface Q { wordId: string; word: string; level: number; options: string[]; correctIndex: number; }
type Phase = "intro" | "quiz" | "result";

export default function StudyPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ correct: boolean }>>([]);
  const [result, setResult] = useState<{ score: number; total: number; percentage: number; recommendedLevel: number; label: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  const start = useCallback(async () => {
    setLoading(true);
    const r = await api.get<{ questions: Q[] }>("/quiz/level-test?exam=TOPIK_I");
    setLoading(false);
    if (r.ok && r.data?.questions?.length) {
      setQuestions(r.data.questions); setAnswers([]); setIdx(0); setSelected(null); setPhase("quiz");
    }
  }, []);

  const pick = (i: number) => {
    if (selected !== null) return;
    const q = questions[idx];
    const correct = i === q.correctIndex;
    setSelected(i);
    const newAnswers = [...answers, { correct, wordId: q.wordId, selectedIndex: i }];
    setAnswers(newAnswers as any);

    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        api.post<any>("/quiz/level-test/submit", {
          answers: newAnswers.map((a: any, j: number) => ({ wordId: questions[j].wordId, selectedIndex: 0, correct: a.correct })),
          exam: "TOPIK_I",
        }).then((r) => { if (r.ok && r.data) setResult(r.data); });
        setPhase("result");
      } else { setIdx(idx + 1); setSelected(null); }
    }, 1000);
  };

  if (!user) return null;

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-7xl">📊</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">Find Your Level</h1>
        <p className="mt-2 text-ink-500">Answer 20 questions to discover the right starting point for your Korean journey.</p>
        <div className="card mx-auto mt-8 max-w-xs space-y-3 p-6">
          <div className="flex items-center gap-3 text-sm text-ink-700"><span className="text-lg">⏱️</span> Takes 3-5 minutes</div>
          <div className="flex items-center gap-3 text-sm text-ink-700"><span className="text-lg">📝</span> 20 multiple choice questions</div>
          <div className="flex items-center gap-3 text-sm text-ink-700"><span className="text-lg">🎯</span> Mixed difficulty (easy → hard)</div>
        </div>
        <button onClick={start} disabled={loading} className="btn-primary mt-6">{loading ? "Loading…" : "Start Test"}</button>
        <div className="mt-4"><Link href="/dashboard" className="text-sm text-ink-500 font-semibold">Skip for now</Link></div>
      </div>
    );
  }

  if (phase === "result" && result) {
    const emoji = result.recommendedLevel >= 3 ? "🏆" : result.recommendedLevel === 2 ? "💪" : "🌱";
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-7xl">{emoji}</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">{result.label}</h1>
        <p className="mt-2 text-ink-500">{result.score}/{result.total} correct ({result.percentage}%)</p>
        <p className="mt-4 text-lg text-ink-700">We recommend starting at <span className="font-bold text-brand-600">Level {result.recommendedLevel}</span></p>
        <div className="mt-8 flex flex-col items-center gap-3">
          <Link href="/learn" className="btn-primary w-full max-w-xs">Start learning at Level {result.recommendedLevel}</Link>
          <Link href="/dashboard" className="text-sm text-ink-500 font-semibold">Go to dashboard</Link>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const progress = Math.round((idx / questions.length) * 100);
  return (
    <div className="mx-auto max-w-md py-6">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-900">Question {idx + 1}/{questions.length}</span>
        <span className="chip">Level {q.level}</span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="card p-8 text-center"><div className="korean text-5xl font-bold text-ink-900">{q.word}</div></div>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)} disabled={selected !== null}
            className={`card p-4 text-left text-sm font-medium transition ${selected !== null ? (i === q.correctIndex ? "border-green-500 bg-green-50 text-green-700" : i === selected ? "border-rose-500 bg-rose-50 text-rose-700" : "opacity-50") : "hover:border-brand-300"}`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
