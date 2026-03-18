# Feature Specification: Web Crawler

**Feature Branch**: `027-web-crawler`
**Created**: 2026-03-17
**Status**: Draft
**Input**: User description: "A web crawler tool that lets users submit URLs, crawl web pages, and view extracted content with GraphQL backend and Firestore storage"

## Clarifications

### Session 2026-03-17

- Q: Should the feature use REST API or the existing GraphQL service? → A: Must build on top of the existing project GraphQL service, not REST.
- Q: Should the crawler follow links (spider) or extract a single page per URL? → A: Single page only — each submitted URL extracts that one page. No link-following.
- Q: Should the server block private/internal URLs to prevent SSRF? → A: Yes — block private/internal addresses (localhost, 10.x, 172.16-31.x, 192.168.x, link-local) and restrict to HTTP/HTTPS only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Submit a URL for Crawling (Priority: P1)

As a user, I want to submit a URL so the system fetches the web page and extracts its content for me to read. I navigate to the Web Crawler page, paste a URL into the input field, and submit it. The system processes the page and displays the extracted content (title, main text, images, and metadata) in a clean, readable format.

**Why this priority**: This is the core value proposition. Without the ability to submit a URL and see extracted content, the feature has no purpose.

**Independent Test**: Can be fully tested by submitting a single URL and verifying that the extracted content (title, body text, metadata) is displayed. Delivers immediate value as a standalone page reader.

**Acceptance Scenarios**:

1. **Given** a user is on the Web Crawler page, **When** they enter a valid URL and click "Crawl", **Then** the system fetches the page and displays the extracted title, main text content, and metadata within a reasonable time.
2. **Given** a user submits a URL that is unreachable (404, timeout, DNS failure), **When** the crawl completes, **Then** the system displays a clear error message explaining why the page could not be crawled.
3. **Given** a user submits a URL, **When** the crawl is in progress, **Then** the system shows a loading indicator so the user knows the request is being processed.

---

### User Story 2 - View Crawl History (Priority: P2)

As a user, I want to see a list of all pages I have previously crawled so I can revisit extracted content without re-crawling. The history shows each crawled page with its title, URL, crawl date, and a preview snippet. I can click any item to view the full extracted content.

**Why this priority**: Persistence transforms the tool from a one-shot utility into a reference library. Users gain lasting value from every crawl they perform.

**Independent Test**: Can be tested by crawling 2-3 URLs and verifying they appear in the history list with correct metadata. Clicking an item shows the full content without re-fetching.

**Acceptance Scenarios**:

1. **Given** a user has previously crawled multiple URLs, **When** they visit the Web Crawler page, **Then** they see a chronologically ordered list of their past crawls with title, URL, date, and snippet.
2. **Given** a user is viewing their crawl history, **When** they click on a history item, **Then** the full extracted content for that crawl is displayed.
3. **Given** a user has no crawl history, **When** they visit the Web Crawler page, **Then** they see an empty state with guidance on how to start crawling.

---

### User Story 3 - Delete Crawl Results (Priority: P3)

As a user, I want to delete individual crawl results from my history so I can keep my list organized and remove content I no longer need.

**Why this priority**: Gives users control over their stored data, which is important for usability and data management, but not essential for core functionality.

**Independent Test**: Can be tested by crawling a URL, verifying it appears in history, deleting it, and confirming it no longer appears.

**Acceptance Scenarios**:

1. **Given** a user is viewing their crawl history, **When** they choose to delete a specific crawl result, **Then** the system asks for confirmation before removing it.
2. **Given** a user confirms deletion, **When** the deletion completes, **Then** the item is removed from the history list and its stored content is permanently deleted.

---

### User Story 4 - Search Crawl History (Priority: P4)

As a user, I want to search through my previously crawled pages by keyword so I can quickly find specific content without scrolling through the entire history.

**Why this priority**: Enhances usability for power users with many crawled pages, but the feature is fully functional without it.

**Independent Test**: Can be tested by crawling several pages with distinct content, then searching for a keyword that appears in one page and verifying only matching results appear.

**Acceptance Scenarios**:

1. **Given** a user has multiple crawled pages in their history, **When** they enter a search term, **Then** the list filters to show only pages whose title or content matches the search term.
2. **Given** a user searches for a term with no matches, **When** the search completes, **Then** the system displays a "no results found" message.

