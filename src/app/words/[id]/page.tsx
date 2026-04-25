"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { BookmarkButton } from "@/components/BookmarkButton";
import { conceptImageUrl } from "@/lib/visuals";

interface WordDetail {
  id: string; word: string; romanization: string; ipa: string; definitionEn: string;
  partOfSpeech: string; level: number; exam: string;
  etymology?: { origin: string; language: string; rootWords: any; originEn?: string };
  mnemonic?: { englishHint: string; syllables: string[] };
  examples?: Array<{ sentence: string; translation: string }>;
  collocations?: Array<{ phrase: string; translation: string }>;
  visuals?: Array<{ kind: string; url: string }>;
}

export default function WordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [word, setWord] = useState<WordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ word: WordDetail }>(`/words/${id}`).then((r) => {
      if (r.ok && r.data) setWord(r.data.word);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="py-16 text-center animate-pulse text-ink-500">Loading…</div>;
  if (!word) return <div className="py-16 text-center"><h1 className="text-2xl font-bold text-ink-900">Word not found</h1><Link href="/vocabulary" className="btn-primary mt-4 inline-block">Browse vocabulary</Link></div>;

  const img = conceptImageUrl(word as any);
  const hanja = word.etymology?.rootWords as Array<{ char: string; meaning: string; sound: string }> | undefined;

  return (
    <div className="mx-auto max-w-3xl py-6">
      <Link href="/vocabulary" className="text-sm font-semibold text-brand-600">← Vocabulary</Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        {/* Image */}
        <div className="card lg:col-span-3 overflow-hidden">
          {img ? (
            <img src={img} alt={word.word} className="aspect-square w-full object-cover" />
          ) : (
            <div className="aspect-[16/9] bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center">
              <span className="korean text-6xl font-bold text-brand-600">{word.word}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="chip">{word.exam.replace(/_/g, " ")} · L{word.level} · {word.partOfSpeech}</span>
                <h1 className="korean mt-2 text-4xl font-bold text-ink-900">{word.word}</h1>
                <div className="mt-1 text-sm text-ink-500">{word.romanization} · {word.ipa}</div>
                <p className="mt-3 text-lg text-ink-700">{word.definitionEn}</p>
              </div>
              <BookmarkButton wordId={word.id} />
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/chat?wordId=${word.id}`} className="btn-outline flex-1 text-center">Ask AI</Link>
            <Link href="/review" className="btn-primary flex-1 text-center">Practice</Link>
          </div>
        </div>
      </div>

      {/* Hanja */}
      {hanja && Array.isArray(hanja) && hanja.length > 0 && hanja[0]?.char && (
        <section className="card mt-6 p-6">
          <h2 className="text-sm font-semibold text-ink-900">漢字 Etymology</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {hanja.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="rounded-2xl border border-brand-200 bg-white p-3 text-center min-w-[80px]">
                  <div className="font-serif text-3xl text-brand-700">{h.char}</div>
                  <div className="mt-1 text-[10px] text-ink-500">{h.meaning} · {h.sound}</div>
                </div>
                {i < hanja.length - 1 && <span className="text-xl text-ink-300">+</span>}
              </div>
            ))}
          </div>
          {word.etymology?.originEn && <p className="mt-3 text-sm text-ink-700">{word.etymology.originEn}</p>}
        </section>
      )}

      {/* Mnemonic */}
      {word.mnemonic && (
        <section className="card mt-4 p-6">
          <h2 className="text-sm font-semibold text-ink-900">Mnemonic</h2>
          <p className="mt-2 text-ink-700">{word.mnemonic.englishHint}</p>
          {word.mnemonic.syllables?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {word.mnemonic.syllables.map((s, i) => (
                <span key={i} className="korean rounded-xl bg-brand-50 px-3 py-1.5 text-lg font-bold text-brand-700">{s}</span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <section className="card mt-4 p-6">
          <h2 className="text-sm font-semibold text-ink-900">Examples</h2>
          <div className="mt-3 space-y-3">
            {word.examples.map((e, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3">
                <p className="korean text-ink-900">{e.sentence}</p>
                <p className="mt-1 text-sm text-ink-500">{e.translation}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Collocations */}
      {word.collocations && word.collocations.length > 0 && (
        <section className="card mt-4 p-6">
          <h2 className="text-sm font-semibold text-ink-900">Collocations</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {word.collocations.map((c, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3">
                <div className="korean font-semibold text-ink-900">{c.phrase}</div>
                {c.translation && <div className="text-xs text-ink-500">{c.translation}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
