# Data Model: Web Crawler

**Branch**: `027-web-crawler` | **Date**: 2026-03-17

## Entities

### CrawlJob

Represents a user-initiated crawl task. Top-level document in the user's
private subcollection.

**Firestore path**: `users/{uid}/crawlJobs/{jobId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | The target URL submitted by the user |
| status | string | yes | One of: `pending`, `running`, `completed`, `stopped`, `stopping`, `failed` |
| maxDepth | number | yes | Maximum link-following depth (1-5, default 2) |
| maxPages | number | yes | Maximum pages to visit (1-100, default 20) |
| pagesVisited | number | yes | Counter of pages crawled so far |
| createdAt | timestamp | yes | When the job was created |
| updatedAt | timestamp | yes | Last status/progress update |

**Validation rules**:
- `url` must be a valid HTTP or HTTPS URL
- `url` must NOT resolve to a private/internal IP address (SSRF protection)
- `maxDepth` clamped to [1, 5]
- `maxPages` clamped to [1, 100]
- `status` transitions: `pending` → `running` → `completed`/`failed`/`stopping` → `stopped`

**State transitions**:

```text
pending → running → completed
                  → failed
                  → stopping → stopped
pending → stopping → stopped (if stopped before worker picks up)
```

### CrawledDocument

Represents a single page fetched during a crawl job. Stored as a subcollection
document under the parent job.

**Firestore path**: `users/{uid}/crawlJobs/{jobId}/documents/{docId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | yes | The fetched page URL |
| title | string | no | Page `<title>` content (first 500 chars) |
| contentPreview | string | no | First 500 chars of visible text content |
| fullContent | string | no | **NEW** — Full visible text (up to 100KB, truncated with `contentTruncated` flag) |
| contentTruncated | boolean | no | **NEW** — `true` if fullContent was truncated at 100KB |
| description | string | no | **NEW** — From `<meta name="description">` or `<meta property="og:description">` |
| author | string | no | **NEW** — From `<meta name="author">` |
| publishDate | string | no | **NEW** — From `<meta property="article:published_time">` (ISO 8601) |
| ogImage | string | no | **NEW** — From `<meta property="og:image">` |
| statusCode | number | yes | HTTP response status code |
| contentType | string | no | HTTP `Content-Type` header value |
| crawledAt | timestamp | yes | When this page was fetched |
| size | number | yes | Response body size in bytes |
| depth | number | yes | Link depth from the starting URL (0 = starting page) |

**Validation rules**:
- `fullContent` max 100,000 characters (well under Firestore 1MB doc limit)
- `title` max 500 characters
- `description` max 1,000 characters
- `ogImage` must be a valid URL if present

### CrawlTrace

Represents a log entry from the crawl worker execution. Used for the tracing
tab UI.

**Firestore path**: `users/{uid}/crawlJobs/{jobId}/traces/{traceId}`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | timestamp | yes | When the trace was recorded |
| level | string | yes | One of: `info`, `warn`, `error` |
| message | string | yes | Human-readable log message |
| url | string | no | The URL being processed when this trace was emitted |
| durationMs | number | no | Duration of the operation in milliseconds |

## Relationships

```text
User (users/{uid})
 └── CrawlJob (crawlJobs/{jobId})      1:many
      ├── CrawledDocument (documents/{docId})  1:many
      └── CrawlTrace (traces/{traceId})        1:many
```

- Each User owns many CrawlJobs (private, no cross-user access)
- Each CrawlJob has many CrawledDocuments (pages fetched)
- Each CrawlJob has many CrawlTraces (execution logs)
- Deleting a CrawlJob cascades to its documents and traces subcollections

## Security Rules

All crawlJobs subcollections are gated by `request.auth.uid == userId`:
- Users can read/write their own jobs
- Users can read (but not write) documents and traces (written by Cloud Function)
- No cross-user access is possible

## New Fields Summary (changes from existing)

Fields marked **NEW** above are additions to the existing `CrawledDocument`:
- `fullContent` — enables the content reader view (FR-004, FR-009)
- `contentTruncated` — signals truncation to the UI
- `description` — extracted metadata (FR-003)
- `author` — extracted metadata (FR-003)
- `publishDate` — extracted metadata (FR-003)
- `ogImage` — extracted metadata (FR-003)

These additions are backward-compatible — existing documents without these fields
will render with `null` values in the UI.
