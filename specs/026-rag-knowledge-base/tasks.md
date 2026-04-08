# Tasks: RAG Knowledge Base

**Input**: Design documents from `/specs/026-rag-knowledge-base/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/graphql.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: GraphQL schema, query definitions, codegen, and i18n keys that all stories depend on

- [x] T001 Add KnowledgeSource, KnowledgeSearchResult, IngestResult types and 3 operations (knowledgeSources query, ragSearch query, ingestKnowledgeDoc mutation) to `functions/src/schema.ts`
- [x] T002 Add INGEST_KNOWLEDGE_DOC mutation, GET_KNOWLEDGE_SOURCES query, and RAG_SEARCH query to `packages/shared/src/apollo/queries.ts` per contracts/graphql.md
- [x] T003 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`
- [x] T004 [P] Add `ai.knowledgeBase.*` i18n keys to `packages/shared/src/i18n/locales/en.ts` (tab label, ingest panel labels, search panel labels, sources list labels, buttons, empty states, errors, loading states)
- [x] T005 [P] Add `ai.knowledgeBase.*` i18n keys to `packages/shared/src/i18n/locales/es.ts` with Unicode escapes for accented characters
- [x] T006 [P] Add `ai.knowledgeBase.*` i18n keys to `packages/shared/src/i18n/locales/zh.ts`
- [x] T007 Run `pnpm build:shared` to rebuild shared package with new queries, types, and i18n keys

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Resolver scaffold, helper utilities (chunking, embedding, similarity), and wiring that all story resolvers depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T008 Create `functions/src/resolvers/rag.ts` with resolver scaffold: imports (`firebase-admin/firestore`, `firebase-admin/storage`, `GraphQLError`, `getUserOllamaEndpoint` from `../aiChatHelpers.js`), `ResolverContext` interface, `requireAuth()` helper, and exported factory stubs `createRagQueryResolvers()` / `createRagMutationResolvers()`
- [x] T009 Implement `chunkText(content: string, maxChunkSize?: number, overlap?: number): string[]` utility function in `functions/src/resolvers/rag.ts` — split by paragraph (`\n\n`), max ~1500 chars, 100-char overlap, handle single paragraphs exceeding max by splitting at sentence boundaries
- [x] T010 Implement `embedText(endpoint: OllamaEndpoint, model: string, text: string): Promise<number[]>` utility function in `functions/src/resolvers/rag.ts` — native Ollama API call (`POST {endpoint.url}/api/embeddings` with `{ model, prompt: text }`), include CF Access headers if present, return embedding vector
- [x] T011 Implement `dotProduct(a: number[], b: number[]): number` utility function in `functions/src/resolvers/rag.ts` for similarity scoring
- [x] T012 Implement `readKnowledgeBase(bucket, uid): Promise<KnowledgeChunk[]>` and `writeKnowledgeBase(bucket, uid, chunks: KnowledgeChunk[]): Promise<void>` Storage helpers in `functions/src/resolvers/rag.ts` — read/write `users/{uid}/knowledge-base.json` from Firebase Storage, return empty array if file doesn't exist
- [x] T013 Wire rag resolvers into `functions/src/resolvers/index.ts` — import `createRagQueryResolvers` and `createRagMutationResolvers`, spread into Query and Mutation objects
- [x] T014 Verify backend compiles: `cd functions && npx tsc --noEmit`

**Checkpoint**: Foundation ready — resolver infrastructure in place, user story implementation can begin

---

## Phase 3: User Story 1 — Ingest a Document (Priority: P1) MVP

**Goal**: Users can add text documents to their knowledge base. Text is chunked, embedded via Ollama, and stored persistently.

**Independent Test**: Navigate to AI Assistant > Knowledge Base tab, paste text, provide title, click "Add to Knowledge Base." Verify success message with chunk count and source appears in list.

### Implementation for User Story 1

- [x] T015 [US1] Implement `ingestKnowledgeDoc` resolver in `functions/src/resolvers/rag.ts` — validate input (title non-empty max 200 chars, content non-empty min 50 chars, embedModel non-empty), get endpoint via `getUserOllamaEndpoint()`, chunk text, embed each chunk, read existing chunks from Storage, append new chunks, write back atomically, write KnowledgeSource metadata to Firestore `users/{uid}/knowledgeMeta/{sourceId}`, return IngestResult
- [x] T016 [US1] Create `packages/ai-assistant/src/components/KnowledgeBase.tsx` — main component with IngestPanel section: title input, content textarea, optional source URL input, endpoint/model selectors (reuse existing pattern from AiAssistant.tsx lines 154-187 using GET_BENCHMARK_ENDPOINTS and GET_BENCHMARK_ENDPOINT_MODELS queries), "Add to Knowledge Base" button calling INGEST_KNOWLEDGE_DOC mutation, loading state during ingestion, success/error messages with chunk count
- [x] T017 [US1] Add `'knowledge-base'` to VALID_TABS set and tab type union in `packages/ai-assistant/src/components/AiAssistant.tsx`, add tab button with i18n label, conditionally render `<KnowledgeBase>` component when active tab is `'knowledge-base'`
- [x] T018 [US1] Verify backend compiles: `cd functions && npx tsc --noEmit`

