# Tasks: AI Interviewer MFE Improvements

**Input**: Design documents from `specs/026-ai-interviewer-improvements/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Tests**: Test tasks are included for US5 (test coverage is the explicit goal of that story). Other stories include targeted tests where they cover new untested code paths.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in every task description

---

## Phase 1: Setup

**Purpose**: Verify branch state and confirm baseline passes before any changes.

- [ ] T001 Confirm branch `026-ai-interviewer-improvements` is checked out and `pnpm build:shared && pnpm --filter @mycircle/ai-interviewer test:run` passes clean
- [ ] T002 Read and internalize `specs/026-ai-interviewer-improvements/contracts/graphql-schema-extensions.md` and `data-model.md` before making any changes

---

## Phase 2: Foundational — GraphQL Schema Extensions + Codegen

**Purpose**: Extend the backend schema and regenerate types. All user story phases depend on these changes being in place.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — the new Firestore metadata fields and generated TypeScript types are required by all stories.

- [ ] T003 Extend `InterviewSessionSummary` type in `functions/src/schema.ts` to add `chapter: String`, `difficulty: String`, `questionCount: Int`, `overallScore: Float`, `avgTechnical: Float`, `avgProblemSolving: Float`, `avgCommunication: Float`, `avgDepth: Float` (all nullable)
- [ ] T004 Extend `SaveInterviewSessionInput` in `functions/src/schema.ts` to add the same 8 new nullable fields (`chapter`, `difficulty`, `questionCount`, `overallScore`, `avgTechnical`, `avgProblemSolving`, `avgCommunication`, `avgDepth`)
- [ ] T005 Add optional `chapter: String` and `dateFilter: String` arguments to `getInterviewSessions` query in `functions/src/schema.ts`
- [ ] T006 [P] Add `ImportResult` type and `importQuestions(questions: [CreateInterviewQuestionInput!]!): ImportResult!` mutation to `functions/src/schema.ts`
- [ ] T007 [P] Add `exportQuestionBank(chapter: String): String!` query to `functions/src/schema.ts`
- [ ] T008 Update `saveInterviewSession` resolver in `functions/src/resolvers/interviewSessions.ts` to: (a) accept the 8 new input fields, (b) compute `overallScore` and per-dimension averages from `interviewState.scores[]` when not explicitly provided, (c) write all new fields to the Firestore metadata document
- [ ] T009 Update `getInterviewSessions` resolver in `functions/src/resolvers/interviewSessions.ts` to: (a) return the 8 new summary fields from Firestore, (b) apply `chapter` equality filter when provided, (c) apply `createdAt` range filter when `dateFilter` is `"7d"` or `"30d"`
- [ ] T010 [P] Implement `exportQuestionBank` resolver in `functions/src/resolvers/interviewSessions.ts` (or a new `questionBank.ts` resolvers file): read questions from Cloud Storage, filter by `chapter` if provided, serialize as `QuestionExportBundle` JSON string
- [ ] T011 [P] Implement `importQuestions` resolver: accept array of question inputs, deduplicate by `(title, chapter)` pair against existing bank, write merged question bank back to Cloud Storage, return `ImportResult` with `added`/`skipped`/`errors` counts
- [ ] T012 Verify `cd functions && npx tsc --noEmit` passes after all schema/resolver changes
- [ ] T013 Update `GET_INTERVIEW_SESSIONS` query fragment in `packages/shared/src/apollo/queries.ts` to request the 8 new fields from `InterviewSessionSummary`
- [ ] T014 [P] Add `EXPORT_QUESTION_BANK` query definition to `packages/shared/src/apollo/queries.ts`
- [ ] T015 [P] Add `IMPORT_QUESTIONS` mutation definition to `packages/shared/src/apollo/queries.ts`
- [ ] T016 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`, then run `pnpm build:shared` and confirm both complete without errors
- [ ] T017 Add compound Firestore index `(chapter ASC, createdAt DESC)` to `firestore.indexes.json` for the `interviewSessions` subcollection

**Checkpoint**: Schema extended, types regenerated, Firestore metadata writes updated. User story phases can now begin.

---

## Phase 3: User Story 1 — Session History Browsing (Priority: P1) 🎯 MVP

