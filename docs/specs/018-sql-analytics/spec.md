# Feature Specification: SQL Analytics Layer

**Feature Branch**: `018-sql-analytics`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "SQL analytics layer for AI chat history, benchmark results, and usage analytics with setup page, dual-write architecture, and centralized endpoint configuration"

## Clarifications

### Session 2026-03-31

- Q: Should existing Firestore data (AI chat logs, benchmark results) be backfilled into SQL on first connection? → A: Yes, but as a user-initiated option — show an "Import History" button on the setup page; backfill does not start automatically.
- Clarification: SQL is a supplementary 2nd data source alongside Firestore. Firestore remains the primary source of truth for all live features. SQL adds relational analytics capabilities without replacing anything.
- Clarification: The Cloudflare tunnel to the SQL database is managed externally by the user (separate Docker containers). The app only needs the tunnel URL — it does not start, stop, or monitor the tunnel itself.
- Clarification: The setup page is accessed via a navigation button in the user menu (profile avatar dropdown).
- Clarification: Documentation must be updated as part of this feature (architecture docs, relevant MFE docs).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure SQL Connection (Priority: P1)

As the app owner, I want a setup page where I can configure a SQL database connection (via a Cloudflare tunnel URL) so that the system can store analytics data in a relational database as a supplementary 2nd source alongside the existing real-time store.

**Why this priority**: Without a working SQL connection, no other analytics features can function. This is the foundational setup that gates everything else.

**Independent Test**: Can be fully tested by navigating to the setup page, entering a tunnel URL, testing the connection, and seeing a success/failure indicator. Delivers value by confirming the SQL backend is reachable.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I open the user menu (profile avatar dropdown), **Then** I see a "Setup" navigation button that takes me to the setup page.
2. **Given** I am on the setup page, **When** I enter a valid Cloudflare tunnel URL and save, **Then** the system tests the connection and shows a success indicator.
3. **Given** I am on the setup page, **When** I enter an unreachable URL and save, **Then** the system shows a clear error message indicating the connection failed.
4. **Given** I have a saved SQL connection, **When** I return to the setup page later, **Then** my previously saved connection details are pre-populated.
5. **Given** I have not started my external Cloudflare tunnel Docker container, **When** I try to connect, **Then** the system shows a clear "unreachable" error without crashing or hanging.

---

### User Story 2 - Centralized AI Endpoint Configuration (Priority: P1)

As a user, I want all AI system endpoint configuration (for AI chat, AI interviewer, and endpoint benchmarks) to be managed from the setup page rather than scattered across individual features, so I have one place to manage all external service connections.

**Why this priority**: Consolidating endpoint management eliminates duplication and confusion. Currently, benchmark endpoints are configured in the benchmark UI — moving them to a central setup page improves discoverability and reduces configuration overhead.

**Independent Test**: Can be fully tested by configuring an AI endpoint on the setup page and verifying it is used by AI chat, AI interviewer, and benchmarks without needing to configure it separately in each feature.

**Acceptance Scenarios**:

1. **Given** I am on the setup page, **When** I add an AI endpoint (URL, name, optional access credentials), **Then** that endpoint becomes available across AI chat, AI interviewer, and benchmark features.
2. **Given** I have configured an endpoint on the setup page, **When** I open AI chat and select a model, **Then** the endpoint from the setup page is used without additional configuration.
3. **Given** I have configured an endpoint on the setup page, **When** I open the benchmark runner, **Then** the endpoint appears in the endpoint list automatically.
4. **Given** I remove an endpoint from the setup page, **When** I open any AI feature, **Then** that endpoint is no longer available for selection.

---

### User Story 3 - Optional Backfill of Existing Data (Priority: P2)

As the app owner, I want the option to import existing AI chat logs and benchmark results from Firestore into SQL so that my analytics dashboard can include historical data — but only when I choose to do so.

