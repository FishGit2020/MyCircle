# Feature Specification: AI Interviewer MFE Improvements

**Feature Branch**: `026-ai-interviewer-improvements`
**Created**: 2026-04-07
**Status**: Draft
**Input**: User description: "ai-interviewer — AI-powered mock interview practice with question bank and session history — check what we have in MFE, improve existing setup if there is anything needs fix, add new features improvements"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reliable Session History Browsing (Priority: P1)

A returning user wants to review their past practice sessions and resume or compare them. Currently, sessions are only accessible via a small dropdown — users cannot search, filter, or see meaningful context about past sessions (date, score, question topic) without opening each one.

The improvement provides a dedicated session history view where users can see all past interviews at a glance, with key metadata visible (date, mode, chapter, overall score) and the ability to search or filter by chapter or date. Users can open a session to review the full conversation, re-run the same question setup, or delete sessions they no longer need.

**Why this priority**: Session history is core to the "practice over time" value proposition. Without being able to meaningfully browse past sessions, users lose the feedback loop that motivates continued practice.

**Independent Test**: Can be fully tested by completing two mock interviews, opening the session history view, verifying both sessions appear with correct metadata, searching by chapter name to filter, and confirming the ability to open and delete sessions.

**Acceptance Scenarios**:

1. **Given** a user has completed at least one interview, **When** they open the session history view, **Then** they see a list of all past sessions with date, interview mode (custom vs structured), chapter/topic name, and overall score displayed for each.
2. **Given** a user is viewing session history, **When** they search or filter by chapter name or date range, **Then** only matching sessions appear.
3. **Given** a user selects a past session, **When** they open it, **Then** the full conversation and working document are displayed in read-only mode.
4. **Given** a user views a structured-mode session, **When** they click "Re-run this setup," **Then** a new interview launches with the same chapter and difficulty settings pre-filled.
5. **Given** a user selects a session to delete, **When** they confirm the deletion prompt, **Then** the session is removed and the list updates immediately.

---

### User Story 2 - Cross-Session Progress Analytics (Priority: P2)

A user who practices regularly wants to see how their performance has improved over time. Currently each session produces scores (technical, problem-solving, communication, depth) but there is no way to see trends or aggregates across sessions.

The improvement adds a progress dashboard panel within the AI Interviewer that shows score trends over recent sessions, broken down by dimension and optionally by chapter. Users can see at a glance which skill areas are improving and which need more focus.

**Why this priority**: Progress visibility is the primary motivator for sustained practice. Without it, users cannot set goals or measure improvement — reducing long-term engagement.

**Independent Test**: Can be fully tested by completing three or more structured-mode sessions and verifying the progress panel shows a chart or summary of scores per dimension over time, with the most recent sessions reflected.

**Acceptance Scenarios**:

1. **Given** a user has completed at least two structured-mode sessions, **When** they open the progress panel, **Then** they see scores for each evaluation dimension (technical, problem-solving, communication, depth) plotted over time.
2. **Given** a user has sessions across multiple chapters, **When** they filter progress by chapter, **Then** the view shows only sessions for that chapter.
3. **Given** a user has fewer than two sessions, **When** they visit the progress panel, **Then** an encouraging empty state message explains that more sessions are needed to display trends.
4. **Given** a user completes a new session, **When** they return to the progress panel, **Then** the new session's scores appear immediately in the chart.

---

### User Story 3 - Question Bank Bulk Import and Export (Priority: P3)

An administrator or advanced user wants to seed the question bank with many questions at once, or export the existing question bank to back it up or share it. Currently questions can only be added one at a time through the UI.

The improvement allows users to export the entire question bank (or a filtered subset by chapter/difficulty) as a structured file, and import questions from that same format — replacing, merging, or appending to the existing bank.

**Why this priority**: The question bank's value scales with the number of high-quality questions. Bulk operations enable power users and admins to populate the bank quickly without manual entry overhead.

**Independent Test**: Can be fully tested by exporting the existing question bank, verifying the exported file contains all questions with correct fields, then importing the file into an empty question bank and confirming all questions appear correctly.

**Acceptance Scenarios**:

1. **Given** the question bank has at least one question, **When** a user exports, **Then** a downloadable file is produced containing all questions with their chapter, difficulty, title, description, and tags fields.
2. **Given** a user filters the question bank by chapter before exporting, **When** they export, **Then** only questions matching that chapter are included in the export file.
3. **Given** a user imports a valid question file, **When** the import completes, **Then** all questions from the file appear in the question bank, and a summary shows how many were added.
4. **Given** a user imports a file with duplicate question titles in the same chapter, **When** the import completes, **Then** duplicates are skipped (not doubled), and the summary reports how many were skipped.
5. **Given** a user imports a malformed or unsupported file, **When** the import fails, **Then** a clear error message is shown and no partial data is written.

