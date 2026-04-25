"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface ExamCount { [key: string]: number; }

const EXAMS = [
  { id: "TOPIK_I", name: "TOPIK I", sub: "Beginner · Level 1-2", emoji: "🌱", color: "from-sky-400 to-brand-500" },
  { id: "TOPIK_II_MID", name: "TOPIK II Mid", sub: "Intermediate · Level 3-4", emoji: "🌿", color: "from-indigo-400 to-purple-500" },
  { id: "TOPIK_II_ADV", name: "TOPIK II Adv", sub: "Advanced · Level 5-6", emoji: "🌳", color: "from-rose-400 to-pink-500" },
  { id: "EPS_TOPIK", name: "EPS-TOPIK", sub: "Employment Permit", emoji: "🛠️", color: "from-emerald-400 to-teal-500" },
  { id: "KIIP", name: "KIIP", sub: "Immigration & Integration", emoji: "🏛️", color: "from-amber-400 to-orange-500" },
];

export default function VocabularyIndex() {
  const [counts, setCounts] = useState<ExamCount>({});

  useEffect(() => {
    api.get<{ total: number; primary: ExamCount }>("/words/count").then((r) => {
      if (r.ok && r.data) setCounts(r.data.primary);
    });
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Vocabulary</h1>
      <p className="mt-1 text-sm text-ink-500">Browse words by exam category.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EXAMS.map((e) => (
          <Link key={e.id} href={`/vocabulary/${e.id}`} className="card group block p-6 transition hover:shadow-pop">
            <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${e.color}`}>{e.emoji}</div>
            <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-600">{e.name}</h2>
            <p className="text-sm text-ink-500">{e.sub}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-500">{counts[e.id]?.toLocaleString() ?? "—"} words</span>
              <span className="text-sm font-semibold text-brand-600">Browse →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