**Why this priority**: Historical data makes the analytics dashboard immediately useful. However, backfill should be user-initiated (not automatic) so the user controls when the migration runs and can ensure the tunnel and database are ready.

**Independent Test**: Can be fully tested by configuring a SQL connection, clicking "Import History," and verifying that existing chat log and benchmark records from Firestore appear in the SQL database with correct field mapping.

**Acceptance Scenarios**:

1. **Given** I have a working SQL connection, **When** I view the setup page, **Then** I see an "Import History" button to start backfilling existing data.
2. **Given** I click "Import History," **When** the backfill starts, **Then** I see a progress indicator showing how many records have been migrated.
3. **Given** backfill is in progress, **When** a new AI chat interaction occurs, **Then** it is dual-written to SQL normally (backfill and live writes coexist without conflict).
4. **Given** backfill completes, **When** I check the SQL database, **Then** all existing benchmark results (including quality scores) are also present.
5. **Given** backfill is interrupted (e.g., tunnel goes down mid-migration), **When** I click "Import History" again after restoring the connection, **Then** backfill resumes from where it left off (does not re-import already-migrated records).
6. **Given** backfill has already completed, **When** I view the setup page, **Then** the "Import History" button is replaced with a status showing when the last import ran and how many records were imported.

---

### User Story 4 - Automatic AI Chat Log Mirroring (Priority: P2)

As the app owner, I want every AI chat interaction to be automatically written to both Firestore and the SQL database so that I can run analytics queries against a relational schema without losing the real-time capabilities of Firestore.

**Why this priority**: Dual-write is the core mechanism that keeps the SQL database up to date going forward. Without it, only backfilled historical data would exist.

**Independent Test**: Can be fully tested by sending an AI chat message and verifying a corresponding record appears in the SQL database with the correct fields (provider, model, tokens, latency, tool calls, question/answer text).

**Acceptance Scenarios**:

1. **Given** a SQL connection is configured, **When** a user sends an AI chat message, **Then** the interaction is recorded in both Firestore and the SQL database.
2. **Given** a SQL connection is configured, **When** the SQL database is temporarily unreachable, **Then** the AI chat still works normally (the SQL write fails silently without affecting the user experience).
3. **Given** a SQL connection is NOT configured, **When** a user sends an AI chat message, **Then** the system behaves exactly as it does today (Firestore only, no errors).
4. **Given** a chat interaction includes tool calls, **When** the record is written to SQL, **Then** each tool call is stored as a separate related record with its name, duration, and error status.

---

### User Story 5 - Automatic Benchmark Result Mirroring (Priority: P2)

As the app owner, I want benchmark run results to be mirrored to the SQL database so that I can track model performance trends over time using relational queries.

**Why this priority**: Benchmark data is the second key dataset for SQL analytics. It enables regression detection and performance trending that is difficult with document storage.

**Independent Test**: Can be fully tested by running a benchmark and verifying the results (endpoint, model, tokens-per-second, time-to-first-token, quality score) appear in the SQL database.

**Acceptance Scenarios**:

1. **Given** a SQL connection is configured, **When** a benchmark run completes, **Then** each result (per endpoint/model/prompt combination) is stored in the SQL database.
2. **Given** a SQL connection is configured, **When** the SQL write fails, **Then** the benchmark results are still saved to Firestore and the user sees no errors.
3. **Given** benchmark results include quality scores, **When** stored in SQL, **Then** the quality score, feedback text, and judge model are all recorded.

---

### User Story 6 - Analytics Dashboard (Priority: P3)

As the app owner, I want a dashboard that displays analytics derived from the SQL database, including usage summaries, cost breakdowns, latency percentiles, tool usage patterns, and benchmark performance trends, so I can understand how the AI system is being used and how models compare.

**Why this priority**: This is the primary consumer of the SQL data. It provides richer analytics than the current manually-aggregated approach, leveraging SQL's aggregation capabilities.

**Independent Test**: Can be fully tested by populating the SQL database with sample data and verifying the dashboard displays correct aggregations, charts, and breakdowns.

