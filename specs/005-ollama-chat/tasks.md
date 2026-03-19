# Tasks: Ollama Chat Enhancement

**Input**: Design documents from `/specs/005-ollama-chat/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included in Polish phase (MarkdownText.test.tsx already exists and needs extending).

**Organization**: Tasks grouped by user story. US1 and US2/US3 target different files so they can start in parallel, but US3 must come after US2 (both modify `MarkdownText.tsx`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Read and understand the two existing source files before modifying them. Ensures correct insertion points.

- [X] T001 Read functions/src/handlers/aiChat.ts lines 750–840 to locate the Ollama for-await streaming loop and verify the `toolCallBuffers` delta-accumulation pattern as the model for `thinkBuffer`
- [X] T002 [P] Read packages/ai-assistant/src/components/MarkdownText.tsx in full to locate the code-block split (Stage 1), the line-by-line loop (Stage 2), and the `renderInline()` helper used by both heading and table implementations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new packages, schema changes, or migrations are required. Existing infrastructure is sufficient.

**⚠️ NOTE**: This feature modifies two existing files only. No foundational scaffolding is needed — proceed directly to user story phases after Phase 1 verification.

- [X] T003 Verify `pnpm --filter @mycircle/ai-assistant build` and `cd functions && npx tsc --noEmit` both pass on the current branch before making any changes

**Checkpoint**: Baseline builds confirmed — user story implementation can begin

---

## Phase 3: User Story 1 — Think Tag Stripping (Priority: P1) 🎯 MVP

**Goal**: DeepSeek R1 / Qwen3 `<think>...</think>` blocks are intercepted server-side and routed to `thinking` SSE events instead of leaking raw tags into the chat bubble.

**Independent Test**: Select a DeepSeek R1 model in AI Assistant → send "What is 17 × 23?" → chat bubble shows only the answer with no `<think>` text; collapsible Reasoning panel shows the stripped reasoning. (See quickstart.md Scenario A.)

### Implementation for User Story 1

- [X] T004 [US1] In functions/src/handlers/aiChat.ts, locate the Ollama streaming path (for-await loop ~line 760) and declare `let thinkBuffer = ''` immediately before the loop; on each `delta.content` chunk, append to `thinkBuffer` instead of emitting directly
- [X] T005 [US1] In functions/src/handlers/aiChat.ts, after appending to `thinkBuffer`, add a while-loop that extracts complete `<think>...</think>` blocks using regex `/\<think\>([\s\S]*?)\<\/think\>/` and calls `sendEvent('thinking', { content: match[1] })` then removes the matched block from `thinkBuffer`
- [X] T006 [US1] In functions/src/handlers/aiChat.ts, after the while-loop: if `thinkBuffer` contains no `<think>` opening tag, call `sendEvent('text', { content: thinkBuffer })` and reset `thinkBuffer = ''`; else if content exists before the first `<think>`, flush that prefix as a `text` event and retain `'<think>' + rest` in the buffer; else do nothing (partial tag — wait for next chunk)
- [X] T007 [US1] In functions/src/handlers/aiChat.ts, after the for-await loop ends (stream complete), add a final flush: if `thinkBuffer` is non-empty, call `sendEvent('text', { content: thinkBuffer })` and reset to `''` (handles unclosed `<think>` gracefully)

**Checkpoint**: US1 complete — `<think>` tags stripped server-side, reasoning panel populated, no raw tags in chat bubble

---

## Phase 4: User Story 2 — Markdown Heading Rendering (Priority: P1)

**Goal**: Lines starting with `#`, `##`, or `###` render as styled heading elements in AI chat responses.

**Independent Test**: Ask AI "Give me a guide to setting up Ollama with 3 sections using # headings" → response renders headings as large/medium/small bold elements with no `#` prefix visible; dark mode shows appropriate `dark:text-gray-100` contrast. (See quickstart.md Scenario C.)

### Implementation for User Story 2

- [X] T008 [P] [US2] In packages/ai-assistant/src/components/MarkdownText.tsx, inside the Stage 2 line-by-line loop, add heading detection BEFORE the existing bullet/numbered list checks: match `/^(#{1,3})\s+(.+)/` and render a `<div>` with `renderInline(text)` content and class `mt-3 mb-1 text-gray-900 dark:text-gray-100` plus one of `['text-xl font-bold', 'text-lg font-semibold', 'text-base font-semibold'][level - 1]` based on `headingMatch[1].length`

**Checkpoint**: US2 complete — `#`/`##`/`###` headings styled, dark mode covered, `renderInline()` applied so bold/italic inside headings works

---

## Phase 5: User Story 3 — Markdown Table Rendering (Priority: P2)

**Goal**: Pipe-delimited markdown tables render as styled grid tables with header row, data rows, borders, and dark mode support.

**Independent Test**: Ask AI "Compare Llama 3 and Mistral 7B in a markdown table" → a styled table renders with gray header background, alternating row striping, visible borders, and `overflow-x-auto` wrapper; partial table during streaming falls through to plain text without crashing. (See quickstart.md Scenarios D and E.)

**Dependency**: Must implement after T008 (US2) since both modify `packages/ai-assistant/src/components/MarkdownText.tsx`.

### Implementation for User Story 3

