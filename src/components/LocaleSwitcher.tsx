"use client";

import { useTransition } from "react";

const locales = [
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

export function LocaleSwitcher() {
  const [isPending, startTransition] = useTransition();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    startTransition(() => {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
      window.location.reload();
    });
  }

  // Read the current locale from the cookie on the client
  const current =
    (typeof document !== "undefined" &&
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("locale="))
        ?.split("=")[1]) ||
    "ko";

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={isPending}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 outline-none transition hover:border-gray-300 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {l.label}
        </option>
      ))}
    </select>
  );
}
