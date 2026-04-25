"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";

const COURSES = [
  { exam: "TOPIK_I", name: "TOPIK I", sub: "Beginner · Level 1-2", emoji: "🌱", color: "from-sky-400 to-brand-500", target: 2000 },
  { exam: "TOPIK_II_MID", name: "TOPIK II Intermediate", sub: "Level 3-4", emoji: "🌿", color: "from-indigo-400 to-purple-500", target: 3000 },
  { exam: "TOPIK_II_ADV", name: "TOPIK II Advanced", sub: "Level 5-6", emoji: "🌳", color: "from-rose-400 to-pink-500", target: 4000 },
  { exam: "EPS_TOPIK", name: "EPS-TOPIK", sub: "Employment Permit", emoji: "🛠️", color: "from-emerald-400 to-teal-500", target: 1000 },
  { exam: "KIIP", name: "KIIP", sub: "Immigration & Integration", emoji: "🏛️", color: "from-amber-400 to-orange-500", target: 1500 },
];

export default function CoursesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    api.get<{ primary: Record<string, number> }>("/words/count").then((r) => {
      if (r.ok && r.data) setCounts(r.data.primary);
    });
    if (getAuthToken()) {
      api.get<{ progress: Array<{ word: { exam: string } }> }>("/progress").then((r) => {
        if (r.ok && r.data) {
          const map: Record<string, number> = {};
          r.data.progress.forEach((p: any) => { const e = p.word?.exam; if (e) map[e] = (map[e] ?? 0) + 1; });
          setProgress(map);
        }
      });
    }
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Courses</h1>
      <p className="mt-1 text-sm text-ink-500">Structured learning paths aligned to official exam syllabi.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COURSES.map((c) => {
          const total = counts[c.exam] ?? 0;
          const seen = progress[c.exam] ?? 0;
          const pct = total > 0 ? Math.round((seen / total) * 100) : 0;
          return (
            <Link key={c.exam} href={`/courses/${c.exam}`} className="card group block p-6 transition hover:shadow-pop">
              <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-2xl ${c.color}`}>{c.emoji}</div>
              <h2 className="text-lg font-bold text-ink-900 group-hover:text-brand-600">{c.name}</h2>
              <p className="text-sm text-ink-500">{c.sub}</p>
              <div className="mt-3 text-xs text-ink-500">{total} words · {c.target.toLocaleString()} target</div>
              {seen > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-[10px] text-ink-500"><span>{seen} studied</span><span>{pct}%</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200"><div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                </div>
              )}
              <div className="mt-3 text-sm font-semibold text-brand-600">Start course →</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
