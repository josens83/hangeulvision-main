"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getAuthToken } from "@/lib/api";

interface Notif {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);

  const loadCount = useCallback(async () => {
    if (!getAuthToken()) return;
    const res = await api.get<{ count: number }>("/notifications/unread-count");
    if (res.ok && res.data) setCount(res.data.count);
  }, []);

  useEffect(() => { loadCount(); const t = setInterval(loadCount, 30_000); return () => clearInterval(t); }, [loadCount]);

  const toggle = async () => {
    if (!open) {
      const res = await api.get<{ notifications: Notif[] }>("/notifications");
      if (res.ok && res.data) setItems(res.data.notifications);
    }
    setOpen((o) => !o);
  };

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setCount(0);
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
  };

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setCount((c) => Math.max(0, c - 1));
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  if (!getAuthToken()) return null;

  return (
    <div className="relative">
      <button onClick={toggle} className="relative rounded-full p-2 text-ink-500 hover:bg-gray-100">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2">
              <span className="text-sm font-bold text-ink-900">Notifications</span>
              {count > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-brand-600">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-8 text-center text-sm text-ink-500">No notifications</div>
              ) : (
                items.slice(0, 20).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`block w-full px-4 py-3 text-left hover:bg-gray-50 ${
                      !n.readAt ? "bg-brand-50/30" : ""
                    }`}
                  >
                    <div className="text-sm font-medium text-ink-900">{n.title}</div>
                    <div className="text-xs text-ink-500">{n.body}</div>
                    <div className="mt-0.5 text-[10px] text-ink-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
