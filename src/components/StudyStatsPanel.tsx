"use client";

/**
 * StudyStatsPanel
 * ───────────────
 * Heavier analytics surface — not needed for first paint, so it's loaded
 * via `next/dynamic({ ssr: false })` from the /learn page. Moving this
 * out of the critical path is what keeps the hero card's TTI ~1.5s.
 */

import { useStore } from "@/lib/store";

export default function StudyStatsPanel({
  dueCount,
  totalWords,
  streakDays,
}: {
  dueCount: number;
  totalWords: number;
  streakDays: number;
}) {
  const progress = useStore((s) => {
    const uid = s.currentUserId;
    if (!uid) return { mastered: 0, seen: 0 };
    const rows = Object.values(s.progress[uid] ?? {});
    return {
      seen: rows.length,
      mastered: rows.filter((r) => (r.reps ?? 0) >= 3 && (r.ease ?? 0) >= 2.5).length,
    };
  });

  const Items: Array<[string, string, string]> = [
    ["🔥", `${streakDays}일`, "Current streak"],
    ["⏰", `${dueCount}`, "Due today"],
    ["🎓", `${progress.mastered}`, "Mastered"],
    ["📚", `${progress.seen} / ${totalWords}`, "Seen vs library"],
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Items.map(([emoji, value, label]) => (
        <div key={label} className="card p-5">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span className="text-lg">{emoji}</span>
            {label}
          </div>
          <div className="mt-1 text-3xl font-bold text-ink-900">{value}</div>
        </div>
      ))}
    </div>
  );
}
