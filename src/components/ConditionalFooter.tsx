"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const HIDE_FOOTER_PREFIXES = [
  "/review",
  "/learn",
  "/quiz",
  "/chat",
  "/study",
  "/achievements",
  "/league",
  "/bookmarks",
  "/decks",
  "/collections",
  "/notifications",
  "/admin",
  "/dashboard",
];

export function ConditionalFooter() {
  const pathname = usePathname();
  const hide = HIDE_FOOTER_PREFIXES.some((p) => pathname?.startsWith(p));
  if (hide) return null;
  return <Footer />;
}
