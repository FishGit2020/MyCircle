# Implementation Plan: SQL Analytics Layer

**Branch**: `018-sql-analytics` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-sql-analytics/spec.md`

## Summary

Add a supplementary SQL analytics layer to MyCircle. A new Setup MFE (`packages/setup`) provides a configuration page accessible from the user menu where users configure a Cloudflare tunnel URL to an external PostgreSQL database and manage AI endpoints centrally. Cloud Functions dual-write AI chat logs and benchmark results to both Firestore (primary) and SQL (supplementary, fire-and-forget). New GraphQL resolvers query SQL for analytics: usage summaries with cost estimates, latency percentiles (P50/P90/P99), tool co-occurrence patterns, benchmark performance trends, and full-text chat history search. A user-initiated "Import History" backfill migrates existing Firestore data to SQL in resumable batches.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions, Node 22)
**Primary Dependencies**: React 18, Apollo Client/Server, `pg` (node-postgres, new in functions/), Tailwind CSS
**Storage**: PostgreSQL (external, via Cloudflare tunnel) + Firestore (existing, primary)
**Testing**: Vitest + React Testing Library (frontend), Vitest (functions/)
**Target Platform**: Web (desktop + mobile responsive)
**Project Type**: Web application (MFE + Cloud Functions)
**Performance Goals**: Analytics dashboard <5s load, chat search <3s, dual-write zero impact on chat latency
**Constraints**: SQL writes fire-and-forget, graceful degradation when SQL unavailable, no regressions
**Scale/Scope**: Up to 100,000 chat log records, 50,000 backfill records in <10 minutes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | New `packages/setup` MFE follows standard federation pattern. All imports from `@mycircle/shared`. |
| II. Complete Integration | PASS | All 20+ integration points identified in research.md Decision 7. Setup is a utility page (like /trash) — not in BottomNav/widgets. |
| III. GraphQL-First Data Layer | PASS | All analytics queries go through new GraphQL resolvers (`sql*` queries). Frontend uses `useQuery`/`useMutation` from shared. No REST endpoints added. `pg` is used server-side only in Cloud Functions. |
| IV. Inclusive by Default | PASS | i18n keys in all 3 locales, dark mode variants, semantic HTML, PageContent wrapper. |
| V. Fast Tests, Safe Code | PASS | Mock `pg` client in tests, no real DB connections. `userEvent.setup({ delay: null })`. SSRF: tunnel URL is user-configured and server-side only. |
| VI. Simplicity | PASS | 4 SQL tables, raw SQL queries (no ORM), single dual-write integration point. EndpointManager component reused, not recreated. |

**Post-Phase 1 Re-check**: All gates still pass. No new violations introduced by data model or contract design.

## Project Structure

### Documentation (this feature)

```text
specs/018-sql-analytics/
├── plan.md              # This file
├── research.md          # Phase 0: Technical decisions
├── data-model.md        # Phase 1: SQL schema + Firestore docs
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/
│   └── graphql-schema-additions.md  # Phase 1: New GraphQL types/queries/mutations
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# New MFE package
packages/setup/
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── postcss.config.js
├── index.html
├── tsconfig.json
├── test/
│   └── setup.ts
└── src/
    ├── main.tsx                          # Standalone dev entry
    ├── vite-env.d.ts
    └── components/
        ├── Setup.tsx                     # Main exported component (tab container)
        ├── Setup.test.tsx
        ├── SqlConnectionSection.tsx      # SQL tunnel URL config + test
        ├── EndpointSection.tsx           # Centralized AI endpoint management (uses shared EndpointManager)
        ├── BackfillSection.tsx           # "Import History" button + progress
        └── AnalyticsDashboard.tsx        # Usage, cost, latency, tools, benchmark trends
            ├── UsageSummary.tsx
            ├── CostBreakdown.tsx
            ├── LatencyPercentiles.tsx
            ├── ToolUsagePatterns.tsx
            ├── BenchmarkTrends.tsx
            └── ChatSearch.tsx

# Backend additions (in existing functions/)
functions/src/
├── sqlClient.ts                          # NEW: pg client wrapper, schema init, connection test
├── sqlWriter.ts                          # NEW: fire-and-forget SQL insert helpers
├── resolvers/sql.ts                      # NEW: GraphQL resolvers for SQL analytics
├── aiChatLogger.ts                       # MODIFIED: add SQL dual-write
├── resolvers/ai.ts                       # MODIFIED: SQL write in saveBenchmarkRun, backfill mutation
└── schema.ts                             # MODIFIED: add SQL types, queries, mutations

# Shell integration (modified)
packages/shell/src/
├── App.tsx                               # MODIFIED: add setup lazy import + route
├── remotes.d.ts                          # MODIFIED: add setup module declaration
├── routeConfig.ts                        # MODIFIED: add breadcrumb label
└── components/layout/
    ├── UserMenu.tsx                      # MODIFIED: add "Setup" button
    └── CommandPalette.tsx                # MODIFIED: add setup nav item

# Shared additions (modified)
packages/shared/src/
├── apollo/queries.ts                     # MODIFIED: add SQL GraphQL queries
├── apollo/generated.ts                   # REGENERATED: pnpm codegen
└── i18n/locales/
    ├── en.ts                             # MODIFIED: add setup + analytics keys
    ├── es.ts                             # MODIFIED: add setup + analytics keys
    └── zh.ts                             # MODIFIED: add setup + analytics keys

# Build/deploy (modified)
├── package.json                          # MODIFIED: add dev:setup, preview:setup, update dev/dev:mf
├── deploy/docker/Dockerfile              # MODIFIED: add setup COPY
├── scripts/assemble-firebase.mjs         # MODIFIED: add setup copy block + mfeDirs
├── vitest.config.ts                      # MODIFIED: add setup alias
├── packages/shell/vite.config.ts         # MODIFIED: add setup remote
├── packages/shell/vitest.config.ts       # MODIFIED: add setup alias
├── packages/shell/test/mocks/setup.tsx   # NEW: mock for shell tests
└── packages/shell/tailwind.config.js     # MODIFIED: add setup content path

# Benchmark (modified)
packages/model-benchmark/src/components/
└── BenchmarkRunner.tsx                   # MODIFIED: remove endpoint management UI section

# Docs (modified)
docs/
├── architecture.md                       # MODIFIED: document SQL analytics layer
└── specs/018-sql-analytics/spec.md       # Required for spec-check CI
```

**Structure Decision**: Web application pattern — new MFE frontend package (`packages/setup`) + backend additions in existing `functions/` directory. No new backend service or separate API — all SQL queries go through existing GraphQL Cloud Function.

## Complexity Tracking

> No constitution violations requiring justification. All design decisions align with existing patterns.

| Aspect | Decision | Justification |
|--------|----------|---------------|
| `pg` dependency in functions/ | New npm dependency | Minimal — single library, no ORM. Required to connect to external PostgreSQL. |
| Raw SQL in resolvers | No ORM layer | Constitution VI: 4 tables with straightforward queries don't warrant an ORM abstraction. |
| Reuse EndpointManager | Import shared component in setup MFE | No duplication. Same Firestore collection, same GraphQL mutations. Just a different render location. |
