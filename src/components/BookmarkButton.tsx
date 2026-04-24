"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAuthToken } from "@/lib/api";

export function BookmarkButton({ wordId }: { wordId: string }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!getAuthToken()) return;
    api
      .get<{ bookmarked: Record<string, boolean> }>(
        `/bookmarks/check?wordIds=${wordId}`,
      )
      .then((res) => {
        if (res.ok && res.data) setBookmarked(!!res.data.bookmarked[wordId]);
      });
  }, [wordId]);

  const toggle = useCallback(async () => {
    if (!getAuthToken() || busy) return;
    setBusy(true);
    setBookmarked((b) => !b); // optimistic
    const res = await api.post<{ bookmarked: boolean }>("/bookmarks/toggle", {
      wordId,
    });
    if (res.ok && res.data) {
      setBookmarked(res.data.bookmarked);
    } else {
      setBookmarked((b) => !b); // rollback
    }
    setBusy(false);
  }, [wordId, busy]);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      className={`rounded-full p-2 transition ${
        bookmarked
          ? "text-rose-500 hover:text-rose-600"
          : "text-ink-300 hover:text-rose-400"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={bookmarked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}