**Goal**: Replace the minimal session dropdown with a rich session history panel showing metadata (date, mode, chapter, score) with search/filter and re-run capability.

**Independent Test**: Complete two structured-mode interviews in different chapters. Open the session history panel. Verify both sessions appear with chapter name, difficulty, overall score, and date. Filter by one chapter — only that session should appear. Click "Re-run" on a session and confirm the setup screen pre-fills with that session's chapter and difficulty.

- [ ] T018 [US1] Update `packages/ai-interviewer/src/hooks/useInterviewChat.ts` in the `saveSession` call to pass the 8 new metadata fields (`chapter`, `difficulty`, `questionCount`, `overallScore`, `avgTechnical/ProblemSolving/Communication/Depth`) extracted from `interviewState` config and scores to the `SAVE_INTERVIEW_SESSION` mutation variables
- [ ] T019 [US1] Create `packages/ai-interviewer/src/hooks/useSessionHistory.ts`: a custom hook that wraps `GET_INTERVIEW_SESSIONS` with local state for `chapter` and `dateFilter` filters, exposes `sessions`, `loading`, `error`, `setChapterFilter(chapter)`, `setDateFilter(filter)`, and `refetch()`, and auto-queries on filter change
- [ ] T020 [US1] Create `packages/ai-interviewer/src/components/SessionHistoryPanel.tsx`: renders a scrollable list of `InterviewSessionSummary` items; each row shows date (`createdAt`), mode badge (Custom / Question Bank), chapter name, difficulty, overall score (or "—" if null), message count; includes a chapter dropdown filter and a date filter (All / Last 7 days / Last 30 days); each row has "Open" and "Re-run" action buttons (for structured sessions) and a "Delete" button with confirmation; uses `useSessionHistory` hook
- [ ] T021 [US1] Update `packages/ai-interviewer/src/components/AiInterviewer.tsx` to replace the current sessions dropdown with a toggle that opens/closes `SessionHistoryPanel`; the "Re-run" action from `SessionHistoryPanel` should call the existing `startInterview` path with config pre-filled; pass `onRerun(config)` and `onOpen(sessionId)` callbacks
- [ ] T022 [US1] Add all `aiInterviewer.sessionHistory`, `aiInterviewer.noSessions`, `aiInterviewer.filterByChapter`, `aiInterviewer.filterByDate`, `aiInterviewer.allChapters`, `aiInterviewer.last7Days`, `aiInterviewer.last30Days`, `aiInterviewer.allTime`, `aiInterviewer.overallScore`, `aiInterviewer.reRunSetup`, `aiInterviewer.viewSession` i18n keys to all 3 locale files: `packages/shared/src/i18n/locales/en.ts`, `es.ts`, `zh.ts`
- [ ] T023 [US1] Ensure all new UI elements in `SessionHistoryPanel.tsx` and updated `AiInterviewer.tsx` use `dark:` Tailwind variants, `type="button"` on all non-submit buttons, `aria-label` on icon-only buttons, and touch targets ≥ 44px

**Checkpoint**: Session History Browsing is independently testable and complete. Users can view, filter, re-run, and delete sessions from the new panel.

---

## Phase 4: User Story 2 — Cross-Session Progress Analytics (Priority: P2)

**Goal**: Show score trends over time across structured-mode sessions, broken down by evaluation dimension, with optional chapter filtering.

**Independent Test**: Complete 3+ structured-mode sessions. Navigate to the Progress tab. Verify a chart/summary shows scores for each dimension (Technical, Problem Solving, Communication, Depth) over time. Filter by one chapter — verify only sessions from that chapter appear. Complete a new session and return — it should appear immediately.

