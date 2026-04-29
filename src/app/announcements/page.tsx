"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Ann { id: string; title: string; content: string; type: string; publishedAt: string; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ announcements: Ann[] }>("/announcements").then((r) => {
      if (r.ok && r.data) setItems(r.data.announcements);
      setLoading(false);
    });
  }, []);

  const typeColor: Record<string, string> = {
    INFO: "border-l-blue-400 bg-blue-50",
    WARNING: "border-l-amber-400 bg-amber-50",
    URGENT: "border-l-rose-400 bg-rose-50",
  };

  return (
    <div className="mx-auto max-w-3xl py-6">
      <h1 className="text-3xl font-bold text-ink-900">Announcements</h1>
      <p className="mt-1 text-sm text-ink-500">Latest updates from HangeulVision AI.</p>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-3">{[1,2].map((i) => <div key={i} className="card h-20 bg-gray-200" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📢</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No announcements</h2>
          <p className="mt-1 text-sm text-ink-500">Check back later for updates.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {items.map((a) => (
            <div key={a.id} className={`card border-l-4 p-5 ${typeColor[a.type] ?? typeColor.INFO}`}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-ink-900">{a.title}</h2>
                <span className="text-xs text-ink-500">{new Date(a.publishedAt).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm text-ink-700">{a.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
