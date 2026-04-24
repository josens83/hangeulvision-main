"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useDailyGoal } from "@/lib/useGoals";

export default function SettingsPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const hydrate = useStore((s) => s.hydrate);

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const { goal, updateGoal } = useDailyGoal();

  useEffect(() => {
    if (!user) router.replace("/signin");
    else setName(user.name);
  }, [user, router]);

  if (!user) return null;

  const saveName = async () => {
    if (!name.trim() || name === user.name) return;
    setSaving(true);
    setMsg(null);
    const res = await api.put<{ user: { name: string } }>("/user/me", { name: name.trim() });
    setSaving(false);
    if (res.ok) {
      setMsg("Name updated.");
      void hydrate();
    } else {
      setMsg(res.error ?? "Failed to update.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <h1 className="text-3xl font-bold text-ink-900">Settings</h1>

      {/* ─── Profile ──────────────────── */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">Profile</h2>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Display name</span>
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="inp flex-1"
            />
            <button
              onClick={saveName}
              disabled={saving || name === user.name}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </label>
        <div>
          <span className="text-xs font-semibold text-ink-700">Email</span>
          <div className="mt-1 text-sm text-ink-500">{user.email}</div>
        </div>
        {msg && <div className="text-sm text-brand-600">{msg}</div>}
      </section>

      {/* ─── Learning ─────────────────── */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">Learning</h2>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Daily goal (cards per day)</span>
          <select
            value={goal?.dailyGoal ?? 20}
            onChange={(e) => updateGoal(Number(e.target.value))}
            className="inp"
          >
            {[5, 10, 15, 20, 30, 50].map((n) => (
              <option key={n} value={n}>{n} cards</option>
            ))}
          </select>
        </label>
      </section>

      {/* ─── App ──────────────────────── */}
      <section className="card space-y-4 p-6">
        <h2 className="text-lg font-bold text-ink-900">App</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-900">Dark mode</div>
            <div className="text-xs text-ink-500">Coming soon</div>
          </div>
          <div className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-semibold text-ink-500">
            Soon
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink-900">Language</div>
            <div className="text-xs text-ink-500">Interface language</div>
          </div>
          <div className="rounded-full bg-gray-200 px-4 py-1.5 text-xs font-semibold text-ink-500">
            English
          </div>
        </div>
      </section>
    </div>
  );
}