- [ ] T024 [US2] Create `packages/ai-interviewer/src/components/ProgressDashboard.tsx`: accepts `sessions: InterviewSessionSummary[]` as prop; filters to sessions where `mode === 'question-bank'` and `overallScore != null`; renders per-dimension score trends using a simple responsive line/dot chart or tabular sparkline (SVG, no new chart library — use Tailwind-styled SVG or table); shows chapter filter dropdown; shows empty-state message when fewer than 2 qualifying sessions exist; all values from `avgTechnical`, `avgProblemSolving`, `avgCommunication`, `avgDepth` per session
- [ ] T025 [US2] Update `packages/ai-interviewer/src/components/AiInterviewer.tsx` to add a "My Progress" tab/toggle alongside the "Session History" toggle that mounts `ProgressDashboard` with the same sessions data from `useSessionHistory`; no additional data fetch needed — reuse the sessions already loaded
- [ ] T026 [US2] Add i18n keys `aiInterviewer.progressDashboard`, `aiInterviewer.noProgressData`, `aiInterviewer.technical`, `aiInterviewer.problemSolving`, `aiInterviewer.communication`, `aiInterviewer.depth` to all 3 locale files: `en.ts`, `es.ts`, `zh.ts`
- [ ] T027 [US2] Ensure `ProgressDashboard.tsx` uses `dark:` Tailwind variants for all chart elements and text, is responsive on mobile (stacks vertically below `md:`), and uses `<PageContent>` conventions when placed in the layout

**Checkpoint**: Progress Analytics is independently testable. Users with 2+ structured sessions can see score trends per dimension.

---

## Phase 5: User Story 3 — Question Bank Bulk Import/Export (Priority: P3)

**Goal**: Allow users to export the question bank to a JSON file and import questions from that file with deduplication.

**Independent Test**: Export the full question bank. Verify the downloaded JSON file contains all questions with correct fields. Clear or note the current count. Import the file back. Verify the count is unchanged (all skipped as duplicates). Import a modified file with one new question. Verify `added: 1, skipped: N`.

- [ ] T028 [US3] Add `useExportQuestions` and `useImportQuestions` hooks to `packages/ai-interviewer/src/hooks/useQuestionBank.ts`: `useExportQuestions` calls `EXPORT_QUESTION_BANK` query lazily and triggers a file download of the returned JSON string; `useImportQuestions` calls `IMPORT_QUESTIONS` mutation with a parsed questions array and returns the `ImportResult`
- [ ] T029 [US3] Update `packages/ai-interviewer/src/components/QuestionManager.tsx` to add an "Export" button (triggers `useExportQuestions` with current chapter filter, if any) and an "Import" button (opens a file input, reads JSON, validates structure, calls `useImportQuestions`, shows success/error toast with added/skipped counts)
- [ ] T030 [US3] Add file format validation in `QuestionManager.tsx` before calling `useImportQuestions`: check that uploaded JSON parses correctly and contains a `questions` array where each entry has `chapter`, `chapterSlug`, `difficulty`, `title`, `description` fields; show `aiInterviewer.importFileInvalid` error message if validation fails without making any mutation call
- [ ] T031 [US3] Add i18n keys `aiInterviewer.exportQuestions`, `aiInterviewer.importQuestions`, `aiInterviewer.exportSuccess`, `aiInterviewer.importSuccess`, `aiInterviewer.importError`, `aiInterviewer.importFileInvalid` to all 3 locale files: `en.ts`, `es.ts`, `zh.ts`
- [ ] T032 [US3] Add tests for export/import interaction to `packages/ai-interviewer/src/test/QuestionManager.test.tsx`: mock `useExportQuestions` and `useImportQuestions` from `@mycircle/shared`; verify export button calls export hook with correct chapter; verify import file input triggers validation then mutation; verify error state when file is invalid; verify success toast shows correct counts

**Checkpoint**: Bulk import/export is independently testable. Users can round-trip the question bank through a file without data loss.

---

## Phase 6: User Story 4 — Timed Practice Mode (Priority: P4)

**Goal**: Add an optional countdown timer to interview sessions, with visual warnings and auto-evaluation on expiry.

**Independent Test**: Enable the 20-minute timer in setup. Start an interview. Verify the countdown is visible and ticking. Navigate away and return — verify elapsed time is preserved (timer has not reset). Wait for (or simulate) expiry — verify evaluation is triggered automatically with a "time's up" notice.

