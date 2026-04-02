# Research: GCP Quota & Billing Monitor

## Decision 1: Page Architecture — Shell Page vs New MFE

**Decision**: Implement as a **shell-internal page** (`packages/shell/src/pages/QuotaPage.tsx`), not a new MFE.

**Rationale**: The RecycleBin (`/trash`) establishes the exact precedent — admin pages that require shell-level context (user auth, navigation) live as shell pages, not federated MFEs. This avoids 20+ integration points required for a new MFE (Dockerfile, nav, widget, command palette, e2e, vitest aliases, etc.) while delivering the same user-facing result. The quota page is not independently deployable content — it's tied to the user's GCP project, which is shell-level config.

**Alternatives considered**:
- New MFE: rejected — disproportionate overhead for an admin page with no widget/nav needs
- Add to `setup` MFE: rejected — setup is for configuration; quota monitoring is read-only observation, different mental model

---

## Decision 2: TTS Quota — Existing vs New Collection

**Decision**: **Reuse the existing `ttsQuota` GraphQL query** (`functions/src/resolvers/digitalLibrary.ts:187`). The `TtsQuota` type already tracks character/request counts per SKU group (WaveNet/Standard, Neural2/Polyglot, Chirp3-HD) with free-tier limits built in.

**Rationale**: The TTS quota resolver already exists and is battle-tested. Re-implementing it in a new resolver would be duplication. The quota snapshot collector should call the existing `ttsQuota` resolver internally or read from the same Firestore path (`users/{uid}/ttsUsage`).

**Alternatives considered**:
- Cloud Monitoring API for TTS character counts: rejected — the existing in-app tracking via `ttsUsage` Firestore doc is more accurate (updated per-conversion) and doesn't require GCP Monitoring API latency
- Re-implementing TTS tracking: rejected — duplication

---

## Decision 3: GCP Data Collection — Cloud Monitoring API vs gcloud CLI equivalents

**Decision**: Use **GCP REST APIs directly** in the Cloud Function, not shelling out to gcloud CLI:
- **Cloud Run request counts**: Cloud Monitoring API (`monitoring.googleapis.com`) — `run.googleapis.com/request_count` metric, aggregated over the current calendar month
- **Firebase Storage sizes**: Google Cloud Storage JSON API — `storage.googleapis.com` list objects with size aggregation per prefix
- **Artifact Registry size**: Artifact Registry API — repository list with `sizeBytes` field
- **Firestore doc counts**: Firebase Admin SDK `collection().count()` (already available in functions)

**Rationale**: Cloud Functions run with the default compute service account which already has IAM roles for Cloud Monitoring, Storage, and Artifact Registry (verified — these are the same APIs the billing analysis used). The `google-auth-library` is already in `functions/node_modules`.

**Alternatives considered**:
- Billing API (`cloudbilling.googleapis.com`): considered but rejected for cost data — billing data has 24-48h latency and requires Billing Account Viewer IAM role (not default). Free-tier limit + usage math gives real-time cost estimates without billing API access.
- BigQuery billing export: rejected — requires manual setup and BigQuery enablement

---

## Decision 4: Snapshot Persistence — Firestore

**Decision**: Store snapshots in **`users/{uid}/quotaSnapshots/{snapshotId}`** in Firestore.

**Rationale**: Follows the established pattern for per-user data (notes, routes, flashcards all use `users/{uid}/collection/{id}`). The 5-user scale means Firestore read costs are negligible. Snapshots are small (~1KB each).

**Retention**: Keep last 90 snapshots (90 days of daily refreshes). The mutation prunes old snapshots on write.

---

## Decision 5: SQL Dump — GraphQL Mutation + Existing SQL Client

**Decision**: Add a `dumpQuotaToSql` GraphQL mutation that reuses the existing `createSqlClient()` and `initSqlSchema()` from `functions/src/sqlClient.ts`.

**Rationale**: The SQL client is already wired — it reads `users/{uid}/sqlConnection/config` from Firestore and creates a pg client. The existing pattern (`logChatToSql`, `logBenchmarkToSql` in `functions/src/sqlWriter.ts`) shows how to write to SQL. We follow the same pattern with `logQuotaToSql`.

SQL availability detection: the frontend uses `GET_SQL_CONNECTION_STATUS` GraphQL query (returns `hasCredentials: boolean`). The "Dump to SQL" button is only shown when `hasCredentials === true && status === 'connected'`.

---

## Decision 6: GCP Free-Tier Constants

Hardcoded in the Cloud Function resolver. Updated manually when GCP changes pricing.

| Service | Free Tier | Unit | Cost Beyond Free |
|---------|-----------|------|-----------------|
| Cloud Run requests | 2,000,000 / month | requests | $0.40 / 1M |
| Cloud Run compute | 360,000 GB-s / month | GB-seconds | $0.00002400 / GB-s |
| Firebase Storage | 1 GB stored | bytes | $0.026 / GB |
| Firebase Storage downloads | 10 GB / month | bytes | $0.12 / GB |
| Firestore reads | 50,000 / day | docs | $0.06 / 100K |
| Firestore writes | 20,000 / day | docs | $0.18 / 100K |
| Artifact Registry | 0.5 GB | bytes | $0.10 / GB |
| TTS WaveNet/Standard | 4,000,000 chars / month | chars | $0.000016 / char |
| TTS Neural2/Polyglot | 1,000,000 chars / month | chars | $0.000016 / char |
| TTS Chirp3-HD | 1,000,000 chars / month | chars | $0.00003 / char |

---

## Decision 7: Cloud Monitoring API Auth

**Decision**: Use **Application Default Credentials (ADC)** via `google-auth-library` already present in `functions/node_modules`.

The Cloud Function service account (`441498720264-compute@developer.gserviceaccount.com`) already has `roles/monitoring.viewer` implicitly via Cloud Run default permissions.

**Risk**: If the service account lacks `monitoring.viewer`, the Cloud Run metrics call fails gracefully — the quota page shows an error card for that metric while others succeed (per FR-009).

---

## Existing Code to Reuse

| What | Location |
|------|----------|
| TTS quota tracking | `functions/src/resolvers/digitalLibrary.ts` — `ttsQuota` resolver |
| SQL client creation | `functions/src/sqlClient.ts` — `createSqlClient()`, `initSqlSchema()` |
| SQL writer pattern | `functions/src/sqlWriter.ts` — `logChatToSql()`, `logBenchmarkToSql()` |
| SQL connection detection | `packages/shared/src/apollo/queries.ts` — `GET_SQL_CONNECTION_STATUS` |
| Resolver factory pattern | `functions/src/resolvers/*.ts` — `createXxxQueryResolvers()` |
| Shell page pattern | `packages/shell/src/pages/RecycleBinPage.tsx` |
| UserMenu navigation | `packages/shell/src/components/layout/UserMenu.tsx` — `navigate('/setup')` pattern |
| Route registration | `packages/shell/src/App.tsx` — `<Route path="quota" element={...} />` |
| Route label | `packages/shell/src/routeConfig.ts` — `ROUTE_LABEL_KEYS` |
