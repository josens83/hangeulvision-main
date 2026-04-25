"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

type Cycle = "monthly" | "yearly";

declare global {
  interface Window {
    Paddle?: {
      Checkout: {
        open: (opts: { transactionId: string; settings?: { successUrl?: string } }) => void;
      };
      Environment: { set: (env: "sandbox" | "production") => void };
      Setup: (opts: { token: string }) => void;
    };
  }
}

export default function PricingPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  // Check if prices are configured
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    api.get<{ configured: boolean }>("/paddle/prices").then((r) => {
      if (r.ok && r.data) setConfigured(r.data.configured);
    });
  }, []);

  const subscribe = async (plan: "basic" | "premium") => {
    if (!getAuthToken()) { router.push("/signin"); return; }
    setBusy(plan);
    setError(null);

    const res = await api.post<{ transactionId: string }>("/paddle/checkout", {
      plan,
      billingCycle: cycle,
    });

    if (!res.ok || !res.data?.transactionId) {
      setError(res.error ?? "Could not create checkout.");
      setBusy(null);
      return;
    }

    if (window.Paddle) {
      window.Paddle.Checkout.open({
        transactionId: res.data.transactionId,
        settings: { successUrl: `${window.location.origin}/dashboard?subscribed=true` },
      });
    } else {
      setError("Paddle.js not loaded. Please refresh.");
    }
    setBusy(null);
  };

  const yearlyDiscount = (monthly: number) => Math.round(monthly * 12 * 0.8);

  return (
    <div className="space-y-12 py-8">
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={() => setPaddleReady(true)}
      />

      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink-900">Simple, fair pricing</h1>
        <p className="mt-2 text-ink-500">Start free. Upgrade when you're ready.</p>
        <div className="mt-6 inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-5 py-1.5 font-semibold ${
                cycle === c ? "bg-brand-500 text-white" : "text-ink-500"
              }`}
            >
              {c === "monthly" ? "Monthly" : "Yearly (save 20%)"}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="mx-auto max-w-md rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-center text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        {/* Free */}
        <div className="card p-6">
          <div className="text-sm font-semibold text-brand-600">Free</div>
          <div className="mt-1 text-4xl font-bold text-ink-900">$0</div>
          <p className="mt-2 text-sm text-ink-500">TOPIK I Level 1 · 800 words</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ AI Concept images</li>
            <li>✓ SM-2 spaced repetition</li>
            <li>✓ Hanja breakdown</li>
            <li>✓ 1 daily review session</li>
          </ul>
          <Link href={user ? "/dashboard" : "/signup"} className="btn-outline mt-5 w-full">
            {user ? "Current plan" : "Start free"}
          </Link>
        </div>

        {/* Basic */}
        <div className="card p-6">
          <div className="text-sm font-semibold text-brand-600">Basic</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-ink-900">
              ${cycle === "monthly" ? "4.99" : yearlyDiscount(4.99) / 12 + ""}
            </span>
            <span className="text-ink-500 text-sm">/mo</span>
          </div>
          {cycle === "yearly" && (
            <div className="text-xs text-brand-600">${yearlyDiscount(4.99)}/yr billed annually</div>
          )}
          <p className="mt-2 text-sm text-ink-500">TOPIK I + TOPIK II Mid + KIIP</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ All Free features</li>
            <li>✓ 2,000+ TOPIK I words</li>
            <li>✓ TOPIK II Intermediate</li>
            <li>✓ AI Mnemonic images</li>
            <li>✓ Unlimited review sessions</li>
          </ul>
          <button
            onClick={() => subscribe("basic")}
            disabled={!!busy || !configured}
            className="btn-outline mt-5 w-full disabled:opacity-50"
          >
            {busy === "basic" ? "Loading…" : configured ? "Subscribe" : "Coming soon"}
          </button>
        </div>

        {/* Premium */}
        <div className="card relative p-6 ring-2 ring-brand-500 shadow-pop">
          <span className="absolute -top-3 right-6 chip bg-brand-500 text-white">Most popular</span>
          <div className="text-sm font-semibold text-brand-600">Premium</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-ink-900">
              ${cycle === "monthly" ? "7.99" : yearlyDiscount(7.99) / 12 + ""}
            </span>
            <span className="text-ink-500 text-sm">/mo</span>
          </div>
          {cycle === "yearly" && (
            <div className="text-xs text-brand-600">${yearlyDiscount(7.99)}/yr billed annually</div>
          )}
          <p className="mt-2 text-sm text-ink-500">All 13,500+ words · every exam</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ All Basic features</li>
            <li>✓ TOPIK II Advanced (5-6급)</li>
            <li>✓ EPS-TOPIK + Theme packs</li>
            <li>✓ AI tutor + video lessons</li>
            <li>✓ Priority support</li>
          </ul>
          <button
            onClick={() => subscribe("premium")}
            disabled={!!busy || !configured}
            className="btn-primary mt-5 w-full disabled:opacity-50"
          >
            {busy === "premium" ? "Loading…" : configured ? "Subscribe" : "Coming soon"}
          </button>
        </div>
      </section>

      <section className="card p-6 text-sm text-ink-700 text-center">
        <div className="font-semibold text-ink-900">Payments powered by Paddle</div>
        <p className="mt-1 text-ink-500">
          Secure checkout · Cancel anytime · {cycle === "yearly" ? "20% annual discount" : "No commitment"}
        </p>
      </section>
    </div>
  );
}
