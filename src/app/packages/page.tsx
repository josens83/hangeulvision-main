"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Pkg {
  id: string; slug: string; name: string; nameEn: string | null;
  description: string; exam: string; priceUSD: string; durationDays: number;
  wordCount: number; paddlePriceId: string | null;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ packages: Pkg[] }>("/packages").then((r) => {
      if (r.ok && r.data) setPackages(r.data.packages);
      setLoading(false);
    });
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Word Packs</h1>
      <p className="mt-1 text-sm text-ink-500">One-time purchase · 6-month access · no subscription required.</p>

      {loading ? (
        <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="card h-48 bg-gray-200" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📦</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No packs available yet</h2>
          <p className="mt-1 text-sm text-ink-500">Check back soon or subscribe for full access.</p>
          <Link href="/pricing" className="btn-primary mt-4 inline-block">View plans</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Link key={pkg.id} href={`/packages/${pkg.slug}`} className="card group block p-6 transition hover:shadow-pop">
              <div className="chip">{pkg.exam.replace(/_/g, " ")}</div>
              <h2 className="mt-3 text-lg font-bold text-ink-900 group-hover:text-brand-600">
                {pkg.nameEn ?? pkg.name}
              </h2>
              <p className="mt-1 text-sm text-ink-500 line-clamp-2">{pkg.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-ink-900">${pkg.priceUSD}</span>
                  <span className="ml-1 text-xs text-ink-500">/ {pkg.durationDays} days</span>
                </div>
                <span className="text-xs font-semibold text-ink-500">{pkg.wordCount} words</span>
              </div>
              <button className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold ${
                pkg.paddlePriceId
                  ? "bg-brand-500 text-white hover:bg-brand-600"
                  : "bg-gray-200 text-ink-500 cursor-default"
              }`}>
                {pkg.paddlePriceId ? "Buy now" : "Coming soon"}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
