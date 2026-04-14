# Backend Environment Setup

Step-by-step guide to wire `backend/` to the Supabase Postgres database
and run the first Prisma migration.

- **Supabase project ref**: `bplufwtrokacdpxwyttv`
- **Region**: `ap-northeast-2` (Seoul)
- **Pooler host**: `aws-0-ap-northeast-2.pooler.supabase.com`

---

## 1. Grab the database password

Supabase Dashboard → your project (`bplufwtrokacdpxwyttv`) →
**Project Settings → Database → Database password**.

- Reset the password if you don't have it saved anywhere.
- URL-encode any special characters (`@` → `%40`, `#` → `%23`, etc.).

---

## 2. Fill in `backend/.env`

```bash
cd backend
cp .env.example .env
```

Edit `.env` — only two variables are strictly required to run migrations:

| Variable | Value | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | Pooled URL on port **6543** | Runtime queries |
| `DIRECT_URL`   | Direct URL on port **5432** | `prisma migrate` only |

### `DATABASE_URL` — Transaction pooler (port 6543)

Use this for all runtime Prisma queries. It's serverless-safe.

```
postgresql://postgres.bplufwtrokacdpxwyttv:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### `DIRECT_URL` — Session pooler / direct (port 5432)

Prisma migrate needs a direct connection because the Transaction pooler
doesn't support prepared statements and advisory locks.

**Option A — Session pooler** (same host, port 5432) — recommended:

```
postgresql://postgres.bplufwtrokacdpxwyttv:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**Option B — Direct host** (bypasses the pooler entirely):

```
postgresql://postgres:PASSWORD@db.bplufwtrokacdpxwyttv.supabase.co:5432/postgres
```

Option B requires the direct DB host to be reachable from your network —
fine for local dev and Railway, sometimes blocked on corporate networks.

---

## 3. Verify the schema

```bash
npm install
npx prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

---

## 4. Generate the Prisma client

```bash
npm run prisma:generate
```

Expected: `✔ Generated Prisma Client (v5.22.0) to ./node_modules/@prisma/client`

---

## 5. Run the first migration

### Local / dev (creates a migration + applies it)

```bash
npm run prisma:migrate:dev -- --name init
```

This:
1. Creates `prisma/migrations/<timestamp>_init/migration.sql`
2. Applies it to the database via `DIRECT_URL`
3. Re-generates the Prisma client

### Production / CI (applies existing migrations only)

```bash
npm run prisma:migrate
```

This runs `prisma migrate deploy` — idempotent, safe for rerun, used by
the Railway container's entrypoint.

---

## 6. Sanity-check the connection

```bash
npm run prisma:studio   # opens Prisma Studio on http://localhost:5555
# or, inline:
node -e "require('./dist/prisma').prisma.\$queryRaw\`SELECT NOW() AS now\`.then(r=>console.log(r)).finally(()=>process.exit())"
```

---

## 7. Seed the database (optional)

Ship a `prisma/seed.ts` script that mirrors the 50 frontend seed words
plus the six TOPIK / KIIP / EPS exam categories. Run with:

```bash
npm run db:seed
```

(Not yet authored — lands when the backend controllers start wiring real logic.)

---

## 8. Production deploy (Railway)

Set the same two variables in Railway's **Variables** tab:

- `DATABASE_URL` — pooler (6543)
- `DIRECT_URL`   — direct (5432)

Plus the rest of `.env.example` (`JWT_SECRET`, `ADMIN_EMAILS`,
`INTERNAL_API_KEY`, payment keys, etc.).

The Dockerfile runs `npx prisma migrate deploy` at container boot, so
every deploy applies any pending migrations automatically.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `P1001 Can't reach database server` | Password wrong, or firewall blocking port 5432/6543 | Re-confirm password in Supabase dashboard; try Option B direct host |
| `P3014 Prisma schema and database are out of sync` | Migration folder diverged from prod DB | `prisma migrate resolve --applied <migration-name>` |
| `Transactions are not supported by the pooler` | Migration ran against the Transaction pooler (6543) instead of `DIRECT_URL` | Confirm `DIRECT_URL` is set and on port 5432 |
| `prepared statement "s0" already exists` | Using port 6543 for migrations | Same as above — must use 5432 for migrations |
| Special chars in password break the URL | Not URL-encoded | `@` → `%40`, `#` → `%23`, `:` → `%3A`, `/` → `%2F` |

---

## Reference: URL anatomy

```
postgresql://postgres.bplufwtrokacdpxwyttv:PASSWORD@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
            └──────────── user ───────────┘ └─pwd─┘ └────────────── host ─────────────────┘ └port┘ └─db─┘
```

- The `postgres.<project-ref>` user format is **required** for the Supabase
  pooler — using plain `postgres` returns `Tenant or user not found`.
- Ports are fixed: **6543** for the Transaction pooler, **5432** for the
  Session pooler / direct host.
