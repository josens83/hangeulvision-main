"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";

const CATEGORIES = ["Bug", "Feature", "Account", "Billing", "Other"] as const;

export default function ContactPage() {
  const user = useStore((s) => s.currentUser());
  const [form, setForm] = useState({
    email: user?.email ?? "",
    name: user?.name ?? "",
    category: "Bug" as string,
    subject: "",
    message: "",
  });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true); setError(null);
    const res = await api.post("/support/ticket", form);
    setBusy(false);
    if (res.ok) setSent(true);
    else setError(res.error ?? "Failed to send.");
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="text-5xl">📬</div>
        <h1 className="mt-4 text-2xl font-bold text-ink-900">Message sent!</h1>
        <p className="mt-2 text-sm text-ink-500">We'll get back to you within 24 hours.</p>
        <Link href="/" className="btn-primary mt-6 inline-block">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <h1 className="text-3xl font-bold text-ink-900">Contact us</h1>
      <p className="mt-1 text-sm text-ink-500">Have a question or found a bug? Let us know.</p>
      <div className="card mt-6 space-y-4 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-700">Email</span>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="inp w-full" required />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-700">Name</span>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="inp w-full" />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Category</span>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="inp w-full">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Subject</span>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="inp w-full" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-ink-700">Message</span>
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="inp w-full" rows={5} required />
        </label>
        {error && <div className="text-sm text-rose-600">{error}</div>}
        <button onClick={submit} disabled={busy || !form.email || !form.subject || !form.message}
          className="btn-primary w-full disabled:opacity-50">
          {busy ? "Sending…" : "Send message"}
        </button>
      </div>
      <p className="mt-4 text-center text-xs text-ink-500">
        Check our <Link href="/cs" className="font-semibold text-brand-600">FAQ</Link> first — your answer might be there.
      </p>
    </div>
  );
}
