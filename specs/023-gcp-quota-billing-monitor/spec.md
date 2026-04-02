# Feature Specification: GCP Quota & Billing Monitor

**Feature Branch**: `023-gcp-quota-billing-monitor`
**Created**: 2026-04-01
**Status**: Draft

## Clarifications

### Session 2026-04-01

- Q: Where should the GCP billing link point, and should per-service links be included? → A: Main link is `https://console.cloud.google.com/billing/01752D-EE3836-922FD4`; each metric card also links to its own GCP service console page.
- Q: How should $0.00 cost be displayed on free-tier cards? → A: Show `$0.00 / mo` on all cards — consistent format regardless of whether cost is zero or non-zero.
- Q: Should cost represent month-to-date actual or projected full-month? → A: Show both — MTD actual cost and projected full-month cost side by side (e.g., `$0.62 MTD · est. $0.74 / mo`).
- Q: Should Firebase Functions invocations be tracked separately from Cloud Run HTTP requests? → A: Yes — track both as separate metric cards. Cloud Run = HTTP request quota; Firebase Functions = event-triggered invocation quota. Different free-tier pools.
- Direct: Add Firebase Usage dashboard link (`https://console.firebase.google.com/u/0/project/mycircle-dash/usage`) as a second header link alongside GCP Billing.
- Direct: Expand monitored metrics to include Firebase Functions invocations, Firebase Storage bandwidth, Firestore daily reads/writes/deletes (with 7-day peak), and Firebase Hosting storage + daily downloads.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Current GCP Usage Snapshot (Priority: P1)

An admin user opens the UserMenu (profile avatar dropdown) and clicks "Quota & Billing". They see the current GCP resource usage across all 7 monitored service categories — Cloud Run HTTP requests, Firebase Functions invocations, Firebase Storage (size + bandwidth), Firestore daily reads/writes/deletes, TTS character counts, Artifact Registry storage, and Firebase Hosting (storage + downloads) — displayed alongside free-tier limits, usage percentages, MTD actual cost, and projected full-month cost.

**Why this priority**: This is the core value of the feature. Without a snapshot view, there is nothing else to build on.

**Independent Test**: Can be fully tested by clicking "Refresh Now" and verifying each of the 7 metric cards shows a value, a free-tier limit, a usage percentage, an MTD cost (e.g., `$0.00 MTD`), and a projected cost (e.g., `est. $0.00 / mo`) — without needing history or SQL.

**Acceptance Scenarios**:

1. **Given** a signed-in user with admin access, **When** they navigate to the Quota & Billing page, **Then** they see metric cards for all 7 monitored service categories
2. **Given** the page is loaded, **When** the user clicks "Refresh Now", **Then** the system collects fresh data from GCP and updates all metric cards within 30 seconds
3. **Given** a metric is within the free tier, **When** the card renders, **Then** it shows a green indicator, usage percentage, `$0.00 MTD`, and `est. $0.00 / mo`
4. **Given** a metric exceeds the free-tier threshold (>80%), **When** the card renders, **Then** it shows a yellow warning indicator with MTD cost and projected cost
5. **Given** a metric exceeds the free-tier limit, **When** the card renders, **Then** it shows a red indicator, MTD cost (e.g., `$47.13 MTD`), and projected full-month cost (e.g., `est. $57.20 / mo`)
6. **Given** the Firestore card renders, **When** reads have peaked above the daily limit in the last 7 days, **Then** the card shows "Peaked at 101K in last 7 days" as a warning sub-line
7. **Given** the GCP API call fails during refresh, **When** the error occurs, **Then** the page shows an error message per failed service without crashing
8. **Given** the page header renders, **When** the user clicks "View in GCP Billing", **Then** they are navigated to `https://console.cloud.google.com/billing/01752D-EE3836-922FD4` in a new tab
9. **Given** the page header renders, **When** the user clicks "Firebase Usage", **Then** they are navigated to `https://console.firebase.google.com/u/0/project/mycircle-dash/usage` in a new tab
10. **Given** a metric card renders, **When** the user clicks its service link, **Then** they are navigated to that service's console page in a new tab

---

### User Story 2 - View Historical Usage Trends (Priority: P2)

After multiple manual refreshes over days/weeks, the user returns to the Quota & Billing page and sees a history chart showing how each metric has changed over time.

**Why this priority**: History enables trend detection (e.g., storage growing fast, TTS spike after a deploy). Useful but not required for the initial snapshot.

**Independent Test**: Can be tested by triggering two refreshes and verifying a chart appears with two data points per metric.

**Acceptance Scenarios**:

1. **Given** fewer than 2 snapshots exist, **When** the user views the page, **Then** the history chart section is hidden with a message "Refresh at least twice to see trends"
2. **Given** 2 or more snapshots exist, **When** the user views the page, **Then** a line chart shows each metric over time with dates on the x-axis
3. **Given** a user selects a specific metric from the chart legend, **When** they click it, **Then** only that metric's trend line is highlighted

