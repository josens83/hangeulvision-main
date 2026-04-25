"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

interface Pair { wordId: string; word: string; definitionEn: string; }

export default function MatchQuiz() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [phase, setPhase] = useState<"setup" | "playing" | "done">("setup");
  const [exam, setExam] = useState("TOPIK_I");
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<Array<{ wordId: string; definitionEn: string }>>([]);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  const start = useCallback(async () => {
    setLoading(true);
    const r = await api.get<{ pairs: Pair[]; shuffledDefinitions: Array<{ wordId: string; definitionEn: string }> }>(`/quiz/questions?exam=${exam}&count=5&type=match`);
    setLoading(false);
    if (r.ok && r.data) { setPairs(r.data.pairs); setShuffledDefs(r.data.shuffledDefinitions); setMatched(new Set()); setSelectedWord(null); setPhase("playing"); }
  }, [exam]);

  const clickWord = (wordId: string) => {
    if (matched.has(wordId)) return;
    setSelectedWord(wordId);
    setWrong(null);
  };

  const clickDef = (defWordId: string) => {
    if (!selectedWord || matched.has(defWordId)) return;
    if (selectedWord === defWordId) {
      const next = new Set(matched);
      next.add(defWordId);
      setMatched(next);
      setSelectedWord(null);
      if (next.size === pairs.length) setTimeout(() => setPhase("done"), 500);
    } else {
      setWrong(defWordId);
      setTimeout(() => { setWrong(null); setSelectedWord(null); }, 800);
    }
  };

  if (!user) return null;

  if (phase === "setup") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <h1 className="text-2xl font-bold text-ink-900">Match Pairs</h1>
        <p className="mt-2 text-ink-500">Connect Korean words with their English meanings.</p>
        <div className="card mx-auto mt-6 max-w-sm space-y-4 p-6 text-left">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="inp w-full">
              {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV"].map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select></label>
          <button onClick={start} disabled={loading} className="btn-primary w-full">{loading ? "Loading…" : "Start"}</button>
        </div>
        <Link href="/quiz" className="mt-4 inline-block text-sm text-brand-600 font-semibold">← All modes</Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <div className="text-7xl">🎉</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">All matched!</h1>
        <p className="mt-2 text-ink-500">{pairs.length} pairs completed.</p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button onClick={() => setPhase("setup")} className="btn-primary w-full max-w-xs">Play again</button>
          <Link href="/quiz" className="text-sm text-ink-500 font-semibold">All modes</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="mb-4 text-xl font-bold text-ink-900">Match: {matched.size}/{pairs.length}</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {pairs.map((p) => (
            <button key={p.wordId} onClick={() => clickWord(p.wordId)} disabled={matched.has(p.wordId)}
              className={`card w-full p-3 text-left korean text-lg font-bold transition ${matched.has(p.wordId) ? "border-green-400 bg-green-50 opacity-60" : selectedWord === p.wordId ? "border-brand-500 bg-brand-50 ring-2 ring-brand-300" : "text-ink-900 hover:border-brand-300"}`}>
              {p.word}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {shuffledDefs.map((d) => (
            <button key={d.wordId} onClick={() => clickDef(d.wordId)} disabled={matched.has(d.wordId)}
              className={`card w-full p-3 text-left text-sm transition ${matched.has(d.wordId) ? "border-green-400 bg-green-50 opacity-60" : wrong === d.wordId ? "border-rose-500 bg-rose-50" : "text-ink-700 hover:border-brand-300"}`}>
              {d.definitionEn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
