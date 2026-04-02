# Implementation Plan: GCP Quota & Billing Monitor

**Branch**: `023-gcp-quota-billing-monitor` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)

## Summary

Add a manual-trigger quota and billing monitor accessible from the UserMenu. A new `collectQuotaSnapshot` GraphQL mutation calls GCP APIs (Cloud Monitoring, Storage, Artifact Registry) and the existing TTS quota/Firestore infrastructure to collect a usage snapshot. Snapshots are persisted to Firestore and displayed on a shell-internal `/quota` page with usage-vs-free-tier metric cards, a history chart, and an optional SQL dump button.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions Node 22)
**Primary Dependencies**: React 18, Apollo Client (via `@mycircle/shared`), Firebase Admin SDK, `google-auth-library` (already in `functions/node_modules`), `pg` (already in `functions/` for SQL dump)
**Storage**: Firestore `quotaSnapshots/{id}` (new subcollection); PostgreSQL `quota_snapshots` table (optional, existing connection)
**Testing**: Vitest + React Testing Library (frontend), Vitest (resolver unit tests)
**Target Platform**: Firebase Cloud Functions (backend), React shell app (frontend)
**Project Type**: Feature addition — shell page + GraphQL extension
**Performance Goals**: Snapshot collection completes within 30 seconds (5 parallel GCP API calls)
**Constraints**: No new npm packages required; all GCP calls are parallel; partial failure allowed (errors field per FR-009)
**Scale/Scope**: Single user (5 users total), ~90 snapshots retained

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | Shell-internal page, no new MFE, no `@apollo/client` direct imports |
| II. Complete Integration | ✅ PASS | Shell page (not MFE) — only requires route, UserMenu button, routeConfig, i18n, and route label. No widget/nav/Dockerfile/e2e MFE overhead. |
| III. GraphQL-First Data Layer | ✅ PASS | `collectQuotaSnapshot` and `quotaSnapshots` via GraphQL. GCP API calls are inside the Cloud Function resolver (server-side), not in MFE runtime. |
| IV. Inclusive by Default | ✅ PASS | All strings use `t('key')`, dark mode variants on all colors, semantic HTML, `type="button"` on all non-submit buttons |
| V. Fast Tests, Safe Code | ✅ PASS | GCP API calls mocked in unit tests; no user-supplied content rendered; no SSRF risk (GCP APIs are trusted endpoints) |
| VI. Simplicity | ✅ PASS | Shell page reuses RecycleBin pattern; resolver reuses existing TTS quota, SQL client, and Firestore patterns |

## Project Structure

### Documentation (this feature)

```text
specs/023-gcp-quota-billing-monitor/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── graphql-quota.graphql
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code Changes

```text
functions/src/
├── resolvers/
│   └── quota.ts                          # NEW — createQuotaQueryResolvers() + createQuotaMutationResolvers()
├── schema.ts                             # MODIFY — add QuotaSnapshot types + quotaSnapshots query + collectQuotaSnapshot + dumpQuotaToSql mutations
└── graphql.ts                            # MODIFY — register new resolvers

packages/
└── shared/src/apollo/
    ├── queries.ts                        # MODIFY — add GET_QUOTA_SNAPSHOTS, COLLECT_QUOTA_SNAPSHOT, DUMP_QUOTA_TO_SQL
    └── generated.ts                      # REGENERATE — pnpm codegen

packages/shell/src/
├── pages/
│   └── QuotaPage.tsx                     # NEW — shell-internal page (RecycleBin pattern)
├── App.tsx                               # MODIFY — add /quota route
├── routeConfig.ts                        # MODIFY — add quota: 'nav.quotaBilling' to ROUTE_LABEL_KEYS
└── components/layout/
    └── UserMenu.tsx                      # MODIFY — add "Quota & Billing" menu item

