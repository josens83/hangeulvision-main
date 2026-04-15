"use client";

/**
 * AuthBoot
 * ────────
 * Mounted once from the root layout. If the browser has an `authToken`
 * in localStorage, fetches the latest `/auth/me` so the Zustand store
 * reflects server-side truth (tier / streak / locale) rather than any
 * stale snapshot persisted from a previous session. Non-blocking — the
 * UI keeps using the persisted state while the hydrate call is in flight.
 */

import { useEffect } from "react";
import { useStore } from "@/lib/store";

export function AuthBoot() {
  const hydrate = useStore((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return null;
}
