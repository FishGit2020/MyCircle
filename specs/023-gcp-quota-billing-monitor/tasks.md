# Tasks: GCP Quota & Billing Monitor

**Input**: Design documents from `/specs/023-gcp-quota-billing-monitor/`
**Branch**: `023-gcp-quota-billing-monitor`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks in same phase)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Foundational Prerequisites)

**Purpose**: GraphQL schema, resolver scaffold, i18n keys, and shared query definitions. Must be complete before any user story UI can be built.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Add `QuotaSnapshot`, `CloudRunQuotaMetric`, `StorageQuotaMetric`, `FirestoreQuotaMetric`, `ArtifactRegistryQuotaMetric`, `ServiceRequestCount`, `FolderSize`, `CollectionCount`, `RepositorySize`, `QuotaSnapshotList` GraphQL types to `functions/src/schema.ts` (after the existing TtsQuota type block, before `type Query`)
- [X] T002 Add `quotaSnapshots(limit: Int): QuotaSnapshotList!` to `type Query` in `functions/src/schema.ts`
- [X] T003 Add `collectQuotaSnapshot: QuotaSnapshot!` and `dumpQuotaToSql: Boolean!` to `type Mutation` in `functions/src/schema.ts`
- [X] T004 [P] Create `functions/src/resolvers/quota.ts` with `createQuotaQueryResolvers()` returning a stub `quotaSnapshots` resolver (reads `quotaSnapshots` ordered by `collectedAt desc`, limit param default 10 max 90) and `createQuotaMutationResolvers()` with stub `collectQuotaSnapshot` (returns empty snapshot) and `dumpQuotaToSql` (throws "not implemented")
- [X] T005 Register the new quota resolvers in `functions/src/graphql.ts` — spread `createQuotaQueryResolvers()` into `Query` and `createQuotaMutationResolvers()` into `Mutation`, following the existing resolver factory registration pattern
- [X] T006 Add `GET_QUOTA_SNAPSHOTS`, `COLLECT_QUOTA_SNAPSHOT`, and `DUMP_QUOTA_TO_SQL` GraphQL operations to `packages/shared/src/apollo/queries.ts` — request all fields defined in `contracts/graphql-quota.graphql`
- [X] T007 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` with the new quota types and operation hooks
- [X] T008 [P] Add i18n keys to `packages/shared/src/i18n/en.ts`: `nav.quotaBilling`, and all `quotaBilling.*` keys — title, lastRefreshed, refreshNow, refreshing, noData, historyNote, dumpToSql, dumpSuccess, partialError, viewInBilling, firebaseUsage, basedOnDays, peakedAt, peakExceeded, cloudRun, functions, storage, firestore, tts, artifactRegistry, hosting, freeTier, mtdCost, projectedCost, perMonth, perDay, requests, invocations, characters, documents, bytes, bandwidth
- [X] T009 [P] Add the same `quotaBilling.*` i18n keys (including viewInBilling, basedOnDays, mtdCost, projectedCost) to `packages/shared/src/i18n/es.ts` using Unicode escapes for accented characters (read the file first before editing to preserve existing encoding)
- [X] T010 [P] Add the same `quotaBilling.*` i18n keys to `packages/shared/src/i18n/zh.ts`
- [X] T011 Run `pnpm build:shared` to verify schema compiles, codegen types are correct, and all 3 locale files have matching keys

**Checkpoint**: Foundation ready — GraphQL types exist, operations are defined, codegen is up-to-date, i18n keys are in all 3 locales. User story implementation can begin.

---

## Phase 2: User Story 1 — View Current GCP Usage Snapshot (Priority: P1) 🎯 MVP

**Goal**: Implement the full snapshot collection backend and the metric cards UI. A user can click "Refresh Now" and see usage vs free-tier for all **7 service categories** with green/yellow/red status indicators, MTD cost, projected cost, 7-day Firestore peaks, and console links.

**Independent Test**: Navigate to `/quota`, click "Refresh Now", verify 7 metric cards appear with values, limits, status colors, `$X.XX MTD · est. $X.XX / mo`, and per-card console links. Verify both "View in GCP Billing" and "Firebase Usage" header links are present. Verify that if one GCP API call fails, its card shows an error while others succeed.

### Implementation for User Story 1

- [X] T012 [US1] Implement `collectQuotaSnapshot` mutation resolver in `functions/src/resolvers/quota.ts`:
  - Define `FREE_TIER` and `COST_PER_UNIT` constants: Cloud Run 2M req/mo, Functions 2M invocations/mo, Storage ~1 GB stored + ~10 GB bandwidth/mo, Firestore 50K reads/day + 20K writes/day + 20K deletes/day, TTS per-SKU, Artifact Registry 0.5 GB, Hosting 10 GB storage + 360 MB/day downloads
  - Implement `collectCloudRunRequests(projectId, auth)`: Cloud Monitoring `run.googleapis.com/request_count`, current calendar month, grouped by `service_name`; returns `{totalRequests, byService[]}`
  - Implement `collectFunctionsInvocations(projectId, auth)`: Cloud Monitoring `cloudfunctions.googleapis.com/function/execution_count`, current calendar month, grouped by `function_name`; returns `{totalInvocations, byFunction[]}`
  - Implement `collectStorageSizes(bucket)`: Firebase Admin SDK `getStorage().bucket().getFiles()`; accumulate bytes per top-level folder for storage; for bandwidth use Cloud Monitoring `storage.googleapis.com/network/sent_bytes_count` for current calendar month; returns `{totalBytes, byFolder[], bandwidthBytes}`
  - Implement `collectFirestoreMetrics(projectId, auth)`: Cloud Monitoring `firestore.googleapis.com/document/read_count`, `write_count`, `delete_count` — two time ranges: (a) today (midnight to now) for current usage; (b) last 7 days daily max for peak; returns `{reads: {today, peak7d}, writes: {today, peak7d}, deletes: {today, peak7d}}`
  - Implement `collectTtsQuota(db, uid)`: reads `users/{uid}/ttsUsage` doc (same source as existing `ttsQuota` resolver); returns `TtsQuota`-shaped object
  - Implement `collectArtifactRegistry(projectId, auth)`: `artifactregistry.googleapis.com/v1/projects/{project}/locations/-/repositories`; maps `sizeBytes`; returns `{totalBytes, byRepository[]}`
  - Implement `collectHostingMetrics(projectId, auth)`: Cloud Monitoring `firebasehosting.googleapis.com/...` for daily downloads if available; Firebase Management API or directory size estimate for storage; on failure returns `{storageBytes: null, dailyDownloadBytes: null, error: 'unavailable'}` without failing whole snapshot
  - In `collectQuotaSnapshot` resolver: run all 7 collectors in `Promise.allSettled`; for each rejected result add service name to `errors[]`; compute `mtdCostUsd` per service; compute `projectedCostUsd` = `mtdCostUsd ÷ elapsedDays × daysInMonth`; include `elapsedDays` in snapshot root; save to `quotaSnapshots/{id}`; prune to 90 docs; return snapshot

- [X] T013 [US1] Implement `quotaSnapshots` query resolver fully in `functions/src/resolvers/quota.ts`: query `quotaSnapshots` ordered by `collectedAt desc`, apply limit (clamp to max 90), map Firestore docs to `QuotaSnapshot` shape, return `{snapshots, total}`

- [X] T014 [P] [US1] Create `packages/shell/src/pages/QuotaPage.tsx`:
  - Use `useQuery(GET_QUOTA_SNAPSHOTS, { variables: { limit: 10 } })` from `@mycircle/shared`
  - Use `useMutation(COLLECT_QUOTA_SNAPSHOT)` from `@mycircle/shared`
  - Render page header with `t('quotaBilling.title')`, last-refreshed timestamp, and **two** header links side by side (both `target="_blank"` `rel="noopener noreferrer"`): "View in GCP Billing" → `https://console.cloud.google.com/billing/01752D-EE3836-922FD4` and "Firebase Usage" → `https://console.firebase.google.com/u/0/project/mycircle-dash/usage`
  - Render "Refresh Now" button (`type="button"`, disabled + spinner while mutation in-flight, `aria-label`, min touch target 44px)
  - Render empty state when `snapshots.length === 0` with `t('quotaBilling.noData')`
  - Render **7** `MetricCard` components: Cloud Run, Firebase Functions, Firebase Storage, Firestore, TTS, Artifact Registry, Firebase Hosting — using the latest snapshot's data when available
  - Extract `MetricCard` as a local component: props `{ label, value, formattedValue, limit, formattedLimit, limitPeriod: 'daily'|'monthly', percent, status: 'green'|'yellow'|'red', mtdCostUsd: number, projectedCostUsd: number, elapsedDays: number, consoleUrl: string, breakdown?: {name: string; value: string}[], peak7d?: {label: string; value: string; exceeded: boolean} }` — always show `$X.XX MTD · est. $X.XX / mo`; when `elapsedDays < 7` show `t('quotaBilling.basedOnDays')`; when `peak7d.exceeded` show red peak warning line
  - Per-service console URLs: Cloud Run → `https://console.cloud.google.com/run?project=mycircle-dash`; Functions → `https://console.firebase.google.com/u/0/project/mycircle-dash/functions`; Storage → `https://console.cloud.google.com/storage/browser?project=mycircle-dash`; Firestore → `https://console.cloud.google.com/firestore/data?project=mycircle-dash`; TTS → `https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/quotas?project=mycircle-dash`; Artifact Registry → `https://console.cloud.google.com/artifacts?project=mycircle-dash`; Hosting → `https://console.firebase.google.com/u/0/project/mycircle-dash/hosting`
  - Show error banner if `latestSnapshot.errors.length > 0` listing failed services
  - Wrap page content in `<PageContent>` from `@mycircle/shared`