packages/shared/src/i18n/
├── en.ts                                 # MODIFY — add quotaBilling.* keys
├── es.ts                                 # MODIFY — add quotaBilling.* keys (Unicode escapes)
└── zh.ts                                 # MODIFY — add quotaBilling.* keys
```

## Implementation Phases

### Phase A: Backend — GraphQL Schema + Resolver

**Files**: `functions/src/schema.ts`, `functions/src/resolvers/quota.ts`, `functions/src/graphql.ts`

1. Add GraphQL types to `schema.ts` (see `contracts/graphql-quota.graphql` for the full type list)
2. Create `functions/src/resolvers/quota.ts`:
   - `createQuotaQueryResolvers()` — `quotaSnapshots` resolver: reads `quotaSnapshots` ordered by `collectedAt desc`, limit param (default 10, max 90)
   - `createQuotaMutationResolvers()` — two resolvers:
     - `collectQuotaSnapshot`: runs 5 GCP collections in parallel (`Promise.all`), each in a try/catch; assembles snapshot; saves to Firestore; prunes to 90 docs; returns snapshot
     - `dumpQuotaToSql`: reads most recent snapshot from Firestore; calls `createSqlClient()`; creates table if needed; inserts row; returns `true`
3. Register in `functions/src/graphql.ts` — same pattern as other resolver factories

**GCP API calls inside `collectQuotaSnapshot`**:
- Cloud Run requests: `GET https://monitoring.googleapis.com/v3/projects/mycircle-dash/timeSeries` with filter `metric.type="run.googleapis.com/request_count"`, aggregation over current month start → now, grouped by `resource.labels.service_name`
- Storage sizes: Firebase Admin SDK `getStorage().bucket().getFiles()` with autoPaginate, accumulate `file.metadata.size` per top-level folder prefix
- Firestore doc counts: `db.collection('worshipSongs').count().get()`, `db.collection('announcements').count().get()`, `db.collection('users').count().get()`
- TTS quota: read `users/{uid}/ttsUsage` from Firestore (same source as existing `ttsQuota` resolver)
- Artifact Registry: `GET https://artifactregistry.googleapis.com/v1/projects/mycircle-dash/locations/-/repositories` — use `sizeBytes` field

**Free-tier constants** (defined as `const FREE_TIER` object at top of `quota.ts`):
```
CLOUD_RUN_REQUESTS: 2_000_000
STORAGE_BYTES: 1_073_741_824       // 1 GB
ARTIFACT_REGISTRY_BYTES: 536_870_912  // 0.5 GB
FIRESTORE_READS_PER_DAY: 50_000
TTS_WAVENET_CHARS: 4_000_000
TTS_NEURAL2_CHARS: 1_000_000
TTS_CHIRP3_CHARS: 1_000_000
```

---

### Phase B: Frontend — Shared Queries + Codegen

**Files**: `packages/shared/src/apollo/queries.ts`, then `pnpm codegen`

