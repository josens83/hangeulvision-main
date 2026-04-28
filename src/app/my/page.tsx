"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

interface Purchase {
  id: string;
  exam: string;
  expiresAt: string;
  package: { slug: string; name: string; nameEn?: string | null; exam: string };
}

export default function MySubscriptionPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const hydrate = useStore((s) => s.hydrate);
  const [sub, setSub] = useState<any>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  useEffect(() => {
    if (!getAuthToken()) return;
    api.get("/user/me").then((r: any) => {
      if (r.ok && r.data?.user) setSub(r.data.user);
    });
    api.get<{ purchases: Purchase[] }>("/packages/me/access").then((r) => {
      if (r.ok && r.data) setPurchases(r.data.purchases);
    });
  }, []);

  const cancel = async () => {
    setCancelling(true);
    await api.post("/paddle/portal"); // Simplified — real implementation opens Paddle portal
    setCancelling(false);
    setShowConfirm(false);
    hydrate();
  };

  if (!user) return null;

  const tier = sub?.tier ?? user.tier ?? "free";
  const status = sub?.subscriptionStatus ?? "NONE";
  const plan = sub?.subscriptionPlan ?? null;
  const endDate = sub?.subscriptionEnd ? new Date(sub.subscriptionEnd).toLocaleDateString() : null;

  const TIER_COLORS: Record<string, string> = { free: "bg-gray-100 text-ink-700", basic: "bg-brand-100 text-brand-700", premium: "bg-purple-100 text-purple-700" };

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-3xl font-bold text-ink-900">My Subscription</h1>

      <div className="card mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${TIER_COLORS[tier] ?? TIER_COLORS.free}`}>
            {tier.charAt(0).toUpperCase() + tier.slice(1)}
          </span>
          {status !== "NONE" && (
            <span className={`text-xs font-semibold ${status === "ACTIVE" ? "text-green-600" : status === "CANCELLED" ? "text-amber-600" : "text-rose-600"}`}>
              {status}
            </span>
          )}
        </div>

        {plan && <div className="mt-3 text-sm text-ink-700">Plan: <span className="font-semibold">{plan.replace(/_/g, " ")}</span></div>}
        {endDate && <div className="mt-1 text-sm text-ink-500">{status === "CANCELLED" ? "Access until" : "Next billing"}: {endDate}</div>}

        <div className="mt-6 flex flex-wrap gap-3">
          {tier === "free" ? (
            <Link href="/pricing" className="btn-primary">Upgrade plan</Link>
          ) : (
            <>
              <Link href="/pricing" className="btn-outline">Change plan</Link>
              {status === "ACTIVE" && !showConfirm && (
                <button onClick={() => setShowConfirm(true)} className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100">
                  Cancel subscription
                </button>
              )}
            </>
          )}
        </div>

        {showConfirm && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm text-rose-700">Are you sure? You'll keep access until the end of your billing period.</p>
            <div className="mt-3 flex gap-2">
              <button onClick={cancel} disabled={cancelling} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50">
                {cancelling ? "Cancelling…" : "Yes, cancel"}
              </button>
              <button onClick={() => setShowConfirm(false)} className="btn-ghost">Keep subscription</button>
            </div>
          </div>
        )}
      </div>

      {purchases.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-ink-900">Purchased packs</h2>
          <div className="space-y-2">
            {purchases.map((p) => (
              <div key={p.id} className="card flex items-center justify-between p-4">
                <div>
                  <div className="font-semibold text-ink-900">{p.package.nameEn ?? p.package.name}</div>
                  <div className="text-xs text-ink-500">{p.package.exam.replace(/_/g, " ")}</div>
                </div>
                <div className="text-xs text-ink-500">
                  Expires {new Date(p.expiresAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-ink-900">What's included</h2>
        <div className="card p-5">
          {tier === "free" && <ul className="space-y-1 text-sm text-ink-700"><li>✓ TOPIK I Level 1 (800 words)</li><li>✓ AI concept images</li><li>✓ Spaced repetition</li></ul>}
          {tier === "basic" && <ul className="space-y-1 text-sm text-ink-700"><li>✓ TOPIK I full + TOPIK II Mid + KIIP</li><li>✓ AI concept + mnemonic images</li><li>✓ Unlimited sessions</li></ul>}
          {tier === "premium" && <ul className="space-y-1 text-sm text-ink-700"><li>✓ All 13,500+ words</li><li>✓ Every exam (TOPIK I + II + EPS + KIIP)</li><li>✓ AI tutor + video lessons</li><li>✓ Priority support</li></ul>}
        </div>
      </section>
    </div>
  );
}