- [X] T015 [US1] Add `/quota` route to `packages/shell/src/App.tsx`: import `QuotaPage` from `./pages/QuotaPage` and add `<Route path="quota" element={<RequireAuth><QuotaPage /></RequireAuth>} />` after the `/trash` route

- [X] T016 [US1] Add `quota: 'nav.quotaBilling'` to `ROUTE_LABEL_KEYS` in `packages/shell/src/routeConfig.ts` (for breadcrumb support)

- [X] T017 [US1] Add "Quota & Billing" menu item to `packages/shell/src/components/layout/UserMenu.tsx`: insert before the "Setup" button entry; use `navigate('/quota'); setIsOpen(false);` onClick pattern; icon: bar-chart SVG (3 vertical bars of different heights); label `t('nav.quotaBilling')`; `type="button"`, `role="menuitem"`, same className as other menu items

**Checkpoint**: User Story 1 complete. Navigate to `/quota`, click "Refresh Now", see all **7** metric cards with status colors, `$X.XX MTD · est. $X.XX / mo`, Firestore 7-day peaks with red warning on exceeded days, both header links ("View in GCP Billing" + "Firebase Usage"), and per-card console links.

---

## Phase 3: User Story 2 — View Historical Usage Trends (Priority: P2)

**Goal**: After 2+ manual refreshes, a history chart renders automatically showing `totalEstimatedCostUsd` over time with per-service toggles.