Add three operations:
- `GET_QUOTA_SNAPSHOTS` — query `quotaSnapshots(limit: 10)`
- `COLLECT_QUOTA_SNAPSHOT` — mutation `collectQuotaSnapshot`
- `DUMP_QUOTA_TO_SQL` — mutation `dumpQuotaToSql`

Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`.

---

### Phase C: Frontend — QuotaPage

**File**: `packages/shell/src/pages/QuotaPage.tsx`

Structure (RecycleBin pattern — `useQuery`/`useMutation` from `@mycircle/shared`):

```
QuotaPage
├── Header: "Quota & Billing" + last-refreshed timestamp
├── "Refresh Now" button (disabled while collecting; spinner)
├── [if errors.length > 0] ErrorBanner: list of failed services
├── MetricGrid (2-col mobile, 3-col md)
│   ├── MetricCard: Cloud Run
│   ├── MetricCard: Firebase Storage
│   ├── MetricCard: Firestore
│   ├── MetricCard: TTS (breakdown by SKU)
│   └── MetricCard: Artifact Registry
├── [if snapshots.length >= 2] HistoryChart (SVG-based, no new chart lib)
│   └── Simple line chart: x = date, y = totalEstimatedCostUsd
│       Plus per-service toggle buttons
└── [if sqlConnection.hasCredentials] "Dump to SQL" button
```

**MetricCard props**:
- `label`: service name
- `value`: current usage (formatted with units: requests/GB/docs/chars)
- `limit`: free-tier limit (same units)
- `percent`: value/limit * 100
- `status`: 'green' | 'yellow' | 'red' (green ≤80%, yellow 80–100%, red >100%)
- `estimatedCostUsd`: shown in red if > 0
- `breakdown`: optional array of {name, value} for sub-items (e.g., Cloud Run by service)

**HistoryChart**: Use SVG path — no new dependency. x-axis: snapshot dates, y-axis: totalEstimatedCostUsd. Keep it simple: polyline per tracked metric, tick marks, no animation.

---

### Phase D: Shell Integration

**Files**: `packages/shell/src/App.tsx`, `packages/shell/src/routeConfig.ts`, `packages/shell/src/components/layout/UserMenu.tsx`

1. `App.tsx`: Add `import QuotaPage from './pages/QuotaPage'` and `<Route path="quota" element={<RequireAuth><QuotaPage /></RequireAuth>} />`
2. `routeConfig.ts`: Add `quota: 'nav.quotaBilling'` to `ROUTE_LABEL_KEYS`
3. `UserMenu.tsx`: Add button before "Setup" entry, using `navigate('/quota')` + `setIsOpen(false)`. Icon: bar-chart SVG.

---

### Phase E: i18n Keys

Add to all 3 locale files (`en.ts`, `es.ts`, `zh.ts`):

```
nav.quotaBilling: "Quota & Billing"

quotaBilling.title: "Quota & Billing"
quotaBilling.lastRefreshed: "Last refreshed"
quotaBilling.refreshNow: "Refresh Now"
quotaBilling.refreshing: "Refreshing..."
quotaBilling.noData: "No data yet — click Refresh Now"
quotaBilling.historyNote: "Refresh at least twice to see trends"
quotaBilling.dumpToSql: "Dump to SQL"
quotaBilling.dumpSuccess: "Snapshot saved to SQL"
quotaBilling.partialError: "Some services failed to collect"

quotaBilling.cloudRun: "Cloud Run"
quotaBilling.storage: "Firebase Storage"
quotaBilling.firestore: "Firestore"
quotaBilling.tts: "Text-to-Speech"
quotaBilling.artifactRegistry: "Artifact Registry"

quotaBilling.freeTier: "Free tier"
quotaBilling.estimatedCost: "Est. cost"
quotaBilling.perMonth: "/ month"
quotaBilling.requests: "requests"
quotaBilling.characters: "chars"
quotaBilling.documents: "docs"
```

---

### Phase F: Tests

**Backend** (`functions/src/resolvers/quota.test.ts`):
- Mock `google-auth-library` `GoogleAuth` and `fetch` calls
- Mock Firestore admin SDK
- Test `quotaSnapshots` resolver: returns empty list, returns ordered snapshots, respects limit
- Test `collectQuotaSnapshot`: GCP calls called, snapshot saved to Firestore, snapshot pruned when >90
- Test `collectQuotaSnapshot` with one failing GCP call: errors field populated, other services succeed
- Test `dumpQuotaToSql`: calls createSqlClient, creates table, inserts row

**Frontend** (`packages/shell/src/pages/QuotaPage.test.tsx`):
- Mock `@mycircle/shared` Apollo hooks
- Test: "no snapshots" state shows empty state + Refresh button
- Test: clicking Refresh calls `collectQuotaSnapshot` mutation
- Test: metric cards render with correct status colors (green/yellow/red)
- Test: "Dump to SQL" hidden when `hasCredentials: false`, shown when `true`
- Test: history chart absent with 1 snapshot, present with 2+

---

## Complexity Tracking

No constitution violations. All choices follow established patterns.

---

## Build & Verify Checklist

After implementing all phases:

```bash
pnpm build:shared        # regenerates types, catches i18n key mismatches
pnpm lint                # no unused vars in functions/ strict tsconfig
cd functions && npx tsc --noEmit  # functions/ separate strict check
pnpm test:run            # quota.test.ts + QuotaPage.test.tsx must pass
pnpm typecheck           # root typecheck
```
