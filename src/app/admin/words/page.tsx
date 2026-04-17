"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

interface ApiWord {
  id: string;
  word: string;
  romanization: string;
  definitionEn: string;
  exam: string;
  level: number;
  partOfSpeech: string;
  tags: string[];
  createdAt: string;
}

const EXAMS = ["", "TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV", "KIIP", "EPS_TOPIK", "THEME"];
const LIMIT = 20;

export default function AdminWordsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const key = params.get("key") ?? "";

  const [words, setWords] = useState<ApiWord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search.trim()) qs.set("search", search.trim());
    if (examFilter) qs.set("exam", examFilter);
    try {
      const res = await fetch(`${API_URL}/words?${qs}`);
      const data = await res.json();
      setWords(data.words ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setWords([]);
    }
    setLoading(false);
  }, [page, search, examFilter]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const go = (p: number) => {
    setPage(Math.max(1, Math.min(totalPages, p)));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Words ({total})</h1>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Search</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="word, romanization, definition…"
            className="inp w-64"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
          <select
            value={examFilter}
            onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
            className="inp"
          >
            <option value="">All exams</option>
            {EXAMS.filter(Boolean).map((v) => (
              <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <button onClick={load} className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Word</th>
              <th className="px-4 py-2">Romanization</th>
              <th className="px-4 py-2">Definition</th>
              <th className="px-4 py-2">POS</th>
              <th className="px-4 py-2">Exam</th>
              <th className="px-4 py-2">Lvl</th>
              <th className="px-4 py-2">Tags</th>
              <th className="px-4 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {words.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-500">
                  {loading ? "Loading…" : "No words found"}
                </td>
              </tr>
            ) : words.map((w) => (
              <tr key={w.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-ink-900">{w.word}</td>
                <td className="px-4 py-2 text-ink-500">{w.romanization}</td>
                <td className="max-w-xs truncate px-4 py-2 text-ink-700">{w.definitionEn}</td>
                <td className="px-4 py-2">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold">{w.partOfSpeech}</span>
                </td>
                <td className="px-4 py-2">
                  <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{w.exam}</span>
                </td>
                <td className="px-4 py-2 text-center">{w.level}</td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap gap-1">
                    {w.tags?.slice(0, 3).map((t) => (
                      <span key={t} className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-ink-500">{t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-xs text-ink-500 whitespace-nowrap">
                  {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-500">
          Page {page} of {totalPages} &middot; {total} total
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
          >
            &larr; Prev
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p < 1 || p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => go(p)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  p === page ? "border-brand-400 bg-brand-50 font-bold text-brand-700" : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => go(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
