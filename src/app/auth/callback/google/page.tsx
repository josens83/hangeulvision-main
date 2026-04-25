"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthTokens } from "@/lib/api";
import { useStore } from "@/lib/store";

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<Loading />}>
      <GoogleCallbackInner />
    </Suspense>
  );
}

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const hydrate = useStore((s) => s.hydrate);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");
    const err = params.get("error");

    if (err) {
      setError(err);
      setTimeout(() => router.replace(`/signin?error=${err}`), 2000);
      return;
    }

    if (token) {
      setAuthTokens(token, refreshToken);
      void hydrate().then(() => router.replace("/dashboard"));
    } else {
      setError("no_token");
      setTimeout(() => router.replace("/signin?error=google_failed"), 2000);
    }
  }, [params, router, hydrate]);

  if (error) {
    return (
      <div className="py-16 text-center">
        <div className="text-5xl">😕</div>
        <h1 className="mt-4 text-xl font-bold text-ink-900">Google sign-in failed</h1>
        <p className="mt-2 text-sm text-ink-500">Error: {error}. Redirecting…</p>
      </div>
    );
  }

  return <Loading />;
}

function Loading() {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl animate-pulse">🔄</div>
      <h1 className="mt-4 text-xl font-bold text-ink-900">Signing you in…</h1>
      <p className="mt-2 text-sm text-ink-500">Completing Google authentication.</p>
    </div>
  );
}