**Checkpoint**: User Story 1 fully functional — users can ingest documents and see them stored

---

## Phase 4: User Story 2 — Search the Knowledge Base (Priority: P1)

**Goal**: Users can search their knowledge base with natural-language questions and see ranked results with source attribution.

**Independent Test**: After ingesting a document (US1), type a question in the search panel. Verify relevant chunks appear ranked by similarity score with source title and URL.

### Implementation for User Story 2

- [x] T019 [US2] Implement `ragSearch` resolver in `functions/src/resolvers/rag.ts` — validate question non-empty, get endpoint, embed question via `embedText()`, read chunks from Storage via `readKnowledgeBase()`, compute dot product similarity for each chunk, sort descending, return top-K (default 5) as KnowledgeSearchResult array, return empty array if no chunks exist
- [x] T020 [US2] Add SearchPanel section to `packages/ai-assistant/src/components/KnowledgeBase.tsx` — question input, endpoint/model selectors (shared with IngestPanel state), optional top-K selector, "Search" button calling RAG_SEARCH query, results list showing chunk text (truncated with expand), source title, source URL (as link), similarity score (percentage), empty state for no results, "no strong matches" message for low scores, loading state
- [x] T021 [US2] Add model mismatch warning in SearchPanel — if the search embedModel differs from any source's embedModel shown in results, display an i18n warning about potential inaccuracy

**Checkpoint**: User Stories 1 AND 2 fully functional — users can ingest and search

---

## Phase 5: User Story 3 — View and Manage Knowledge Sources (Priority: P2)

**Goal**: Users can see all ingested documents with metadata (title, URL, chunk count, date).

**Independent Test**: After ingesting multiple documents, verify the sources list displays all entries with correct metadata. When no documents exist, verify empty state guidance.

### Implementation for User Story 3

- [x] T022 [US3] Implement `knowledgeSources` resolver in `functions/src/resolvers/rag.ts` — query Firestore `users/{uid}/knowledgeMeta` collection, convert Firestore Timestamps to ISO strings via `toMillis()`, return array of KnowledgeSource objects sorted by createdAt descending
- [x] T023 [US3] Add SourcesList section to `packages/ai-assistant/src/components/KnowledgeBase.tsx` — fetch sources via GET_KNOWLEDGE_SOURCES query, display as a list/table with title, URL (clickable link), chunk count, embed model, formatted date, empty state with guidance ("Add your first document above"), refetch sources after successful ingestion (US1)

**Checkpoint**: User Stories 1, 2, AND 3 all functional — full knowledge base management

---

## Phase 6: User Story 4 — Use Search Results as AI Chat Context (Priority: P2)

**Goal**: Users can pipe search results into the AI chat as context for retrieval-augmented generation.

**Independent Test**: After searching (US2), click "Ask AI about these results." Verify the Chat tab activates with retrieved chunks injected as system prompt context.

### Implementation for User Story 4

- [x] T024 [US4] Add "Ask AI about these results" button to SearchPanel in `packages/ai-assistant/src/components/KnowledgeBase.tsx` — visible only when search results exist, disabled when no results or all low-score, constructs a system prompt string from top-K chunks (format: "Use the following knowledge base excerpts to answer the user's question:\n\n[chunk text with source attribution]...")
- [x] T025 [US4] Wire tab switching and context injection in `packages/ai-assistant/src/components/AiAssistant.tsx` — accept a callback or state from KnowledgeBase that sets the active tab to 'chat' and passes the constructed systemPrompt to the chat component/hook, integrate with existing `useAiChatWithStreaming` hook's systemPrompt support

**Checkpoint**: Full RAG workflow operational — ingest, search, and generate with context

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Quality, accessibility, dark mode, and final validation

