"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { api, getAuthToken } from "@/lib/api";

interface Deck { id: string; name: string; exam: string | null; wordCount: number; updatedAt: string; }

export default function DecksPage() {
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { if (!user) router.replace("/signin"); }, [user, router]);

  const load = useCallback(async () => {
    if (!getAuthToken()) return;
    const r = await api.get<{ decks: Deck[] }>("/decks");
    if (r.ok && r.data) setDecks(r.data.decks);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    await api.post("/decks", { name: newName.trim() });
    setCreating(false);
    setNewName("");
    setShowCreate(false);
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/decks/${id}`);
    setDecks((d) => d.filter((x) => x.id !== id));
  };

  if (!user) return null;

  return (
    <div className="py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900">My Decks</h1>
          <p className="text-sm text-ink-500">{decks.length} custom word lists</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">+ Create Deck</button>
      </div>

      {showCreate && (
        <div className="card mt-4 flex gap-2 p-4">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") create(); }} placeholder="Deck name…" className="inp flex-1" autoFocus />
          <button onClick={create} disabled={creating || !newName.trim()} className="btn-primary disabled:opacity-50">{creating ? "…" : "Create"}</button>
          <button onClick={() => setShowCreate(false)} className="btn-ghost">Cancel</button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid animate-pulse gap-4 sm:grid-cols-2">{[1, 2, 3].map((i) => <div key={i} className="card h-28 bg-gray-200" />)}</div>
      ) : decks.length === 0 ? (
        <div className="mt-16 text-center">
          <div className="text-5xl">📦</div>
          <h2 className="mt-4 text-xl font-bold text-ink-900">No decks yet</h2>
          <p className="mt-1 text-sm text-ink-500">Create a custom word list to organize your study.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {decks.map((d) => (
            <div key={d.id} className="card flex items-center gap-4 p-5">
              <Link href={`/decks/${d.id}`} className="flex-1 hover:opacity-80">
                <div className="font-bold text-ink-900">{d.name}</div>
                <div className="text-xs text-ink-500">{d.wordCount} words · {d.exam?.replace(/_/g, " ") ?? "Mixed"}</div>
              </Link>
              <button onClick={() => remove(d.id)} className="rounded-full p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete deck">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
