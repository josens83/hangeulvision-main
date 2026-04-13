import Link from "next/link";
import { EXAMS } from "@/lib/exams";
import { SEED_WORDS } from "@/lib/words.seed";

export default function HomePage() {
  const featured = SEED_WORDS.slice(0, 3);
  return (
    <div className="space-y-24">
      {/* HERO */}
      <section className="animate-fadeIn pt-4 sm:pt-10">
        <div className="grid items-center gap-10 sm:grid-cols-2">
          <div>
            <span className="chip">🇰🇷 World's first AI-image Korean vocabulary</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl">
              Korean,{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent">
                Visualized.
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-lg text-ink-500">
              Every word gets an AI-generated concept image, hanja breakdown, English mnemonic
              and spaced-repetition schedule. Built for TOPIK, KIIP and EPS learners.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">Start free — 800 words</Link>
              <Link href="/learn" className="btn-outline">See a word</Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-ink-500">
              <span>⭐ 13,500+ words planned</span>
              <span>🌐 TOPIK · KIIP · EPS</span>
              <span>📱 Web · iOS · Android</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-brand-200/40 blur-3xl" />
            <div className="relative mx-auto max-w-sm -rotate-1 transform animate-floaty">
              <WordPreview />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["550K+", "TOPIK test takers / yr"],
          ["16M+", "Korean learners worldwide"],
          ["87", "Countries with TOPIK"],
          ["93%", "VocaVision tech reused"],
        ].map(([v, l]) => (
          <div key={l} className="card p-5 text-center">
            <div className="text-2xl font-bold text-brand-600">{v}</div>
            <div className="mt-1 text-xs text-ink-500">{l}</div>
          </div>
        ))}
      </section>

      {/* FEATURE GRID */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900">Eight sections per word</h2>
        <p className="mt-1 text-ink-500">
          The same rich anatomy VocaVision pioneered for English — now for Korean.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["🎨", "Concept image", "AI-generated scene that captures the meaning."],
            ["🪄", "Mnemonic image", "Syllable-based memory hook for English speakers."],
            ["📝", "4 Example sentences", "Korean with highlighted target and English gloss."],
            ["🤝", "Collocations", "Natural phrases like 약속을 지키다 or 꿈을 포기하다."],
            ["🀄️", "Hanja / Etymology", "Breakdown for 60%+ of Sino-Korean vocabulary."],
            ["🧬", "Morphology", "Prefix + root + suffix, verb/adjective analysis."],
            ["🔁", "Synonyms / Antonyms", "Related words with usage notes."],
            ["🔊", "Pronunciation", "IPA + romanization + native TTS audio."],
          ].map(([emoji, title, desc]) => (
            <div key={title} className="card p-5">
              <div className="text-2xl">{emoji}</div>
              <div className="mt-3 font-semibold text-ink-900">{title}</div>
              <div className="mt-1 text-sm text-ink-500">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED WORDS */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">Sample from TOPIK I</h2>
            <p className="text-ink-500 text-sm">The first three words — free for every learner.</p>
          </div>
          <Link href="/learn" className="btn-ghost">Browse all →</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {featured.map((w) => (
            <Link href={`/learn/${w.id}`} key={w.id} className="card block p-5 transition hover:shadow-pop">
              <div className="chip mb-3">{w.exam.replace("_", " ")} · L{w.level}</div>
              <div className="korean text-3xl font-bold text-ink-900">{w.word}</div>
              <div className="mt-1 text-sm text-ink-500">{w.romanization} · {w.ipa}</div>
              <div className="mt-3 text-sm text-ink-700">{w.definitionEn}</div>
              {w.etymology?.rootWords && Array.isArray(w.etymology.rootWords) && typeof w.etymology.rootWords[0] === "object" ? (
                <div className="mt-4 flex gap-2">
                  {(w.etymology.rootWords as any[]).map((h, i) => (
                    <span key={i} className="hanja border-b-2 border-brand-300 px-1">
                      {h.char}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      </section>

      {/* EXAM LINEUP */}
      <section>
        <h2 className="text-2xl font-bold text-ink-900">Built for every Korean exam</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMS.map((e) => (
            <Link href={`/exams/${e.id}`} key={e.id} className="card block p-5 transition hover:shadow-pop">
              <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl text-xl bg-gradient-to-br ${e.color}`}>{e.emoji}</div>
              <div className="font-semibold text-ink-900">{e.name}</div>
              <div className="text-sm text-ink-500">{e.nameEn}</div>
              <div className="mt-2 text-xs text-ink-500">{e.levelRange} · {e.wordCount.toLocaleString()} words</div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-500 to-brand-400 p-10 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
          Ready to see Korean the way you remember it?
        </h2>
        <p className="mt-2 max-w-xl text-white/85">
          Free tier is 800 words of TOPIK I — no card required. Upgrade any time.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/signup" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Create account
          </Link>
          <Link href="/pricing" className="btn border border-white/60 text-white hover:bg-white/10">
            View plans
          </Link>
        </div>
      </section>
    </div>
  );
}

function WordPreview() {
  return (
    <div className="card p-6">
      <div className="chip">TOPIK I · Verb</div>
      <div className="korean mt-3 text-5xl font-bold text-ink-900">포기하다</div>
      <div className="mt-1 text-sm text-ink-500">pogihada · /po̞.ɡi.ɦa̠.da/</div>
      <div className="mt-4 aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-100 via-white to-indigo-100 p-3 text-xs text-ink-500">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="text-4xl">🎒📝➡️🚪</div>
            <div className="mt-2">AI Concept · "to abandon"</div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <span className="hanja border-b-2 border-brand-300 px-1">抛</span>
        <span className="text-xs text-ink-500">throw</span>
        <span className="mx-1 text-ink-300">+</span>
        <span className="hanja border-b-2 border-brand-300 px-1">棄</span>
        <span className="text-xs text-ink-500">abandon</span>
      </div>
    </div>
  );
}
