"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function SignUpPage() {
  const router = useRouter();
  const signUp = useStore((s) => s.signUp);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold text-ink-900">Create your free account</h1>
      <p className="mt-1 text-sm text-ink-500">800 TOPIK I words — no card, no catch.</p>
      <form
        className="card mt-6 space-y-3 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          setError(null);
          const res = await signUp(form.email, form.name, form.password);
          setSubmitting(false);
          if (!res.ok) setError(res.error ?? "Could not sign up");
          else router.push("/dashboard");
        }}
      >
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        {error ? <div className="text-sm text-rose-600">{error}</div> : null}
        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
        <div className="text-center text-xs text-ink-500">
          Already have an account?{" "}
          <Link href="/signin" className="text-brand-600 font-semibold">
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-ink-700">{label}</span>
      <input
        className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </label>
  );
}
