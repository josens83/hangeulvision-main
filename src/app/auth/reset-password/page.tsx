"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-500">Loading…</div>}>
      <ResetInner />
    </Suspense>
  );
}

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (pw !== confirm) { setError("Passwords don't match."); return; }
    if (pw.length < 8) { setError("Minimum 8 characters."); return; }
    setBusy(true); setError(null);
    const res = await api.post<{ message: string }>("/auth/password/reset", { token, newPassword: pw });
    setBusy(false);
    if (res.ok) { setDone(true); setTimeout(() => router.push("/signin"), 2000); }
    else setError(res.error ?? "Reset failed.");
  };

  if (!token) return <div className="py-16 text-center text-ink-500">Invalid reset link.</div>;

  if (done) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Password reset!</h1>
        <p className="mt-2 text-sm text-ink-500">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold text-ink-900">Set new password</h1>
      <div className="card mt-6 space-y-3 p-6">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          placeholder="New password (min 8 chars)" className="inp w-full" />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password" className="inp w-full" />
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button onClick={submit} disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? "Resetting…" : "Reset password"}
        </button>
      </div>
    </div>
  );
}
