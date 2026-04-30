"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminAnalyticsPage() {
  const params = useSearchParams();
  const key = params.get("key") ?? "";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/analytics`, {
      headers: { Authorization: `Bearer ${key}`, "X-Internal-Key": key },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [key]);

  if (loading) return <div className="p-10 text-ink-500">Loading analytics...</div>;
  if (!data) return <div className="p-10 text-ink-500">Failed to load analytics</div>;

  const formatDate = (d: string) => {
    const date = new Date(d);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-ink-900">Analytics</h1>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">Total Users</div>
          <div className="mt-1 text-2xl font-bold text-brand-600">{data.summary.totalUsers}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">Total Words</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600">{data.summary.totalWords}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-xs text-ink-500">Active Subscribers</div>
          <div className="mt-1 text-2xl font-bold text-purple-600">{data.summary.activeSubscribers}</div>
        </div>
      </div>

      {/* Line charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Signups chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Daily Signups (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.signups}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* DAU chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Daily Active Users (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.dau}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
              <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Words learned chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-ink-700">Words Studied (30d)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.wordsLearned}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(v) => new Date(v as string).toLocaleDateString()} />
            <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tier distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">User Tiers</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.tierDistribution} dataKey="count" nameKey="tier" cx="50%" cy="50%" outerRadius={80} label>
                {data.tierDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Exam distribution */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="mb-4 text-sm font-semibold text-ink-700">Words by Exam</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.examDistribution} dataKey="count" nameKey="exam" cx="50%" cy="50%" outerRadius={80} label>
                {data.examDistribution.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