- [ ] T033 [US4] Create `packages/ai-interviewer/src/components/TimerControl.tsx`: renders an enable toggle and (when enabled) a duration selector with presets (20, 30, 45 min) and a custom number input (1–120); when interview is active, renders a countdown display (`{m}:{s} remaining`) that turns amber at ≤5 min; accepts `timerConfig`, `elapsedMs`, `onConfigChange` props
- [ ] T034 [US4] Update `packages/ai-interviewer/src/hooks/useInterviewChat.ts` to: (a) accept `timerConfig: TimerConfig | null` in its config/session state; (b) when timer is enabled, start a `setInterval` (1s) that computes elapsed time from `timerConfig.startTimestamp`; (c) when elapsed ≥ `totalMinutes * 60 * 1000`, automatically call the existing `endInterview()` path and show the `aiInterviewer.timerExpired` message; (d) persist `timerConfig` (including `startTimestamp` set at interview start) via the existing session auto-save; (e) restore `startTimestamp` on session load so the timer resumes correctly after navigation
- [ ] T035 [US4] Update `packages/ai-interviewer/src/components/InterviewSetup.tsx` to render `<TimerControl>` below the existing question setup controls; pass `timerConfig` state up to `AiInterviewer` to be stored in session config
- [ ] T036 [US4] Add i18n keys `aiInterviewer.timerLabel`, `aiInterviewer.timerEnabled`, `aiInterviewer.timerMinutes`, `aiInterviewer.timerCustom`, `aiInterviewer.timerWarning`, `aiInterviewer.timerExpired`, `aiInterviewer.timerRemaining` to all 3 locale files: `en.ts`, `es.ts`, `zh.ts`
- [ ] T037 [US4] Ensure `TimerControl.tsx` uses `dark:` Tailwind variants, `type="button"` on all non-submit buttons, `aria-label` on the toggle, and is accessible (color contrast on the warning state meets WCAG AA)

**Checkpoint**: Timed Practice Mode is independently testable. Timer starts, warns, persists across navigation, and auto-triggers evaluation on expiry.

---

## Phase 7: User Story 5 — Test Coverage for Core Components (Priority: P5)

**Goal**: Add dedicated unit tests for `InterviewChat`, `QuestionPanel`, and `QuestionManager` — covering primary user interactions and rendered states — to bring component test coverage from ~55% to ≥75%.

**Independent Test**: Run `pnpm --filter @mycircle/ai-interviewer test:run --coverage`. Verify `InterviewChat.test.tsx`, `QuestionPanel.test.tsx`, and the updated `QuestionManager.test.tsx` all exist and all assertions pass.

- [ ] T038 [P] [US5] Create `packages/ai-interviewer/src/test/InterviewChat.test.tsx`: mock all GraphQL hooks from `@mycircle/shared` and `useInterviewChat`; test that (1) messages render with correct role alignment (user right, assistant left), (2) the send button submits non-empty input and clears the textarea, (3) Shift+Enter inserts a newline without submitting, (4) a retry button appears when `error` state is set, (5) a score badge renders with the correct average when an `EvaluationScore` is present in the message; use `userEvent.setup({ delay: null })`
- [ ] T039 [P] [US5] Create `packages/ai-interviewer/src/test/QuestionPanel.test.tsx`: mock `useInterviewStateMachine` and prop callbacks; test that (1) the working document textarea accepts and reflects typed input, (2) the Start button is visible in idle state and calls `onStart`, (3) the Hint button calls `onHint`, (4) the Next Question button calls `onNext`, (5) the End Interview button calls `onEnd`, (6) the progress bar renders with correct `current/total` text when `progress` prop is provided, (7) score badges appear for completed questions with correct `Q{n}: {avg}/10` format
- [ ] T040 [P] [US5] Update `packages/ai-interviewer/src/test/QuestionManager.test.tsx` to add: (1) search input filters the displayed question list, (2) chapter dropdown filter shows only questions matching that chapter, (3) the add/edit form validation prevents submission when required fields are empty, (4) delete confirmation prompt appears before calling the delete mutation, (5) the cancel button on the delete prompt does NOT call the mutation (tests added to existing file, complementing any existing tests)

**Checkpoint**: All three components have passing tests. `pnpm test:run` green across the board.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation cleanup, and ensuring all integration points are consistent.

