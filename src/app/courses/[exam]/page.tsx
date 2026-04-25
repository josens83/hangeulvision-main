"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, getAuthToken } from "@/lib/api";

export default function CourseDetail() {
  const { exam } = useParams<{ exam: string }>();
  const [words, setWords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ words: any[]; total: number }>(`/words?exam=${exam}&limit=50`).then((r) => {
      if (r.ok && r.data) { setWords(r.data.words); setTotal(r.data.total); }
      setLoading(false);
    });
  }, [exam]);

  const levels = Array.from(new Set(words.map((w) => w.level))).sort();

  return (
    <div className="py-6">
      <Link href="/courses" className="text-sm font-semibold text-brand-600">← All courses</Link>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">{exam?.replace(/_/g, " ")}</h1>
      <p className="text-sm text-ink-500">{total} words available</p>

      <div className="mt-6 flex gap-3">
        <Link href={`/review`} className="btn-primary">Continue learning</Link>
        <Link href={`/vocabulary/${exam}`} className="btn-outline">Browse all words</Link>
      </div>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-3">{[1,2,3].map((i) => <div key={i} className="card h-16 bg-gray-200" />)}</div>
      ) : (
        <div className="mt-8 space-y-3">
          {levels.map((lv) => {
            const count = words.filter((w) => w.level === lv).length;
            return (
              <Link key={lv} href={`/vocabulary/${exam}`} className="card flex items-center justify-between p-4 transition hover:shadow-pop">
                <div>
                  <div className="font-bold text-ink-900">Level {lv}</div>
                  <div className="text-xs text-ink-500">{count} words in this set</div>
                </div>
                <span className="text-sm font-semibold text-brand-600">Study →</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