**Acceptance Scenarios**:

1. **Given** the SQL database has chat log data, **When** I open the analytics dashboard, **Then** I see a usage summary with total calls, token counts, and provider/model breakdowns.
2. **Given** the SQL database has chat log data spanning multiple weeks, **When** I view the cost breakdown section, **Then** I see estimated costs grouped by model and time period.
3. **Given** the SQL database has chat log data, **When** I view the latency section, **Then** I see P50, P90, and P99 latency percentiles broken down by provider and model.
4. **Given** the SQL database has chat log data with tool calls, **When** I view the tool usage section, **Then** I see which tools are most frequently called and which tools are commonly used together.
5. **Given** the SQL database has benchmark data over time, **When** I view the benchmark trends section, **Then** I see tokens-per-second and time-to-first-token trends per model/endpoint by week.
6. **Given** the SQL database has no data (empty or not connected), **When** I open the analytics dashboard, **Then** I see an empty state explaining that data will appear after SQL is configured and AI interactions occur.

---

### User Story 7 - Chat History Search (Priority: P3)

As a user, I want to search across my past AI chat conversations by keyword so that I can find previous answers and topics discussed.

**Why this priority**: Full-text search is a capability the current system lacks entirely. It is a valuable addition but depends on SQL data being populated first.

**Independent Test**: Can be fully tested by entering a search term and verifying matching conversations are returned with highlighted matches.

**Acceptance Scenarios**:

1. **Given** the SQL database has chat history, **When** I search for a keyword, **Then** I see matching conversations with the search term highlighted in context.
2. **Given** I search for a term that appears in the question but not the answer, **When** results are displayed, **Then** the conversation still appears (search covers both question and answer text).
3. **Given** no conversations match my search term, **When** I search, **Then** I see an empty state with a clear message.

---

### Edge Cases

- What happens when the SQL connection is configured but the Cloudflare tunnel Docker container is stopped? The system must continue operating normally using Firestore; SQL writes fail silently.
- What happens when migrating from the current per-feature endpoint configuration to the centralized setup page? Existing configurations must be preserved and surfaced on the setup page.
- What happens when two AI chat requests fire simultaneously and both try to write to SQL? Each write must be independent (no shared transaction) to avoid blocking.
- What happens when the SQL database schema needs to be updated (new columns)? The system should handle schema initialization and migrations gracefully on first connection.
- What happens when chat log data exceeds the SQL database storage capacity? The dashboard should display a warning; the system must not crash.
- What happens when backfill is running and the user disconnects the SQL connection? Backfill should stop gracefully. If the user clicks "Import History" again after reconnecting, it should resume from the last successfully migrated record.
- What happens when backfill encounters a Firestore record that already exists in SQL (e.g., from a partial previous migration)? The system must skip duplicates rather than failing or creating duplicate entries.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a setup page accessible via a navigation button in the user menu (profile avatar dropdown).
- **FR-002**: System MUST allow users to configure a SQL database connection by providing a Cloudflare tunnel URL and optional authentication credentials. The tunnel is externally managed — the app does not start, stop, or monitor it.
- **FR-003**: System MUST test the SQL connection on save and report success or failure to the user.
- **FR-004**: System MUST persist SQL connection configuration securely so it survives across sessions.
- **FR-005**: System MUST consolidate all AI endpoint configuration (currently in benchmark UI) into the setup page, making endpoints available to AI chat, AI interviewer, and benchmarks from a single location.
- **FR-006**: System MUST automatically initialize the SQL database schema (tables, indexes) on first successful connection.
- **FR-007**: System MUST dual-write AI chat interactions to both Firestore and the SQL database when a SQL connection is configured. SQL is a supplementary 2nd source — Firestore remains the primary source of truth.
- **FR-008**: System MUST dual-write benchmark results to both Firestore and the SQL database when a SQL connection is configured.
- **FR-009**: SQL writes MUST be fire-and-forget — failures must not block, slow down, or surface errors in the primary user experience.
- **FR-010**: System MUST store tool call details as individual related records in SQL (not as a nested array) to enable relational queries.
- **FR-011**: System MUST provide an analytics dashboard displaying: usage summary, cost estimates by model, latency percentiles (P50/P90/P99), tool usage patterns, and benchmark performance trends.
- **FR-012**: System MUST support full-text keyword search across stored AI chat history (both questions and answers).
- **FR-013**: System MUST gracefully degrade when no SQL connection is configured — all existing features must work exactly as they do today.
- **FR-014**: System MUST migrate existing per-feature endpoint configurations to the centralized setup page without data loss.
- **FR-015**: System MUST provide a user-initiated "Import History" button on the setup page to backfill existing AI chat logs and benchmark results from Firestore into SQL, with progress indication, resumability on interruption, and duplicate detection. Backfill does not start automatically.
- **FR-016**: Documentation (architecture docs, relevant feature docs) MUST be updated to reflect the new setup page, SQL analytics layer, and centralized endpoint configuration.