---

### User Story 3 - Dump Snapshot to SQL (Priority: P3)

A user who has configured the SQL Analytics connection clicks "Dump to SQL" to persist the current snapshot to their PostgreSQL database for external analysis.

**Why this priority**: Optional power-user feature. Has no impact on core quota monitoring.

**Independent Test**: Can be tested by confirming a `quota_snapshots` table is created and populated in the connected SQL database.

**Acceptance Scenarios**:

1. **Given** SQL connection is not configured, **When** the user views the page, **Then** the "Dump to SQL" button is not visible
2. **Given** SQL connection is configured, **When** the user views the page, **Then** the "Dump to SQL" button is visible
3. **Given** a snapshot exists, **When** the user clicks "Dump to SQL", **Then** the current snapshot is written to a `quota_snapshots` table and a success message is shown
4. **Given** the `quota_snapshots` table does not exist, **When** the first dump is triggered, **Then** the system creates the table automatically before inserting

---

### Edge Cases

- What happens when GCP credentials are expired or not available? → Show an actionable error: "GCP credentials unavailable — run `gcloud auth application-default login`"
- What happens when a specific GCP API (e.g., Cloud Monitoring) is not enabled? → Show per-service error card while others continue to display
- What happens when there are no Cloud Run services? → Show "0 requests" with a green indicator, `$0.00 MTD`, `est. $0.00 / mo`
- What happens when the SQL database connection is lost during a dump? → Show an error with the specific connection failure; do not corrupt existing data
- What happens when the user refreshes while a refresh is already in progress? → Disable the "Refresh Now" button while in progress
- What happens when only a few days have elapsed in the month? → Projected cost = MTD cost ÷ elapsed days × days in month; show a note "based on X days of data" when fewer than 7 days have elapsed
- What happens when Firestore daily read count cannot be retrieved from Cloud Monitoring? → Show an error sub-card for reads while writes/deletes still display
- What happens when Firebase Hosting bandwidth API is unavailable? → Show "N/A" with a note linking to the Firebase Usage console for manual verification

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a "Quota & Billing" entry point in the UserMenu (profile avatar dropdown) that navigates to the quota page
- **FR-002**: System MUST collect, on manual trigger, the following GCP metrics across **7 service categories**:
  - **Cloud Run**: total HTTP request count per service for the current calendar month (free tier: 2M requests/month)
  - **Firebase Functions**: total event-triggered invocation count for the current calendar month via Cloud Monitoring `cloudfunctions.googleapis.com/function/execution_count` (free tier: 2M invocations/month)
  - **Firebase Storage**: (a) total bytes stored broken down by top-level folder; (b) total monthly bandwidth/download bytes (free tier: ~1 GB storage, ~10 GB/month bandwidth — region-dependent)
  - **Cloud Firestore**: daily reads, daily writes, and daily deletes for the current day via Cloud Monitoring `firestore.googleapis.com/document/read_count`, `write_count`, `delete_count`; also collect 7-day peak for each operation (free tier: 50K reads/day, 20K writes/day, 20K deletes/day)
  - **Cloud TTS**: character count per SKU group for the current calendar month (free tier: 4M chars/month WaveNet/Standard, 1M chars/month Neural2/Polyglot, 1M chars/month Chirp3-HD)
  - **Artifact Registry**: total storage size in bytes (free tier: 0.5 GB)
  - **Firebase Hosting**: (a) total hosting storage size; (b) daily download bandwidth (free tier: 10 GB storage, 360 MB/day downloads)
- **FR-003**: System MUST display each collected metric alongside its GCP free-tier limit and a usage percentage
- **FR-004**: System MUST show a visual status indicator per metric: green (≤80% of free tier), yellow (80–100%), red (>100%)
- **FR-005**: System MUST show cost estimates on **every** metric card regardless of whether cost is zero or non-zero. Each card displays two values: (a) MTD actual cost (e.g., `$0.00 MTD` or `$47.13 MTD`) and (b) projected full-month cost (e.g., `est. $0.00 / mo` or `est. $57.20 / mo`). Projected cost = MTD cost ÷ elapsed days in month × total days in month. When fewer than 7 days have elapsed, show a note: "based on X days of data".
- **FR-006**: System MUST persist each snapshot locally (in Firestore) so historical data survives page reloads
- **FR-007**: System MUST display a history chart when 2 or more snapshots exist
- **FR-008**: The "Refresh Now" button MUST be disabled while a refresh is in progress
- **FR-009**: System MUST show an error state per individual service if collection fails, without blocking other services
- **FR-010**: System MUST show the timestamp of the last successful refresh
- **FR-011**: If SQL Analytics is configured, system MUST show a "Dump to SQL" button that writes the snapshot to a `quota_snapshots` table
- **FR-012**: System MUST auto-create the `quota_snapshots` table on first dump if it does not exist
- **FR-013**: Page header MUST include two verification links, both opening in a new tab:
  - "View in GCP Billing" → `https://console.cloud.google.com/billing/01752D-EE3836-922FD4`
  - "Firebase Usage" → `https://console.firebase.google.com/u/0/project/mycircle-dash/usage`
