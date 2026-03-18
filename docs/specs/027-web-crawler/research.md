# Research: Web Crawler Enhancements

**Branch**: `027-web-crawler` | **Date**: 2026-03-17

## Existing Implementation Analysis

The web crawler MFE was shipped in PR #774 (commit `4019cc0`). It implements a
multi-page spider with configurable depth (1-5) and max pages (1-100). The spec
describes a simpler single-page extractor. Rather than rewriting, this plan
enhances the existing implementation to close spec gaps.

### Feature Gap Matrix

| Spec Requirement | Existing | Gap |
|-----------------|----------|-----|
| FR-001: Single-page URL extraction | Multi-page spider (depth + max pages) | Existing is a superset — no change needed (single page = depth 1, max 1) |
| FR-002: URL validation | Basic `new URL()` check | Sufficient |
| FR-003: Rich metadata extraction | Title + 500-char content preview only | Missing: description, author, publish date, image references |
| FR-004: Clean readable content view | Table-style document list with preview | Missing: dedicated content reader view |
| FR-005: Loading state | Polling every 3-5s with status badges | Sufficient |
| FR-006: Error messages | GraphQL errors surfaced | Sufficient |
| FR-007: Persist crawl results | Firestore subcollections | Sufficient |
| FR-008: Reverse chronological history | Ordered desc by createdAt | Sufficient |
| FR-009: View full content from history | Content preview only (500 chars) | Missing: full content storage + reader |
| FR-010: Delete with confirmation | Delete button + confirm dialog | Sufficient |
| FR-011: Search by keyword | Not implemented | Missing entirely |
| FR-012: Timeout handling | 10s axios timeout, 540s function timeout | Sufficient |
| FR-013: Public pages only | Same-origin link following | Sufficient |
| FR-014: Content sanitization | cheerio text extraction (no raw HTML) | Sufficient (text-only, no XSS vector) |
| FR-015: SSRF protection | Not implemented | Missing entirely |

### Gaps to Address (4 items)

1. **SSRF protection** (FR-015) — security
2. **Keyword search** (FR-011) — new feature
3. **Rich metadata extraction** (FR-003) — enhancement
4. **Content reader view** (FR-004, FR-009) — UX enhancement

---

## R1: SSRF Protection in Cloud Function Worker

**Decision**: Add a `isPrivateUrl()` validation function to the worker that blocks
requests to private/internal IP ranges before `axios.get()` is called.

**Rationale**: The server-side fetcher currently accepts any URL the user provides.
A malicious user could submit `http://169.254.169.254/` (cloud metadata),
`http://localhost:3003/graphql`, or `http://10.0.0.1/admin` to probe internal
infrastructure. Constitution principle V (Safe Code) mandates SSRF protection.

**Blocked ranges**:
- `127.0.0.0/8` (localhost/loopback)
- `10.0.0.0/8` (private class A)
- `172.16.0.0/12` (private class B)
- `192.168.0.0/16` (private class C)
- `169.254.0.0/16` (link-local)
- `0.0.0.0/8` (unspecified)
- `::1`, `fc00::/7`, `fe80::/10` (IPv6 equivalents)
- Non-HTTP(S) protocols rejected

**Implementation**: Resolve hostname to IP via `dns.promises.lookup()` before
fetching, then check against blocked CIDR ranges. Apply to every URL before
`axios.get()`.

**Alternatives considered**:
- Allowlist-only approach (too restrictive, breaks legitimate use)
- Rely on network firewall rules (defense in depth — app-level check is still needed)

---

## R2: Keyword Search of Crawl History

**Decision**: Add a `searchCrawlJobs` GraphQL query that performs server-side
filtering on job URL and document titles/content.

**Rationale**: Firestore does not support full-text search natively. For the
initial implementation, fetch the user's jobs and filter in the resolver using
string matching. This is viable because the job limit is 50 per user.

**Implementation**:
- New GraphQL query: `searchCrawlJobs(query: String!): [CrawlJob!]!`
- Resolver fetches all user jobs (up to 50), then filters where URL or
  associated document titles/content contain the search term (case-insensitive)
- Frontend: search input in the Jobs tab that calls the new query with debounce

**Alternatives considered**:
- Client-side filtering (simpler but doesn't scale; chosen approach keeps
  filtering logic on server for consistency)
- Algolia/Typesense integration (over-engineered for 50 items per user)
- Firestore `array-contains` with keyword tokenization (complex setup, not
  worth it at current scale)

---

## R3: Rich Metadata Extraction

**Decision**: Enhance the cheerio HTML parser in the Cloud Function worker to
extract `<meta>` tags (description, author, og:image, article:published_time)
and store them in the `documents` subcollection.

**Rationale**: The existing worker extracts only title and a 500-char content
preview. The spec requires description, author, publish date, and image
references (FR-003).

**Implementation**:
- Extract from `<meta>` tags: `name="description"`, `name="author"`,
  `property="og:description"`, `property="og:image"`, `property="article:published_time"`
- Store new fields in document: `description`, `author`, `publishDate`,
  `ogImage`, `fullContent` (up to 100KB, truncated with flag)
- Extend GraphQL `CrawledDocument` type with new fields
- Run `pnpm codegen` after schema update

**Alternatives considered**:
- Use a headless browser (Puppeteer) for JS-rendered content — too heavy for
  Cloud Functions, out of scope per spec assumptions
- Extract images from `<img>` tags — deferred to future enhancement to keep
  scope bounded

---

## R4: Content Reader View

**Decision**: Add a dedicated content reader panel in the WebCrawler component
that displays full extracted content for a selected document.

**Rationale**: Currently, documents show in a table with 500-char previews. The
spec requires viewing "full extracted content" in a "clean, readable layout"
(FR-004, FR-009).

**Implementation**:
- When a user clicks a document row, show a reader view with: title, URL,
  metadata (author, date, description), and full text content
- Use existing tab pattern — reader replaces documents list with a back button
- Styled as a prose-like reading experience (max-width, readable font size,
  proper spacing)
- Dark mode variants on all reader styles

**Alternatives considered**:
- Modal overlay (less readable for long content)
- Separate route/page (over-engineered, breaks the single-MFE pattern)
