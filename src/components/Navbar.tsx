"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/exams", label: "Exams" },
  { href: "/learn", label: "Learn" },
  { href: "/review", label: "Review" },
  { href: "/pricing", label: "Pricing" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const signOut = useStore((s) => s.signOut);
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
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname?.startsWith(l.href)
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-700 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                {user.name.split(" ")[0]}
                <span className="chip ml-1 bg-brand-500 text-white">{user.tier}</span>
              </Link>
              <button onClick={signOut} className="btn-outline">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary">
                Start free
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
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-gray-100"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn-outline flex-1">
                    Dashboard
                  </Link>
                  <button onClick={signOut} className="btn-ghost">
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="btn-outline flex-1">
                    Sign in
                  </Link>
                  <Link href="/signup" className="btn-primary flex-1">
                    Start free
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
