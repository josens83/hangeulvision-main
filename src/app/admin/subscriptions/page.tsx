"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function AdminSubscriptionsPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${key}`, "X-Internal-Key": key } })
      .then((r) => r.json()).then((d) => { setUsers((d.users ?? []).filter((u: any) => u.subscriptionStatus && u.subscriptionStatus !== "NONE")); setLoading(false); })
      .catch(() => setLoading(false));
  }, [key]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">Subscriptions</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">Active</div><div className="mt-1 text-2xl font-bold text-green-600">{users.filter((u) => u.subscriptionStatus === "ACTIVE").length}</div></div>
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">Cancelled</div><div className="mt-1 text-2xl font-bold text-amber-600">{users.filter((u) => u.subscriptionStatus === "CANCELLED").length}</div></div>
        <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">Expired</div><div className="mt-1 text-2xl font-bold text-rose-600">{users.filter((u) => u.subscriptionStatus === "EXPIRED").length}</div></div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-ink-500">
            <tr><th className="px-4 py-2">User</th><th className="px-4 py-2">Plan</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Tier</th><th className="px-4 py-2">Ends</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">Loading…</td></tr> :
            users.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No subscribers yet</td></tr> :
            users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="px-4 py-2"><div className="font-medium text-ink-900">{u.name}</div><div className="text-xs text-ink-500">{u.email}</div></td>
                <td className="px-4 py-2 text-xs">{u.subscriptionPlan ?? "—"}</td>
                <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${u.subscriptionStatus === "ACTIVE" ? "bg-green-100 text-green-700" : u.subscriptionStatus === "CANCELLED" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{u.subscriptionStatus}</span></td>
                <td className="px-4 py-2">{u.tier}</td>
                <td className="px-4 py-2 text-xs text-ink-500">{u.subscriptionEnd ? new Date(u.subscriptionEnd).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
