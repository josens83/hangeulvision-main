"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    await api.post("/auth/password/forgot", { email });
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold text-ink-900">Reset password</h1>
      {sent ? (
        <div className="card mt-6 space-y-3 p-6 text-center">
          <div className="text-4xl">📧</div>
          <h2 className="text-xl font-bold text-ink-900">Check your email</h2>
          <p className="text-sm text-ink-500">
            If an account exists for {email}, we sent a reset link. It expires in 1 hour.
          </p>
          <Link href="/signin" className="btn-outline mt-4 inline-block">Back to sign in</Link>
        </div>
      ) : (
        <div className="card mt-6 space-y-3 p-6">
          <p className="text-sm text-ink-500">Enter your email and we'll send a reset link.</p>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com" className="inp w-full" />
          <button onClick={submit} disabled={busy || !email} className="btn-primary w-full disabled:opacity-50">
            {busy ? "Sending…" : "Send reset link"}
          </button>
          <Link href="/signin" className="block text-center text-xs text-brand-600 font-semibold">
            Back to sign in
          </Link>
        </div>
      )}
    </div>
  );
}
