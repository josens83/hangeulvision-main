"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

interface WordCount {
  total: number;
  primary: Record<string, number>;
  secondary: Record<string, number>;
}

interface GenerateResult {
  created: number;
  skipped: number;
  errors: Array<{ word?: string; error: string }>;
  words: Array<{ id: string; word: string; partOfSpeech: string }>;
  log?: Array<{ word: string; status: string; reason?: string }>;
}

interface RecentWord {
  id: string;
  word: string;
  romanization: string;
  definitionEn: string;
  exam: string;
  level: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";

  const [counts, setCounts] = useState<WordCount | null>(null);
  const [recent, setRecent] = useState<RecentWord[]>([]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<GenerateResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [genExam, setGenExam] = useState("TOPIK_I");
  const [genLevel, setGenLevel] = useState("1");
  const [genCount, setGenCount] = useState("10");
  const [genCategory, setGenCategory] = useState("");

  const load = useCallback(() => {
    fetch(`${API_URL}/words/count`)
      .then((r) => r.json())
      .then(setCounts)
      .catch(() => {});
    fetch(`${API_URL}/words?limit=5`)
      .then((r) => r.json())
      .then((d) => setRecent(d.words ?? []))
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const generate = async () => {
    setGenerating(true);
    setGenResult(null);
    setGenError(null);
    try {
      const qs = new URLSearchParams({
        key,
        exam: genExam,
        level: genLevel,
        count: genCount,
      });
      if (genCategory) qs.set("category", genCategory);
      const res = await fetch(`${API_URL}/internal/generate-words?${qs}`);
      const data = await res.json();
      if (res.ok) {
        setGenResult(data);
        load();
      } else {
        setGenError(data.message ?? data.error ?? `HTTP ${res.status}`);
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Network error");
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>

      {/* ─── Word counts ──────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Total words" value={counts?.total ?? "—"} />
        {counts?.primary &&
          Object.entries(counts.primary).map(([exam, n]) => (
            <Stat key={exam} label={exam.replace(/_/g, " ")} value={n} />
          ))}
      </section>

      {/* ─── Generate ─────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-ink-900">Generate words (Claude pipeline)</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Exam">
            <select value={genExam} onChange={(e) => setGenExam(e.target.value)} className="inp">
              {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV", "KIIP", "EPS_TOPIK"].map((v) => (
                <option key={v} value={v}>{v.replace(/_/g, " ")}</option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select value={genLevel} onChange={(e) => setGenLevel(e.target.value)} className="inp">
              {[1, 2, 3, 4, 5, 6].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Count">
            <input type="number" min={1} max={20} value={genCount} onChange={(e) => setGenCount(e.target.value)} className="inp w-20" />
          </Field>
          <Field label="Category (opt)">
            <input value={genCategory} onChange={(e) => setGenCategory(e.target.value)} placeholder="food, daily, …" className="inp w-32" />
          </Field>
          <button onClick={generate} disabled={generating} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {generating ? "Generating…" : `Generate ${genCount} words`}
          </button>
        </div>

        {genError && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
        )}
        {genResult && (
          <div className="mt-4 space-y-3">
            <div className="flex gap-4 text-sm">
              <Badge color="green">Created: {genResult.created}</Badge>
              <Badge color="amber">Skipped: {genResult.skipped}</Badge>
              <Badge color="rose">Errors: {genResult.errors.length}</Badge>
            </div>
            {genResult.log && genResult.log.length > 0 && (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-ink-500">
                    <th className="py-1 pr-4">Word</th>
                    <th className="py-1 pr-4">Status</th>
                    <th className="py-1">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {genResult.log.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-1 pr-4 font-medium text-ink-900">{r.word}</td>
                      <td className="py-1 pr-4">
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.status === "created" ? "bg-green-100 text-green-700" :
                          r.status === "skipped" ? "bg-amber-100 text-amber-700" :
                          "bg-rose-100 text-rose-700"
                        }`}>{r.status}</span>
                      </td>
                      <td className="py-1 text-ink-500">{r.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>

      {/* ─── Recent words ─────────────────────────── */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-ink-900">Recent words</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50 text-left text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-2">Word</th>
                <th className="px-4 py-2">Romanization</th>
                <th className="px-4 py-2">Definition</th>
                <th className="px-4 py-2">Exam</th>
                <th className="px-4 py-2">Lvl</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-ink-500">No words yet</td></tr>
              ) : recent.map((w) => (
                <tr key={w.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{w.word}</td>
                  <td className="px-4 py-2 text-ink-500">{w.romanization}</td>
                  <td className="px-4 py-2 text-ink-700">{w.definitionEn}</td>
                  <td className="px-4 py-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{w.exam}</span></td>
                  <td className="px-4 py-2">{w.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink-900">{String(value)}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-700">{label}</span>
      {children}
    </label>
  );
}

function Badge({ color, children }: { color: "green" | "amber" | "rose"; children: React.ReactNode }) {
  const cls = color === "green" ? "bg-green-100 text-green-700" : color === "amber" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
}
