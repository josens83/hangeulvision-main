"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, clearAuthTokens } from "@/lib/api";

export default function AccountPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-6">
      <h1 className="text-3xl font-bold text-ink-900">Account</h1>
      <PasswordSection />
      <DeleteSection />
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (next !== confirm) { setMsg({ ok: false, text: "Passwords don't match." }); return; }
    if (next.length < 8) { setMsg({ ok: false, text: "Minimum 8 characters." }); return; }
    setBusy(true);
    setMsg(null);
    const res = await api.put<{ message: string }>("/user/password", {
      currentPassword: current,
      newPassword: next,
    });
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Password changed." });
      setCurrent(""); setNext(""); setConfirm("");
    } else {
      setMsg({ ok: false, text: res.error ?? "Failed." });
    }
  };

  return (
    <section className="card space-y-4 p-6">
      <h2 className="text-lg font-bold text-ink-900">Change password</h2>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink-700">Current password</span>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="inp w-full" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink-700">New password</span>
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="inp w-full" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-ink-700">Confirm new password</span>
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="inp w-full" />
      </label>
      {msg && <div className={`text-sm ${msg.ok ? "text-brand-600" : "text-rose-600"}`}>{msg.text}</div>}
      <button onClick={submit} disabled={busy || !current || !next} className="btn-primary disabled:opacity-50">
        {busy ? "Updating…" : "Update password"}
      </button>
    </section>
  );
}

function DeleteSection() {
  const router = useRouter();
  const signOut = useStore((s) => s.signOut);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    if (!password) return;
    setBusy(true);
    setError(null);
    const res = await api.delete<{ message: string }>("/user/account", {
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
    });
    setBusy(false);
    if (res.ok) {
      clearAuthTokens();
      signOut();
      router.replace("/");
    } else {
      setError(res.error ?? "Failed to delete.");
    }
  };

  return (
    <section className="card border-rose-200 p-6">
      <h2 className="text-lg font-bold text-rose-600">Danger zone</h2>
      <p className="mt-1 text-sm text-ink-500">
        Permanently delete your account and all associated data (progress, bookmarks, sessions).
        This action cannot be undone.
      </p>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100">
          Delete my account
        </button>
      ) : (
        <div className="mt-4 space-y-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-semibold text-rose-700">
            Are you sure? Enter your password to confirm.
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className="inp w-full"
          />
          {error && <div className="text-sm text-rose-600">{error}</div>}
          <div className="flex gap-2">
            <button
              onClick={doDelete}
              disabled={busy || !password}
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Yes, delete everything"}
            </button>
            <button onClick={() => { setOpen(false); setPassword(""); setError(null); }} className="btn-ghost">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