### Key Entities

- **SQL Connection**: A user-configured external database connection with a Cloudflare tunnel URL, optional credentials, and a connection status (connected/disconnected/error). The tunnel infrastructure is managed externally via Docker containers.
- **AI Endpoint**: A named external AI service endpoint with URL, display name, and optional access credentials. Used across AI chat, interviewer, and benchmarks. Managed centrally from the setup page.
- **Chat Log Record**: A single AI chat interaction with user ID, provider, model, token counts (input/output), latency, status, error info, fallback flag, endpoint reference, question text, and answer text. Exists in both Firestore (primary) and SQL (supplementary).
- **Tool Call Record**: A single tool invocation within a chat interaction, with tool name, execution duration, and error status. Related to a parent Chat Log Record.
- **Benchmark Result Record**: A single benchmark run result with endpoint reference, model, prompt, tokens-per-second, time-to-first-token, total duration, optional quality score/feedback, and timestamp. Exists in both Firestore (primary) and SQL (supplementary).
- **Backfill Job**: A migration task tracking progress of historical data transfer from Firestore to SQL. Tracks last-migrated record for resumability.

## Assumptions

- The SQL database is hosted externally and accessed via a Cloudflare tunnel. The user manages the tunnel infrastructure (Docker containers) independently — the app only needs the tunnel URL.
- Only one SQL connection is needed per user/instance (not multi-database).
- Cost estimates for AI usage will use configurable per-model pricing rates (since pricing varies by provider).
- The analytics dashboard is read-only — it displays data but does not allow editing or deleting records.
- Schema migrations are additive (new columns/tables) and do not require destructive changes to existing data.
- Firestore remains the primary source of truth for all live features. SQL is a supplementary 2nd data source used exclusively for analytics and search capabilities that benefit from relational queries.
- Backfill is user-initiated via an "Import History" button, not automatic. Subsequent clicks after interruption resume from the last checkpoint rather than restarting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure a SQL connection and verify it works in under 2 minutes from the setup page.
- **SC-002**: All AI endpoint configuration is accessible from a single setup page — no feature-specific endpoint setup required.
- **SC-003**: 100% of AI chat interactions are mirrored to SQL when a connection is active, with zero impact on chat response time (fire-and-forget).
- **SC-004**: Analytics dashboard loads aggregated data (usage, cost, latency percentiles, tool patterns, benchmark trends) in under 5 seconds for datasets up to 100,000 records.
- **SC-005**: Full-text chat history search returns results in under 3 seconds for datasets up to 100,000 records.
- **SC-006**: System operates identically to today when no SQL connection is configured — zero regressions in existing functionality.
- **SC-007**: SQL connection failures do not produce any user-visible errors or slow down any existing feature.
- **SC-008**: Backfill completes for up to 50,000 existing records within 10 minutes, with progress visible to the user.
