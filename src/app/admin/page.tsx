"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { SEED_WORDS } from "@/lib/words.seed";
import { EXAMS } from "@/lib/exams";

// MVP admin: read-only view of users, revenue and content inventory.
// In production this is gated by role and hits the NestJS / Supabase backend.
export default function AdminPage() {
  const users = useStore((s) => Object.values(s.users));
  const payments = useStore((s) => s.payments);
  const revenue = payments.filter((p) => p.status === "paid").reduce((a, b) => a + b.amountUSD, 0);

  return (
    <div className="space-y-8 py-6">
      <header>
        <h1 className="text-3xl font-bold text-ink-900">Admin · Ops dashboard</h1>
        <p className="text-sm text-ink-500">
          MVP preview. Role gating, content CRUD and AI pipeline triggers arrive with the NestJS backend.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Users" value={users.length.toString()} />
        <Stat label="Paid users" value={users.filter((u) => u.tier !== "free").length.toString()} />
        <Stat label="Revenue (mock)" value={`$${revenue.toFixed(2)}`} />
        <Stat label="Seed words" value={SEED_WORDS.length.toString()} />
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink-900">Users</h2>
        <div className="card mt-3 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-ink-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Tier</th>
                <th className="px-4 py-2">Purchases</th>
                <th className="px-4 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-ink-500">No users yet</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-ink-900">{u.name}</td>
                  <td className="px-4 py-2 text-ink-500">{u.email}</td>
                  <td className="px-4 py-2"><span className="chip">{u.tier}</span></td>
                  <td className="px-4 py-2">{u.purchases.join(", ") || "—"}</td>
                  <td className="px-4 py-2 text-ink-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-ink-900">Content inventory</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => {
            const count = SEED_WORDS.filter((w) => w.exam === e.id).length;
            return (
              <div key={e.id} className="card p-5">
                <div className="font-semibold text-ink-900">{e.name}</div>
                <div className="mt-1 text-sm text-ink-500">{count} seed / {e.wordCount.toLocaleString()} target</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${Math.min(100, (count / e.wordCount) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-bold text-ink-900">Pipelines</h2>
        <p className="mt-1 text-sm text-ink-500">Hooks into the content generation stack.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Claude · word content", v: "POST /internal/generate-content-continuous" },
            { k: "Stability AI · concept images", v: "POST /internal/images/concept" },
            { k: "Stability AI · mnemonic images", v: "POST /internal/images/mnemonic" },
          ].map((p) => (
            <div key={p.k} className="rounded-xl border border-dashed border-gray-300 p-4 text-xs">
              <div className="font-semibold text-ink-900">{p.k}</div>
              <div className="mt-1 text-ink-500 break-all">{p.v}</div>
            </div>
          ))}
        </div>
        <Link href="/pricing" className="mt-4 inline-block text-sm font-semibold text-brand-600">
          Configure pricing →
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm text-ink-500">{label}</div>
      <div className="mt-1 text-3xl font-bold text-ink-900">{value}</div>
    </div>
  );
}
