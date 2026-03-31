# Tasks: SQL Analytics Layer

**Input**: Design documents from `/specs/018-sql-analytics/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested — test tasks omitted. Tests should be added per existing project patterns during implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, scaffold MFE package, add i18n keys, wire shell integration points

- [x] T001 Install `pg` and `@types/pg` in `functions/` via `cd functions && npm install pg @types/pg --save`
- [x] T002 Scaffold `packages/setup/` MFE with package.json (port 3032), vite.config.ts, vitest.config.ts, postcss.config.js, tsconfig.json, index.html, src/main.tsx, src/vite-env.d.ts, test/setup.ts
- [x] T003 [P] Add i18n keys for setup page and analytics dashboard to `packages/shared/src/i18n/locales/en.ts` (nav.setup, commandPalette.goToSetup, setup.title, setup.subtitle, setup.sqlConnection.*, setup.endpoints.*, setup.backfill.*, setup.analytics.*)
- [x] T004 [P] Add i18n keys for setup page and analytics dashboard to `packages/shared/src/i18n/locales/es.ts` (matching en.ts keys with Spanish translations)
- [x] T005 [P] Add i18n keys for setup page and analytics dashboard to `packages/shared/src/i18n/locales/zh.ts` (matching en.ts keys with Chinese translations)
- [x] T006 Rebuild shared: `pnpm build:shared`
- [x] T007 [P] Add setup remote URL variable and remotes entry in `packages/shell/vite.config.ts`
- [x] T008 [P] Add `setup/Setup` module declaration in `packages/shell/src/remotes.d.ts`
- [x] T009 [P] Add lazy import and `/setup` route in `packages/shell/src/App.tsx`
- [x] T010 [P] Add "Setup" menu item (with gear icon) before "Sign out" in `packages/shell/src/components/layout/UserMenu.tsx`
- [x] T011 [P] Add setup nav item in `packages/shell/src/components/layout/CommandPalette.tsx`
- [x] T012 [P] Add `setup: 'nav.setup'` breadcrumb label in `packages/shell/src/routeConfig.ts`
- [x] T013 [P] Add `packages/setup/src/**/*.{ts,tsx}` to content array in `packages/shell/tailwind.config.js`
- [x] T014 [P] Add setup alias in root `vitest.config.ts` and `packages/shell/vitest.config.ts`
- [x] T015 [P] Create mock file `packages/shell/test/mocks/setup.tsx`
- [x] T016 [P] Add COPY commands for setup in both build and runtime stages of `deploy/docker/Dockerfile`
- [x] T017 [P] Add setup copy block and mfeDirs entry in `scripts/assemble-firebase.mjs`
- [x] T018 Add `dev:setup` and `preview:setup` scripts, update `dev` and `dev:mf` concurrently commands in root `package.json`
- [x] T019 Run `pnpm install` to link the new workspace package

**Checkpoint**: Setup MFE scaffolded, shell integration wired, `/setup` route renders placeholder

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: SQL client infrastructure and GraphQL schema that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T020 Create `functions/src/sqlClient.ts` — pg client wrapper with `getSqlClient(uid)` that reads tunnel URL from `users/{uid}/sqlConnection` Firestore doc, creates `pg.Client`, returns it. Include `testSqlConnection(uid)` and `initSqlSchema(client)` (CREATE TABLE IF NOT EXISTS for all 4 tables per data-model.md)
- [x] T021 Create `functions/src/sqlWriter.ts` — fire-and-forget helpers: `logChatToSql(client, entry, firestoreDocId)` inserts into `ai_chat_logs` + `ai_tool_calls`, `logBenchmarkToSql(client, result, runId, userId)` inserts into `benchmark_results`. All use `INSERT ... ON CONFLICT (id) DO NOTHING`
- [x] T022 Add all new GraphQL types, queries, and mutations to `functions/src/schema.ts` per contracts/graphql-schema-additions.md (SqlConnectionStatus, SqlBackfillStatus, SqlAnalyticsSummary, LatencyPercentiles, ToolUsageStats, ToolCoOccurrence, BenchmarkTrend, ChatSearchResult, SqlConnectionInput, plus query and mutation declarations)
- [x] T023 Create `functions/src/resolvers/sql.ts` — stub resolver factory `createSqlQueryResolvers()` and `createSqlMutationResolvers()` returning empty/null implementations for all declared queries and mutations
- [x] T024 Register SQL resolvers in the Apollo Server setup (where other resolvers are composed) in `functions/src/index.ts` or equivalent entry point
- [x] T025 Add all new GraphQL query/mutation exports to `packages/shared/src/apollo/queries.ts` (SAVE_SQL_CONNECTION, TEST_SQL_CONNECTION, DELETE_SQL_CONNECTION, GET_SQL_CONNECTION_STATUS, GET_SQL_BACKFILL_STATUS, START_SQL_BACKFILL, GET_SQL_ANALYTICS_SUMMARY, GET_SQL_LATENCY_PERCENTILES, GET_SQL_TOOL_USAGE_STATS, GET_SQL_TOOL_CO_OCCURRENCES, GET_SQL_BENCHMARK_TRENDS, SQL_CHAT_SEARCH)
- [x] T026 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`
- [x] T027 Rebuild shared: `pnpm build:shared`
- [x] T028 Verify `cd functions && npx tsc --noEmit` passes (strict tsconfig)

