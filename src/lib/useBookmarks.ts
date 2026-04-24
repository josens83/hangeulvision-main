"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getAuthToken } from "./api";

interface BookmarkWord {
  id: string;
  word: string;
  romanization: string;
  definitionEn: string;
  level: number;
  exam: string;
}

interface BookmarkEntry {
  id: string;
  wordId: string;
  note: string | null;
  createdAt: string;
  word: BookmarkWord;
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getAuthToken()) { setLoading(false); return; }
    setLoading(true);
    const res = await api.get<{ bookmarks: BookmarkEntry[] }>("/bookmarks");
    if (res.ok && res.data) setBookmarks(res.data.bookmarks);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = useCallback(async (wordId: string) => {
    const res = await api.post<{ bookmarked: boolean }>("/bookmarks/toggle", { wordId });
    if (res.ok) load();
    return res.data?.bookmarked ?? false;
  }, [load]);

  const remove = useCallback(async (wordId: string) => {
    await api.delete(`/bookmarks/${wordId}`);
    setBookmarks((b) => b.filter((x) => x.wordId !== wordId));
  }, []);

  return { bookmarks, loading, toggle, remove, reload: load };
}

export function useIsBookmarked(wordIds: string[]) {
  const [map, setMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!getAuthToken() || !wordIds.length) return;
    api.get<{ bookmarked: Record<string, boolean> }>(
      `/bookmarks/check?wordIds=${wordIds.join(",")}`,
    ).then((res) => {
      if (res.ok && res.data) setMap(res.data.bookmarked);
    });
  }, [wordIds.join(",")]);

  return map;
}