- [X] T009 [US3] In packages/ai-assistant/src/components/MarkdownText.tsx, add `isMarkdownTable(text: string): boolean` function that: splits text by `\n`, filters empty lines, returns false if fewer than 2 lines or first line has no `|`, returns true only if second line matches `/^\|[\s\-:|]+\|$/` (separator row gate)
- [X] T010 [US3] In packages/ai-assistant/src/components/MarkdownText.tsx, add `renderMarkdownTable(segment: string, key: number): React.ReactNode` function that: parses header cells from line 0, skips separator row (line 1), renders data rows from line 2+; wraps in `<div className="overflow-x-auto my-2"><table className="w-full text-sm border-collapse">` with `<thead>` / `<th className="text-left px-3 py-2 font-semibold bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">` and `<tbody>` / `<tr className="even:bg-gray-50 dark:even:bg-gray-800/50">` / `<td className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">`; applies `renderInline()` to each cell's content
- [X] T011 [US3] In packages/ai-assistant/src/components/MarkdownText.tsx, insert Stage 1.5 between the existing code-block split and the line-by-line Stage 2: after splitting by `/(```[\s\S]*?```)/g`, map over each non-code-block segment and further split using `/((?:\|[^\n]+\|(?:\n|$)){2,})/g`; flatten results; in the render switch add `if (isMarkdownTable(segment)) return renderMarkdownTable(segment, i)` before the existing code-block check

**Checkpoint**: US3 complete — tables render as styled grids; partial tables during streaming fall through to plain text safely

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Extend existing tests, verify full build passes, run quickstart scenarios.

- [X] T012 [P] Add heading tests to packages/ai-assistant/src/components/MarkdownText.test.tsx: test that `# Heading` renders with `text-xl font-bold` class, `## Heading` with `text-lg font-semibold`, `### Heading` with `text-base font-semibold`; test that `# ` (with space) matches but `#nospace` does not; test that `renderInline()` is applied (bold inside heading works)
- [X] T013 [P] Add table tests to packages/ai-assistant/src/components/MarkdownText.test.tsx: test that a complete 3-column table (header + separator + 2 data rows) renders `<table>`, `<thead>`, `<tbody>`, `<th>`, `<td>` elements; test that `overflow-x-auto` wrapper is present; test that cell content with `**bold**` renders as `<strong>`
- [X] T014 [P] Add streaming partial-table safety test to packages/ai-assistant/src/components/MarkdownText.test.tsx: pass a `| header |` line with no separator row to `<MarkdownText>` and assert no `<table>` element is rendered (falls through to plain text)
- [X] T015 Run `pnpm --filter @mycircle/ai-assistant test:run` and fix any test failures in packages/ai-assistant/src/components/MarkdownText.test.tsx
- [X] T016 Run `cd functions && npx tsc --noEmit` and fix any TypeScript errors introduced in functions/src/handlers/aiChat.ts
- [X] T017 Run `pnpm lint` from repo root and fix any lint errors in modified files
- [ ] T018 Run manual quickstart.md scenarios A–E against `pnpm dev` to validate all three user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — run baseline build check
- **US1 (Phase 3)**: Depends on Phase 2 — modifies `aiChat.ts` independently
- **US2 (Phase 4)**: Depends on Phase 2 — modifies `MarkdownText.tsx`; can run in parallel with US1
- **US3 (Phase 5)**: Depends on Phase 4 (US2 must be complete — same file)
- **Polish (Phase 6)**: Depends on US1 + US2 + US3 completion

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — independent of US2/US3 (different file)
- **US2 (P1)**: Can start immediately after Phase 2 — independent of US1 (different file)
- **US3 (P2)**: Must follow US2 — both modify `MarkdownText.tsx`; implementing US3 after US2 avoids merge conflicts

### Parallel Opportunities

- T001 and T002 (Setup) can run in parallel
- T004–T007 (US1) and T008 (US2) can run in parallel — different files
- T009–T011 (US3) must follow T008 (US2) sequentially
- T012, T013, T014 (test additions in Polish) can run in parallel

---

## Parallel Example: US1 + US2 (Different Files)

```bash
# US1 and US2 can be implemented simultaneously since they touch different files:

# Developer A (or Agent A):
Task T004: Initialize thinkBuffer in functions/src/handlers/aiChat.ts
Task T005: Implement <think> extraction loop in functions/src/handlers/aiChat.ts
Task T006: Implement pre-think text flush in functions/src/handlers/aiChat.ts
Task T007: Add stream-end flush in functions/src/handlers/aiChat.ts

# Developer B (or Agent B):
Task T008: Add heading detection in packages/ai-assistant/src/components/MarkdownText.tsx
```

---

## Implementation Strategy

### MVP First (US1 Only — Think Tag Stripping)

1. Complete Phase 1: Verify source files
2. Complete Phase 2: Confirm baseline builds
3. Complete Phase 3: US1 (aiChat.ts thinkBuffer)
4. **STOP and VALIDATE**: Test with DeepSeek R1 — no `<think>` tags in chat bubble, Reasoning panel populated
5. Ship US1 independently if needed

### Incremental Delivery

1. Phase 1 + 2: Verification → Foundation confirmed
2. Phase 3 (US1): Think tag stripping → reasoning models fully usable ✓
3. Phase 4 (US2): Heading rendering → structured AI responses readable ✓
4. Phase 5 (US3): Table rendering → comparison/data responses readable ✓
5. Phase 6: Tests + validation → ready for PR

### Notes

- `[P]` tasks = different files, no dependencies on incomplete sibling tasks
- US1 tasks (T004–T007) are sequential within `aiChat.ts` — each builds on the previous
- US2 task (T008) is a single coherent change to `MarkdownText.tsx` Stage 2
- US3 tasks (T009–T011) are sequential within `MarkdownText.tsx` — detection → renderer → stage wiring
- Commit after each phase or logical group
- Run `cd functions && npx tsc --noEmit` after any `aiChat.ts` change — functions uses strict `noUnusedLocals`
