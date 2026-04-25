"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

const MODES = [
  { href: "/quiz/choice", icon: "🎯", name: "Multiple Choice", desc: "Pick the right English definition from 4 options." },
  { href: "/quiz/fill", icon: "✏️", name: "Fill in Blank", desc: "Type the Korean word from the English definition." },
  { href: "/quiz/match", icon: "🔗", name: "Match Pairs", desc: "Connect 5 Korean words with their English meanings." },
  { href: "/quiz/timed", icon: "⏱️", name: "Timed Challenge", desc: "60 seconds. How many can you get right?" },
];

export default function QuizIndex() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);
  if (!user) return null;

  return (
    <div className="py-6">
      <div className="text-center">
        <div className="text-6xl">🧠</div>
        <h1 className="mt-4 text-3xl font-bold text-ink-900">Quiz Mode</h1>
        <p className="mt-2 text-ink-500">Choose your challenge.</p>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {MODES.map((m) => (
          <Link key={m.href} href={m.href} className="card group block p-6 transition hover:shadow-pop">
            <div className="text-4xl">{m.icon}</div>
            <h2 className="mt-3 text-lg font-bold text-ink-900 group-hover:text-brand-600">{m.name}</h2>
            <p className="mt-1 text-sm text-ink-500">{m.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