**Independent Test**: Trigger two `collectQuotaSnapshot` mutations (or mock 2 snapshots in Firestore), reload the page, verify the history chart appears below the metric cards with two data points.

### Implementation for User Story 2

- [X] T018 [US2] Add `HistoryChart` component inside `packages/shell/src/pages/QuotaPage.tsx`:
  - Props: `snapshots: QuotaSnapshot[]` (ordered oldest → newest)
  - Only rendered when `snapshots.length >= 2`; when `snapshots.length === 1` show `t('quotaBilling.historyNote')` text instead
  - SVG-based polyline (no new library): viewBox with fixed height (200px), x-axis = snapshot index evenly spaced, y-axis = `totalEstimatedCostUsd`; draw a polyline connecting the data points; show date tick labels on x-axis (abbreviated: "Apr 1", "Apr 2", etc.); show cost labels on y-axis ($0.00 / $0.50 / $1.00)
  - Include per-service toggle buttons (Cloud Run / Storage / TTS / Artifact Registry / Total) — clicking a button toggles its polyline; use `useState` for active lines set; "Total" is active by default

- [X] T019 [US2] Update `GET_QUOTA_SNAPSHOTS` usage in `QuotaPage.tsx` to request `limit: 10` snapshots (already done in T014) and pass the full `snapshots` array to `HistoryChart` sorted oldest-first (reverse of query order)

