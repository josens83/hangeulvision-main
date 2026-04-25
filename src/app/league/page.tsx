"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

interface Member { rank: number; userId: string; name: string; xp: number; isMe: boolean; zone: "promote" | "safe" | "demote"; }
interface LeagueData { league: { tierName: string; tier: number; endsAt: string }; members: Member[]; myRank: number; resetIn: number; }

const TIER_COLORS: Record<string, string> = { BRONZE: "from-amber-600 to-amber-700", SILVER: "from-gray-400 to-gray-500", GOLD: "from-yellow-400 to-yellow-500", SAPPHIRE: "from-blue-500 to-blue-600", RUBY: "from-rose-500 to-rose-600", EMERALD: "from-emerald-500 to-emerald-600", AMETHYST: "from-purple-500 to-purple-600", PEARL: "from-pink-200 to-pink-300", OBSIDIAN: "from-gray-800 to-gray-900", DIAMOND: "from-cyan-300 to-cyan-400" };

export default function LeaguePage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [data, setData] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);
  useEffect(() => {
    if (!getAuthToken()) return;
    api.get<LeagueData>("/league").then((r) => { if (r.ok && r.data) setData(r.data); setLoading(false); });
  }, []);

  if (!user) return null;
  if (loading || !data) return <div className="py-16 text-center text-ink-500 animate-pulse">Loading league…</div>;

  const { league, members, myRank, resetIn } = data;
  const days = Math.floor(resetIn / 86_400_000);
  const hours = Math.floor((resetIn % 86_400_000) / 3_600_000);
  const gradient = TIER_COLORS[league.tierName] ?? "from-brand-500 to-brand-600";

  return (
    <div className="mx-auto max-w-lg py-6">
      {/* Tier badge */}
      <div className={`rounded-3xl bg-gradient-to-br ${gradient} p-6 text-center text-white`}>
        <div className="text-sm font-semibold opacity-80">Week of {new Date(league.endsAt).toLocaleDateString()}</div>
        <h1 className="mt-1 text-3xl font-bold">{league.tierName} League</h1>
        <div className="mt-1 text-sm opacity-80">Rank #{myRank} · Resets in {days}d {hours}h</div>
      </div>

      {/* Leaderboard */}
      <div className="mt-6 space-y-2">
        {members.map((m) => (
          <div key={m.userId} className={`card flex items-center gap-3 p-3 ${m.isMe ? "ring-2 ring-brand-400 bg-brand-50/30" : ""} ${m.zone === "promote" ? "border-l-4 border-l-green-400" : m.zone === "demote" ? "border-l-4 border-l-rose-400" : ""}`}>
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${m.rank <= 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-ink-700"}`}>
              {m.rank <= 3 ? ["🥇", "🥈", "🥉"][m.rank - 1] : m.rank}
            </div>
            <div className="flex-1">
              <div className={`text-sm font-semibold ${m.isMe ? "text-brand-700" : "text-ink-900"}`}>
                {m.name}{m.isMe && " (you)"}
              </div>
            </div>
            <div className="text-sm font-bold text-ink-900">{m.xp.toLocaleString()} XP</div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-ink-500">
        <span className="mr-4 inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-400" /> Promotion zone</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400" /> Demotion zone</span>
      </div>

      <div className="mt-4 text-center text-xs text-ink-500">
        +10 XP per flashcard · +15 XP per quiz answer · +50 XP for daily goal
      </div>
    </div>
  );
}
