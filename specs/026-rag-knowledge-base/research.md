# Research: RAG Knowledge Base

**Feature**: 026-rag-knowledge-base  
**Date**: 2026-04-04

## R-001: Embedding API Pattern

**Decision**: Use native Ollama REST API (`POST {endpoint.url}/api/embeddings`) via `fetch` with Cloudflare Access headers, rather than the OpenAI-compatible `/v1` client.

**Rationale**: The existing codebase uses the OpenAI-compatible client (`openai` package) for chat completions only. No embedding code exists yet. The native Ollama API is simpler for embeddings — a single POST returning `{ embedding: float[] }` — and avoids wrapping the OpenAI client's embedding endpoint which has different response shapes.

**Alternatives considered**:
- OpenAI-compatible `/v1/embeddings` endpoint: Would work but adds unnecessary abstraction since we just need a raw fetch call. The existing `makeOllamaClient()` pattern in `resumeTailor.ts` is chat-specific.

## R-002: Storage Architecture

**Decision**: Firebase Storage for chunk+embedding data (`users/{uid}/knowledge-base.json`), Firestore for source metadata only (`users/{uid}/knowledgeMeta/{sourceId}`).

**Rationale**: Embedding vectors are large (768+ floats per chunk). Storing them in Firestore would hit document size limits (1 MB) and be expensive for reads. Firebase Storage is cheap for blob storage and supports atomic overwrite. Firestore metadata stays small for fast source listing.

**Alternatives considered**:
- All in Firestore (subcollection per chunk): Expensive reads, document size risk for large embeddings.
- All in Firebase Storage: Metadata listing would require downloading the entire JSON file.

## R-003: Tab Implementation Pattern

**Decision**: Add `'knowledge-base'` to the `VALID_TABS` set in `AiAssistant.tsx` (line 61). Use URL search params (`?tab=knowledge-base`) consistent with existing `chat` and `monitor` tabs.

**Rationale**: Direct extension of existing pattern. No new routing or state management needed.

**Source**: `packages/ai-assistant/src/components/AiAssistant.tsx` lines 60-66.

## R-004: Chat Context Injection

**Decision**: Use the existing `systemPrompt` parameter on the `AI_CHAT` GraphQL mutation to inject RAG context. When user clicks "Ask AI about these results," switch to chat tab and set a system prompt containing the top-K chunks.

**Rationale**: The `AI_CHAT` mutation already accepts `systemPrompt` (line 476 of `queries.ts`, line 282 of `resolvers/ai.ts`). No backend changes needed for context injection — only frontend wiring.

**Alternatives considered**:
- Custom eventBus event: More complex, requires new event type and handler.
- New GraphQL mutation parameter: Over-engineering when `systemPrompt` already exists.

## R-005: Endpoint/Model Selector Reuse

**Decision**: Reuse the existing endpoint and model picker UI pattern from `AiAssistant.tsx` (lines 154-187). The selectors use `GET_BENCHMARK_ENDPOINTS` and `GET_BENCHMARK_ENDPOINT_MODELS` queries with localStorage persistence (`ENDPOINT_STORAGE_KEY`, `MODEL_STORAGE_KEY`).

**Rationale**: Consistent UX. The Knowledge Base tab needs the same endpoint/model selection as chat. Sharing the same localStorage keys means the user's last selection carries across tabs.

## R-006: Chunking Strategy

**Decision**: Split by paragraph boundaries (`\n\n`), with a max chunk size of ~1500 characters and 100-character overlap between consecutive chunks. If a paragraph exceeds 1500 chars, split at sentence boundaries.

**Rationale**: Paragraph-based splitting preserves semantic coherence. Overlap ensures context at chunk boundaries isn't lost. 1500 chars is a common sweet spot for embedding models — large enough for context, small enough for meaningful similarity.

## R-007: Similarity Computation

**Decision**: Dot product for similarity scoring. Compute on the server side (Cloud Function) when `ragSearch` is called.

**Rationale**: `nomic-embed-text` produces L2-normalized vectors, making dot product equivalent to cosine similarity. Dot product is computationally cheaper (no normalization step). For up to ~1000 chunks, brute-force dot product is fast enough (sub-second).

**Alternatives considered**:
- Client-side similarity: Would require downloading all embeddings to the browser — defeats the purpose of server-side storage.
- Vector database (Pinecone, Weaviate): Over-engineering for a single-user personal knowledge base with <10K chunks.

## R-008: Resolver Pattern

**Decision**: Create `functions/src/resolvers/rag.ts` with factory functions `createRagQueryResolvers()` and `createRagMutationResolvers()`, wired into `resolvers/index.ts`.

**Rationale**: Follows the established factory pattern used by `resumeTailor.ts`, `ai.ts`, and other resolver files. Uses `requireAuth()`, `getUserOllamaEndpoint()`, `GraphQLError` for consistency.

**Source**: `functions/src/resolvers/index.ts` (resolver wiring), `functions/src/resolvers/resumeTailor.ts` (factory pattern example).

## R-009: Crawl Results Integration

**Decision**: Allow users to pick from completed web crawl jobs stored in `users/{uid}/crawlJobs/{jobId}`. Add a dropdown in the ingest panel that fetches completed crawl jobs and lets the user select one as ingestion source.

**Rationale**: The web crawler already stores crawl data in Firestore. Reusing this data for RAG ingestion is a natural workflow — users crawl a site, then add it to their knowledge base.

**Source**: `functions/src/handlers/webCrawler.ts` (crawl job structure).
