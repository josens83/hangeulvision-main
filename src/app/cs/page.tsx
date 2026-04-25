"use client";

import Link from "next/link";
import { useState } from "react";

const FAQ = [
  { q: "What is HangeulVision AI?", a: "An AI-powered Korean vocabulary learning platform. Every word gets a concept image, hanja breakdown, mnemonic, and spaced-repetition schedule." },
  { q: "Is it free?", a: "Yes! The free tier includes 800 TOPIK I Level 1 words. Upgrade to Basic or Premium for the full library." },
  { q: "What exams does it cover?", a: "TOPIK I (1-2급), TOPIK II (3-6급), KIIP (사회통합프로그램), EPS-TOPIK (고용허가제), and thematic packs." },
  { q: "How does spaced repetition work?", a: "We use the SM-2 algorithm (same as Anki). You grade each card 0-5, and the system schedules reviews so you see words at the optimal time." },
  { q: "Can I use it on my phone?", a: "Yes. HangeulVision is a PWA — install it from your browser and it works offline on iOS and Android." },
  { q: "How do I cancel my subscription?", a: "Go to Settings → Account or contact us. Subscriptions can be cancelled anytime; you keep access until the billing period ends." },
  { q: "I forgot my password.", a: "Use the 'Forgot password?' link on the sign-in page. We'll email you a reset link (valid for 1 hour)." },
  { q: "How are the AI images generated?", a: "Claude AI writes a visual prompt for each word, and Stability AI renders it into a concept illustration." },
];

export default function CsPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="mx-auto max-w-2xl py-6">
      <h1 className="text-3xl font-bold text-ink-900">Help Center</h1>
      <p className="mt-1 text-sm text-ink-500">Frequently asked questions</p>

      <div className="mt-8 space-y-2">
        {FAQ.map((item, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="pr-4 text-sm font-semibold text-ink-900">{item.q}</span>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`shrink-0 text-ink-400 transition ${openIdx === i ? "rotate-180" : ""}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {openIdx === i && (
              <div className="border-t border-gray-100 px-4 py-3 text-sm text-ink-700">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="text-sm text-ink-500">Still need help?</p>
        <Link href="/contact" className="btn-primary mt-3 inline-block">
          Contact us
        </Link>
      </div>
    </div>
  );
}