- **FR-014**: Each metric card MUST include a link to its corresponding console page, opening in a new tab:
  - Cloud Run → `https://console.cloud.google.com/run?project=mycircle-dash`
  - Firebase Functions → `https://console.firebase.google.com/u/0/project/mycircle-dash/functions`
  - Firebase Storage → `https://console.cloud.google.com/storage/browser?project=mycircle-dash`
  - Firestore → `https://console.cloud.google.com/firestore/data?project=mycircle-dash`
  - TTS → `https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/quotas?project=mycircle-dash`
  - Artifact Registry → `https://console.cloud.google.com/artifacts?project=mycircle-dash`
  - Firebase Hosting → `https://console.firebase.google.com/u/0/project/mycircle-dash/hosting`
- **FR-015**: The Firestore metric card MUST display the 7-day peak alongside the current day's value for reads, writes, and deletes. If any 7-day peak exceeded the daily free-tier limit, it MUST be flagged with a warning label (e.g., "Peaked at 101K — exceeded 50K/day limit").

### Key Entities

- **QuotaSnapshot**: A point-in-time collection of all GCP resource metrics. Attributes: snapshot ID, timestamp, Cloud Run metrics (per service), Firebase Functions invocation metrics, Storage metrics (per folder + bandwidth), Firestore metrics (daily reads/writes/deletes + 7-day peaks), TTS metrics (per SKU), Artifact Registry metrics, Firebase Hosting metrics (storage + downloads), MTD estimated cost per service, projected full-month cost per service, total MTD cost, total projected cost, elapsed days in month
- **ResourceMetric**: A single measured value within a snapshot. Attributes: service name, metric name, current value, free-tier limit, limit period (daily or monthly), unit (requests, bytes, documents, characters), status (green/yellow/red), MTD cost, projected monthly cost, 7-day peak (Firestore only)
- **FreeTierLimit**: Static reference data defining the free allowance per GCP service, the limit period (daily vs monthly), and the per-unit cost beyond that limit

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can trigger a full GCP usage refresh and see results for all 7 service categories within 30 seconds
- **SC-002**: Each metric card accurately reflects the same values observable in the Firebase Usage dashboard and `gcloud` CLI (within a 5% margin due to API aggregation windows)
- **SC-003**: After 2 or more refreshes, a history chart renders without manual configuration
- **SC-004**: If SQL is connected, a dump operation completes within 10 seconds and the `quota_snapshots` table contains the correct row count
- **SC-005**: The feature introduces no regression in UserMenu rendering or navigation for users who never visit the quota page
- **SC-006**: Every metric card shows both an MTD cost and a projected full-month cost; both "View in GCP Billing" and "Firebase Usage" links are always visible in the page header
- **SC-007**: The Firestore card shows 7-day peak data and flags any day where reads exceeded 50K, writes exceeded 20K, or deletes exceeded 20K

## Assumptions

- Only the signed-in user (owner) uses this feature — no multi-user permission model needed
- GCP Application Default Credentials are available in the Cloud Function runtime environment (already true — existing functions use the same credentials)
- Firestore free-tier limits are **daily**: 50K reads/day, 20K writes/day, 20K deletes/day. (Previous assumption of monthly approximation is replaced.)
- Firebase Storage free-tier limits are region-dependent; us-central1 baseline used: ~1 GB storage, ~10 GB/month bandwidth. If actual region differs, limits must be updated in the FREE_TIER constants.
- Firebase Hosting free-tier limits: 10 GB storage total, 360 MB/day downloads.
- TTS billing is based on character count; free tiers: 4M chars/month WaveNet/Standard, 1M chars/month Neural2/Polyglot, 1M chars/month Chirp3-HD.
- Firebase Functions invocations (event-triggered) are tracked separately from Cloud Run HTTP requests — they use different free-tier pools (both 2M/month but consumed independently).
- Snapshot history is stored in Firestore under `users/{uid}/quotaSnapshots` — no additional infrastructure needed
- SQL dump is optional and only shown when the user has an active SQL connection (detected via existing sql-analytics MFE state)
- GCP pricing constants are hardcoded in the Cloud Function and updated manually when GCP changes pricing — no dynamic pricing API required
- The GCP billing account ID is `01752D-EE3836-922FD4` (Firebase Payment account). Hardcoded in FR-013.
- Projected cost uses simple linear extrapolation (MTD ÷ elapsed days × days in month). May underestimate for end-of-month spike workloads.
- If Firebase Hosting bandwidth cannot be retrieved via API, the card shows "N/A" with a link to the Firebase Usage console rather than failing the whole snapshot.
