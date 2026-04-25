"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function AdminImagesPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [stats, setStats] = useState<{ total: number; withImage: number; without: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);
  const [exam, setExam] = useState("TOPIK_I");
  const [count, setCount] = useState(5);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/words/count`).then((r) => r.json()),
      fetch(`${API_URL}/words?limit=1000`).then((r) => r.json()),
    ]).then(([countData, wordData]) => {
      const total = countData.total ?? 0;
      const withImage = (wordData.words ?? []).filter((w: any) => w.visuals?.length > 0).length;
      setStats({ total, withImage, without: total - withImage });
    }).catch(() => {});
  }, []);

  const generate = async () => {
    setGenerating(true); setGenResult(null);
    try {
      const r = await fetch(`${API_URL}/internal/generate-images?key=${key}&exam=${exam}&count=${count}`);
      const data = await r.json();
      setGenResult(data);
    } catch (e) { setGenResult({ error: String(e) }); }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Image Management</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">Total words</div><div className="mt-1 text-2xl font-bold text-ink-900">{stats?.total ?? "—"}</div></div>
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">With image</div><div className="mt-1 text-2xl font-bold text-green-600">{stats?.withImage ?? "—"}</div></div>
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">Missing image</div><div className="mt-1 text-2xl font-bold text-rose-600">{stats?.without ?? "—"}</div></div>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-ink-900">Generate Images</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Exam</span>
            <select value={exam} onChange={(e) => setExam(e.target.value)} className="inp">
              {["TOPIK_I", "TOPIK_II_MID", "TOPIK_II_ADV", "KIIP", "EPS_TOPIK"].map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select></label>
          <label className="block"><span className="mb-1 block text-xs font-semibold text-ink-700">Count</span>
            <input type="number" min={1} max={20} value={count} onChange={(e) => setCount(Number(e.target.value))} className="inp w-20" /></label>
          <button onClick={generate} disabled={generating} className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50">
            {generating ? "Generating…" : `Generate ${count} images`}
          </button>
        </div>

        {genResult && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
            <div className="flex gap-4 mb-2">
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Created: {genResult.created ?? 0}</span>
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Failed: {genResult.failed ?? 0}</span>
            </div>
            {genResult.results?.map((r: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-gray-200 last:border-0">
                <span className={`text-xs font-semibold ${r.status === "created" ? "text-green-600" : "text-rose-600"}`}>{r.status}</span>
                <span className="text-ink-900">{r.word}</span>
                {r.url && <a href={r.url} target="_blank" rel="noopener" className="text-xs text-brand-600">View</a>}
                {r.reason && <span className="text-xs text-ink-500">{r.reason}</span>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
