"use client";

import type { Etymology, Hanja } from "@/lib/types";

/**
 * Hanja breakdown visualisation.
 *
 *   예: 경험 (經驗)  →   經 (지날 경) + 驗 (시험할 험)
 *       ─────────
 *        Big syllable tiles with the Hanja character on top,
 *        Korean meaning + sound underneath, plus a composition
 *        equation line and the evolution/origin footer.
 */
export function HanjaBreakdown({ etymology, word }: { etymology: Etymology; word: string }) {
  const hanja = isHanjaArray(etymology.rootWords) ? etymology.rootWords : null;

  if (!hanja) {
    // Native / loanword fallback
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={pillClass(etymology.language)}>{etymology.language}</span>
          <span className="text-sm text-ink-500">{etymology.origin}</span>
        </div>
        {(etymology.rootWords as string[])?.length ? (
          <ul className="space-y-1 text-sm text-ink-700">
            {(etymology.rootWords as string[]).map((r, i) => (
              <li key={i} className="rounded-xl bg-gray-50 px-3 py-2">
                {r}
              </li>
            ))}
          </ul>
        ) : null}
        {etymology.originEn ? (
          <p className="text-sm text-ink-700">{etymology.originEn}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={pillClass(etymology.language)}>{etymology.language}</span>
        <span className="korean text-lg font-semibold text-ink-900">{word}</span>
        <span className="text-ink-300">·</span>
        <span className="font-serif text-lg text-brand-700">{etymology.origin}</span>
      </div>

      {/* Equation line: 經(지날 경)  +  驗(시험할 험) */}
      <div className="flex flex-wrap items-stretch gap-3">
        {hanja.map((h, i) => (
          <HanjaTile key={i} h={h} last={i === hanja.length - 1} />
        ))}
      </div>

      {/* Composition arrow */}
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/50 p-3 text-sm text-ink-700">
        <span className="font-serif text-lg text-brand-700">
          {hanja.map((h) => h.char).join("")}
        </span>
        <span className="text-ink-500">→</span>
        <span className="korean text-lg font-bold text-ink-900">{word}</span>
      </div>

      {etymology.originEn ? (
        <p className="text-sm leading-relaxed text-ink-700">{etymology.originEn}</p>
      ) : null}
      {etymology.evolution ? (
        <p className="text-xs text-ink-500">
          <span className="font-semibold">Evolution · </span>
          {etymology.evolution}
        </p>
      ) : null}
    </div>
  );
}

function HanjaTile({ h, last }: { h: Hanja; last: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-2xl border border-brand-200 bg-white p-3 text-center shadow-card min-w-[110px]">
        <div className="font-serif text-5xl leading-none text-brand-700">{h.char}</div>
        <div className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          {h.meaning}
        </div>
        <div className="korean text-sm font-bold text-ink-900">{h.sound}</div>
      </div>
      {!last ? <span className="text-2xl text-ink-300">+</span> : null}
    </div>
  );
}

function pillClass(lang: Etymology["language"]) {
  const base = "chip text-[11px]";
  if (lang === "Sino-Korean") return `${base} bg-brand-50 text-brand-700`;
  if (lang === "Native") return `${base} bg-emerald-50 text-emerald-700`;
  return `${base} bg-amber-50 text-amber-700`;
}

function isHanjaArray(xs: unknown): xs is Hanja[] {
  return (
    Array.isArray(xs) &&
    xs.length > 0 &&
    typeof xs[0] === "object" &&
    xs[0] !== null &&
    "char" in (xs[0] as object)
  );
}
