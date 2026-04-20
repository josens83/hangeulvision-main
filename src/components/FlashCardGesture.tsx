"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Hanja, Word } from "@/lib/types";
import type { Grade } from "@/lib/srs";
import { conceptImageUrl } from "@/lib/visuals";

/**
 * VocaVision-style flashcard with gesture controls.
 *
 *   • Horizontal swipe:   ← "don't know" (grade 1) · → "know" (grade 5)
 *   • Vertical swipe up:  mark "hard" (grade 3)
 *   • Tap the card:       flip front ↔ back
 *   • Tap the art panel:  toggle Concept ↔ Mnemonic image
 *
 * Reuses the algorithm + UX beats from VocaVision's FlashCardGesture.tsx
 * so the two apps feel identical to returning learners.
 */

export type FlashAction = "know" | "dontKnow" | "hard";
export interface FlashCardGestureProps {
  word: Word;
  onAction: (action: FlashAction, grade: Grade) => void;
}

const SWIPE_THRESHOLD = 80;   // px
const VELOCITY_THRESHOLD = 0.5; // px / ms

function FlashCardGestureInner({ word, onAction }: FlashCardGestureProps) {
  const [flipped, setFlipped] = useState(false);
  const [art, setArt] = useState<"concept" | "mnemonic">("concept");
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [leaving, setLeaving] = useState<"left" | "right" | "up" | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const movedRef = useRef(false);

  // Keep the latest handler in a ref so the memoized component can safely
  // skip re-renders when the parent passes a fresh closure — the internal
  // `commit` always calls the freshest handler via `onActionRef.current`.
  const onActionRef = useRef(onAction);
  useEffect(() => {
    onActionRef.current = onAction;
  }, [onAction]);

  // Reset state whenever the card changes.
  useEffect(() => {
    setFlipped(false);
    setArt("concept");
    setDrag({ x: 0, y: 0 });
    setLeaving(null);
    startRef.current = null;
    movedRef.current = false;
  }, [word.id]);

  const commit = useCallback((action: FlashAction) => {
    const exitDir =
      action === "know" ? "right" : action === "dontKnow" ? "left" : "up";
    const grade: Grade = action === "know" ? 5 : action === "hard" ? 3 : 1;
    setLeaving(exitDir);
    // Let the exit animation play before handing off to the parent.
    window.setTimeout(() => onActionRef.current(action, grade), 180);
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    startRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    movedRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!startRef.current) return;
    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movedRef.current = true;
    setDrag({ x: dx, y: dy });
  };

  const onPointerUp = () => {
    if (!startRef.current) return;
    const { x, y, t } = startRef.current;
    startRef.current = null;
    const dx = drag.x;
    const dy = drag.y;
    const dt = Math.max(1, performance.now() - t);
    const vx = Math.abs(dx) / dt;
    const vy = Math.abs(dy) / dt;

    if (dx > SWIPE_THRESHOLD || (dx > 20 && vx > VELOCITY_THRESHOLD)) {
      commit("know");
      return;
    }
    if (dx < -SWIPE_THRESHOLD || (dx < -20 && vx > VELOCITY_THRESHOLD)) {
      commit("dontKnow");
      return;
    }
    if (dy < -SWIPE_THRESHOLD || (dy < -20 && vy > VELOCITY_THRESHOLD)) {
      commit("hard");
      return;
    }

    // Below threshold — treat as a tap.
    if (!movedRef.current) {
      setFlipped((f) => !f);
    }
    setDrag({ x: 0, y: 0 });
    // silence unused
    void x;
    void y;
  };

  // Keyboard shortcuts for desktop — matches VocaVision.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (leaving) return;
      if (e.key === "ArrowRight") commit("know");
      else if (e.key === "ArrowLeft") commit("dontKnow");
      else if (e.key === "ArrowUp") commit("hard");
      else if (e.key === "Enter") commit("know");
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commit, leaving]);

  const rotation = Math.max(-15, Math.min(15, drag.x / 12));
  const cardStyle = useMemo(() => {
    if (leaving === "left") {
      return { transform: "translate(-120vw, 0) rotate(-30deg)", opacity: 0 };
    }
    if (leaving === "right") {
      return { transform: "translate(120vw, 0) rotate(30deg)", opacity: 0 };
    }
    if (leaving === "up") {
      return { transform: "translate(0, -120vh) rotate(0)", opacity: 0 };
    }
    return {
      transform: `translate(${drag.x}px, ${drag.y}px) rotate(${rotation}deg)`,
    };
  }, [leaving, drag.x, drag.y, rotation]);

  const intent = drag.x > 40 ? "know" : drag.x < -40 ? "dontKnow" : drag.y < -40 ? "hard" : null;

  return (
    <div className="relative mx-auto w-full max-w-md select-none touch-none">
      {/* Swipe intent badges */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-3">
        <div
          className={`rounded-2xl border-2 border-rose-400 bg-rose-500/90 px-3 py-1.5 text-sm font-bold text-white transition ${
            intent === "dontKnow" ? "opacity-100 scale-105" : "opacity-0"
          }`}
        >
          DON'T KNOW
        </div>
        <div
          className={`rounded-2xl border-2 border-brand-400 bg-brand-500/90 px-3 py-1.5 text-sm font-bold text-white transition ${
            intent === "know" ? "opacity-100 scale-105" : "opacity-0"
          }`}
        >
          KNOW IT
        </div>
      </div>
      <div
        className={`pointer-events-none absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full border-2 border-amber-400 bg-amber-500/90 px-3 py-1 text-xs font-bold text-white transition ${
          intent === "hard" ? "opacity-100" : "opacity-0"
        }`}
      >
        HARD ↑
      </div>

      <div
        ref={cardRef}
        className="card relative aspect-[3/4] w-full p-5 transition-[transform,opacity] duration-200 ease-out touch-none"
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {flipped ? <CardBack word={word} /> : <CardFront word={word} art={art} setArt={setArt} />}
      </div>

      {/* Button bar — visible on every device */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <button
          onClick={() => commit("dontKnow")}
          className="rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-100"
        >
          ← Don't know
        </button>
        <button
          onClick={() => commit("hard")}
          className="rounded-2xl border border-amber-200 bg-amber-50 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-100"
        >
          ↑ Hard
        </button>
        <button
          onClick={() => commit("know")}
          className="rounded-2xl border border-brand-300 bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Know it →
        </button>
      </div>
      <div className="mt-2 text-center text-[11px] text-ink-500">
        Swipe · tap to flip · arrow keys / Enter / Space on desktop
      </div>
    </div>
  );
}

function CardFront({
  word,
  art,
  setArt,
}: {
  word: Word;
  art: "concept" | "mnemonic";
  setArt: (a: "concept" | "mnemonic") => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <span className="chip">{word.exam.replace(/_/g, " ")} · L{word.level}</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setArt(art === "concept" ? "mnemonic" : "concept");
          }}
          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-ink-700 hover:bg-gray-200"
        >
          {art === "concept" ? "🎨 Concept" : "🪄 Mnemonic"}
        </button>
      </div>
      <div
        className="mt-3 flex flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br"
        style={{ backgroundImage: gradientFor(word.id) }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setArt(art === "concept" ? "mnemonic" : "concept");
        }}
      >
        <ConceptOrEmoji word={word} art={art} />
      </div>
      <div className="mt-4 text-center">
        <div className="korean text-4xl font-bold text-ink-900 sm:text-5xl">{word.word}</div>
        <div className="mt-1 text-xs text-ink-500">Tap to reveal meaning</div>
      </div>
    </div>
  );
}

