"use client";
import Link from "next/link";
import { useState } from "react";
import { ONE_TIME_PACKAGES, PLANS } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

type Currency = "USD" | "KRW";

export default function PricingPage() {
  const [currency, setCurrency] = useState<Currency>("USD");

  return (
    <div className="space-y-12 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-ink-900">Simple, fair pricing</h1>
        <p className="mt-2 text-ink-500">Freemium · cancel any time · student discounts on request.</p>
        <div className="mt-6 inline-flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          {(["USD", "KRW"] as Currency[]).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`rounded-full px-4 py-1.5 font-semibold ${
                currency === c ? "bg-brand-500 text-white" : "text-ink-500"
              }`}
            >
              {c === "USD" ? "🌐 Global (USD)" : "🇰🇷 Korea (KRW)"}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.id}
            className={`card relative p-6 ${p.highlight ? "ring-2 ring-brand-500 shadow-pop" : ""}`}
          >
            {p.highlight ? (
              <span className="absolute -top-3 right-6 chip bg-brand-500 text-white">Most popular</span>
            ) : null}
            <div className="text-sm font-semibold text-brand-600">{p.name}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-ink-900">
                {p.priceUSD === 0
                  ? "Free"
                  : currency === "USD"
                    ? `$${p.priceUSD}`
                    : `₩${p.priceKRW.toLocaleString()}`}
              </span>
              {p.priceUSD !== 0 ? <span className="text-ink-500 text-sm">/mo</span> : null}
            </div>
            <p className="mt-2 text-sm text-ink-500">{p.tagline}</p>
            <ul className="mt-4 space-y-2 text-sm text-ink-700">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-brand-500">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <SubscribeButton planId={p.id} highlight={p.highlight} />
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-bold text-ink-900">Or buy a single pack</h2>
        <p className="text-ink-500 text-sm">6-month access · no subscription.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {ONE_TIME_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="card p-5">
              <div className="font-semibold text-ink-900">{pkg.name}</div>
              <div className="mt-1 text-sm text-ink-500">{pkg.description}</div>
              <div className="mt-3 text-2xl font-bold text-brand-600">
                {currency === "USD" ? `$${pkg.priceUSD}` : `₩${pkg.priceKRW.toLocaleString()}`}
              </div>
              <OneTimeButton exam={pkg.id as any} priceUSD={pkg.priceUSD} />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6 text-sm text-ink-700">
        <div className="font-semibold text-ink-900">Enterprise & education</div>
        <p className="mt-1 text-ink-500">
          Seat licenses for 세종학당, universities and corporate training. Email{" "}
          <a href="mailto:sales@hangeulvision.app" className="text-brand-600 font-semibold">
            sales@hangeulvision.app
          </a>.
        </p>
      </section>
    </div>
  );
}

function SubscribeButton({ planId, highlight }: { planId: "free" | "basic" | "premium"; highlight?: boolean }) {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  if (planId === "free") {
    return (
      <Link href={user ? "/dashboard" : "/signup"} className="btn-outline mt-5 w-full">
        {user ? "Go to dashboard" : "Create free account"}
      </Link>
    );
  }
  return (
    <button
      onClick={() => router.push(`/checkout?plan=${planId}`)}
      className={`mt-5 w-full ${highlight ? "btn-primary" : "btn-outline"}`}
    >
      Choose {planId}
    </button>
  );
}

function OneTimeButton({ exam, priceUSD }: { exam: string; priceUSD: number }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/checkout?pack=${exam}`)}
      className="btn-outline mt-4 w-full"
    >
      Buy pack — ${priceUSD}
    </button>
  );
}
