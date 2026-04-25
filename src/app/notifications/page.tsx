"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

interface Notif { id: string; title: string; body: string; readAt: string | null; createdAt: string; }

export default function NotificationsPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  useEffect(() => {
    if (!getAuthToken()) return;
    api.get<{ notifications: Notif[] }>("/notifications").then((r) => {
      if (r.ok && r.data) setItems(r.data.notifications);
      setLoading(false);
    });
  }, []);

  const markAllRead = async () => {
    await api.put("/notifications/read-all");
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const markRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  };

  if (!user) return null;
  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Notifications</h1>
          <p className="text-sm text-ink-500">{unread} unread</p>
        </div>
        {unread > 0 && <button onClick={markAllRead} className="btn-outline">Mark all read</button>}
      </div>

      {loading ? (
        <div className="mt-6 animate-pulse space-y-3">{[1,2,3].map((i) => <div key={i} className="card h-16 bg-gray-200" />)}</div>
      ) : items.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">🔔</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No notifications yet</h2>
          <p className="mt-1 text-sm text-ink-500">You'll see achievement unlocks, streak milestones, and more here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {items.map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={`card w-full p-4 text-left transition ${!n.readAt ? "border-l-4 border-l-brand-400 bg-brand-50/20" : ""}`}>
              <div className="flex items-start gap-3">
                {!n.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink-900">{n.title}</div>
                  <div className="text-xs text-ink-500">{n.body}</div>
                  <div className="mt-1 text-[10px] text-ink-400">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
