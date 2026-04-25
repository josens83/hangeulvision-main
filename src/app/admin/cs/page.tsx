"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { API_URL } from "@/lib/api";

interface Ticket { id: string; email: string; subject: string; category: string; status: string; priority: string; createdAt: string; }

export default function AdminCsPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/support/tickets`, { headers: { Authorization: `Bearer ${key}`, "X-Internal-Key": key } })
      .then((r) => r.json()).then((d) => { setTickets(d.tickets ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [key]);

  const byStatus = (s: string) => tickets.filter((t) => t.status === s).length;
  const today = tickets.filter((t) => new Date(t.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink-900">CS Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Open" value={byStatus("OPEN")} color="text-amber-600" />
        <Stat label="In Progress" value={byStatus("IN_PROGRESS")} color="text-blue-600" />
        <Stat label="Resolved" value={byStatus("RESOLVED")} color="text-green-600" />
        <Stat label="Today" value={today} color="text-ink-900" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50 text-left text-xs uppercase text-ink-500">
            <tr><th className="px-4 py-2">ID</th><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Date</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">Loading…</td></tr> :
            tickets.length === 0 ? <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-500">No tickets</td></tr> :
            tickets.map((t) => (
              <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 text-xs text-ink-500">{t.id.slice(0, 8)}</td>
                <td className="px-4 py-2 font-medium text-ink-900">{t.subject}</td>
                <td className="px-4 py-2"><span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px]">{t.category}</span></td>
                <td className="px-4 py-2"><StatusBadge status={t.status} /></td>
                <td className="px-4 py-2 text-ink-500">{t.email}</td>
                <td className="px-4 py-2 text-xs text-ink-500">{new Date(t.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="rounded-lg border border-gray-200 bg-white p-4"><div className="text-xs text-ink-500">{label}</div><div className={`mt-1 text-2xl font-bold ${color}`}>{value}</div></div>;
}

function StatusBadge({ status }: { status: string }) {
  const cls = status === "OPEN" ? "bg-amber-100 text-amber-700" : status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" : status === "RESOLVED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-ink-500";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{status}</span>;
}
