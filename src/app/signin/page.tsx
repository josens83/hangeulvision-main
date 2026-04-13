"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function SignInPage() {
  const router = useRouter();
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to continue your streak.</p>
      <form
        className="card mt-6 space-y-3 p-6"
        onSubmit={(e) => {
          e.preventDefault();
          const res = signIn(email, password);
          if (!res.ok) setError(res.error ?? "Could not sign in");
          else router.push("/dashboard");
        }}
      >
        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Email</span>
          <input className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Password</span>
          <input className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <div className="text-sm text-rose-600">{error}</div> : null}
        <button className="btn-primary w-full" type="submit">
          Sign in
        </button>
        <div className="text-center text-xs text-ink-500">
          New here?{" "}
          <Link href="/signup" className="text-brand-600 font-semibold">
            Create an account
          </Link>
        </div>
      </form>
    </div>
  );
}
