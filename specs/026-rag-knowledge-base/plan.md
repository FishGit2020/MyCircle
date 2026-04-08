# Implementation Plan: RAG Knowledge Base

**Branch**: `026-rag-knowledge-base` | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/026-rag-knowledge-base/spec.md`

## Summary

Add a RAG (Retrieval-Augmented Generation) Knowledge Base to the existing AI Assistant MFE. Users can ingest text documents (chunked and embedded via Ollama), search their knowledge base with semantic similarity, view ingested sources, and pipe search results into AI chat as context. This is an enhancement to the existing `ai-assistant` package — no new MFE package required.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions Node 22)  
**Primary Dependencies**: React 18, Apollo Client (via `@mycircle/shared`), Firebase Cloud Functions v2, Firebase Admin SDK (Storage + Firestore)  
**Storage**: Firebase Storage (`users/{uid}/knowledge-base.json` for chunks+embeddings), Firestore (`users/{uid}/knowledgeMeta/{sourceId}` for source metadata)  
**Testing**: Vitest + React Testing Library (frontend), `npx tsc --noEmit` (backend)  
**Target Platform**: Web (desktop + mobile responsive)  
**Project Type**: Enhancement to existing MFE (ai-assistant)  
**Performance Goals**: Ingestion <60s for 50K chars, search <5s for 1000 chunks  
**Constraints**: Embedding via user-configured Ollama endpoint (not a managed service), single JSON file per user for chunk storage  
**Scale/Scope**: Per-user private knowledge base, expected <10K chunks per user

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | Enhancement to existing MFE, no new package. All shared imports via `@mycircle/shared`. |
| II. Complete Integration | PASS | No new MFE — only adding a tab + backend operations. i18n keys in all 3 locales required. No new shell routes, nav, widgets, Dockerfile, or vitest aliases needed. |
| III. GraphQL-First Data Layer | PASS | All 3 operations (ingestKnowledgeDoc, knowledgeSources, ragSearch) are GraphQL. No REST endpoints. |
| IV. Inclusive by Default | PASS | All strings via `t('key')`, dark mode variants, semantic HTML, aria-labels, 44px touch targets, mobile-first. |
| V. Fast Tests, Safe Code | PASS | Unit tests mock all network calls. Input validation via Zod on backend. No SSRF risk (Ollama URL from user's own endpoint config). `printf` for any secret ops. |
| VI. Simplicity | PASS | Minimal viable approach: single JSON file for embeddings, brute-force dot product search, no vector DB, no abstraction layers. |

**Gate result**: ALL PASS — proceed to implementation.

## Project Structure

### Documentation (this feature)

```text
specs/026-rag-knowledge-base/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research findings
├── data-model.md        # Data model definition
├── quickstart.md        # Developer quickstart
├── contracts/
│   └── graphql.md       # GraphQL schema contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
functions/src/
├── schema.ts                    # + KnowledgeSource, KnowledgeSearchResult, IngestResult types
│                                #   + knowledgeSources query, ragSearch query, ingestKnowledgeDoc mutation
├── resolvers/
│   ├── index.ts                 # + wire rag resolvers
│   └── rag.ts                   # NEW — createRagQueryResolvers(), createRagMutationResolvers()
│                                #   chunking, embedding (native Ollama API), Storage read/write, dot product

packages/shared/src/
├── apollo/
│   ├── queries.ts               # + INGEST_KNOWLEDGE_DOC, GET_KNOWLEDGE_SOURCES, RAG_SEARCH
│   └── generated.ts             # Auto-regenerated via pnpm codegen
├── i18n/locales/
│   ├── en.ts                    # + ai.knowledgeBase.* keys (~20 keys)
│   ├── es.ts                    # + ai.knowledgeBase.* keys (Unicode escapes)
│   └── zh.ts                    # + ai.knowledgeBase.* keys

packages/ai-assistant/src/
├── components/
│   ├── AiAssistant.tsx          # + 'knowledge-base' tab, tab button
│   └── KnowledgeBase.tsx        # NEW — IngestPanel + SearchPanel + SourcesList
```

**Structure Decision**: This is an enhancement to the existing `ai-assistant` MFE and `functions` backend. No new packages or MFEs are created. The change touches 3 existing packages (functions, shared, ai-assistant) and adds 1 new resolver file + 1 new component file.

## Complexity Tracking

No constitution violations. No complexity justifications needed.

## Key Design Decisions

### 1. Embedding via Native Ollama API (not OpenAI client)

The existing codebase uses the OpenAI-compatible client for chat completions. For embeddings, we use the native Ollama REST API (`POST {url}/api/embeddings`) directly via `fetch`. This is simpler and avoids mismatches with the OpenAI client's embedding response format.

Cloudflare Access headers (`CF-Access-Client-Id`, `CF-Access-Client-Secret`) are applied from the user's endpoint configuration, consistent with existing patterns in `aiChatHelpers.ts`.

### 2. Single JSON File for Chunks

All chunks + embeddings for a user are stored in one Firebase Storage JSON file. This enables atomic reads for search (download entire file, compute similarity in memory) and atomic writes for ingestion (read-modify-write). The trade-off is that very large knowledge bases (>10K chunks) may become slow, but this is acceptable for the personal use case.

### 3. Chat Context via systemPrompt

The existing `AI_CHAT` mutation already accepts a `systemPrompt` parameter. When the user clicks "Ask AI about these results," the frontend constructs a system prompt containing the top-K chunks and switches to the chat tab. No backend changes needed for context injection.

### 4. Model Tracking per Source

Each `KnowledgeSource` and `KnowledgeChunk` stores the `embedModel` used. This enables future warnings when the search model differs from the ingestion model (mixed embeddings produce meaningless similarity scores). For v1, we display a warning but don't prevent the search.

## Implementation Phases

### Phase A: Backend (GraphQL + Resolvers)

1. Add types to `functions/src/schema.ts`
2. Create `functions/src/resolvers/rag.ts` with chunking, embedding, storage, and search logic
3. Wire resolvers in `functions/src/resolvers/index.ts`
4. Verify with `cd functions && npx tsc --noEmit`

### Phase B: Shared (Queries + Codegen + i18n)

1. Add 3 GraphQL operations to `packages/shared/src/apollo/queries.ts`
2. Run `pnpm codegen` to regenerate types
3. Add i18n keys to all 3 locale files
4. Run `pnpm build:shared`

### Phase C: Frontend (Knowledge Base Tab)

1. Create `KnowledgeBase.tsx` component with IngestPanel, SearchPanel, SourcesList
2. Integrate into `AiAssistant.tsx` as 4th tab
3. Wire "Ask AI about these results" to switch tab and set systemPrompt
4. Ensure dark mode, a11y, responsive design

### Phase D: Testing + Validation

1. Add unit tests for KnowledgeBase component
2. Run full suite: `pnpm lint && pnpm test:run && pnpm typecheck`
3. Run `cd functions && npx tsc --noEmit`
4. Manual verification of end-to-end flow
