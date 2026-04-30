"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";

const ADMIN_KEY = "dohurnk1006";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10 text-ink-500">Loading admin…</div>}>
      <AdminGuard>{children}</AdminGuard>
    </Suspense>
  );
}

function AdminGuard({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const key = params.get("key");

  if (key !== ADMIN_KEY) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-bold text-ink-900">Access denied</h1>
          <p className="mt-2 text-sm text-ink-500">
            Append <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">?key=YOUR_KEY</code> to the URL.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center gap-6">
          <span className="font-bold text-ink-900">HV Admin</span>
          <Link href={`/admin?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">
            Dashboard
          </Link>
          <Link href={`/admin/analytics?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Analytics</Link>
          <Link href={`/admin/words?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Words</Link>
          <Link href={`/admin/cs?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">CS</Link>
          <Link href={`/admin/packages?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Packs</Link>
          <Link href={`/admin/subscriptions?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Subs</Link>
          <Link href={`/admin/images?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Images</Link>
          <Link href={`/admin/monitoring?key=${key}`} className="text-sm text-ink-700 hover:text-ink-900">Monitor</Link>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
    </div>
  );
}
