"use client";

/**
 * /learn — the study surface.
 *
 * Render pipeline (HAR-derived performance plan):
 *   stage 1 · synchronous skeleton                         ~0ms
 *   stage 2 · useStudyBootstrap hero card + progress bar   ~200ms
 *   stage 3 · useStudyQueue warms next 3 words in memory   background
 *   stage 4 · dynamic() StudyStatsPanel                    deferred
 *
 * Performance targets:
 *   • first paint       <1.0s
 *   • first word ready  <1.5s
 *   • next-card tap     <0.2s  (queue hit, no network)
 */

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useStudyBootstrap } from "@/lib/useStudyBootstrap";
import { useStudyQueue } from "@/lib/useStudyQueue";
import { LibrarySkeleton, StatsSkeleton, StudySkeleton } from "@/components/StudySkeleton";
import { SEED_WORDS } from "@/lib/words.seed";
import type { Word } from "@/lib/types";

// Stats panel is not on the critical path — lazy-load it.
const StudyStatsPanel = dynamic(() => import("@/components/StudyStatsPanel"), {
  ssr: false,
  loading: () => <StatsSkeleton />,
});

export default function LearnPage() {
  const { data: bootstrap, isLoading } = useStudyBootstrap();

  // Queue is strictly gated on the bootstrap's firstWord.
  const { queue, prefetched } = useStudyQueue(bootstrap?.firstWord, {
    enabled: !!bootstrap?.firstWord,
  });

  if (isLoading || !bootstrap) {
    return (
      <div className="space-y-10 py-6">
        <StatsSkeleton />
        <StudySkeleton />
        <LibrarySkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6">
      {/* Stats — dynamic import, suspends into StatsSkeleton */}
      <StudyStatsPanel
        dueCount={bootstrap.dueCount}
        totalWords={bootstrap.totalWords}
        streakDays={bootstrap.streakDays}
      />

      {/* Hero — first word (bootstrap payload) */}
      {bootstrap.firstWord ? (
        <StudyHero word={bootstrap.firstWord} dueCount={bootstrap.dueCount} />
      ) : null}

      {/* Buffered next-three queue — shows that preloading is live */}
      {queue.length ? (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink-900">Up next</h2>
              <p className="text-xs text-ink-500">
                Buffered in memory — next tap is instant.
                {prefetched.length ? ` ${prefetched.length} image(s) prefetched.` : ""}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {queue.map((w) => (
              <WordMini key={w.id} word={w} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Full library — renders from the sync seed, after critical path */}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Word library</h1>
            <p className="text-sm text-ink-500">
              {SEED_WORDS.length} seed words · bulk catalog from the content pipeline.
            </p>
          </div>
          <Link href="/review" className="btn-primary">
            Start session
          </Link>
        </div>
        <LibraryGrid />
      </section>
    </div>
  );
}

function StudyHero({ word, dueCount }: { word: Word; dueCount: number }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <section
      aria-label="Continue studying"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-6 sm:p-8"
    >
      <div className="grid items-center gap-6 sm:grid-cols-2">
        <div>
          <span className="chip">
            {dueCount > 0 ? `${dueCount} due today` : "Continue where you left off"}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-ink-900">
            {dueCount > 0 ? "Ready for your review" : "Pick up from here"}
          </h1>
          <p className="mt-2 max-w-md text-sm text-ink-500">
            Tap the card to flip. Swipe in review mode to grade — know it, hard, or
            don't know — and the SRS schedule adapts.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/review" className="btn-primary">
              Start review session
            </Link>
            <Link href={`/learn/${word.id}`} className="btn-outline">
              Deep dive
            </Link>
          </div>
        </div>

        <button
          onClick={() => setFlipped((f) => !f)}
          className="card mx-auto flex aspect-[4/5] w-full max-w-xs flex-col items-center justify-center gap-3 p-6 text-center shadow-pop transition hover:scale-[1.01]"
        >
          {flipped ? (
            <>
              <div className="text-xs font-semibold uppercase text-ink-500">
                {word.romanization}
              </div>
              <div className="text-2xl font-bold text-ink-900">{word.definitionEn}</div>
              {word.examples[0] ? (
                <p className="korean mt-2 text-sm text-ink-500">
                  "{word.examples[0].sentence}"
                </p>
              ) : null}
            </>
          ) : (
            <>
              <span className="chip">{word.exam.replace(/_/g, " ")} · L{word.level}</span>
              <div className="korean text-5xl font-bold text-ink-900 sm:text-6xl">
                {word.word}
              </div>
              <div className="text-xs text-ink-500">Tap to reveal</div>
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function WordMini({ word }: { word: Word }) {
  return (
    <Link
      href={`/learn/${word.id}`}
      className="card flex items-center gap-3 p-4 transition hover:shadow-pop"
    >
      <div className="korean text-2xl font-bold text-ink-900">{word.word}</div>
      <div className="flex-1">
        <div className="text-xs text-ink-500">{word.romanization}</div>
        <div className="text-sm text-ink-700 line-clamp-1">{word.definitionEn}</div>
      </div>
      <div className="chip">L{word.level}</div>
    </Link>
  );
}

function LibraryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SEED_WORDS.map((w) => (
        <Link
          href={`/learn/${w.id}`}
          key={w.id}
          className="card p-5 transition hover:shadow-pop"
        >
          <div className="chip">{w.exam.replace(/_/g, " ")} · L{w.level}</div>
          <div className="korean mt-3 text-3xl font-bold text-ink-900">{w.word}</div>
          <div className="mt-1 text-sm text-ink-500">{w.romanization}</div>
          <div className="mt-3 text-sm text-ink-700">{w.definitionEn}</div>
        </Link>
      ))}
    </div>
  );
}