- [x] T026 [P] Ensure all new UI in `packages/ai-assistant/src/components/KnowledgeBase.tsx` has dark mode Tailwind variants (`dark:bg-*`, `dark:text-*`, `dark:border-*`) for every color class
- [x] T027 [P] Ensure all interactive elements in KnowledgeBase.tsx have proper a11y: `type="button"` on non-submit buttons, `aria-label` on icon-only controls, semantic HTML (`<section>`, `<h2>`, `<form>`), touch targets >= 44px
- [x] T028 [P] Ensure responsive layout in KnowledgeBase.tsx: mobile-first with `md:` breakpoint for side-by-side panels, wrap in `<PageContent>` from `@mycircle/shared`
- [x] T029 Run `cd functions && npx tsc --noEmit` to verify backend strict typecheck passes
- [x] T030 Run `pnpm lint && pnpm test:run && pnpm typecheck` to verify full suite passes
- [x] T031 Run quickstart.md verification checklist manually

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion (schema + queries must exist for resolver types)
- **User Stories (Phase 3+)**: All depend on Foundational phase (Phase 2) completion
  - US1 (Ingest): Can start after Phase 2 — no dependencies on other stories
  - US2 (Search): Can start after Phase 2 — functionally depends on US1 for testable data but is independently implementable
  - US3 (Sources): Can start after Phase 2 — independent of US1/US2 for implementation
  - US4 (Chat Context): Depends on US2 being complete (needs search results UI to add button)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: Independent — foundational capability
- **US2 (P1)**: Can be implemented in parallel with US1, but requires US1 data for end-to-end testing
- **US3 (P2)**: Fully independent — can implement in parallel with US1/US2
- **US4 (P2)**: Depends on US2 (search results must exist in UI to add "Ask AI" button)

### Within Each User Story

- Backend resolver before frontend UI (resolver provides the data the UI consumes)
- Core implementation before integration/polish

### Parallel Opportunities

- T004, T005, T006 (i18n keys for all 3 locales) can run in parallel
- T009, T010, T011, T012 (utility functions in rag.ts) could be implemented in parallel if in separate files, but since they share one file, implement sequentially
- US1, US2, US3 implementation can proceed in parallel after Phase 2 (different resolver functions + different UI sections)
- T026, T027, T028 (polish tasks) can all run in parallel

---

## Parallel Example: Phase 1 Setup

```
# Launch all i18n tasks together:
Task T004: "Add ai.knowledgeBase.* keys to en.ts"
Task T005: "Add ai.knowledgeBase.* keys to es.ts"
Task T006: "Add ai.knowledgeBase.* keys to zh.ts"
```

## Parallel Example: User Stories After Phase 2

```
# After Phase 2 checkpoint, launch US1 + US3 in parallel:
Task T015: "Implement ingestKnowledgeDoc resolver"  (US1 backend)
Task T022: "Implement knowledgeSources resolver"     (US3 backend)

# Then their UI in parallel:
Task T016: "Create KnowledgeBase.tsx with IngestPanel"  (US1 frontend)
Task T023: "Add SourcesList to KnowledgeBase.tsx"        (US3 frontend)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (schema, queries, codegen, i18n)
2. Complete Phase 2: Foundational (resolver scaffold, utilities, wiring)
3. Complete Phase 3: User Story 1 (ingest resolver + UI + tab)
4. **STOP and VALIDATE**: Test ingestion end-to-end independently
5. Deploy/demo if ready — users can already add documents

### Incremental Delivery

1. Setup + Foundational → Infrastructure ready
2. Add US1 (Ingest) → Test → Deploy (MVP — users can add documents)
3. Add US2 (Search) → Test → Deploy (users can now find information)
4. Add US3 (Sources) → Test → Deploy (users can manage their knowledge base)
5. Add US4 (Chat Context) → Test → Deploy (full RAG loop — retrieval-augmented generation)
6. Polish → Final quality pass

### Recommended Execution Order (Single Developer)

Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No test tasks are generated — tests were not explicitly requested in the spec
- All backend changes are in `functions/src/resolvers/rag.ts` (new file) and `functions/src/schema.ts` + `functions/src/resolvers/index.ts` (existing files)
- All frontend changes are in `packages/ai-assistant/src/components/KnowledgeBase.tsx` (new file) and `packages/ai-assistant/src/components/AiAssistant.tsx` (existing file)
- This is NOT a new MFE — no Dockerfile, shell route, widget, nav, or vitest alias changes needed
- After i18n changes, always rebuild shared: `pnpm build:shared`
- After schema changes, always run codegen: `pnpm codegen`
- Spanish locale uses Unicode escapes (`\u00f3`, `\u00e1`, etc.) — read exact lines before editing
