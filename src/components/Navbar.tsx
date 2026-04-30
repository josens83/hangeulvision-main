"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Logo } from "./Logo";
import { NotificationBell } from "./NotificationBell";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useStore } from "@/lib/store";

const LINK_KEYS = [
  { href: "/exams", key: "exams" },
  { href: "/learn", key: "learn" },
  { href: "/review", key: "review" },
  { href: "/quiz", key: "quiz" },
  { href: "/bookmarks", key: "bookmarks" },
  { href: "/statistics", key: "statistics" },
  { href: "/pricing", key: "pricing" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const signOut = useStore((s) => s.signOut);
  const t = useTranslations("nav");
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  const user = mounted && currentUserId ? users[currentUserId] : null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINK_KEYS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname?.startsWith(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-gray-100"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          {user ? (
            <>
              <NotificationBell />
              <UserDropdown name={user.name} tier={user.tier} signOut={signOut} />
            </>
          ) : (
            <>
              <Link href="/signin" className="btn-ghost">
                {t("signIn")}
              </Link>
              <Link href="/signup" className="btn-primary">
                {t("startFree")}
              </Link>
            </>
          )}
        </div>
        <button
          className="md:hidden rounded-full border border-gray-200 p-2"
          aria-label="Toggle menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open ? (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {LINK_KEYS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-gray-100"
              >
                {t(l.key)}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-outline flex-1">
                    {t("dashboard")}
                  </Link>
                  <button onClick={signOut} className="btn-ghost">
                    {t("signOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="btn-outline flex-1">
                    {t("signIn")}
                  </Link>
                  <Link href="/signup" className="btn-primary flex-1">
                    {t("startFree")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function UserDropdown({
  name,
  tier,
  signOut,
}: {
  name: string;
  tier: string;
  signOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("nav");

  // Close on navigation.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
      >
        {name.split(" ")[0]}
        <span className="chip ml-1 bg-brand-500 text-white">{tier}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-1">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-card">
            <DropLink href="/dashboard" label={t("dashboard")} />
            <DropLink href="/bookmarks" label={t("bookmarks")} />
            <DropLink href="/achievements" label={t("achievements")} />
            <DropLink href="/statistics" label={t("statistics")} />
            <div className="my-1 border-t border-gray-100" />
            <DropLink href="/settings" label={t("settings")} />
            <DropLink href="/my" label={t("mySubscription")} />
            <DropLink href="/account" label={t("account")} />
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={signOut}
              className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
            >
              {t("signOut")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function DropLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 text-sm text-ink-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  );
}
