"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { GoogleSignInButton, OrDivider } from "@/components/GoogleSignInButton";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-500">Loading…</div>}>
      <SignInInner />
    </Suspense>
  );
}

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const signIn = useStore((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("expired") === "true") {
      setNotice("Your session expired. Please sign in again.");
    }
  }, [params]);

  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="text-3xl font-bold text-ink-900">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-500">Sign in to continue your streak.</p>
      {notice ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {notice}
        </div>
      ) : null}
      <div className="card mt-6 space-y-3 p-6">
        <GoogleSignInButton label="Sign in with Google" />
        <OrDivider />
      </div>
      <form
        className="card space-y-3 p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting) return;
          setSubmitting(true);
          setError(null);
          const res = await signIn(email, password);
          setSubmitting(false);
          if (!res.ok) setError(res.error ?? "Could not sign in");
          else router.push("/dashboard");
        }}
      >
        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Email</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-700">Password</span>
          <input
            className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <div className="text-sm text-rose-600">{error}</div> : null}
        <div className="text-right">
          <Link href="/auth/forgot-password" className="text-xs text-brand-600 font-semibold">
            Forgot password?
          </Link>
        </div>
        <button className="btn-primary w-full" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
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
