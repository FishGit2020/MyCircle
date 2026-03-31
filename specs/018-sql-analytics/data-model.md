# Data Model: SQL Analytics Layer

**Feature**: 018-sql-analytics
**Date**: 2026-03-31

## SQL Tables

### ai_chat_logs

Primary analytics table mirroring Firestore `aiChatLogs` collection.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | Firestore document ID (for deduplication) |
| user_id | TEXT | NOT NULL | Firebase UID |
| provider | TEXT | NOT NULL | 'ollama' or 'gemini' |
| model | TEXT | NOT NULL | e.g. 'gemma2:2b', 'gemini-2.5-flash' |
| input_tokens | INTEGER | NOT NULL DEFAULT 0 | Prompt tokens |
| output_tokens | INTEGER | NOT NULL DEFAULT 0 | Completion tokens |
| total_tokens | INTEGER | NOT NULL DEFAULT 0 | Sum of input + output |
| latency_ms | INTEGER | NOT NULL DEFAULT 0 | End-to-end response time |
| status | TEXT | NOT NULL DEFAULT 'success' | 'success' or 'error' |
| error | TEXT | | Error message if status='error' |
| used_fallback | BOOLEAN | NOT NULL DEFAULT false | Prompt-based tool fallback |
| endpoint_id | TEXT | | Correlates with benchmark endpoints |
| question_preview | TEXT | | Truncated to 200 chars |
| answer_preview | TEXT | | Truncated to 500 chars |
| full_question | TEXT | | Up to 5000 chars |
| full_answer | TEXT | | Up to 10000 chars |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Interaction timestamp |

**Indexes:**
- `idx_chat_logs_created_at` on `created_at DESC`
- `idx_chat_logs_provider_model` on `(provider, model)`
- `idx_chat_logs_user_id` on `user_id`
- `idx_chat_logs_status` on `status`

### ai_tool_calls

Individual tool invocations, normalized from the `toolCalls[]` array in chat logs.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| log_id | TEXT | NOT NULL, FK → ai_chat_logs(id) | Parent chat log |
| tool_name | TEXT | NOT NULL | e.g. 'getWeather', 'getStockQuote' |
| duration_ms | INTEGER | | Execution time |
| error | TEXT | | Error message if tool failed |

**Indexes:**
- `idx_tool_calls_log_id` on `log_id`
- `idx_tool_calls_tool_name` on `tool_name`

### benchmark_results

Individual benchmark run results, mirroring data from Firestore `users/{uid}/benchmarkRuns`.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | TEXT | PRIMARY KEY | Composite: `{runId}_{endpointId}_{model}_{promptHash}` |
| run_id | TEXT | NOT NULL | Firestore benchmarkRun document ID |
| user_id | TEXT | NOT NULL | Firebase UID |
| endpoint_id | TEXT | NOT NULL | Benchmark endpoint reference |
| endpoint_name | TEXT | NOT NULL | Human-readable endpoint name |
| model | TEXT | NOT NULL | Model name |
| prompt | TEXT | NOT NULL | Benchmark prompt text |
| tokens_per_second | REAL | | TPS metric |
| prompt_tokens_per_second | REAL | | Encoding speed |
| time_to_first_token | REAL | | TTFT in seconds |
| total_duration | REAL | | Total time in seconds |
| load_duration | REAL | | Model load time |
| eval_duration | REAL | | Evaluation time |
| eval_count | INTEGER | | Output token count |
| quality_score | REAL | | 1-10 judge score |
| quality_feedback | TEXT | | Judge feedback text |
| quality_judge | TEXT | | Judge model name |
| error | TEXT | | Error message if benchmark failed |
| created_at | TIMESTAMPTZ | NOT NULL | Run timestamp |

**Indexes:**
- `idx_benchmark_created_at` on `created_at DESC`
- `idx_benchmark_model` on `model`
- `idx_benchmark_endpoint` on `(endpoint_id, model)`

### feature_events (optional, Phase 2)

Generic event log for cross-feature analytics. Deferred — not in MVP.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | SERIAL | PRIMARY KEY | Auto-increment |
| user_id | TEXT | NOT NULL | Firebase UID |
| feature | TEXT | NOT NULL | MFE name (e.g. 'weather', 'stocks') |
| action | TEXT | NOT NULL | Event name (e.g. 'page_view', 'search') |
| metadata | JSONB | | Flexible event data |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Event timestamp |

## Firestore Documents (New)

### users/{uid}/sqlConnection (single document)

Stores the user's SQL database connection configuration.

| Field | Type | Notes |
|-------|------|-------|
| tunnelUrl | string | Cloudflare tunnel URL (e.g. `https://sql.example.com`) |
| dbName | string | Database name (default: 'mycircle') |
| username | string | Optional auth username |
| password | string | Optional auth password |
| status | string | 'connected', 'disconnected', 'error' |
| lastTestedAt | string | ISO timestamp of last connection test |
| createdAt | string | ISO timestamp |
| updatedAt | string | ISO timestamp |

### users/{uid}/sqlBackfillState (single document)

Tracks backfill progress for resumability.

| Field | Type | Notes |
|-------|------|-------|
| status | string | 'idle', 'running', 'completed', 'error' |
| lastDocId | string | Firestore cursor for resume |
| totalMigrated | number | Records successfully imported |
| totalErrors | number | Records that failed |
| startedAt | string | ISO timestamp |
| completedAt | string | ISO timestamp (null if running) |
| error | string | Error message if status='error' |

## Entity Relationships

```
ai_chat_logs 1──* ai_tool_calls (log_id FK)

users/{uid}/sqlConnection ──> SQL database (tunnel URL)
users/{uid}/sqlBackfillState ──> tracks migration progress
users/{uid}/benchmarkEndpoints ──> shared across setup page + AI features (unchanged)
```

## State Transitions

### SQL Connection Status
```
(none) → disconnected → connected
                ↕           ↕
              error ←───── error
```

### Backfill Status
```
idle → running → completed
         ↕
       error → idle (user retries)
```

## Deduplication Strategy

- **Chat logs**: Use Firestore document ID as SQL primary key. `INSERT ... ON CONFLICT (id) DO NOTHING` prevents duplicates during backfill and dual-write race conditions.
- **Benchmark results**: Composite key `{runId}_{endpointId}_{model}_{promptHash}` ensures uniqueness per result within a run.
- **Tool calls**: No deduplication needed — they reference the parent log_id which is itself deduplicated.
