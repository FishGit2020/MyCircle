# Quickstart: GCP Quota & Billing Monitor

## Access the Feature

1. Sign in to MyCircle
2. Click your profile avatar (top-right)
3. Click **"Quota & Billing"** in the dropdown
4. You land on `/quota`

## First Use

The page loads with no data. Click **"Refresh Now"** — this triggers the `collectQuotaSnapshot` mutation which:
1. Calls Cloud Monitoring API for Cloud Run request counts (current calendar month)
2. Reads Firebase Storage bucket sizes by top-level folder
3. Counts documents in key Firestore collections
4. Reads existing TTS quota from Firestore (already tracked per-conversion)
5. Calls Artifact Registry API for repository sizes
6. Saves the snapshot to `quotaSnapshots/{id}` in Firestore

The page updates with metric cards showing usage vs free-tier limits.

## Status Indicators

- **Green** — usage ≤ 80% of free tier (no cost)
- **Yellow** — usage 80–100% of free tier (approaching limit)
- **Red** — usage > 100% of free tier (incurring cost, shows estimated $/month)

## History Chart

After 2+ refreshes, a line chart appears below the metric cards showing trends over time.

## Dump to SQL (optional)

If you have a SQL Analytics connection configured (via Setup → SQL Analytics), a **"Dump to SQL"** button appears. Click it to write the current snapshot to the `quota_snapshots` table in your PostgreSQL database. The table is created automatically on first use.

## IAM Requirements

The Cloud Function uses Application Default Credentials. The following permissions are required on the `mycircle-dash` GCP project:

- `monitoring.timeSeries.list` — Cloud Run request counts
- `storage.objects.list` — Firebase Storage sizes
- `artifactregistry.repositories.list` — Artifact Registry sizes

These are included in the default compute SA roles (`roles/monitoring.viewer`, `roles/storage.objectViewer`, `roles/artifactregistry.reader`).
