# Tasks: Web Crawler Enhancements

**Input**: Design documents from `/specs/027-web-crawler/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/graphql.md

**Context**: The web crawler MFE already exists (PR #774). These tasks address 4 gaps:
SSRF protection (FR-015), rich metadata extraction (FR-003), content reader view
(FR-004/FR-009), and keyword search (FR-011). US3 (Delete) needs no changes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US4)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: Verify baseline is healthy before making changes

- [x] T001 Build shared package and verify baseline: `pnpm build:shared && pnpm --filter @mycircle/web-crawler test:run`
- [x] T002 Verify backend compiles: `cd functions && npx tsc --noEmit`

**Checkpoint**: Existing tests pass, no regressions before enhancement work begins

---

## Phase 2: Foundational (SSRF Protection)

**Purpose**: Security hardening — blocks private/internal IP access in the server-side fetcher. MUST complete before any other enhancements since it modifies the worker's fetch pipeline.

**CRITICAL**: No user story work should begin until SSRF protection is in place.

- [x] T003 Add `isPrivateUrl()` helper function in `functions/src/handlers/webCrawler.ts` that resolves hostname via `dns.promises.lookup()` and checks against blocked CIDR ranges (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16, 0.0.0.0/8, IPv6 ::1, fc00::/7, fe80::/10)
- [x] T004 Integrate `isPrivateUrl()` check before every `axios.get()` call in the crawl worker loop in `functions/src/handlers/webCrawler.ts` — reject with trace log on blocked URLs
- [x] T005 Add SSRF URL validation in `startCrawl` mutation in `functions/src/resolvers/webCrawler.ts` — call `isPrivateUrl()` on the input URL and throw `GraphQLError('URL resolves to a private or reserved network address', { extensions: { code: 'BAD_USER_INPUT' } })` if blocked
- [x] T006 Verify backend compiles after SSRF changes: `cd functions && npx tsc --noEmit`

**Checkpoint**: Submitting `http://127.0.0.1` or `http://10.0.0.1` returns a clear error. All existing tests still pass.

---

## Phase 3: User Story 1 — Rich Metadata Extraction (Priority: P1)

**Goal**: Enhance the crawler to extract page description, author, publish date, og:image, and full text content from crawled pages.

**Independent Test**: Crawl an article page (e.g., a blog post with meta tags) and verify that description, author, date, and full content are displayed — not just a 500-char preview.

### Implementation for User Story 1

- [x] T007 [US1] Extend `CrawledDocument` type in `functions/src/schema.ts` — add fields: `fullContent: String`, `contentTruncated: Boolean`, `description: String`, `author: String`, `publishDate: String`, `ogImage: String`
- [x] T008 [US1] Enhance cheerio extraction in `functions/src/handlers/webCrawler.ts` to capture: `meta[name="description"]`, `meta[name="author"]`, `meta[property="og:description"]`, `meta[property="og:image"]`, `meta[property="article:published_time"]`, and full visible text (up to 100,000 chars with `contentTruncated` flag). Store all new fields in the `documents` subcollection write.
- [x] T009 [US1] Update `crawlJobDetail` resolver in `functions/src/resolvers/webCrawler.ts` to return new document fields (`fullContent`, `contentTruncated`, `description`, `author`, `publishDate`, `ogImage`) from Firestore data
- [x] T010 [US1] Update `GET_CRAWL_JOB_DETAIL` query in `packages/shared/src/apollo/queries.ts` to request new `CrawledDocument` fields in the documents selection set
- [x] T011 [US1] Run `pnpm codegen` to regenerate TypeScript types in `packages/shared/src/apollo/generated.ts`
- [x] T012 [US1] Rebuild shared package: `pnpm build:shared`

**Checkpoint**: Backend returns rich metadata for newly crawled pages. Existing documents return `null` for new fields (backward compatible).

---

## Phase 4: User Story 2 — Content Reader View (Priority: P2)

**Goal**: Add a dedicated reading view so users can view full extracted content with metadata, not just a 500-char preview in a table row.

**Independent Test**: Click a document in the Documents tab, verify a reader panel appears showing title, URL, metadata (author, date, description, og:image), and full text content with a back button to return to the list.

### Implementation for User Story 2

- [x] T013 [US2] Add content reader panel in `packages/web-crawler/src/components/WebCrawler.tsx` — when a document row is clicked, replace the documents list with a reader view showing: title (h2), URL (link), metadata block (author, publishDate, description, ogImage as header image), full text content in prose-styled layout (max-w-3xl, readable font, proper spacing), `contentTruncated` notice if applicable, and a "Back to documents" button (`type="button"`)
- [x] T014 [US2] Add dark mode variants on all reader view Tailwind classes (text colors, background, border, metadata block)
- [x] T015 [P] [US2] Add i18n keys for reader view in all 3 locale files (`packages/shared/src/locales/en.ts`, `es.ts`, `zh.ts`): `webCrawler.reader.backToDocuments`, `webCrawler.reader.author`, `webCrawler.reader.publishDate`, `webCrawler.reader.contentTruncated`, `webCrawler.reader.noContent`
- [x] T016 [US2] Rebuild shared after i18n changes: `pnpm build:shared`

