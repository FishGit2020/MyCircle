# GraphQL Contracts: Web Crawler Enhancements

**Branch**: `027-web-crawler` | **Date**: 2026-03-17

## Existing Operations (no changes)

### Queries

```graphql
# Fetch all user's crawl jobs (auth required)
crawlJobs: [CrawlJob!]!

# Fetch job details with documents and traces
crawlJobDetail(id: ID!): CrawlJobDetail
```

### Mutations

```graphql
# Start a new crawl job
startCrawl(input: StartCrawlInput!): CrawlJob!

# Request a running job to stop
stopCrawl(id: ID!): CrawlJob!

# Delete a job and all subcollections
deleteCrawlJob(id: ID!): Boolean!
```

---

## New Operations

### Query: searchCrawlJobs

Search the user's crawl history by keyword. Matches against job URL and
associated document titles/content.

```graphql
searchCrawlJobs(query: String!): [CrawlJob!]!
```

**Variables**:
- `query` (String!, required) — Search term, minimum 2 characters

**Returns**: Filtered list of `CrawlJob` objects matching the search term.

**Behavior**:
- Case-insensitive substring match
- Searches: job URL, document titles, document content previews
- Returns jobs where any associated document matches
- Ordered by `createdAt` descending (newest first)
- Auth required (returns only the calling user's jobs)

**Error codes**:
- `UNAUTHENTICATED` — No valid auth token
- `BAD_USER_INPUT` — Query string is empty or less than 2 characters

---

## Type Changes

### CrawledDocument (extended)

New fields added to the existing type:

```graphql
type CrawledDocument {
  # ... existing fields unchanged ...
  id: ID!
  jobId: String!
  url: String!
  title: String
  contentPreview: String
  statusCode: Int!
  contentType: String
  crawledAt: String!
  size: Int!
  depth: Int!

  # NEW fields
  fullContent: String          # Full visible text (up to 100KB)
  contentTruncated: Boolean    # true if fullContent was truncated
  description: String          # From <meta name="description">
  author: String               # From <meta name="author">
  publishDate: String          # From <meta property="article:published_time">
  ogImage: String              # From <meta property="og:image">
}
```

All new fields are nullable for backward compatibility with existing documents.

---

## SSRF Validation (Internal Contract)

Not a GraphQL contract, but a critical internal behavior of the `startCrawl`
mutation and the Cloud Function worker:

**Before fetching any URL, the system MUST**:
1. Parse the URL and verify protocol is `http` or `https`
2. Resolve the hostname to an IP address via DNS lookup
3. Reject if the resolved IP falls within any blocked range:
   - `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
   - `169.254.0.0/16`, `0.0.0.0/8`
   - IPv6: `::1`, `fc00::/7`, `fe80::/10`
4. Return a `GraphQLError` with code `BAD_USER_INPUT` and message
   "URL resolves to a private or reserved network address"