**Checkpoint**: Foundation ready — SQL client, schema, stub resolvers, GraphQL queries all in place. User story implementation can begin.

---

## Phase 3: User Story 1 — Configure SQL Connection (Priority: P1) MVP

**Goal**: Users can navigate to the setup page from the user menu, enter a Cloudflare tunnel URL, test the connection, and see success/failure status.

**Independent Test**: Open user menu → click Setup → enter tunnel URL → Save & Test → see connection status indicator.

### Implementation for User Story 1

- [x] T029 [US1] Implement `saveSqlConnection` mutation resolver in `functions/src/resolvers/sql.ts` — validate input with Zod, save to `users/{uid}/sqlConnection` Firestore doc, call `testSqlConnection()` + `initSqlSchema()`, return status
- [x] T030 [US1] Implement `testSqlConnection` query resolver in `functions/src/resolvers/sql.ts` — read existing config, attempt connection, update status field, return result
- [x] T031 [US1] Implement `deleteSqlConnection` mutation resolver in `functions/src/resolvers/sql.ts` — delete Firestore doc, return true
- [x] T032 [US1] Implement `sqlConnectionStatus` query resolver in `functions/src/resolvers/sql.ts` — read `users/{uid}/sqlConnection`, return current status (or null if not configured)
- [x] T033 [US1] Create `packages/setup/src/components/SqlConnectionSection.tsx` — form with tunnel URL, db name, username, password fields. Save & Test button calls SAVE_SQL_CONNECTION mutation. Shows connection status (connected/error/disconnected) with appropriate colors. Pre-populates from GET_SQL_CONNECTION_STATUS query.
- [x] T034 [US1] Create `packages/setup/src/components/Setup.tsx` — main exported component. Tab-based layout with sections: SQL Connection, AI Endpoints, Import History, Analytics. Wraps in PageContent. Uses useTranslation.
- [x] T035 [US1] Verify end-to-end: user menu → Setup → SQL Connection tab → enter URL → Save & Test → see status

**Checkpoint**: User Story 1 fully functional — SQL connection can be configured and tested from the UI.

---

## Phase 4: User Story 2 — Centralized AI Endpoint Configuration (Priority: P1)

**Goal**: AI endpoint management (add/edit/delete) is done from the setup page. Benchmark runner no longer has its own endpoint management section.

**Independent Test**: Add an endpoint on setup page → open AI chat → endpoint is available. Open benchmark → endpoint is in the list.

### Implementation for User Story 2

- [x] T036 [US2] Create `packages/setup/src/components/EndpointSection.tsx` — imports and renders `EndpointManager` from `@mycircle/shared` with `source="setup"`. Shows list of configured endpoints with connection status.
- [x] T037 [US2] Add EndpointSection as a tab/section in `packages/setup/src/components/Setup.tsx`
- [x] T038 [US2] Remove the endpoint management UI section from `packages/model-benchmark/src/components/BenchmarkRunner.tsx` — keep the endpoint selection dropdown (useEndpoints hook) but remove the add/edit/delete forms. Add a link/hint pointing to `/setup` for endpoint management.
- [x] T039 [US2] Verify existing AI chat, AI interviewer, and benchmark features still read endpoints correctly via `useEndpoints()` hook after the UI move

