"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

interface Pkg {
  id: string; slug: string; name: string; nameEn: string | null;
  exam: string; active: boolean; priceUSD: string;
  wordCount: number; paddlePriceId: string | null;
}

export default function AdminPackagesPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [pkgs, setPkgs] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`${API_URL}/packages`)
      .then((r) => r.json())
      .then((d) => { setPkgs(d.packages ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Package Management</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">Total packs</div>
          <div className="mt-1 text-2xl font-bold text-ink-900">{pkgs.length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">Active</div>
          <div className="mt-1 text-2xl font-bold text-green-600">{pkgs.filter((p) => p.active).length}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">With Paddle Price</div>
          <div className="mt-1 text-2xl font-bold text-brand-600">{pkgs.filter((p) => p.paddlePriceId).length}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-ink-500">
            <tr>
              <th className="px-4 py-2">Pack</th>
              <th className="px-4 py-2">Exam</th>
              <th className="px-4 py-2">Words</th>
              <th className="px-4 py-2">Price</th>
              <th className="px-4 py-2">Active</th>
              <th className="px-4 py-2">Paddle Price ID</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">Loading…</td></tr>
            ) : pkgs.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">No packages</td></tr>
            ) : pkgs.map((p) => (
              <tr key={p.id} className="border-b border-gray-100">
                <td className="px-4 py-2">
                  <div className="font-medium text-ink-900">{p.nameEn ?? p.name}</div>
                  <div className="text-xs text-ink-500">{p.slug}</div>
                </td>
                <td className="px-4 py-2"><span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">{p.exam}</span></td>
                <td className="px-4 py-2 font-semibold">{p.wordCount}</td>
                <td className="px-4 py-2">${p.priceUSD}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-ink-500"}`}>
                    {p.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 font-mono text-xs text-ink-500">
                  {p.paddlePriceId ?? <span className="text-amber-600">Not set</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-500">
        To update active/paddlePriceId: use Supabase SQL Editor or the admin API directly.
        Paddle Price IDs are set via Railway Variables for subscriptions, via DB for standalone packs.
      </p>
    </div>
  );
}