---

### User Story 4 - Timed Practice Mode (Priority: P4)

A user preparing for real interviews wants to practice under time pressure. Currently there is no timer during interviews, so users cannot replicate the time-constrained nature of real coding interviews.

The improvement adds an optional countdown timer that users can enable before starting a session. The timer is visible during the interview, shows warnings as time runs low, and gracefully ends the question (triggering evaluation) when time expires.

**Why this priority**: Time pressure is a critical component of real interview performance. Users who only practice without time constraints may underperform in actual interviews.

**Independent Test**: Can be fully tested by enabling the timer before starting an interview, verifying the countdown is visible, waiting for (or fast-forwarding) the timer to expire, and confirming evaluation is triggered automatically.

**Acceptance Scenarios**:

1. **Given** a user is on the interview setup screen, **When** they enable the timer and select a duration (e.g., 20, 30, 45 minutes), **Then** a visible countdown starts when the interview begins.
2. **Given** a timer is active and 5 minutes remain, **When** the threshold is crossed, **Then** the timer displays a visual warning (color change) without interrupting the interview.
3. **Given** a timer reaches zero, **When** time expires, **Then** evaluation is triggered automatically as if the user clicked "End Interview," with a notice that time ran out.
4. **Given** a user ends the interview manually before time runs out, **When** they submit, **Then** the timer stops and evaluation proceeds normally.
5. **Given** a user has the timer enabled and navigates away mid-session, **When** they return to the session, **Then** the timer displays the elapsed time already consumed (not restarted from zero).

---

### User Story 5 - Improved Test Coverage for Core Interview Components (Priority: P5)

As a developer maintaining this MFE, the current test coverage leaves three key components (chat interface, question panel, question manager) without dedicated tests. This creates risk of regressions being merged undetected.

The improvement adds unit and integration tests covering the primary user interactions for each untested component, ensuring all visible state changes and user-triggered actions are validated.

**Why this priority**: Test coverage gaps represent technical risk. While this is developer-facing, it protects all user-facing features by catching regressions before they reach production.

**Independent Test**: Can be fully tested by running the test suite and verifying all three previously-untested components (InterviewChat, QuestionPanel, QuestionManager) have test files with passing assertions covering their primary interactions.

**Acceptance Scenarios**:

1. **Given** the InterviewChat component, **When** tests run, **Then** they verify: messages render correctly for both user and assistant roles, the send button submits input, the retry button appears on errors, and score badges display for evaluated questions.
2. **Given** the QuestionPanel component, **When** tests run, **Then** they verify: the working document textarea accepts input, action buttons (Start, Hint, Next, End) are present and emit the correct interactions, and the progress bar updates based on session state.
3. **Given** the QuestionManager component, **When** tests run, **Then** they verify: the search input filters the question list, the add/edit form submits correctly, and the delete confirmation prompt prevents accidental deletion.

---

### Edge Cases