**Checkpoint**: Endpoint management centralized on setup page. Benchmark, AI chat, and interviewer consume endpoints without managing them.

---

## Phase 5: User Story 3 — Optional Backfill of Existing Data (Priority: P2)

**Goal**: Users can click "Import History" to migrate existing Firestore AI chat logs and benchmark results into SQL, with progress tracking and resumability.

**Independent Test**: Configure SQL connection → click Import History → see progress → verify records appear in SQL.

### Implementation for User Story 3

- [x] T040 [US3] Implement `startSqlBackfill` mutation resolver in `functions/src/resolvers/sql.ts` — read `aiChatLogs` from Firestore in batches of 500 (cursor pagination via lastDocId), insert into SQL using `logChatToSql()`. Read `benchmarkRuns` across all users, flatten results, insert via `logBenchmarkToSql()`. Track progress in `users/{uid}/sqlBackfillState` Firestore doc. Return status.
- [x] T041 [US3] Implement `sqlBackfillStatus` query resolver in `functions/src/resolvers/sql.ts` — read `users/{uid}/sqlBackfillState`, return current status/progress
- [x] T042 [US3] Create `packages/setup/src/components/BackfillSection.tsx` — shows "Import History" button when status is idle, progress bar when running (polls sqlBackfillStatus every 3s), completion summary when done. Shows last import timestamp and record count if previously completed.
- [x] T043 [US3] Add BackfillSection as a tab/section in `packages/setup/src/components/Setup.tsx`
- [x] T044 [US3] Handle backfill resumability: if `sqlBackfillState.status === 'running'` or `'error'`, clicking Import History resumes from `lastDocId` cursor

**Checkpoint**: Backfill works end-to-end with progress, resumability, and deduplication.

---

## Phase 6: User Story 4 — Automatic AI Chat Log Mirroring (Priority: P2)

**Goal**: Every AI chat interaction is automatically dual-written to Firestore and SQL when a SQL connection is configured.

**Independent Test**: Configure SQL connection → send AI chat message → verify record appears in SQL database with correct fields.

### Implementation for User Story 4

- [x] T045 [US4] Modify `functions/src/aiChatLogger.ts` — in `logAiChatInteraction()`, after the Firestore write, attempt SQL write via `logChatToSql()`. Pass the Firestore doc ID as the SQL primary key. Wrap in try/catch — SQL failure must not affect Firestore write or caller. Only attempt if user has a configured sqlConnection (check Firestore doc existence, cache result briefly).
- [x] T046 [US4] Add connection config caching in `functions/src/sqlClient.ts` — `getCachedSqlConfig(uid)` reads `users/{uid}/sqlConnection` with a 60-second in-memory TTL to avoid Firestore reads on every chat interaction
- [x] T047 [US4] Verify dual-write: send AI chat with tools → confirm both Firestore `aiChatLogs` and SQL `ai_chat_logs` + `ai_tool_calls` tables have matching records

**Checkpoint**: AI chat log dual-write active. Firestore still works when SQL is down.

---

## Phase 7: User Story 5 — Automatic Benchmark Result Mirroring (Priority: P2)

**Goal**: Benchmark run results are automatically mirrored to SQL when a SQL connection is configured.

**Independent Test**: Configure SQL connection → run benchmark → verify results appear in SQL `benchmark_results` table.

### Implementation for User Story 5

- [x] T048 [US5] Modify `saveBenchmarkRun` resolver in `functions/src/resolvers/ai.ts` — after Firestore write, iterate results array, call `logBenchmarkToSql()` for each. Wrap in try/catch (fire-and-forget). Use `getCachedSqlConfig(uid)` to check for SQL connection.
- [x] T049 [US5] Verify dual-write: run benchmark → confirm Firestore `users/{uid}/benchmarkRuns` and SQL `benchmark_results` table both have matching records

**Checkpoint**: Benchmark dual-write active. Both data sources populated.

---

