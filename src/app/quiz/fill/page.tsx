"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Setup, ProgressBar, Feedback, Results } from "../choice/page";

interface FillQ { wordId: string; definitionEn: string; answer: string; romanization: string; }

export default function FillQuiz() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [phase, setPhase] = useState<"setup" | "playing" | "feedback" | "results">("setup");
  const [exam, setExam] = useState("TOPIK_I");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<FillQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Array<{ correct: boolean; word: string; answer: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  const start = useCallback(async () => {
    setLoading(true);
    const r = await api.get<{ questions: FillQ[] }>(`/quiz/questions?exam=${exam}&count=${count}&type=fill`);
    setLoading(false);
    if (r.ok && r.data?.questions?.length) { setQuestions(r.data.questions); setAnswers([]); setIdx(0); setInput(""); setPhase("playing"); }
  }, [exam, count]);

  const submit = () => {
    const q = questions[idx];
    const trimmed = input.trim();
    const correct = trimmed === q.answer || trimmed.toLowerCase() === q.romanization.toLowerCase();
    setLastCorrect(correct);
    setAnswers((a) => [...a, { correct, word: q.answer, answer: q.answer }]);
    setPhase("feedback");
    setTimeout(() => {
      if (idx + 1 >= questions.length) setPhase("results");
      else { setIdx(idx + 1); setInput(""); setPhase("playing"); }
    }, 2000);
  };

  if (!user) return null;
  if (phase === "setup") return <Setup exam={exam} setExam={setExam} count={count} setCount={setCount} start={start} loading={loading} title="Fill in Blank" />;
  if (phase === "results") return <Results answers={answers} onRetry={() => { setPhase("setup"); setAnswers([]); }} />;

  const q = questions[idx];
  return (
    <div className="mx-auto max-w-md py-6">
      <ProgressBar idx={idx} total={questions.length} correct={answers.filter((a) => a.correct).length} />
      <div className="card p-8 text-center">
        <div className="text-xs text-ink-500">Type the Korean word for:</div>
        <div className="mt-3 text-2xl font-bold text-ink-900">{q.definitionEn}</div>
      </div>
      <div className="mt-4 flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && input.trim()) submit(); }} placeholder="한국어 or romanization" className="inp flex-1 text-lg korean" autoFocus />
        <button onClick={submit} disabled={!input.trim() || phase === "feedback"} className="btn-primary disabled:opacity-50">Check</button>
      </div>
      {phase === "feedback" && <Feedback correct={lastCorrect} answer={q.answer} />}
    </div>
  );
}