**Checkpoint**: Users can click any document to read full content. Dark mode and all 3 languages work. Back button returns to document list.

---

## Phase 5: User Story 4 — Search Crawl History (Priority: P4)

**Goal**: Allow users to search their crawl history by keyword, filtering the jobs list to show only matching results.

**Independent Test**: Crawl 3 different URLs with distinct content. Enter a keyword from one page into the search bar. Verify only the matching job appears. Clear search to see all jobs again. Search a non-matching term to see "no results" message.

### Implementation for User Story 4

- [x] T017 [US4] Add `searchCrawlJobs(query: String!): [CrawlJob!]!` query to the schema in `functions/src/schema.ts` under the Query type
- [x] T018 [US4] Implement `searchCrawlJobs` resolver in `functions/src/resolvers/webCrawler.ts` — fetch all user jobs (limit 50), for each job fetch document titles/contentPreviews, filter where job URL or any document title/contentPreview contains the query string (case-insensitive), return matching jobs ordered by createdAt desc. Validate query length >= 2 chars, throw `BAD_USER_INPUT` otherwise.
- [x] T019 [US4] Add `SEARCH_CRAWL_JOBS` query definition in `packages/shared/src/apollo/queries.ts` requesting all CrawlJob fields
- [x] T020 [US4] Run `pnpm codegen` to regenerate types, then rebuild shared: `pnpm codegen && pnpm build:shared`
- [x] T021 [US4] Add `useSearchCrawlJobs(query: string)` hook in `packages/web-crawler/src/hooks/useCrawler.ts` — uses `useQuery` with `skip: query.length < 2`, `fetchPolicy: 'network-only'`
- [x] T022 [US4] Add search input bar to the Jobs tab in `packages/web-crawler/src/components/WebCrawler.tsx` — text input with debounce (300ms), switches between `useCrawlJobs` (no search term) and `useSearchCrawlJobs` (with search term). Show "no results" message when search returns empty. Include `aria-label` and clear button.
- [x] T023 [P] [US4] Add i18n keys for search in all 3 locale files: `webCrawler.search.placeholder`, `webCrawler.search.noResults`, `webCrawler.search.clear`

**Checkpoint**: Search filters jobs by keyword. Empty search shows all jobs. "No results" shown for non-matching queries. i18n works in all 3 languages.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all enhancements

- [x] T024 Run full test suite: `pnpm test:run`
- [x] T025 Run typecheck: `pnpm typecheck && cd functions && npx tsc --noEmit`
- [x] T026 Run quickstart verification checklist from `docs/specs/027-web-crawler/quickstart.md`
- [x] T027 Run MCP validators: `validate_all` (i18n sync, Dockerfile, widget registry)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — verify baseline first
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 (SSRF must be in place before modifying worker)
- **US2 (Phase 4)**: Depends on Phase 3 (reader view needs new document fields from US1)
- **US4 (Phase 5)**: Depends on Phase 2 only (search is independent of metadata/reader)
- **Polish (Phase 6)**: Depends on all user story phases

### Parallel Opportunities

- **US2 + US4 can run in parallel** after Phase 3 completes (if US4 doesn't need new fields)
- Actually, US4 only depends on Phase 2 (search uses existing fields: URL, title, contentPreview). If two developers are available:
  - Developer A: Phase 3 (US1) → Phase 4 (US2)
  - Developer B: Phase 5 (US4) after Phase 2

### Within Each User Story

- Schema changes before resolver changes
- Backend before frontend (codegen must run first)
- i18n keys before UI that references them (or same commit)
- Rebuild shared after any query/i18n changes

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: SSRF Protection
3. Complete Phase 3: Rich Metadata (US1)
4. **STOP and VALIDATE**: Crawl an article, verify metadata appears
5. This alone closes FR-003, FR-015

### Incremental Delivery

1. Setup + SSRF → Security hardened
2. Rich Metadata (US1) → Better data extraction
3. Content Reader (US2) → Full reading experience
4. Search (US4) → Power user feature
5. Each phase adds value without breaking previous work

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- US3 (Delete) needs no changes — already implemented with confirmation dialog
- All new i18n keys must go in en.ts, es.ts, zh.ts (Constitution IV)
- Spanish locale uses Unicode escapes — read exact line before editing
- Always import Apollo hooks from `@mycircle/shared`, never `@apollo/client` (Constitution I)
- `pnpm codegen` must run after any schema.ts or queries.ts change
- `cd functions && npx tsc --noEmit` must pass before pushing backend changes
