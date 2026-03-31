# Research: SQL Analytics Layer

**Feature**: 018-sql-analytics
**Date**: 2026-03-31

## Decision 1: SQL Client Library for Cloud Functions

**Decision**: Use `pg` (node-postgres) in `functions/`

**Rationale**: `pg` is the standard, lightweight PostgreSQL client for Node.js. The Cloudflare tunnel exposes a PostgreSQL-compatible endpoint. No ORM needed — raw SQL is simpler for analytics queries and aligns with Constitution VI (Simplicity). The `functions/` package uses npm (not pnpm), so `npm install pg` in that directory.

**Alternatives considered**:
- `drizzle-orm` — adds abstraction layer not needed for 4 tables with straightforward queries
- `@neondatabase/serverless` — Neon-specific, not needed since we're connecting via Cloudflare tunnel to any Postgres instance
- `better-sqlite3` — SQLite, would limit to single-node; Postgres is more appropriate for analytics workloads

## Decision 2: SQL Connection Config Storage

**Decision**: Store in Firestore at `users/{uid}/sqlConnection` (single document per user)

**Rationale**: Follows existing pattern for user-scoped config (like `benchmarkEndpoints`). Stored server-side in Firestore so Cloud Functions can read it during dual-write. Credentials (tunnel URL, optional auth) are persisted securely in Firestore, not in localStorage. GraphQL mutations handle CRUD.

**Alternatives considered**:
- Firebase secrets — too static, user needs to change config from UI without redeploying
- localStorage — Cloud Functions can't access it for server-side dual-write
- Environment variables — same issue as Firebase secrets

## Decision 3: Analytics Query Layer

**Decision**: New GraphQL resolvers that internally query SQL

**Rationale**: Constitution III (GraphQL-First) requires all MFE data operations to go through GraphQL. The analytics dashboard will use `useQuery` from `@mycircle/shared` to call new GraphQL queries (`sqlAnalyticsSummary`, `sqlLatencyPercentiles`, `sqlToolUsagePatterns`, `sqlBenchmarkTrends`, `sqlChatSearch`). These resolvers internally connect to the user's SQL database via their configured tunnel URL and run aggregation queries. This keeps the frontend pattern consistent with all other MFEs.

**Alternatives considered**:
- Dedicated REST endpoint `/analytics/*` — violates Constitution III; would require MFE to use `fetch()` instead of Apollo
- Direct SQL connection from frontend — security risk; tunnel credentials should stay server-side

## Decision 4: Dual-Write Integration Point

**Decision**: Enhance `logAiChatInteraction()` in `functions/src/aiChatLogger.ts`

**Rationale**: All AI chat paths (REST handler, GraphQL resolver) funnel through this single function. Adding SQL write here means zero changes to call sites. The function is already fire-and-forget; SQL write will be equally fire-and-forget with independent error handling.

**For benchmarks**: Add a parallel `logBenchmarkToSql()` call in the `saveBenchmarkRun` resolver (`functions/src/resolvers/ai.ts` line 240).

**Alternatives considered**:
- Separate Firestore trigger (onWrite) — adds latency and complexity; trigger-based architectures are harder to debug
- Modify every call site — 12+ locations, high risk of missing one

## Decision 5: Schema Initialization Strategy

**Decision**: Run `CREATE TABLE IF NOT EXISTS` on connection test (FR-003/FR-006)

**Rationale**: When the user clicks "Save & Test" on the setup page, the Cloud Function tests the connection and runs DDL statements to ensure tables exist. This is idempotent — safe to run multiple times. No migration framework needed for the initial 4-table schema. Future schema changes can use additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

**Alternatives considered**:
- Separate "Initialize Schema" button — extra step, worse UX
- Migration framework (knex, prisma) — overkill for 4 tables with additive-only changes

## Decision 6: Backfill Implementation

**Decision**: GraphQL mutation `backfillSqlData` that reads Firestore in batches and writes to SQL

**Rationale**: User clicks "Import History" → frontend calls mutation → Cloud Function reads `aiChatLogs` collection in batches of 500 (using Firestore cursor pagination), inserts into SQL with `INSERT ... ON CONFLICT DO NOTHING` for deduplication. Progress is tracked via a `users/{uid}/sqlBackfillState` document with `lastDocId`, `totalMigrated`, `status` fields. The frontend polls this document for progress display.

**Alternatives considered**:
- Client-side migration — can't access Firestore admin from frontend
- Background Cloud Function (scheduled) — user wants on-demand control
- Stream all at once — would timeout on large datasets; batching is necessary

## Decision 7: Setup MFE Package

**Decision**: New `packages/setup` MFE on port 3032

**Rationale**: Setup is a distinct page with its own route (`/setup`), accessed via user menu. Follows the standard MFE pattern with Module Federation. Not added to bottom nav or NAV_GROUPS — it's a utility page, like `/trash`.

**Key integration points** (per Constitution II):
- Shell: App.tsx (lazy import + route), vite.config.ts (remote), remotes.d.ts
- UserMenu.tsx: "Setup" button before "Sign out"
- CommandPalette.tsx: nav item for `/setup`
- routeConfig.ts: breadcrumb label
- i18n: All 3 locales
- Dockerfile: COPY in both stages
- assemble-firebase.mjs: copy block + mfeDirs
- Root package.json: dev:setup, preview:setup, dev/dev:mf concurrently
- vitest aliases: root + shell configs
- Mock file: packages/shell/test/mocks/

**NOT added to**: BottomNav, NAV_GROUPS, WidgetDashboard, PWA shortcuts (utility page, not a feature)

## Decision 8: Endpoint Configuration Centralization

**Decision**: Move existing `EndpointManager` component usage to the setup page; keep the shared component and hook (`useEndpoints`) unchanged

**Rationale**: The `EndpointManager` component already exists in `@mycircle/shared` and uses the `useEndpoints` hook. It's currently rendered in the benchmark UI. Moving it to the setup page means:
1. Import `EndpointManager` in the setup MFE
2. Remove the endpoint management section from the benchmark runner
3. The benchmark runner continues to use `useEndpoints()` hook for listing endpoints — it just no longer has the add/edit/delete UI

The underlying GraphQL mutations (`saveBenchmarkEndpoint`, `deleteBenchmarkEndpoint`) and Firestore collection (`users/{uid}/benchmarkEndpoints`) remain unchanged.

**Alternatives considered**:
- Duplicate the UI in both places — violates single source of truth
- Create a new collection for "setup endpoints" — unnecessary when benchmarkEndpoints already serves the purpose