- What happens when a user starts a new interview while a previous session is still auto-saving? The in-flight save should complete before the session ID changes to avoid data corruption.
- How does the system handle a session history view with hundreds of sessions? Pagination or lazy loading must prevent the view from becoming unusably slow.
- What happens when the progress analytics panel has sessions with missing scores (e.g., custom-mode sessions that may not produce structured scores)? These sessions should be omitted from score trend charts with a note explaining the gap.
- How does the timer interact with the auto-save debounce? Expiry should flush any pending auto-save before triggering evaluation.
- What happens when an import file is extremely large (thousands of questions)? The import should process in batches and show progress, not lock the UI.
- What happens when the AI endpoint is unavailable mid-interview? The existing retry mechanism must remain functional, and timer-based expiry should not trigger evaluation if no AI response has been received yet.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The session history view MUST display all past interview sessions with the following metadata visible without opening a session: session date, interview mode (custom or structured), chapter/topic name (or "Custom" for freeform), and overall score (when available).
- **FR-002**: The session history view MUST support filtering by chapter name and by date range (past 7 days, past 30 days, all time).
- **FR-003**: Users MUST be able to open any past session in a read-only view that shows the full conversation and working document as they existed at session end.
- **FR-004**: Users MUST be able to re-launch a new interview pre-configured with the same settings (chapter, difficulty, question count) as any past structured-mode session.
- **FR-005**: The progress analytics panel MUST display scores for each evaluation dimension (technical, problem-solving, communication, depth) across the user's completed structured-mode sessions, presented as a trend over time.
- **FR-006**: The progress analytics panel MUST support filtering by chapter so users can track improvement within a specific topic area.
- **FR-007**: Users MUST be able to export the question bank (or a chapter-filtered subset) to a downloadable file containing all question fields.
- **FR-008**: Users MUST be able to import questions from an exported file, with the system detecting and skipping duplicate questions (same title + chapter combination) and reporting a count of added vs skipped.
- **FR-009**: The import process MUST validate the file format before writing any data, and display a clear error message if the file is invalid.
- **FR-010**: Users MUST be able to enable an optional countdown timer on the interview setup screen, choosing from preset durations (20, 30, 45 minutes) or a custom value.
- **FR-011**: The timer MUST display a visual warning when 5 minutes remain (color change or badge) without interrupting the interview flow.
- **FR-012**: When the timer expires, the system MUST automatically trigger the evaluation flow, equivalent to the user manually ending the interview.
- **FR-013**: The timer state (elapsed time) MUST persist if a user navigates away and returns to a session before it is complete.
- **FR-014**: InterviewChat, QuestionPanel, and QuestionManager components MUST each have a dedicated test file covering their primary user interactions and rendered states.

### Key Entities

- **InterviewSession**: Represents a completed or in-progress interview session. Key attributes: unique ID, user ID, creation date, interview mode (custom/structured), chapter (if structured), difficulty (if structured), list of questions with scores, working document content, full message history, and overall score summary.
- **SessionScoreRecord**: A point-in-time record of scores for a single session used for progress tracking. Attributes: session ID, date, chapter, and scores per dimension (technical, problem-solving, communication, depth).
- **QuestionBankEntry**: A single question in the shared question bank. Attributes: unique ID, chapter, difficulty level, title, description, and tags. Used for both structured interviews and the question manager UI.
- **QuestionExportBundle**: A portable representation of one or more QuestionBankEntries for import/export purposes. Must include all fields needed to recreate the entries exactly.
- **InterviewTimer**: Session-scoped state representing the optional countdown. Attributes: enabled flag, total duration (in minutes), start timestamp, and current elapsed time.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can browse and locate any past session within their history in under 30 seconds, regardless of how many sessions they have.
- **SC-002**: Users with 5 or more completed structured-mode sessions can identify their strongest and weakest evaluation dimension from the progress panel without leaving the AI Interviewer page.
- **SC-003**: A user can export the entire question bank and re-import it with zero data loss — all fields and all questions identical before and after the round trip.
- **SC-004**: Timed practice sessions end evaluation automatically within 5 seconds of the timer reaching zero, with no manual action required from the user.
- **SC-005**: The test suite for the AI Interviewer MFE achieves at least 75% component coverage (measured by files with test coverage), up from the current ~55%.
- **SC-006**: All five new and improved capabilities (session history, progress analytics, bulk import/export, timed mode, test coverage) are fully accessible on mobile screen sizes without horizontal scrolling or truncated UI elements.

## Assumptions

- **Session data completeness**: Assumed that all past sessions already stored in Firestore contain the metadata fields (chapter, difficulty, scores) needed to populate the session history view. Sessions without scores (e.g., interrupted sessions) will display "—" for score fields.
- **Analytics scope**: Progress analytics only cover structured-mode sessions because custom-mode sessions do not produce structured per-dimension scores. Custom sessions appear in session history but are excluded from score trend charts.
- **Question export format**: Assumed a structured data exchange format (e.g., JSON or CSV) is appropriate. The exact format is an implementation detail; the spec requires it be importable by the same tool without data loss.
- **Timer presets**: 20, 30, and 45 minutes chosen as defaults based on common coding interview durations. A custom duration field allows overriding these.
- **Import conflict resolution**: Assumed "skip duplicates" (same title + chapter = duplicate) is the safest default for import conflicts. Overwrite-all or merge options are out of scope for this iteration.
- **Admin vs. user roles**: Assumed all authenticated users can manage the question bank (add/edit/delete/import/export), consistent with the existing QuestionManager behavior which does not restrict by role.
- **Timer persistence mechanism**: Timer elapsed-time persistence uses the existing session persistence layer (Firestore + localStorage), not a separate real-time sync, meaning a brief gap on reload is acceptable.
