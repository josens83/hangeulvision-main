"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Announcement { id: string; title: string; content: string; type: string; }

const COLORS: Record<string, string> = {
  INFO: "border-blue-200 bg-blue-50 text-blue-800",
  WARNING: "border-amber-200 bg-amber-50 text-amber-800",
  URGENT: "border-rose-200 bg-rose-50 text-rose-800",
};

export function AnnouncementBanner() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dismissed_announcements") ?? "[]");
    setDismissed(new Set(saved));
    api.get<{ announcements: Announcement[] }>("/announcements").then((r) => {
      if (r.ok && r.data) setItems(r.data.announcements);
    });
  }, []);

  const dismiss = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    localStorage.setItem("dismissed_announcements", JSON.stringify([...next]));
  };

  const visible = items.filter((a) => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <div className="space-y-2">
      {visible.map((a) => (
        <div key={a.id} className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${COLORS[a.type] ?? COLORS.INFO}`}>
          <div className="flex-1">
            <div className="font-semibold">{a.title}</div>
            <div className="mt-0.5 text-xs opacity-80">{a.content}</div>
          </div>
          <button onClick={() => dismiss(a.id)} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
}
