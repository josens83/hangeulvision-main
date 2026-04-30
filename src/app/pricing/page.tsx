"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("pricing");

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
        <h1 className="text-4xl font-bold tracking-tight text-ink-900">{t("title")}</h1>
        <p className="mt-2 text-ink-500">{t("subtitle")}</p>
        <div className="mt-6 inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          {(["monthly", "yearly"] as Cycle[]).map((c) => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              className={`rounded-full px-5 py-1.5 font-semibold ${
                cycle === c ? "bg-brand-500 text-white" : "text-ink-500"
              }`}
            >
              {c === "monthly" ? t("monthly") : t("yearly")}
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
          <div className="text-sm font-semibold text-brand-600">{t("free")}</div>
          <div className="mt-1 text-4xl font-bold text-ink-900">$0</div>
          <p className="mt-2 text-sm text-ink-500">{t("freeDescription")}</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ {t("freeFeature1")}</li>
            <li>✓ {t("freeFeature2")}</li>
            <li>✓ {t("freeFeature3")}</li>
            <li>✓ {t("freeFeature4")}</li>
          </ul>
          <Link href={user ? "/dashboard" : "/signup"} className="btn-outline mt-5 w-full">
            {user ? t("currentPlan") : t("startFree")}
          </Link>
        </div>

        {/* Basic */}
        <div className="card p-6">
          <div className="text-sm font-semibold text-brand-600">{t("basic")}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-ink-900">
              ${cycle === "monthly" ? "4.99" : yearlyDiscount(4.99) / 12 + ""}
            </span>
            <span className="text-ink-500 text-sm">{t("perMonth")}</span>
          </div>
          {cycle === "yearly" && (
            <div className="text-xs text-brand-600">{t("billedAnnually", { price: "$" + yearlyDiscount(4.99) })}</div>
          )}
          <p className="mt-2 text-sm text-ink-500">{t("basicDescription")}</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ {t("basicFeature1")}</li>
            <li>✓ {t("basicFeature2")}</li>
            <li>✓ {t("basicFeature3")}</li>
            <li>✓ {t("basicFeature4")}</li>
            <li>✓ {t("basicFeature5")}</li>
          </ul>
          <button
            onClick={() => subscribe("basic")}
            disabled={!!busy || !configured}
            className="btn-outline mt-5 w-full disabled:opacity-50"
          >
            {busy === "basic" ? t("loading") : configured ? t("subscribe") : t("comingSoon")}
          </button>
        </div>

        {/* Premium */}
        <div className="card relative p-6 ring-2 ring-brand-500 shadow-pop">
          <span className="absolute -top-3 right-6 chip bg-brand-500 text-white">{t("mostPopular")}</span>
          <div className="text-sm font-semibold text-brand-600">{t("premium")}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-ink-900">
              ${cycle === "monthly" ? "7.99" : yearlyDiscount(7.99) / 12 + ""}
            </span>
            <span className="text-ink-500 text-sm">{t("perMonth")}</span>
          </div>
          {cycle === "yearly" && (
            <div className="text-xs text-brand-600">{t("billedAnnually", { price: "$" + yearlyDiscount(7.99) })}</div>
          )}
          <p className="mt-2 text-sm text-ink-500">{t("premiumDescription")}</p>
          <ul className="mt-4 space-y-2 text-sm text-ink-700">
            <li>✓ {t("premiumFeature1")}</li>
            <li>✓ {t("premiumFeature2")}</li>
            <li>✓ {t("premiumFeature3")}</li>
            <li>✓ {t("premiumFeature4")}</li>
            <li>✓ {t("premiumFeature5")}</li>
          </ul>
          <button
            onClick={() => subscribe("premium")}
            disabled={!!busy || !configured}
            className="btn-primary mt-5 w-full disabled:opacity-50"
          >
            {busy === "premium" ? t("loading") : configured ? t("subscribe") : t("comingSoon")}
          </button>
        </div>
      </section>

      <section className="card p-6 text-sm text-ink-700 text-center">
        <div className="font-semibold text-ink-900">{t("paddleInfo")}</div>
        <p className="mt-1 text-ink-500">
          {t("secureCheckout", { note: cycle === "yearly" ? t("annualDiscount") : t("noCommitment") })}
        </p>
      </section>

      {/* Standalone packs */}
      <section>
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">{t("packsTitle")}</h2>
            <p className="text-sm text-ink-500">{t("packsSubtitle")}</p>
          </div>
          <Link href="/packages" className="text-sm font-semibold text-brand-600">{t("browseAll")}</Link>
        </div>
        <div className="mt-4 card p-6 text-center">
          <div className="text-4xl">📦</div>
          <h3 className="mt-2 font-bold text-ink-900">{t("topik1Complete")}</h3>
          <p className="text-sm text-ink-500">{t("topik1CompleteDesc")}</p>
          <div className="mt-2 text-2xl font-bold text-ink-900">$4.99</div>
          <Link href="/packages/topik-i-complete" className="btn-outline mt-3 inline-block">
            {t("viewPackDetails")}
          </Link>
        </div>
      </section>
    </div>
  );
}
