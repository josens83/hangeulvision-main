# HangeulVision AI — Backend

Express + Prisma + Postgres service, deployed to Railway (Singapore region)
with Supabase Postgres as the database. Architecturally identical to the
VocaVision AI backend so both services share ops playbooks and CI/CD.

## Local dev

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, DIRECT_URL, JWT_SECRET
npm install
npx prisma generate
npm run prisma:migrate:dev -- --name init   # first-time only
npm run dev                 # http://localhost:4000/health
```

See **[`docs/ENV_SETUP.md`](docs/ENV_SETUP.md)** for the full Supabase
connection-string walk-through (pooler vs direct URL, port 6543 vs 5432,
URL-encoding the password, troubleshooting).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Hot-reloading dev server via `tsx` |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled server (production) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate:dev` | Create + apply a new migration locally |
| `npm run prisma:migrate` | Apply pending migrations (used at boot) |

## Route map

| Prefix | File | Access |
|--------|------|--------|
| `/auth` | `routes/auth.routes.ts` | Public (signup/login) + bearer (`/me`) |
| `/words` | `routes/word.routes.ts` | Public (tier-gated content in controller) |
| `/learning` | `routes/learning.routes.ts` | Bearer |
| `/progress` | `routes/progress.routes.ts` | Bearer |
| `/packages` | `routes/package.routes.ts` | Public + bearer |
| `/subscription` | `routes/subscription.routes.ts` | Bearer |
| `/payments` | `routes/payments.routes.ts` | Bearer (Toss webhook unauth'd, signed) |
| `/paddle` | `routes/paddle.routes.ts` | Bearer + webhook (raw body) |
| `/admin` | `routes/admin.routes.ts` | Bearer + role `admin`/`editor` |
| `/internal` | `routes/internal.routes.ts` | `X-Internal-Key` only |
| `/health`, `/ready` | `src/index.ts` | Public |

All controllers currently return `501 not_implemented` — routes are
scaffolded so the frontend can start wiring against the API surface.
Implementation lands once the Supabase project is provisioned and
`DATABASE_URL` is set.

## Prisma schema

See `prisma/schema.prisma`. The schema mirrors the VocaVision AI data
model (spec §5-3) — same tables, same relations, same `UserProgress` SRS
fields. The only enum change is `ExamCategory`:

```
TOPIK_I · TOPIK_II_MID · TOPIK_II_ADV · KIIP · EPS_TOPIK · THEME · GENERAL
```

Field *meanings* flip direction (e.g. `Word.word` is Korean, `Example.translation`
is English) but the *structure* is identical — the core insight behind 93%
code reuse.

## Deploy (Railway)

- `railway.json` pins the Dockerfile build and `asia-southeast1` region.
- `Dockerfile` (node:20-slim) runs `prisma migrate deploy` at boot, then
  starts the compiled server on `PORT` (default 4000).
- `/health` is the Railway healthcheck target.

## Environment

All env vars live in `.env.example`. Key ones:

- `DATABASE_URL` — Supabase Postgres connection string.
- `JWT_SECRET` — signing key for the `/auth` flow.
- `INTERNAL_API_KEY` — required header for `/internal/*` pipeline calls.
- `PADDLE_*`, `TOSS_*` — payment provider credentials.
- `ADMIN_EMAILS` — bootstrap admin list.
