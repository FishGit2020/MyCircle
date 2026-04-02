# Data Model: GCP Quota & Billing Monitor

## Firestore Schema

### `users/{uid}/quotaSnapshots/{snapshotId}`

Stores one snapshot per manual refresh. Pruned to last 90 documents on write.

```
QuotaSnapshot {
  id:         string          // auto-generated Firestore doc ID
  collectedAt: Timestamp      // when the snapshot was taken
  cloudRun: {
    totalRequests: number     // total requests across all services, current calendar month
    byService: {              // per-service breakdown
      [serviceName: string]: number
    }
    freeTierLimit: number     // 2,000,000
    estimatedCostUsd: number  // 0 if within free tier
  }
  storage: {
    totalBytes: number        // total bucket size in bytes
    byFolder: {               // top-level folder breakdown
      [folderName: string]: number  // e.g. "books": 1787822080
    }
    freeTierLimitBytes: number  // 1,073,741,824 (1 GB)
    estimatedCostUsd: number
  }
  firestore: {
    collections: {            // doc count per tracked collection
      [collectionName: string]: number  // e.g. "users": 5, "worshipSongs": 112
    }
    estimatedDailyReads: number   // rough estimate from app traffic
    freeTierLimitReadsPerDay: number  // 50,000
    estimatedCostUsd: number
  }
  tts: {
    wavenetStandard: {
      characters: number
      requests:   number
      freeTierLimit: number   // 4,000,000 chars/month
      estimatedCostUsd: number
    }
    neural2Polyglot: {
      characters: number
      requests:   number
      freeTierLimit: number   // 1,000,000 chars/month
      estimatedCostUsd: number
    }
    chirp3: {
      characters: number
      requests:   number
      freeTierLimit: number   // 1,000,000 chars/month
      estimatedCostUsd: number
    }
  }
  artifactRegistry: {
    totalBytes: number
    byRepository: {
      [repoName: string]: number
    }
    freeTierLimitBytes: number  // 536,870,912 (0.5 GB)
    estimatedCostUsd: number
  }
  totalEstimatedCostUsd: number   // sum of all service estimates
  errors: string[]                // list of services that failed to collect
}
```

**Indexes**: none required — queries are always `where uid = X order by collectedAt desc limit 90`

---

## GraphQL Schema Extensions

### New types in `functions/src/schema.ts`

```graphql
type CloudRunQuotaMetric {
  totalRequests: Int!
  byService: [ServiceRequestCount!]!
  freeTierLimit: Int!
  estimatedCostUsd: Float!
}

type ServiceRequestCount {
  serviceName: String!
  requests: Int!
}

type StorageQuotaMetric {
  totalBytes: Float!
  byFolder: [FolderSize!]!
  freeTierLimitBytes: Float!
  estimatedCostUsd: Float!
}

type FolderSize {
  folder: String!
  bytes: Float!
}

type FirestoreQuotaMetric {
  collections: [CollectionCount!]!
  freeTierLimitReadsPerDay: Int!
  estimatedCostUsd: Float!
}

type CollectionCount {
  collection: String!
  count: Int!
}

type ArtifactRegistryQuotaMetric {
  totalBytes: Float!
  byRepository: [RepositorySize!]!
  freeTierLimitBytes: Float!
  estimatedCostUsd: Float!
}

type RepositorySize {
  repository: String!
  bytes: Float!
}

type QuotaSnapshot {
  id: String!
  collectedAt: String!
  cloudRun: CloudRunQuotaMetric!
  storage: StorageQuotaMetric!
  firestore: FirestoreQuotaMetric!
  tts: TtsQuota!          # reuses existing TtsQuota type
  artifactRegistry: ArtifactRegistryQuotaMetric!
  totalEstimatedCostUsd: Float!
  errors: [String!]!
}

type QuotaSnapshotList {
  snapshots: [QuotaSnapshot!]!
  total: Int!
}
```

### New query in `type Query`

```graphql
# Returns the N most recent quota snapshots for the authenticated user
quotaSnapshots(limit: Int): QuotaSnapshotList!
```

### New mutation in `type Mutation`

```graphql
# Collects fresh GCP metrics and saves a new snapshot. Returns the snapshot.
collectQuotaSnapshot: QuotaSnapshot!

# Writes the most recent snapshot to the connected SQL database.
# Errors if no SQL connection is configured.
dumpQuotaToSql: Boolean!
```

---

## SQL Schema

### Table `quota_snapshots`

Created automatically on first `dumpQuotaToSql` call if it doesn't exist.

```sql
CREATE TABLE IF NOT EXISTS quota_snapshots (
  id                      TEXT PRIMARY KEY,
  collected_at            TIMESTAMPTZ NOT NULL,
  cloud_run_requests      INTEGER NOT NULL DEFAULT 0,
  storage_bytes           BIGINT NOT NULL DEFAULT 0,
  firestore_users         INTEGER NOT NULL DEFAULT 0,
  firestore_worship_songs INTEGER NOT NULL DEFAULT 0,
  firestore_announcements INTEGER NOT NULL DEFAULT 0,
  tts_wavenet_chars       BIGINT NOT NULL DEFAULT 0,
  tts_neural2_chars       BIGINT NOT NULL DEFAULT 0,
  tts_chirp3_chars        BIGINT NOT NULL DEFAULT 0,
  artifact_registry_bytes BIGINT NOT NULL DEFAULT 0,
  total_cost_usd          NUMERIC(10,4) NOT NULL DEFAULT 0,
  errors                  TEXT[] NOT NULL DEFAULT '{}',
  raw_json                JSONB NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## State Transitions

```
QuotaPage load
  └─► fetch quotaSnapshots(limit: 10) via GraphQL
        ├─ [0 snapshots] → show empty state + "Refresh Now" button
        ├─ [1 snapshot]  → show metric cards + "Refresh Now" + "Refresh history needs 2+ snapshots" note
        └─ [2+ snapshots] → show metric cards + history chart + "Refresh Now"

"Refresh Now" clicked
  └─► collectQuotaSnapshot mutation
        ├─ loading: disable button, show spinner
        ├─ success: update metric cards + append to history
        └─ error: show per-service error badges, keep previous data

"Dump to SQL" clicked (only if sqlConnection.hasCredentials === true)
  └─► dumpQuotaToSql mutation
        ├─ loading: show button spinner
        ├─ success: show "Dumped to SQL" toast
        └─ error: show error message
```
