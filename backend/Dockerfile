# HangeulVision AI backend — Railway-ready container.
# Structure matches the VocaVision AI backend (node:20-slim, 4-stage
# base/deps/builder/runner) so both services share ops + CI conventions.

FROM node:20-slim AS base

# ─── deps ──────────────────────────────────────────────────────────────────
FROM base AS deps
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json ./
COPY prisma ./prisma/
RUN npm install

# ─── builder ───────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ─── runner ────────────────────────────────────────────────────────────────
FROM base AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
EXPOSE 8080
ENV PORT=8080
CMD ["npm", "start"]
