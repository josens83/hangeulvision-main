"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { conceptImageUrl } from "@/lib/visuals";

interface Word { id: string; word: string; romanization: string; definitionEn: string; level: number; exam: string; visuals?: Array<{ kind: string; url: string }>; }

export default function VocabularyExam() {
  const { exam } = useParams<{ exam: string }>();
  const [words, setWords] = useState<Word[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ exam: exam ?? "", page: String(page), limit: String(limit) });
    if (search.trim()) qs.set("search", search.trim());
    const r = await api.get<{ words: Word[]; total: number }>(`/words?${qs}`);
    if (r.ok && r.data) { setWords(r.data.words); setTotal(r.data.total); }
    setLoading(false);
  }, [exam, page, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="py-6">
      <Link href="/vocabulary" className="text-sm font-semibold text-brand-600">← All exams</Link>
      <h1 className="mt-2 text-3xl font-bold text-ink-900">{exam?.replace(/_/g, " ")}</h1>
      <p className="text-sm text-ink-500">{total} words</p>

      <div className="mt-4">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search words…" className="inp w-full max-w-sm" />
      </div>

      {loading ? (
        <div className="mt-6 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-32 bg-gray-200" />)}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {words.map((w) => {
            const img = conceptImageUrl(w as any);
            return (
              <Link key={w.id} href={`/words/${w.id}`} className="card group block overflow-hidden transition hover:shadow-pop">
                {img ? (
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    <img src={img} alt={w.word} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-square bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center">
                    <span className="korean text-4xl font-bold text-brand-600">{w.word.charAt(0)}</span>
                  </div>
                )}
                <div className="p-3">
                  <div className="korean text-lg font-bold text-ink-900 group-hover:text-brand-600">{w.word}</div>
                  <div className="text-xs text-ink-500">{w.romanization}</div>
                  <div className="mt-1 text-sm text-ink-700 line-clamp-1">{w.definitionEn}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn-outline disabled:opacity-40">← Prev</button>
          <span className="text-sm text-ink-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn-outline disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
