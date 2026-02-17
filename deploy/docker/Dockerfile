# ─── Stage 1: Build ──────────────────────────────────────────────────
FROM node:22-slim AS builder

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY packages/shell/package.json packages/shell/
COPY packages/city-search/package.json packages/city-search/
COPY packages/weather-display/package.json packages/weather-display/
COPY packages/stock-tracker/package.json packages/stock-tracker/
COPY packages/podcast-player/package.json packages/podcast-player/
COPY packages/ai-assistant/package.json packages/ai-assistant/
COPY packages/bible-reader/package.json packages/bible-reader/
COPY packages/worship-songs/package.json packages/worship-songs/
COPY packages/notebook/package.json packages/notebook/
COPY packages/baby-tracker/package.json packages/baby-tracker/
COPY packages/child-development/package.json packages/child-development/
COPY packages/chinese-learning/package.json packages/chinese-learning/
COPY packages/english-learning/package.json packages/english-learning/

RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Accept Vite build-time env vars
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_FIREBASE_MEASUREMENT_ID
ARG VITE_FIREBASE_VAPID_KEY
ARG VITE_SENTRY_DSN
ARG VITE_RECAPTCHA_SITE_KEY

# Build shared → all MFEs → assemble static output
RUN pnpm build:shared && \
    NODE_ENV=production pnpm build:mf && \
    node scripts/assemble-firebase.mjs

# ─── Stage 2: Runtime ────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package manifests and install production deps only
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
# Dummy workspace entries to satisfy pnpm (only root deps needed at runtime)
RUN mkdir -p packages/shell packages/city-search packages/weather-display \
    packages/stock-tracker packages/podcast-player packages/ai-assistant \
    packages/bible-reader packages/worship-songs packages/notebook \
    packages/baby-tracker packages/child-development packages/chinese-learning \
    packages/english-learning && \
    for pkg in shell city-search weather-display stock-tracker podcast-player \
    ai-assistant bible-reader worship-songs notebook baby-tracker \
    child-development chinese-learning english-learning; do \
      echo '{"name":"@mycircle/'$pkg'","version":"1.0.0","private":true}' > packages/$pkg/package.json; \
    done

RUN pnpm install --frozen-lockfile --prod && \
    pnpm store prune

# Copy built shared package (needed for runtime imports)
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/shared/src packages/shared/src

# Copy assembled static assets
COPY --from=builder /app/dist/firebase dist/firebase

# Copy server source (executed via tsx at runtime)
COPY server/ server/

# Install tsx for running TypeScript directly
RUN npx tsx --version > /dev/null 2>&1 || pnpm add -w tsx

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "server/production.ts"]