- [ ] T041 [P] Verify all 30 new i18n keys listed in `specs/026-ai-interviewer-improvements/contracts/graphql-schema-extensions.md` are present in all 3 locale files (`packages/shared/src/i18n/locales/en.ts`, `es.ts`, `zh.ts`) — run `validate_i18n` MCP tool to confirm
- [ ] T042 Run `validate_all` MCP tool and resolve any reported issues before opening PR
- [ ] T043 Run full suite `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` and fix any failures
- [ ] T044 Run `cd functions && npx tsc --noEmit` to confirm functions strict tsconfig passes with all new resolver code

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1 — Session History)**: Depends on Phase 2 completion — new Firestore fields must be writable before the new UI can read them
- **Phase 4 (US2 — Progress Analytics)**: Depends on Phase 2 (needs new summary fields) — can start in parallel with Phase 3 if Phase 2 is complete
- **Phase 5 (US3 — Import/Export)**: Depends on Phase 2 (needs new mutations) — independent of Phases 3 & 4
- **Phase 6 (US4 — Timer)**: Depends only on Phase 2 (no new schema needed, but `useInterviewChat` update in T034 may touch T018's file) — can start after Phase 3's T018 is complete
- **Phase 7 (US5 — Tests)**: Depends on the components being stable (best started after Phases 3–6 are complete, or run in parallel on components that aren't actively changing)
- **Phase 8 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — no dependency on US2–US5
- **US2 (P2)**: Can start after Phase 2 — depends on US1 only for the `sessions` data prop (reuses `useSessionHistory`); UI can be developed in parallel
- **US3 (P3)**: Fully independent of US1, US2 — can proceed in parallel after Phase 2
- **US4 (P4)**: Shares `useInterviewChat.ts` with US1 (T018); implement T034 after T018 is merged to avoid conflicts
- **US5 (P5)**: Test files are independent of each other — all 3 can be written in parallel; best written after the target components are stable

### Parallel Opportunities

- T006, T007 (schema additions) can be written in parallel
- T010, T011 (export/import resolvers) can be written in parallel
- T013, T014, T015 (shared query updates) can be written in parallel
- T018, T019, T020 (US1 hook + panel) — T019 and T020 can be written in parallel after T018
- T038, T039, T040 (US5 tests) can all be written in parallel

---

## Parallel Example: Phase 2 Foundational

```bash
# These can run in parallel once T003-T005 are done:
Task T006: Add ImportResult type + importQuestions mutation to functions/src/schema.ts
Task T007: Add exportQuestionBank query to functions/src/schema.ts

# These can run in parallel once T008-T009 are done:
Task T010: Implement exportQuestionBank resolver
Task T011: Implement importQuestions resolver

# These can run in parallel once T013 is done:
Task T014: Add EXPORT_QUESTION_BANK query to packages/shared/src/apollo/queries.ts
Task T015: Add IMPORT_QUESTIONS mutation to packages/shared/src/apollo/queries.ts
```

## Parallel Example: User Story 5 Tests

```bash
# All 3 test files can be written simultaneously:
Task T038: Create InterviewChat.test.tsx
Task T039: Create QuestionPanel.test.tsx
Task T040: Update QuestionManager.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T017) — **do not skip**
3. Complete Phase 3: User Story 1 (T018–T023)
4. **STOP and VALIDATE**: Create 2 structured sessions, verify history panel shows metadata, filter works, re-run pre-fills setup
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Schema extended, types generated
2. US1 (Session History) → Users can browse and filter past sessions with metadata
3. US2 (Progress Analytics) → Users can see score trends over time
4. US3 (Import/Export) → Admins can bulk-manage the question bank
5. US4 (Timed Mode) → Users can practice under real interview time pressure
6. US5 (Tests) → Codebase regression-protected for all new and existing components

### Parallel Team Strategy

With 2 developers after Phase 2:

- Developer A: US1 (T018–T023) → US2 (T024–T027)
- Developer B: US3 (T028–T032) → US4 (T033–T037) → US5 (T038–T040)

---

## Notes

- [P] tasks = different files, no unresolved dependencies
- Each user story is independently completable and testable without completing others
- T034 (timer in `useInterviewChat.ts`) should be implemented after T018 (metadata save in same file) to avoid merge conflicts
- Run `pnpm codegen` immediately after T016 and commit `generated.ts` — do not defer
- When writing Spanish i18n (`es.ts`), read the exact existing lines first — the file uses Unicode escapes (`\u00f3` etc.)
- All new Tailwind classes must have `dark:` variants — check existing component patterns for the color system in use
- Commit after each phase or logical group; never batch unrelated changes into one commit