## Phase 8: User Story 6 — Analytics Dashboard (Priority: P3)

**Goal**: Dashboard on the setup page shows usage summaries, cost breakdowns, latency percentiles, tool usage patterns, and benchmark performance trends — all queried from SQL.

**Independent Test**: Populate SQL with chat log and benchmark data → open analytics tab → verify aggregations display correctly.

### Implementation for User Story 6

- [x] T050 [P] [US6] Implement `sqlAnalyticsSummary` query resolver in `functions/src/resolvers/sql.ts` — SQL query with GROUP BY provider, model, DATE; aggregates calls, tokens, latency, errors. Returns SqlAnalyticsSummary type.
- [x] T051 [P] [US6] Implement `sqlLatencyPercentiles` query resolver in `functions/src/resolvers/sql.ts` — SQL query using PERCENTILE_CONT(0.5/0.9/0.99) grouped by provider, model
- [x] T052 [P] [US6] Implement `sqlToolUsageStats` and `sqlToolCoOccurrences` query resolvers in `functions/src/resolvers/sql.ts` — SQL queries against ai_tool_calls with GROUP BY and self-JOIN for co-occurrences
- [x] T053 [P] [US6] Implement `sqlBenchmarkTrends` query resolver in `functions/src/resolvers/sql.ts` — SQL query with DATE_TRUNC('week') GROUP BY on benchmark_results
- [x] T054 [P] [US6] Create `packages/setup/src/components/analytics/UsageSummary.tsx` — card grid showing total calls, tokens, provider split, error rate. Uses GET_SQL_ANALYTICS_SUMMARY query.
- [x] T055 [P] [US6] Create `packages/setup/src/components/analytics/CostBreakdown.tsx` — table/chart showing estimated cost by model per week. Uses data from sqlAnalyticsSummary modelBreakdown.
- [x] T056 [P] [US6] Create `packages/setup/src/components/analytics/LatencyPercentiles.tsx` — table showing P50/P90/P99 per provider/model. Uses GET_SQL_LATENCY_PERCENTILES query.
- [x] T057 [P] [US6] Create `packages/setup/src/components/analytics/ToolUsagePatterns.tsx` — ranked list of tools by call count + co-occurrence pairs table. Uses GET_SQL_TOOL_USAGE_STATS and GET_SQL_TOOL_CO_OCCURRENCES queries.
- [x] T058 [P] [US6] Create `packages/setup/src/components/analytics/BenchmarkTrends.tsx` — weekly TPS and TTFT trends per endpoint/model. Uses GET_SQL_BENCHMARK_TRENDS query.
- [x] T059 [US6] Create `packages/setup/src/components/AnalyticsDashboard.tsx` — container component that renders all analytics sub-components. Shows empty state when SQL not connected or no data.
- [x] T060 [US6] Add AnalyticsDashboard as a tab/section in `packages/setup/src/components/Setup.tsx`

**Checkpoint**: Analytics dashboard fully functional with all 5 visualization sections.

---

## Phase 9: User Story 7 — Chat History Search (Priority: P3)

**Goal**: Users can search past AI chat conversations by keyword, with results showing matching conversations.

**Independent Test**: Populate SQL with chat data → search for a keyword → see matching conversations with highlighted context.

### Implementation for User Story 7

- [x] T061 [US7] Implement `sqlChatSearch` query resolver in `functions/src/resolvers/sql.ts` — SQL query with `WHERE full_question ILIKE $1 OR full_answer ILIKE $1` with `%keyword%` pattern, ORDER BY created_at DESC, LIMIT
- [x] T062 [US7] Create `packages/setup/src/components/analytics/ChatSearch.tsx` — search input field + results list showing timestamp, model, question/answer preview with highlighted search term. Uses SQL_CHAT_SEARCH query.
- [x] T063 [US7] Add ChatSearch to AnalyticsDashboard or as a separate section/tab in Setup.tsx

**Checkpoint**: Chat history search works end-to-end.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, cleanup

