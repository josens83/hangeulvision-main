"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/learn", label: "Learn", icon: BookIcon },
  { href: "/review", label: "Review", icon: SparkIcon, primary: true },
  { href: "/exams", label: "Exams", icon: AwardIcon },
  { href: "/dashboard", label: "Me", icon: UserIcon },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const currentUserId = useStore((s) => s.currentUserId);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Hide on onboarding/legal flows.
  if (pathname?.startsWith("/legal")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur md:hidden safe-bottom">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((t) => {
          const isActive =
            t.href === "/"
              ? pathname === "/"
              : pathname?.startsWith(t.href);
          const href = t.href === "/dashboard" && mounted && !currentUserId ? "/signin" : t.href;
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-semibold ${
                  isActive ? "text-brand-600" : "text-ink-500"
                }`}
              >
                {t.primary ? (
                  <span
                    className={`mb-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-pop ${
                      isActive ? "ring-2 ring-brand-300" : ""
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                ) : (
                  <Icon size={22} />
                )}
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Minimal inline icons — no new deps. Stroke style matches the brand.
function base({ size = 22 }: { size?: number }) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function HomeIcon(props: { size?: number }) {
  return (
    <svg {...base(props)}>
      <path d="M3 10 12 3l9 7" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}
function BookIcon(props: { size?: number }) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h10a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z" />
      <path d="M4 16h14" />
    </svg>
  );
}
function SparkIcon(props: { size?: number }) {
  return (
    <svg {...base(props)} stroke="white">
      <path d="M12 3l2.3 5.7L20 11l-5.7 2.3L12 19l-2.3-5.7L4 11l5.7-2.3z" />
    </svg>
  );
}
function AwardIcon(props: { size?: number }) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="9" r="6" />
      <path d="M9 14l-1.5 7L12 18l4.5 3L15 14" />
    </svg>
  );
}
function UserIcon(props: { size?: number }) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}
