# Quickstart: SQL Analytics Layer

**Feature**: 018-sql-analytics
**Date**: 2026-03-31

## Prerequisites

- PostgreSQL database accessible via Cloudflare tunnel
- Cloudflare tunnel Docker container running separately
- Tunnel URL available (e.g., `https://sql.yourdomain.com`)

## Development Setup

### 1. Install SQL client in functions/

```bash
cd functions && npm install pg @types/pg --save
```

### 2. Scaffold the setup MFE

```bash
# Create packages/setup/ following MFE pattern (port 3032)
# Key files: package.json, vite.config.ts, vitest.config.ts, src/components/Setup.tsx
pnpm install
```

### 3. Build shared (after i18n key additions)

```bash
pnpm build:shared
```

### 4. Run locally

```bash
pnpm dev  # Starts all MFEs including setup on port 3032
```

### 5. Verify

1. Open app → click user menu avatar → "Setup" button
2. Enter tunnel URL → Save & Test → see connection status
3. Send an AI chat message → verify SQL record appears
4. Open analytics dashboard → verify data displays

## Key File Locations

### New Files

| File | Purpose |
|------|---------|
| `packages/setup/` | New MFE package (setup page) |
| `functions/src/sqlClient.ts` | PostgreSQL client wrapper + schema init |
| `functions/src/sqlWriter.ts` | Dual-write helper (fire-and-forget SQL inserts) |
| `functions/src/resolvers/sql.ts` | GraphQL resolvers for SQL analytics queries |

### Modified Files

| File | Change |
|------|--------|
| `functions/src/aiChatLogger.ts` | Add SQL dual-write in `logAiChatInteraction()` |
| `functions/src/resolvers/ai.ts` | Add SQL write in `saveBenchmarkRun`, add backfill mutation |
| `functions/src/schema.ts` | Add SQL types, queries, mutations |
| `packages/shared/src/apollo/queries.ts` | Add SQL GraphQL queries |
| `packages/shared/src/i18n/locales/en.ts` | Add setup + analytics i18n keys |
| `packages/shared/src/i18n/locales/es.ts` | Add setup + analytics i18n keys |
| `packages/shared/src/i18n/locales/zh.ts` | Add setup + analytics i18n keys |
| `packages/shell/src/App.tsx` | Add lazy import + route for setup |
| `packages/shell/src/components/layout/UserMenu.tsx` | Add "Setup" menu item |
| `packages/shell/src/components/layout/CommandPalette.tsx` | Add setup nav item |
| `packages/shell/src/routeConfig.ts` | Add breadcrumb label |
| `packages/shell/vite.config.ts` | Add setup remote |
| `packages/shell/src/remotes.d.ts` | Add setup type declaration |
| `packages/model-benchmark/src/components/BenchmarkRunner.tsx` | Remove endpoint management UI |
| `deploy/docker/Dockerfile` | Add setup COPY commands |
| `scripts/assemble-firebase.mjs` | Add setup to copy + mfeDirs |
| `package.json` | Add dev:setup, preview:setup, update dev/dev:mf |
| Root `vitest.config.ts` | Add setup alias |
| `packages/shell/vitest.config.ts` | Add setup alias |
| `packages/shell/test/mocks/` | Add setup mock |
| `docs/architecture.md` | Document SQL analytics layer |

## Testing

```bash
# Unit tests for SQL client, writer, resolvers
cd functions && npx vitest run src/__tests__/sqlClient.test.ts
cd functions && npx vitest run src/__tests__/sqlWriter.test.ts

# Setup MFE tests
pnpm --filter @mycircle/setup test:run

# Full suite
pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck

# Functions typecheck (separate strict tsconfig)
cd functions && npx tsc --noEmit
```

## Architecture Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Setup MFE   │────▶│  GraphQL     │────▶│  Firestore       │
│  (config UI) │     │  Resolvers   │     │  (sqlConnection)  │
└──────────────┘     │              │     └──────────────────┘
                     │              │
┌──────────────┐     │              │     ┌──────────────────┐
│  AI Chat     │────▶│  aiChat*     │──┬─▶│  Firestore       │
│  (existing)  │     │  resolvers   │  │  │  (aiChatLogs)    │
└──────────────┘     │              │  │  └──────────────────┘
                     │              │  │
                     │              │  └─▶┌──────────────────┐
                     │              │     │  SQL (via tunnel) │
                     │  sql*        │────▶│  (analytics)      │
                     │  resolvers   │     └──────────────────┘
                     └──────────────┘
                            ▲
┌──────────────┐            │
│  Analytics   │────────────┘
│  Dashboard   │  (sqlAnalyticsSummary, sqlLatencyPercentiles, etc.)
└──────────────┘
```
