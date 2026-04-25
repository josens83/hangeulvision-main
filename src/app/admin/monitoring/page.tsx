"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

interface Health { uptime: number; memory: { rss: number; heap: number; heapTotal: number }; database: string; nodeVersion: string; env: string; }

export default function AdminMonitoringPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [health, setHealth] = useState<Health | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = () => {
    fetch(`${API_URL}/admin/monitoring/health`, { headers: { Authorization: `Bearer ${key}`, "X-Internal-Key": key } })
      .then((r) => r.json()).then(setHealth).catch(() => {});
  };

  useEffect(() => { load(); const t = setInterval(load, 10_000); return () => clearInterval(t); }, [key]);

  const clearCache = async () => {
    setClearing(true);
    await fetch(`${API_URL}/admin/cache/clear`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "X-Internal-Key": key } });
    setClearing(false);
  };

  const upMins = health ? Math.floor(health.uptime / 60) : 0;
  const upHrs = Math.floor(upMins / 60);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">System Monitoring</h1>

      {!health ? (
        <div className="text-ink-500 animate-pulse">Connecting…</div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Tile label="Uptime" value={upHrs > 0 ? `${upHrs}h ${upMins % 60}m` : `${upMins}m`} />
            <Tile label="Database" value={health.database} color={health.database === "connected" ? "text-green-600" : "text-rose-600"} />
            <Tile label="Memory (RSS)" value={`${health.memory.rss} MB`} />
            <Tile label="Heap" value={`${health.memory.heap} / ${health.memory.heapTotal} MB`} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs text-ink-500">Node.js</div>
              <div className="mt-1 font-mono text-sm text-ink-900">{health.nodeVersion}</div>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="text-xs text-ink-500">Environment</div>
              <div className="mt-1 text-sm font-semibold text-ink-900">{health.env}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={load} className="btn-outline">Refresh</button>
            <button onClick={clearCache} disabled={clearing} className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50">
              {clearing ? "Clearing…" : "Clear cache"}
            </button>
          </div>

          <p className="text-xs text-ink-500">Auto-refreshes every 10 seconds.</p>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, color }: { label: string; value: string; color?: string }) {
  return <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">{label}</div><div className={`mt-1 text-xl font-bold ${color ?? "text-ink-900"}`}>{value}</div></div>;
}
