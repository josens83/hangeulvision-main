# HangeulVision AI backend — Railway-ready container.
# Matches the VocaVision AI backend base image (node:20-slim) so both
# services share the same hardening + tooling conventions.

# ─── Builder ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Prisma needs OpenSSL + CA certs at install + runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Prisma client is required for tsc to resolve types; generate before build.
RUN npx prisma generate
RUN npm run build

# ─── Runner ────────────────────────────────────────────────────────────────
FROM node:20-slim AS runner

ENV NODE_ENV=production \
    PORT=4000

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4000

# Healthcheck hits the /health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+ (process.env.PORT||4000) +'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply any pending Prisma migrations at container boot, then start the server.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
