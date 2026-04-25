"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface Q { wordId: string; word: string; options: string[]; correctIndex: number; }
type Phase = "setup" | "playing" | "feedback" | "results";

export default function ChoiceQuiz() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [phase, setPhase] = useState<Phase>("setup");
  const [exam, setExam] = useState("TOPIK_I");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ correct: boolean; word: string; answer: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  const start = useCallback(async () => {
    setLoading(true);
    const r = await api.get<{ questions: Q[] }>(`/quiz/questions?exam=${exam}&count=${count}&type=multiple_choice`);
    setLoading(false);
    if (r.ok && r.data?.questions?.length) { setQuestions(r.data.questions); setAnswers([]); setIdx(0); setSelected(null); setPhase("playing"); }
  }, [exam, count]);

  const pick = (i: number) => {
    if (selected !== null) return;
    const q = questions[idx];
    const correct = i === q.correctIndex;
    setSelected(i);
    setAnswers((a) => [...a, { correct, word: q.word, answer: q.options[q.correctIndex] }]);
    setPhase("feedback");
    setTimeout(() => {
      if (idx + 1 >= questions.length) { setPhase("results"); api.post("/quiz/submit", { answers: [...answers, { wordId: q.wordId, selectedIndex: i, correct }], exam, type: "multiple_choice" }); }
      else { setIdx(idx + 1); setSelected(null); setPhase("playing"); }
    }, 1500);
  };

  if (!user) return null;
  if (phase === "setup") return <Setup exam={exam} setExam={setExam} count={count} setCount={setCount} start={start} loading={loading} title="Multiple Choice" />;
  if (phase === "results") return <Results answers={answers} onRetry={() => { setPhase("setup"); setAnswers([]); }} />;

  const q = questions[idx];
  return (
    <div className="mx-auto max-w-md py-6">
      <ProgressBar idx={idx} total={questions.length} correct={answers.filter((a) => a.correct).length} />
      <div className="card p-8 text-center"><div className="text-xs text-ink-500">What does this word mean?</div><div className="korean mt-3 text-5xl font-bold text-ink-900">{q.word}</div></div>
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)} disabled={selected !== null} className={`card p-4 text-left text-sm font-medium transition ${selected !== null ? (i === q.correctIndex ? "border-green-500 bg-green-50 text-green-700" : i === selected ? "border-rose-500 bg-rose-50 text-rose-700" : "opacity-50") : "text-ink-900 hover:border-brand-300"}`}>
            <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold">{String.fromCharCode(65 + i)}</span>{opt}
          </button>
        ))}
      </div>
      {phase === "feedback" && selected !== null && <Feedback correct={selected === q.correctIndex} answer={q.options[q.correctIndex]} />}
    </div>
  );
}

// Shared sub-components used across quiz modes
export function Setup({ exam, setExam, count, setCount, start, loading, title }: { exam: string; setExam: (v: string) => void; count: number; setCount: (v: number) => void; start: () => void; loading: boolean; title: string }) {
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <h1 className="text-2xl font-bold text-ink-900">{title}</h1>
      <div className="card mx-auto mt-6 max-w-sm space-y-4 p-6 text-left">
        <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
          <select value={exam} onChange={(e) => setExam(e.target.value)} className="inp w-full">
            {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV"].map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
          </select></label>
        <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Questions</span>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="inp w-full">
            {[5, 10, 15, 20].map((n) => <option key={n} value={n}>{n}</option>)}
          </select></label>
        <button onClick={start} disabled={loading} className="btn-primary w-full">{loading ? "Loading…" : "Start"}</button>
      </div>
      <Link href="/quiz" className="mt-4 inline-block text-sm text-brand-600 font-semibold">← All modes</Link>
    </div>
  );
}

export function ProgressBar({ idx, total, correct }: { idx: number; total: number; correct: number }) {
  return (
    <>
      <div className="mb-2 flex items-center justify-between text-sm"><span className="font-semibold text-ink-900">Q {idx + 1}/{total}</span><span className="text-ink-500">{correct} correct</span></div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.round((idx / total) * 100)}%` }} /></div>
    </>
  );
}

export function Feedback({ correct, answer }: { correct: boolean; answer: string }) {
  return <div className={`mt-4 rounded-xl p-3 text-center text-sm font-semibold ${correct ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"}`}>{correct ? "✓ Correct!" : `✗ Answer: ${answer}`}</div>;
}

export function Results({ answers, onRetry }: { answers: Array<{ correct: boolean; word: string; answer: string }>; onRetry: () => void }) {
  const score = answers.filter((a) => a.correct).length;
  const pct = answers.length > 0 ? Math.round((score / answers.length) * 100) : 0;
  const wrong = answers.filter((a) => !a.correct);
  return (
    <div className="mx-auto max-w-md py-10 text-center">
      <div className="text-7xl">{pct >= 90 ? "🏆" : pct >= 70 ? "💪" : pct >= 50 ? "👍" : "📚"}</div>
      <h1 className="mt-4 text-3xl font-bold text-ink-900">{score}/{answers.length} ({pct}%)</h1>
      {wrong.length > 0 && <div className="mt-4 space-y-2 text-left">{wrong.map((a, i) => <div key={i} className="card p-3"><span className="korean font-bold">{a.word}</span> → {a.answer}</div>)}</div>}
      <div className="mt-6 flex flex-col items-center gap-3">
        <button onClick={onRetry} className="btn-primary w-full max-w-xs">Try again</button>
        <Link href="/quiz" className="text-sm text-ink-500 font-semibold">All modes</Link>
      </div>
    </div>
  );
}