---

### Edge Cases

- What happens when a user submits a URL that requires authentication (login-protected page)? The system should return a clear message indicating the page content could not be accessed due to authentication requirements.
- What happens when a user submits a malformed URL (missing protocol, invalid characters)? The system should validate the URL format before attempting to crawl and display a helpful error.
- What happens when the crawled page contains no meaningful text content (e.g., a page that is entirely images or JavaScript-rendered)? The system should indicate that no text content could be extracted and display whatever metadata was available.
- What happens when a user submits a very large page (e.g., a page with hundreds of thousands of words)? The system should handle content up to a reasonable size limit and inform the user if content was truncated.
- What happens when a user submits a duplicate URL they have already crawled? The system should perform a fresh crawl and store it as a new entry (allowing users to capture page content at different points in time).
- What happens when the user loses network connectivity during a crawl? The system should handle the failure gracefully and allow the user to retry.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept a URL input from the user and initiate a single-page extraction of the target web page (no link-following or spidering).
- **FR-002**: System MUST validate URL format before initiating a crawl (valid protocol, well-formed domain).
- **FR-003**: System MUST extract the page title, main text content, metadata (description, author, publish date if available), and image references from the crawled page.
- **FR-004**: System MUST display the extracted content in a clean, readable layout with clear visual hierarchy (title, metadata, body text).
- **FR-005**: System MUST show a loading state while a crawl is in progress.
- **FR-006**: System MUST display meaningful error messages when a crawl fails (unreachable URL, timeout, invalid page, authentication-protected).
- **FR-007**: System MUST persist each crawl result (URL, title, extracted content, metadata, crawl timestamp) to the user's personal storage.
- **FR-008**: System MUST display the user's crawl history in reverse chronological order (newest first).
- **FR-009**: System MUST allow users to view the full extracted content of any previously crawled page from their history.
- **FR-010**: System MUST allow users to delete individual crawl results with a confirmation step.
- **FR-011**: System MUST allow users to search their crawl history by keyword (matching title and content).
- **FR-012**: System MUST handle crawl timeouts gracefully, aborting requests that exceed a reasonable duration and notifying the user.
- **FR-013**: System MUST restrict crawling to publicly accessible web pages (no execution of page scripts or following of authentication redirects).
- **FR-015**: System MUST block requests to private/internal network addresses (localhost, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, link-local) and restrict crawling to HTTP and HTTPS protocols only.
- **FR-014**: System MUST sanitize extracted content to prevent display of malicious scripts or unsafe HTML.

### Key Entities

- **Crawl Result**: Represents a single crawled page. Attributes: URL, page title, extracted text content, metadata (description, author, publish date), image references, crawl timestamp, crawl status (success/error), error message (if applicable). Belongs to a single user.
- **User**: The authenticated person using the web crawler. Has a collection of crawl results. Each user can only access their own crawl results.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can submit a URL and view extracted page content within 15 seconds for standard web pages.
- **SC-002**: 90% of crawl attempts on publicly accessible pages successfully extract meaningful content (title + body text).
- **SC-003**: Users can locate a previously crawled page from their history within 10 seconds (via scrolling or search).
- **SC-004**: Users can complete the full workflow (submit URL, view content, find it later in history) on their first attempt without guidance beyond the UI.
- **SC-005**: All crawl results persist reliably across sessions, with zero data loss for successfully stored results.

## Assumptions

- Users are authenticated via the existing application authentication system. No separate login is required for the web crawler.
- The crawler operates server-side to avoid browser CORS restrictions and to ensure consistent results.
- The feature integrates with the existing project GraphQL service for all data operations (queries, mutations). No REST API endpoints are used.
- Each crawl targets a single page. Multi-page spidering and link-following are out of scope.
- Only publicly accessible pages are supported in the initial release. Pages requiring login, CAPTCHA, or JavaScript rendering for primary content are out of scope.
- Content extraction focuses on text-based pages (articles, blog posts, documentation). Rich media pages (video platforms, interactive apps) will have limited extraction quality.
- There is no rate limiting per user in the initial release, but the system should be designed to accommodate it in the future if needed.
- Crawl results are private to each user and not shared between users.
