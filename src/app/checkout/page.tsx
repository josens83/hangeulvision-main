"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ONE_TIME_PACKAGES, PLANS } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { ExamCategory, Tier } from "@/lib/exams";

type Method = "toss" | "paddle";

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-500">Loading checkout…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const router = useRouter();
  const search = useSearchParams();
  const planParam = search.get("plan") as Tier | null;
  const packParam = search.get("pack") as ExamCategory | null;
  const user = useStore((s) => s.currentUser());
  const updateTier = useStore((s) => s.updateTier);
  const addPurchase = useStore((s) => s.addPurchase);
  const recordPayment = useStore((s) => s.recordPayment);

  const [method, setMethod] = useState<Method>("paddle");
  const [state, setState] = useState<"idle" | "processing" | "done">("idle");

  const item = useMemo(() => {
    if (planParam) {
      const p = PLANS.find((x) => x.id === planParam);
      if (!p) return null;
      return { label: `${p.name} subscription`, priceUSD: p.priceUSD, kind: "subscription" as const, id: p.id };
    }
    if (packParam) {
      const p = ONE_TIME_PACKAGES.find((x) => x.id === packParam);
      if (!p) return null;
      return { label: p.name, priceUSD: p.priceUSD, kind: "one-time" as const, id: p.id };
    }
    return null;
  }, [planParam, packParam]);

  useEffect(() => {
    if (!user) router.replace("/signin?next=/checkout");
  }, [user, router]);

  if (!item) {
    return (
      <div className="py-16 text-center">
        <p className="text-ink-500">Nothing to check out. </p>
        <Link href="/pricing" className="btn-primary mt-4">Back to pricing</Link>
      </div>
    );
  }

  const onPay = async () => {
    setState("processing");
    // Mock payment — in production this triggers TossPayments (KR) or Paddle (global).
    await new Promise((r) => setTimeout(r, 900));
    recordPayment({
      userId: user?.id ?? "anon",
      provider: method === "toss" ? "toss" : "paddle",
      kind: item.kind,
      productId: item.id,
      amountUSD: item.priceUSD,
      status: "paid",
    });
    if (item.kind === "subscription") updateTier(item.id as Tier);
    else addPurchase(item.id as ExamCategory);
    setState("done");
    setTimeout(() => router.push("/dashboard"), 900);
  };

  return (
    <div className="mx-auto max-w-lg py-8">
      <h1 className="text-3xl font-bold text-ink-900">Checkout</h1>
      <div className="card mt-6 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-ink-500">Item</div>
            <div className="font-semibold text-ink-900">{item.label}</div>
          </div>
          <div className="text-2xl font-bold text-brand-600">${item.priceUSD.toFixed(2)}</div>
        </div>
        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-semibold text-ink-700 mb-2">Payment method</div>
          <div className="grid gap-2 sm:grid-cols-2">
            <MethodButton active={method === "paddle"} onClick={() => setMethod("paddle")} title="Paddle" desc="Credit card · worldwide" />
            <MethodButton active={method === "toss"} onClick={() => setMethod("toss")} title="TossPayments" desc="카드 · 계좌이체 (KR)" />
          </div>
        </div>
        <button
          className="btn-primary w-full"
          onClick={onPay}
          disabled={state !== "idle"}
        >
          {state === "idle" && `Pay $${item.priceUSD.toFixed(2)}`}
          {state === "processing" && "Processing…"}
          {state === "done" && "✓ Paid — redirecting…"}
        </button>
        <p className="text-xs text-ink-500">
          This MVP uses a mock payment handler. In production, clicking Pay opens a TossPayments (KR)
          or Paddle (global) checkout window. Configure keys in <code>.env.local</code>.
        </p>
      </div>
    </div>
  );
}

function MethodButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-3 text-left transition ${
        active ? "border-brand-500 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-300"
      }`}
    >
      <div className="font-semibold text-ink-900">{title}</div>
      <div className="text-xs text-ink-500">{desc}</div>
    </button>
  );
}
