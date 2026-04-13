"use client";
import { useEffect, useState } from "react";
import type { Hanja, Word } from "@/lib/types";
import { useStore } from "@/lib/store";
import type { Grade } from "@/lib/srs";

export function WordStudy({ word }: { word: Word }) {
  const gradeWord = useStore((s) => s.gradeWord);
  const entry = useStore((s) => s.getEntry(word.id));
  const user = useStore((s) => s.currentUser());
  const [showGrading, setShowGrading] = useState(false);

  const hanjaRoots = Array.isArray(word.etymology?.rootWords) && typeof word.etymology!.rootWords[0] === "object"
    ? (word.etymology!.rootWords as Hanja[])
    : null;

  return (
    <article className="mt-4 space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="chip">
              {word.exam.replace(/_/g, " ")} · Level {word.level} · {word.partOfSpeech}
            </div>
            <h1 className="korean mt-3 text-5xl font-bold text-ink-900 sm:text-6xl">{word.word}</h1>
            <div className="mt-1 text-sm text-ink-500">
              {word.romanization} · {word.ipa}
            </div>
            <p className="mt-3 text-xl text-ink-700">{word.definitionEn}</p>
          </div>
          <PronounceButton text={word.word} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="card lg:col-span-3 overflow-hidden">
          <ConceptArt word={word} />
        </section>
        {word.mnemonic ? (
          <section className="card lg:col-span-2 p-6">
            <SectionTitle emoji="🪄">Mnemonic</SectionTitle>
            <p className="mt-2 text-ink-700">{word.mnemonic.englishHint}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {word.mnemonic.syllables.map((s, i) => (
                <span key={i} className="korean rounded-xl bg-brand-50 px-3 py-1.5 text-lg font-bold text-brand-700">
                  {s}
                </span>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {hanjaRoots ? (
        <section className="card p-6">
          <SectionTitle emoji="🀄️">Hanja / Etymology</SectionTitle>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {hanjaRoots.map((h, i) => (
              <div key={i} className="rounded-2xl border border-brand-200 bg-white p-4 text-center">
                <div className="hanja text-4xl">{h.char}</div>
                <div className="mt-1 text-xs text-ink-500">{h.meaning} · {h.sound}</div>
              </div>
            ))}
          </div>
          {word.etymology?.originEn ? (
            <p className="mt-4 text-sm text-ink-700">{word.etymology.originEn}</p>
          ) : null}
        </section>
      ) : word.etymology ? (
        <section className="card p-6">
          <SectionTitle emoji="🌱">Etymology</SectionTitle>
          <p className="mt-2 text-sm text-ink-700">{word.etymology.originEn ?? word.etymology.origin}</p>
        </section>
      ) : null}

      <section className="card p-6">
        <SectionTitle emoji="📝">Examples</SectionTitle>
        <ol className="mt-3 space-y-3">
          {word.examples.map((e, i) => (
            <li key={i} className="rounded-xl bg-gray-50 p-3">
              <p className="korean text-lg text-ink-900">
                <Highlighted text={e.sentence} highlight={e.highlight} />
              </p>
              <p className="mt-1 text-sm text-ink-500">{e.translation}</p>
            </li>
          ))}
        </ol>
      </section>

      {word.collocations.length ? (
        <section className="card p-6">
          <SectionTitle emoji="🤝">Collocations</SectionTitle>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {word.collocations.map((c, i) => (
              <div key={i} className="rounded-xl bg-gray-50 p-3">
                <div className="korean text-lg text-ink-900">{c.phrase}</div>
                <div className="text-xs text-ink-500">{c.translation}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {word.synonyms?.length || word.antonyms?.length ? (
        <section className="card p-6">
          <SectionTitle emoji="🔁">Related words</SectionTitle>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {word.synonyms?.length ? (
              <div>
                <div className="text-xs font-semibold text-ink-500">Synonyms</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {word.synonyms.map((s) => (
                    <span key={s} className="chip">{s}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {word.antonyms?.length ? (
              <div>
                <div className="text-xs font-semibold text-ink-500">Antonyms</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {word.antonyms.map((s) => (
                    <span key={s} className="chip bg-rose-50 text-rose-600">{s}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="card p-6">
        <SectionTitle emoji="📚">SRS scheduling</SectionTitle>
        {entry ? (
          <p className="mt-2 text-sm text-ink-700">
            Next review in <strong>{entry.interval}</strong> days · ease {entry.ease.toFixed(2)} · reps {entry.reps}
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink-500">
            You haven't graded this word yet. Grade it to schedule future reviews.
          </p>
        )}
        {!showGrading ? (
          <button onClick={() => setShowGrading(true)} className="btn-primary mt-4">
            Grade this word
          </button>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[0, 1, 2, 3, 4, 5].map((g) => (
              <button
                key={g}
                onClick={() => {
                  if (!user) return alert("Please sign in first.");
                  gradeWord(word.id, g as Grade);
                  setShowGrading(false);
                }}
                className={`rounded-xl border p-3 text-center text-sm font-semibold transition ${
                  g < 3
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                }`}
              >
                <div className="text-lg">{g}</div>
                <div className="text-[10px]">
                  {["blank", "wrong", "hard", "ok", "good", "easy"][g]}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </article>
  );
}

function SectionTitle({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
      <span className="text-lg">{emoji}</span>
      {children}
    </div>
  );
}

function Highlighted({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight) return <>{text}</>;
  const parts = text.split(new RegExp(`(${highlight})`));
  return (
    <>
      {parts.map((p, i) =>
        p === highlight ? (
          <mark key={i} className="rounded bg-brand-200/60 px-1 text-brand-800">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function PronounceButton({ text }: { text: string }) {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    setAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);
  if (!available) return null;
  return (
    <button
      className="btn-outline"
      onClick={() => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "ko-KR";
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }}
    >
      🔊 Play
    </button>
  );
}

function ConceptArt({ word }: { word: Word }) {
  // Placeholder "AI concept" art — in production replaced by Stability AI renders.
  const gradientFor = (id: string) => {
    const gradients = [
      "from-indigo-200 via-brand-100 to-rose-200",
      "from-emerald-200 via-brand-100 to-sky-200",
      "from-amber-200 via-orange-100 to-pink-200",
      "from-fuchsia-200 via-purple-100 to-indigo-200",
    ];
    return gradients[Math.abs(hash(id)) % gradients.length];
  };
  return (
    <div className={`aspect-[16/9] w-full bg-gradient-to-br ${gradientFor(word.id)} p-10 text-center`}>
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-6xl">{conceptEmoji(word)}</div>
        <div className="mt-4 text-sm font-semibold text-ink-700">AI Concept · {word.definitionEn}</div>
      </div>
    </div>
  );
}

function conceptEmoji(w: Word) {
  const map: Record<string, string> = {
    w_pogihada: "🎒📝➡️🚪",
    w_gamsahada: "🙏💌✨",
    w_gyeongheom: "🗺️👣",
    w_areumdapda: "🌸🎑",
    w_annyeong: "👋🙂",
    w_gongbuhada: "📚✏️",
    w_sarang: "💖",
    w_chwijik: "💼🏢",
    w_yaksok: "🤝📅",
    w_computer: "💻",
  };
  return map[w.id] ?? "🇰🇷";
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
