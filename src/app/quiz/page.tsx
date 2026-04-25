"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface Question {
  wordId: string;
  word: string;
  options: string[];
  correctIndex: number;
}

interface AnswerRecord {
  wordId: string;
  selectedIndex: number;
  correct: boolean;
  word: string;
  correctAnswer: string;
}

type Phase = "setup" | "playing" | "feedback" | "results";

export default function QuizPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());

  const [phase, setPhase] = useState<Phase>("setup");
  const [exam, setExam] = useState("TOPIK_I");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<{ questions: Question[] }>(
      `/quiz/questions?exam=${exam}&count=${count}&type=multiple_choice`,
    );
    setLoading(false);
    if (res.ok && res.data?.questions?.length) {
      setQuestions(res.data.questions);
      setAnswers([]);
      setIdx(0);
      setSelected(null);
      setPhase("playing");
    } else {
      setError(res.error ?? "Could not load questions.");
    }
  }, [exam, count]);

  const selectAnswer = useCallback(
    (optIdx: number) => {
      if (selected !== null) return; // already answered
      const q = questions[idx];
      const correct = optIdx === q.correctIndex;
      setSelected(optIdx);
      setAnswers((a) => [
        ...a,
        {
          wordId: q.wordId,
          selectedIndex: optIdx,
          correct,
          word: q.word,
          correctAnswer: q.options[q.correctIndex],
        },
      ]);
      setPhase("feedback");

      // Auto-advance after 1.5s
      setTimeout(() => {
        if (idx + 1 >= questions.length) {
          setPhase("results");
          // Submit to server
          api.post("/quiz/submit", {
            answers: [
              ...answers,
              { wordId: q.wordId, selectedIndex: optIdx, correct },
            ].map((a) => ({
              wordId: a.wordId,
              selectedIndex: a.selectedIndex,
              correct: a.correct,
            })),
            exam,
            type: "multiple_choice",
          });
        } else {
          setIdx(idx + 1);
          setSelected(null);
          setPhase("playing");
        }
      }, 1500);
    },
    [selected, questions, idx, answers, exam],
  );

  if (!user) return null;

  // ─── Setup ──────────────────────────
  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-6xl">🧠</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">Quiz Mode</h1>
        <p className="mt-2 text-ink-500">
          Test your Korean vocabulary with multiple choice questions.
        </p>
        <div className="card mx-auto mt-8 max-w-sm space-y-4 p-6 text-left">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="inp w-full">
              {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV", "KIIP", "EPS_TOPIK"].map((v) => (
                <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-700">Questions</span>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="inp w-full">
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </label>
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <button onClick={startQuiz} disabled={loading} className="btn-primary w-full">
            {loading ? "Loading…" : "Start Quiz"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Results ────────────────────────
  if (phase === "results") {
    const score = answers.filter((a) => a.correct).length;
    const total = answers.length;
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const wrong = answers.filter((a) => !a.correct);

    const rating =
      pct >= 90 ? { emoji: "🏆", text: "Outstanding!" } :
      pct >= 70 ? { emoji: "💪", text: "Great job!" } :
      pct >= 50 ? { emoji: "👍", text: "Good effort!" } :
                  { emoji: "📚", text: "Keep practicing!" };

    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-7xl">{rating.emoji}</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">{rating.text}</h1>
        <p className="mt-2 text-ink-500">
          You scored <span className="font-bold text-ink-900">{score}/{total}</span> ({pct}%)
        </p>
        <div className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-3">
          <div className="rounded-2xl border border-green-200 bg-green-50 p-3">
            <div className="text-2xl font-bold text-green-600">{score}</div>
            <div className="text-xs text-green-700">Correct</div>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3">
            <div className="text-2xl font-bold text-rose-600">{total - score}</div>
            <div className="text-xs text-rose-700">Wrong</div>
          </div>
        </div>

        {wrong.length > 0 && (
          <div className="mt-6 text-left">
            <h2 className="mb-2 text-sm font-bold text-ink-900">Review mistakes</h2>
            <div className="space-y-2">
              {wrong.map((a) => (
                <div key={a.wordId} className="card p-3">
                  <div className="korean text-lg font-bold text-ink-900">{a.word}</div>
                  <div className="text-xs text-ink-500">Correct: {a.correctAnswer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          <button onClick={() => { setPhase("setup"); setAnswers([]); }} className="btn-primary w-full max-w-xs">
            Try again
          </button>
          <Link href="/dashboard" className="text-sm font-semibold text-ink-500 hover:text-ink-900">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ─── Playing / Feedback ─────────────
  const q = questions[idx];
  const progress = Math.round((idx / questions.length) * 100);

  return (
    <div className="mx-auto max-w-md py-6">
      {/* Progress */}
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink-900">Question {idx + 1} / {questions.length}</span>
        <span className="text-ink-500">
          {answers.filter((a) => a.correct).length} correct
        </span>
      </div>
      <div className="mb-6 h-2 overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Word */}
      <div className="card p-8 text-center">
        <div className="text-xs text-ink-500">What does this word mean?</div>
        <div className="korean mt-3 text-5xl font-bold text-ink-900">{q.word}</div>
      </div>

      {/* Options */}
      <div className="mt-4 grid gap-2">
        {q.options.map((opt, i) => {
          let cls = "card p-4 text-left text-sm font-medium transition cursor-pointer hover:shadow-pop ";
          if (selected !== null) {
            if (i === q.correctIndex) {
              cls += "border-green-500 bg-green-50 text-green-700";
            } else if (i === selected) {
              cls += "border-rose-500 bg-rose-50 text-rose-700";
            } else {
              cls += "opacity-50";
            }
          } else {
            cls += "text-ink-900 hover:border-brand-300";
          }
          return (
            <button
              key={i}
              onClick={() => selectAnswer(i)}
              disabled={selected !== null}
              className={cls}
            >
              <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-ink-700">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {phase === "feedback" && selected !== null && (
        <div className={`mt-4 rounded-xl p-3 text-center text-sm font-semibold ${
          selected === q.correctIndex
            ? "bg-green-50 text-green-700"
            : "bg-rose-50 text-rose-700"
        }`}>
          {selected === q.correctIndex ? "✓ Correct!" : `✗ The answer was: ${q.options[q.correctIndex]}`}
        </div>
      )}
    </div>
  );
}