**Checkpoint**: User Story 2 complete. With 2+ snapshots in Firestore, the history chart renders with date axis and cost polyline.

---

## Phase 4: User Story 3 — Dump Snapshot to SQL (Priority: P3)

**Goal**: When SQL Analytics is configured, a "Dump to SQL" button appears and writes the most recent snapshot to a `quota_snapshots` PostgreSQL table.

**Independent Test**: With SQL configured (`sqlConnection.hasCredentials === true`), verify "Dump to SQL" button is visible. Click it, verify the button shows a spinner then success toast. Query the database: `SELECT COUNT(*) FROM quota_snapshots` returns 1.

### Implementation for User Story 3

- [X] T020 [US3] Add `logQuotaToSql` function to `functions/src/sqlWriter.ts`:
  - Params: `client: pg.Client`, `snapshot: QuotaSnapshot`
  - CREATE TABLE IF NOT EXISTS `quota_snapshots` with the schema defined in `data-model.md`
  - INSERT row mapping all snapshot fields to columns; `raw_json = JSON.stringify(snapshot)` for the JSONB column; use parameterized query (no string interpolation)

- [X] T021 [US3] Implement `dumpQuotaToSql` mutation resolver in `functions/src/resolvers/quota.ts`:
  - Fetch the most recent snapshot from `quotaSnapshots` (limit 1, ordered by `collectedAt desc`)
  - Throw `new Error('No snapshot available — collect a snapshot first')` if none exists
  - Call `createSqlClient(uid)` from `functions/src/sqlClient.ts` (throws if no SQL connection configured)
  - Call `logQuotaToSql(client, snapshot)` from `functions/src/sqlWriter.ts`
  - Release client after use; return `true`

- [X] T022 [US3] Add "Dump to SQL" button to `packages/shell/src/pages/QuotaPage.tsx`:
  - Use `useQuery(GET_SQL_CONNECTION_STATUS)` from `@mycircle/shared` to check `hasCredentials && status === 'connected'`
  - Use `useMutation(DUMP_QUOTA_TO_SQL)` from `@mycircle/shared`
  - Only render button when SQL is connected AND `snapshots.length > 0`
  - Button: `type="button"`, `t('quotaBilling.dumpToSql')`, disabled while mutation in-flight, shows spinner
  - On success: show inline success message `t('quotaBilling.dumpSuccess')` for 3 seconds (use `useState` + `setTimeout`)
  - On error: show error message from mutation error

**Checkpoint**: User Story 3 complete. Full feature is functional for all 3 user stories.

---

## Phase 5: Tests

**Purpose**: Unit and component tests for correctness and regression protection.

- [ ] T023 [P] Create `functions/src/resolvers/quota.test.ts`:
  - Mock `google-auth-library` (`vi.mock`) — `GoogleAuth.getAccessToken()` returns a fake token
  - Mock global `fetch` — return canned Cloud Monitoring API JSON for Cloud Run, canned Artifact Registry JSON
  - Mock Firebase Admin SDK — `getFirestore()`, `getStorage().bucket().getFiles()`, `collection().count().get()`
  - Test `quotaSnapshots` resolver: empty list returned when no Firestore docs; ordered by `collectedAt desc`; limit param respected
  - Test `collectQuotaSnapshot`: all 5 GCP collectors called; snapshot written to Firestore; snapshot returned with correct free-tier math (e.g., 30317 Cloud Run requests → <2M free tier → `estimatedCostUsd: 0`)
  - Test `collectQuotaSnapshot` with one collector throwing: `errors` field contains the failed service name; other services still populate
  - Test snapshot pruning: when 91 snapshots exist, oldest is deleted after new snapshot is saved
  - Test `dumpQuotaToSql`: `createSqlClient` called; `logQuotaToSql` called with correct snapshot; returns `true`
  - Test `dumpQuotaToSql` with no SQL connection: mutation throws with appropriate error message

