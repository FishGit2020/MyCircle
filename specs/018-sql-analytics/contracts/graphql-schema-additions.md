# GraphQL Schema Additions: SQL Analytics Layer

**Feature**: 018-sql-analytics
**Date**: 2026-03-31

## New Types

```graphql
type SqlConnectionStatus {
  tunnelUrl: String!
  dbName: String!
  status: String!          # 'connected' | 'disconnected' | 'error'
  lastTestedAt: String
  hasCredentials: Boolean!  # true if username/password set (don't expose actual creds)
}

type SqlBackfillStatus {
  status: String!           # 'idle' | 'running' | 'completed' | 'error'
  totalMigrated: Int!
  totalErrors: Int!
  startedAt: String
  completedAt: String
  error: String
}

type SqlAnalyticsSummary {
  totalCalls: Int!
  totalInputTokens: Int!
  totalOutputTokens: Int!
  totalCost: Float           # estimated, null if no pricing configured
  providerBreakdown: [ProviderStats!]!
  modelBreakdown: [ModelStats!]!
  dailyBreakdown: [DailyStats!]!
  since: String!
}

type ProviderStats {
  provider: String!
  calls: Int!
  tokens: Int!
  avgLatencyMs: Float!
  errorRate: Float!
}

type ModelStats {
  model: String!
  provider: String!
  calls: Int!
  tokens: Int!
  avgLatencyMs: Float!
  estimatedCost: Float
}

type DailyStats {
  date: String!
  calls: Int!
  tokens: Int!
  avgLatencyMs: Float!
  errors: Int!
}

type LatencyPercentiles {
  provider: String!
  model: String!
  p50: Float!
  p90: Float!
  p99: Float!
  sampleSize: Int!
}

type ToolUsageStats {
  toolName: String!
  callCount: Int!
  avgDurationMs: Float
  errorRate: Float!
}

type ToolCoOccurrence {
  toolA: String!
  toolB: String!
  coOccurrences: Int!
}

type BenchmarkTrend {
  endpointName: String!
  model: String!
  week: String!             # ISO date of week start
  avgTps: Float!
  avgTtft: Float!
  sampleSize: Int!
}

type ChatSearchResult {
  id: String!
  timestamp: String!
  provider: String!
  model: String!
  questionPreview: String!
  answerPreview: String!
  latencyMs: Int!
  totalTokens: Int!
}

input SqlConnectionInput {
  tunnelUrl: String!
  dbName: String
  username: String
  password: String
}
```

## New Queries

```graphql
type Query {
  # SQL connection status
  sqlConnectionStatus: SqlConnectionStatus

  # Backfill status
  sqlBackfillStatus: SqlBackfillStatus

  # Analytics (all require active SQL connection)
  sqlAnalyticsSummary(days: Int = 30): SqlAnalyticsSummary
  sqlLatencyPercentiles(days: Int = 30): [LatencyPercentiles!]!
  sqlToolUsageStats(days: Int = 30): [ToolUsageStats!]!
  sqlToolCoOccurrences(days: Int = 30, minCount: Int = 2): [ToolCoOccurrence!]!
  sqlBenchmarkTrends(weeks: Int = 12): [BenchmarkTrend!]!
  sqlChatSearch(query: String!, limit: Int = 20): [ChatSearchResult!]!
}
```

## New Mutations

```graphql
type Mutation {
  # SQL connection management
  saveSqlConnection(input: SqlConnectionInput!): SqlConnectionStatus!
  testSqlConnection: SqlConnectionStatus!
  deleteSqlConnection: Boolean!

  # Backfill
  startSqlBackfill: SqlBackfillStatus!
}
```

## Resolver Behavior Notes

- All `sql*` queries return empty results / null if no SQL connection is configured (FR-013).
- `saveSqlConnection` also tests the connection and initializes the schema (FR-003, FR-006).
- `testSqlConnection` re-tests an existing connection without changing config.
- `startSqlBackfill` is idempotent — if already running, returns current status. If completed, resets and starts fresh only if Firestore has newer data.
- Analytics queries use the tunnel URL from the user's `sqlConnection` document to create a temporary `pg` client per request. Connection pooling is not needed since Cloud Functions are ephemeral.