- [x] T064 [P] Update `docs/architecture.md` — document SQL analytics layer, dual-write pattern, setup page, Cloudflare tunnel connection
- [x] T065 [P] Copy spec file to `docs/specs/018-sql-analytics/spec.md` for spec-check CI gate
- [x] T066 [P] Update `docs/mfe-guide.md` if relevant (new MFE pattern notes)
- [x] T067 Run `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` and fix all failures
- [x] T068 Run `cd functions && npx tsc --noEmit` and fix all failures
- [x] T069 Run `validate_all` MCP validator and fix any issues
- [x] T070 Verify graceful degradation: disable SQL connection → confirm all existing features work identically

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational — first story to implement
- **US2 (Phase 4)**: Depends on Foundational — can run in parallel with US1 (different files)
- **US3 (Phase 5)**: Depends on US1 (needs working SQL connection to backfill into)
- **US4 (Phase 6)**: Depends on Foundational + sqlWriter.ts from Phase 2
- **US5 (Phase 7)**: Depends on Foundational + sqlWriter.ts from Phase 2, can run in parallel with US4
- **US6 (Phase 8)**: Depends on US4/US5 (needs data in SQL to display)
- **US7 (Phase 9)**: Depends on US4 (needs chat data in SQL to search)
- **Polish (Phase 10)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (Configure SQL Connection)**: After Phase 2 — no story dependencies
- **US2 (Centralize Endpoints)**: After Phase 2 — no story dependencies, parallel with US1
- **US3 (Backfill)**: After US1 (needs SQL connection configured)
- **US4 (Chat Log Mirroring)**: After Phase 2 — no story dependencies
- **US5 (Benchmark Mirroring)**: After Phase 2 — parallel with US4
- **US6 (Analytics Dashboard)**: After US4+US5 (needs SQL data to display)
- **US7 (Chat Search)**: After US4 (needs chat data in SQL)

### Parallel Opportunities

- T003/T004/T005 (i18n locales) can run in parallel
- T007-T018 (shell integration files) are all different files and can run in parallel
- T050-T058 (analytics resolvers + components) are independent files and can all run in parallel
- US1 and US2 can be implemented in parallel (different files, no shared state)
- US4 and US5 can be implemented in parallel (different resolvers, same sqlWriter)

---

## Parallel Example: Phase 1 Setup

```bash
# These tasks modify different files and can run in parallel:
T003: Add en.ts i18n keys
T004: Add es.ts i18n keys
T005: Add zh.ts i18n keys
T007: Shell vite.config.ts remote
T008: Shell remotes.d.ts
T009: Shell App.tsx route
T010: Shell UserMenu.tsx button
T011: Shell CommandPalette.tsx nav item
T012: Shell routeConfig.ts breadcrumb
T013: Shell tailwind.config.js content
T014: Vitest aliases (root + shell)
T015: Shell test mock
T016: Dockerfile COPY
T017: assemble-firebase.mjs
```

## Parallel Example: Phase 8 Analytics

```bash
# All analytics resolvers are independent SQL queries:
T050: sqlAnalyticsSummary resolver
T051: sqlLatencyPercentiles resolver
T052: sqlToolUsageStats + sqlToolCoOccurrences resolvers
T053: sqlBenchmarkTrends resolver

# All analytics components are independent UI:
T054: UsageSummary.tsx
T055: CostBreakdown.tsx
T056: LatencyPercentiles.tsx
T057: ToolUsagePatterns.tsx
T058: BenchmarkTrends.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (SQL Connection Config)
4. Complete Phase 4: US2 (Endpoint Centralization)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo — setup page functional with connection + endpoints

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → Setup page with connection + endpoints (MVP!)
3. Add US4 + US5 → Dual-write active, SQL populated going forward
4. Add US3 → Backfill available for historical data
5. Add US6 + US7 → Analytics dashboard + search live
6. Polish → Docs, validation, cleanup

### Suggested MVP Scope

**Phase 1 + Phase 2 + US1 + US2** = Minimum valuable increment. The setup page works, SQL connection is configurable, and endpoints are centralized. This is deployable and testable without the analytics dashboard.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- `functions/` uses npm (not pnpm) — run `npm install` there, not `pnpm install`
- Always run `cd functions && npx tsc --noEmit` before pushing backend changes
- Always run `pnpm build:shared` after i18n or shared changes
- Always run `pnpm codegen` after schema.ts changes