- [ ] T024 [P] Create `packages/shell/src/pages/QuotaPage.test.tsx`:
  - Mock `@mycircle/shared` Apollo hooks (`useQuery`, `useMutation`)
  - Test: when `snapshots: []` → empty state text rendered, Refresh button enabled
  - Test: clicking "Refresh Now" calls `collectQuotaSnapshot` mutation; button disabled while in-flight
  - Test: metric card for Cloud Run renders with green status when `percent ≤ 80`
  - Test: metric card renders yellow status when `80 < percent ≤ 100`
  - Test: metric card renders red status and cost estimate when `percent > 100`
  - Test: error banner shown when `errors: ['Cloud Run']` in snapshot
  - Test: history chart absent when `snapshots.length === 1`; history chart present when `snapshots.length === 2`
  - Test: "Dump to SQL" button absent when `hasCredentials: false`; present when `hasCredentials: true && status === 'connected'`
  - Test: "Dump to SQL" calls `dumpQuotaToSql` mutation on click; success toast shown after

- [X] T025 Run `pnpm build:shared && pnpm lint && cd functions && npx tsc --noEmit` — fix any TypeScript or lint errors before proceeding

- [X] T026 Run `pnpm test:run` — all new tests must pass; fix any failures

- [X] T027 Run `pnpm typecheck` — root typecheck must pass

---

## Phase 6: Final Polish

- [X] T028 Verify all `MetricCard` instances have `aria-label` attributes that include the service name and current status (e.g., `aria-label="Cloud Run: 30,317 requests — within free tier"`)
- [X] T029 Verify "Refresh Now" and "Dump to SQL" buttons have `type="button"`, `aria-label`, and minimum 44px touch target (add `min-h-[44px]` if needed)
- [X] T030 Run `validate_all` MCP tool — verify no i18n key mismatches, no Dockerfile issues from this change (no new MFE, so Dockerfile unchanged)
- [X] T031 Add dark mode variants to any Tailwind color classes in `QuotaPage.tsx` that are missing `dark:` counterparts — green status: `text-green-600 dark:text-green-400`; yellow: `text-yellow-600 dark:text-yellow-400`; red: `text-red-600 dark:text-red-400`

---

## Dependencies

```
Phase 1 (T001–T011)
  └─► Phase 2 US1 (T012–T017)   [MVP — deliver here]
        └─► Phase 3 US2 (T018–T019)
              └─► Phase 4 US3 (T020–T022)
                    └─► Phase 5 Tests (T023–T027)
                          └─► Phase 6 Polish (T028–T031)
```

**Parallelism within phases**:
- Phase 1: T008, T009, T010 (i18n files) can run in parallel; T004 can run alongside T001–T003 once schema types are known
- Phase 2: T014 (QuotaPage) can start in parallel with T012–T013 (resolvers) since it mocks the GraphQL layer
- Phase 5: T023 (resolver tests) and T024 (component tests) can run in parallel

---

## Implementation Strategy

**MVP = Phase 1 + Phase 2** (T001–T017)

Delivers User Story 1 end-to-end: UserMenu button → `/quota` page → "Refresh Now" → 5 metric cards with live GCP data, status colors, and cost estimates. This is independently usable and covers the primary value of the feature.

**Increment 2 = Phase 3** (T018–T019) — adds history chart (zero-risk addition, no backend changes)

**Increment 3 = Phase 4** (T020–T022) — adds SQL dump (only visible to users with SQL configured)

**Tests + Polish = Phases 5–6** (T023–T031) — add after increments are working

---

## Summary

| Phase | Tasks | User Story | Parallelizable |
|-------|-------|-----------|----------------|
| 1: Setup | T001–T011 | Foundation | T004, T008, T009, T010 |
| 2: US1 MVP | T012–T017 | US1 (P1) | T014 alongside T012–T013 |
| 3: History Chart | T018–T019 | US2 (P2) | T018, T019 sequential |
| 4: SQL Dump | T020–T022 | US3 (P3) | T020, T021 sequential |
| 5: Tests | T023–T027 | All | T023, T024 parallel |
| 6: Polish | T028–T031 | All | T028–T031 parallel |
| **Total** | **31 tasks** | | |
