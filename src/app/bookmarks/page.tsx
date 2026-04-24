"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useBookmarks } from "@/lib/useBookmarks";

export default function BookmarksPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const { bookmarks, loading, remove } = useBookmarks();

  useEffect(() => {
    if (!user) router.replace("/signin");
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">Bookmarks</h1>
          <p className="text-sm text-ink-500">
            {bookmarks.length} saved word{bookmarks.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/learn" className="btn-outline">Browse library</Link>
      </div>

      {loading ? (
        <div className="mt-8 animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📭</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No bookmarks yet</h2>
          <p className="mt-1 text-sm text-ink-500">
            Tap the heart icon on any word card to save it here.
          </p>
          <Link href="/learn" className="btn-primary mt-6 inline-block">
            Start learning
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {bookmarks.map((b) => (
            <div key={b.id} className="card flex items-center gap-4 p-4">
              <Link
                href={`/learn/${b.wordId}`}
                className="flex flex-1 items-center gap-4 hover:opacity-80"
              >
                <div className="korean text-2xl font-bold text-ink-900">{b.word.word}</div>
                <div className="flex-1">
                  <div className="text-xs text-ink-500">{b.word.romanization}</div>
                  <div className="text-sm text-ink-700 line-clamp-1">{b.word.definitionEn}</div>
                </div>
                <div className="chip">L{b.word.level}</div>
              </Link>
              <button
                onClick={() => remove(b.wordId)}
                className="rounded-full p-2 text-ink-500 hover:bg-rose-50 hover:text-rose-600"
                aria-label="Remove bookmark"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