function CardBack({ word }: { word: Word }) {
  const first = word.examples[0];
  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="text-xs font-semibold text-ink-500">
          {word.romanization} · {word.ipa}
        </div>
        <div className="korean mt-2 text-2xl font-bold text-ink-900">{word.word}</div>
        <div className="mt-3 text-lg text-ink-900">{word.definitionEn}</div>
      </div>
      {first ? (
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="korean text-sm text-ink-900">"{first.sentence}"</p>
          <p className="mt-1 text-xs text-ink-500">{first.translation}</p>
        </div>
      ) : null}
      {word.synonyms?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {word.synonyms.slice(0, 3).map((s) => (
            <span key={s} className="chip">
              ≈ {s}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ConceptOrEmoji({ word, art }: { word: Word; art: "concept" | "mnemonic" }) {
  const imgUrl = art === "concept" ? conceptImageUrl(word as any) : null;
  const [imgError, setImgError] = useState(false);

  // Reset error state when the word changes (new card).
  useEffect(() => setImgError(false), [word.id]);

  if (imgUrl && !imgError) {
    return (
      <img
        src={imgUrl}
        alt={word.word}
        loading="lazy"
        onError={() => setImgError(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div className="text-center">
      <div className="text-5xl sm:text-6xl">
        {art === "concept" ? conceptEmoji(word) : mnemonicEmoji(word)}
      </div>
      <div className="mt-3 text-xs font-semibold text-ink-700">
        {art === "concept" ? "AI Concept" : "AI Mnemonic"}
      </div>
      {art === "mnemonic" && word.mnemonic ? (
        <div className="mt-1 max-w-[220px] text-[11px] text-ink-500">
          {word.mnemonic.englishHint}
        </div>
      ) : null}
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

function mnemonicEmoji(w: Word) {
  const map: Record<string, string> = {
    w_pogihada: "📮🏃‍♂️✨",
    w_gamsahada: "🍬💬",
    w_gyeongheom: "🏠📖",
    w_areumdapda: "🏠🌞",
    w_annyeong: "👴👋",
    w_gongbuhada: "🔔📖",
    w_sarang: "🎤❤️",
    w_chwijik: "✅💼",
    w_yaksok: "🤝🔒",
    w_computer: "💻🗣️",
  };
  return map[w.id] ?? "🪄";
}

function gradientFor(id: string) {
  const gradients = [
    "linear-gradient(135deg, #e0e7ff 0%, #c8f7f0 50%, #fecaca 100%)",
    "linear-gradient(135deg, #bbf7d0 0%, #c8f7f0 50%, #bae6fd 100%)",
    "linear-gradient(135deg, #fde68a 0%, #ffedd5 50%, #fbcfe8 100%)",
    "linear-gradient(135deg, #f5d0fe 0%, #e9d5ff 50%, #c7d2fe 100%)",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return gradients[Math.abs(h) % gradients.length];
}

/**
 * Memoized export. Custom comparator fires a re-render *only* when the
 * active word changes — unrelated parent re-renders (timer ticks, tally
 * updates, streak animations) no longer invalidate the card. Combined
 * with the useStudyQueue buffer this is what lets card transitions drop
 * from ~0.8s (mount + layout + image decode) to ~0.2s (pure style swap).
 */
export const FlashCardGesture = memo(
  FlashCardGestureInner,
  // Compare only on word identity — handler closures from the parent are
  // expected to change on every render, and the latest handler is read
  // through useEventCallback-style ref patterns inside the component.
  (prev, next) => prev.word.id === next.word.id,
);
