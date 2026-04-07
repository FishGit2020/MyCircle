# Research: AI Interviewer MFE Improvements

**Phase 0 Output** | Branch: `026-ai-interviewer-improvements`

---

## Finding 1: Session List Contains No Score or Chapter Metadata

**Decision**: Extend the Firestore session metadata document and `InterviewSessionSummary` GraphQL type to store `chapter`, `difficulty`, `questionCount`, and `overallScore` at save time.

**Rationale**: The current `InterviewSessionSummary` only holds `questionPreview`, `messageCount`, `mode`, `updatedAt`, `createdAt`. Chapter/difficulty live inside the `config` JSON blob in Cloud Storage, and per-dimension scores live inside `interviewState.scores[]` in Cloud Storage — neither is accessible without loading the full session. Adding computed summary fields to the Firestore metadata document on each save is the only way to support efficient listing, filtering, and analytics without N+1 Cloud Storage reads.

**Alternatives considered**:
- Load each session individually on list view: rejected — N+1 Cloud Storage reads, unacceptably slow with many sessions.
- Store scores in a separate Firestore subcollection: rejected — adds complexity; summary fields on the existing document are sufficient for display and filtering.

---

## Finding 2: Per-Dimension Scores Are Fully Persisted But Not Displayed in Detail

**Decision**: The progress analytics panel will read `scores` fields already stored in Cloud Storage JSON (returned by `GET_INTERVIEW_SESSION`), but will pull score summaries from the new Firestore metadata fields for the aggregate trend view — avoiding full session loads.

**Rationale**: `EvaluationScore` already has `technical`, `problemSolving`, `communication`, `depth` (all numbers 1-10). The data exists; the UI simply averages them. Adding `avgTechnical`, `avgProblemSolving`, `avgCommunication`, `avgDepth` as computed fields on the Firestore metadata document (written at session save time) gives the analytics panel everything it needs from the list query alone.

**Alternatives considered**:
- Aggregate scores client-side by loading all sessions: rejected — same N+1 problem as above.
- Add a dedicated analytics GraphQL query that reads all Cloud Storage files server-side: rejected — overengineered for this scope; metadata fields are simpler.

---

## Finding 3: Question Bank Is Stored in Cloud Storage as JSON

**Decision**: Export via a new `exportQuestionBank` GraphQL query that returns the questions array as a JSON string. Import via a new `importQuestions` mutation that accepts an array of question inputs, checks for duplicates by `(title, chapter)` pair, and returns added/skipped counts.

**Rationale**: The question bank is already a JSON file in Cloud Storage (`question-bank.json`). Export is essentially a read with a serialization step. Import is a batch upsert with deduplication. A thin GraphQL layer keeps the MFE GraphQL-first without a new REST endpoint.

**Alternatives considered**:
- Direct Cloud Storage signed URL for export: rejected — bypasses the GraphQL-first principle and exposes storage internals to the client.
- CSV format: rejected — JSON round-trips the data model losslessly without a custom parser.

---

## Finding 4: Timer Is Pure Frontend State

**Decision**: Implement the countdown timer entirely in the MFE without any new backend schema. Timer config (`enabled`, `totalMinutes`, `startTimestamp`) will be persisted alongside the session via the existing `SAVE_INTERVIEW_SESSION` mutation using the `config` JSON field.

**Rationale**: There is no benefit to tracking timer state in Firestore separately — it's session-scoped and already has a persistence channel (session config JSON). A React ref + `setInterval` handles countdown display; the hook already has a 2s debounce auto-save, so `startTimestamp` persists quickly enough.

**Alternatives considered**:
- Server-side timer enforcement: rejected — out of scope; this is practice, not an exam. Client-side is sufficient and simpler.
- Real-time countdown sync across tabs: rejected — users do not need multi-tab sync for interview sessions.

---

## Finding 5: Three Components Lack Test Files

**Decision**: Add dedicated test files for `InterviewChat.tsx`, `QuestionPanel.tsx`, and `QuestionManager.tsx` following the existing test patterns (`vi.fn()` mocks, `userEvent.setup({ delay: null })`, `act()` wrapping for async state).

**Rationale**: The existing tests in `AiInterviewer.test.tsx` and the hook tests demonstrate the pattern: mock GraphQL hooks from `@mycircle/shared`, render the component, assert on visible output and interactions. The three untested components have clear, bounded responsibilities that map directly to testable behaviors.

**Alternatives considered**:
- Integration tests that mount the full AiInterviewer with all sub-components: rejected — already exists at AiInterviewer.test.tsx level; additional coverage should be at unit level for isolation.

---

## Finding 6: Session History Filtering Strategy

**Decision**: Add optional `chapter` and `dateFilter` parameters to the `getInterviewSessions` GraphQL query, resolved server-side using Firestore compound queries.

**Rationale**: The Firestore collection `users/{uid}/interviewSessions` supports compound queries with up to 2 inequality filters. Filtering on `chapter` (equality) + `createdAt` (range) is a standard compound query that Firestore handles efficiently. No client-side filtering needed.

**Alternatives considered**:
- Client-side filtering of the full session list: rejected — works initially but breaks with large session counts; server-side is correct.
- Full-text search on question previews: rejected — not needed; chapter and date are the meaningful filter dimensions.

---

## Summary of Schema Changes Required

| Change | Type | Reason |
|--------|------|--------|
| Add `chapter`, `difficulty`, `questionCount`, `overallScore`, `avgTechnical`, `avgProblemSolving`, `avgCommunication`, `avgDepth` to `InterviewSessionSummary` | Schema extension | Enable list view and analytics without N+1 reads |
| Add `chapter`, `difficulty`, `questionCount`, `scoresSummary` to `SaveInterviewSessionInput` | Schema extension | Persist new metadata fields at save time |
| Add `chapter` and `dateFilter` args to `getInterviewSessions` query | Query extension | Server-side filtering for history view |
| Add `exportQuestionBank(chapter: String)` query | New query | Bulk export capability |
| Add `importQuestions(questions: [CreateInterviewQuestionInput!]!)` mutation | New mutation | Bulk import capability |
| Add `timerConfig` to session config JSON (frontend only) | Frontend | Timer persistence via existing session save |
