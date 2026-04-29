"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, getAuthToken } from "@/lib/api";

interface PkgDetail {
  id: string; slug: string; name: string; nameEn: string | null;
  description: string; exam: string; priceUSD: string; priceKRW: number;
  durationDays: number; wordCount: number; paddlePriceId: string | null;
}

export default function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [pkg, setPkg] = useState<PkgDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ package: PkgDetail }>(`/packages/${slug}`).then((r) => {
      if (r.ok && r.data) setPkg(r.data.package);
      else setLoading(false);
      setLoading(false);
    });
  }, [slug]);

  const purchase = async () => {
    if (!getAuthToken()) { router.push("/signin"); return; }
    if (!pkg?.paddlePriceId) return;
    if (typeof window !== "undefined" && (window as any).Paddle) {
      (window as any).Paddle.Checkout.open({
        items: [{ priceId: pkg.paddlePriceId, quantity: 1 }],
        customData: { userId: "from-session", slug: pkg.slug, type: "package" },
        settings: { successUrl: `${window.location.origin}/checkout/success` },
      });
    }
  };

  if (loading) return <div className="py-16 text-center animate-pulse text-ink-500">Loading…</div>;
  if (!pkg) return <div className="py-16 text-center"><h1 className="text-2xl font-bold">Pack not found</h1><Link href="/packages" className="btn-primary mt-4 inline-block">All packs</Link></div>;

  return (
    <div className="mx-auto max-w-2xl py-6">
      <Link href="/packages" className="text-sm font-semibold text-brand-600">← All packs</Link>

      <div className="card mt-4 p-8">
        <div className="chip">{pkg.exam.replace(/_/g, " ")}</div>
        <h1 className="mt-3 text-3xl font-bold text-ink-900">{pkg.nameEn ?? pkg.name}</h1>
        <p className="mt-2 text-ink-500">{pkg.description}</p>

        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-4xl font-bold text-ink-900">${pkg.priceUSD}</span>
          <span className="text-ink-500">/ {pkg.durationDays} days access</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-ink-900">{pkg.wordCount}</div>
            <div className="text-xs text-ink-500">Words included</div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 text-center">
            <div className="text-2xl font-bold text-ink-900">{pkg.durationDays}</div>
            <div className="text-xs text-ink-500">Days access</div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">What&apos;s included:</h3>
          <ul className="space-y-1 text-sm text-ink-700">
            <li>✓ All {pkg.wordCount} {pkg.exam.replace(/_/g, " ")} vocabulary words</li>
            <li>✓ AI concept images for every word</li>
            <li>✓ Hanja / etymology breakdown</li>
            <li>✓ English mnemonics</li>
            <li>✓ SM-2 spaced repetition</li>
            <li>✓ Flashcards + 4 quiz modes</li>
          </ul>
        </div>

        <button
          onClick={purchase}
          disabled={!pkg.paddlePriceId}
          className={`mt-6 w-full rounded-xl py-3.5 text-base font-semibold ${
            pkg.paddlePriceId
              ? "bg-brand-500 text-white hover:bg-brand-600"
              : "bg-gray-200 text-ink-500 cursor-default"
          }`}
        >
          {pkg.paddlePriceId ? `Purchase for $${pkg.priceUSD}` : "Price not set yet"}
        </button>

        <p className="mt-3 text-center text-xs text-ink-500">
          One-time payment · No subscription · Powered by Paddle
        </p>
      </div>
    </div>
  );
}
