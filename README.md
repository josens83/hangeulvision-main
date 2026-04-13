# HangeulVision AI

> Korean, Visualized. — AI-powered Korean vocabulary learning for TOPIK, KIIP and EPS.

Built on the VocaVision AI platform (93% code reuse). This repo holds the
web / mobile / app client for HangeulVision. A single Next.js 14 codebase powers:

- 🖥️  **Web** — Next.js App Router, SSR, Tailwind.
- 📱 **Mobile web** — responsive layouts, touch-first flashcards.
- 📦 **PWA** — installable on iOS / Android / desktop, offline-capable via `public/sw.js`.
- 🧬 **Native wrapper** — Capacitor build (pipeline wired up, ships with v1.0).

## Quickstart

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Key routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/exams` · `/exams/[id]` | Exam catalogue (TOPIK I / II / KIIP / EPS / Theme) |
| `/learn` · `/learn/[id]` | Word library + rich word study page (concept art, hanja, mnemonic, examples, collocations, synonyms) |
| `/review` | SRS flashcard review (SM-2 algorithm, identical to VocaVision) |
| `/dashboard` | Learner home |
| `/pricing` · `/checkout` | Freemium + subscription + one-time packs (TossPayments / Paddle stubs) |
| `/admin` | Ops dashboard (users, revenue, content inventory, pipeline triggers) |
| `/install` | PWA install instructions for iOS / Android / desktop |

## Architecture

```
src/
  app/              Next.js App Router pages
  components/       Shared UI (Navbar, Footer, Logo, WordStudy, InstallPrompt)
  lib/
    types.ts        Domain models (User, Word, Progress, Payment, Etymology, Hanja)
    exams.ts        Exam taxonomy (ExamCategory enum + metadata)
    pricing.ts      Plans, one-time packages, access-control helpers
    srs.ts          SM-2 spaced repetition engine
    store.ts        Zustand + localStorage (auth, progress, payments)
    words.seed.ts   10 seed TOPIK words — bulk content arrives via the Claude/Stability pipeline
public/
  manifest.webmanifest  PWA manifest
  sw.js                 Service worker (app shell + dynamic cache)
  icon.svg              Logo
```

The schema mirrors the Supabase / Postgres tables defined in the spec (§ 5-3);
the MVP persists to `localStorage` so the app works end-to-end without a backend.
Wiring Supabase / NestJS is a drop-in replacement of `src/lib/store.ts`.

## Content pipeline (5월 초)

Seed data is 10 words only. The full TOPIK I (2,000 words) catalog is produced
by the content pipeline inherited from VocaVision:

- `POST /internal/generate-content-continuous` — Claude writes definitions,
  etymology, examples, mnemonics.
- `POST /internal/images/concept` — Stability AI generates the concept scene.
- `POST /internal/images/mnemonic` — Stability AI generates the syllable-based
  mnemonic image.

See `src/app/admin/page.tsx` for the operator view.

## Payments

- **Korea** — TossPayments (카드 · 계좌이체).
- **Global** — Paddle (credit card).

Both are stubbed in `src/app/checkout/page.tsx` with a mock handler. Product IDs
are configured via `.env.example`.

## Spec

See the service plan shipped by the CTO (2026-04-13). Key decisions:

| # | Decision | Choice |
|---|----------|--------|
| 1 | Service name | **HangeulVision AI** |
| 2 | Domain | `hangeulvision.app` |
| 4 | MVP scope | **TOPIK I (2,000 words)** |
| 5 | UI language | English only (ja/vi/zh follow) |
| 6 | DB isolation | Separate Supabase project |
| 7 | Repo | Fork (this repo) |
| 8 | Business entity | Unipath (same as VocaVision) |

## License

© Unipath. All rights reserved.
