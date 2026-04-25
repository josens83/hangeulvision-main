"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface Col { id: string; name: string; description: string | null; wordCount: number; }

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Col[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ collections: Col[] }>("/collections").then((r) => {
      if (r.ok && r.data) setCollections(r.data.collections);
      setLoading(false);
    });
  }, []);

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-ink-900">Collections</h1>
      <p className="mt-1 text-sm text-ink-500">Curated thematic word sets.</p>

      {loading ? (
        <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((i) => <div key={i} className="card h-28 bg-gray-200" />)}</div>
      ) : collections.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📦</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No collections yet</h2>
          <p className="mt-1 text-sm text-ink-500">Curated word sets are coming soon.</p>
          <Link href="/vocabulary" className="btn-primary mt-4 inline-block">Browse vocabulary</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((c) => (
            <Link key={c.id} href={`/collections/${c.id}`} className="card group block p-5 transition hover:shadow-pop">
              <div className="font-bold text-ink-900 group-hover:text-brand-600">{c.name}</div>
              {c.description && <p className="mt-1 text-sm text-ink-500 line-clamp-2">{c.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-ink-500">{c.wordCount} words</span>
                <span className="text-sm font-semibold text-brand-600">Study →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
