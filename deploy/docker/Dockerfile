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
COPY packages/flashcards/package.json packages/flashcards/
COPY packages/work-tracker/package.json packages/work-tracker/
COPY packages/cloud-files/package.json packages/cloud-files/

RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build shared → all MFEs → assemble static output
# Vite build-time config is injected via BuildKit secret mounts so values
# never persist in image layers (unlike ARG, which is visible in `docker history`).
# Even though these are public Firebase client keys, secret mounts keep them
# out of the image metadata as a defence-in-depth measure.
RUN --mount=type=secret,id=VITE_FIREBASE_API_KEY \
    --mount=type=secret,id=VITE_FIREBASE_AUTH_DOMAIN \
    --mount=type=secret,id=VITE_FIREBASE_PROJECT_ID \
    --mount=type=secret,id=VITE_FIREBASE_STORAGE_BUCKET \
    --mount=type=secret,id=VITE_FIREBASE_MESSAGING_SENDER_ID \
    --mount=type=secret,id=VITE_FIREBASE_APP_ID \
    --mount=type=secret,id=VITE_FIREBASE_MEASUREMENT_ID \
    --mount=type=secret,id=VITE_FIREBASE_VAPID_KEY \
    for f in /run/secrets/VITE_*; do \
      [ -f "$f" ] && export "$(basename "$f")=$(cat "$f")"; \
    done && \
    pnpm build:shared && \
    NODE_ENV=production pnpm build:mf && \
    node scripts/assemble-firebase.mjs

# ─── Stage 2: Runtime ────────────────────────────────────────────────
FROM node:22-slim AS runtime

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy package manifests (real files so lockfile stays in sync)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/packages/shared/package.json packages/shared/
COPY --from=builder /app/packages/shell/package.json packages/shell/
COPY --from=builder /app/packages/city-search/package.json packages/city-search/
COPY --from=builder /app/packages/weather-display/package.json packages/weather-display/
COPY --from=builder /app/packages/stock-tracker/package.json packages/stock-tracker/
COPY --from=builder /app/packages/podcast-player/package.json packages/podcast-player/
COPY --from=builder /app/packages/ai-assistant/package.json packages/ai-assistant/
COPY --from=builder /app/packages/bible-reader/package.json packages/bible-reader/
COPY --from=builder /app/packages/worship-songs/package.json packages/worship-songs/
COPY --from=builder /app/packages/notebook/package.json packages/notebook/
COPY --from=builder /app/packages/baby-tracker/package.json packages/baby-tracker/
COPY --from=builder /app/packages/child-development/package.json packages/child-development/
COPY --from=builder /app/packages/flashcards/package.json packages/flashcards/
COPY --from=builder /app/packages/work-tracker/package.json packages/work-tracker/
COPY --from=builder /app/packages/cloud-files/package.json packages/cloud-files/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts && \
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
