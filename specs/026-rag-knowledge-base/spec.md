# Feature Specification: RAG Knowledge Base

**Feature Branch**: `026-rag-knowledge-base`  
**Created**: 2026-04-04  
**Status**: Draft  
**Input**: User description: "Add a RAG (Retrieval-Augmented Generation) Knowledge Base to the AI Assistant, enabling users to ingest documents, embed them, perform semantic search, and use matched context in AI conversations."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ingest a Document into the Knowledge Base (Priority: P1)

A user has a text document (e.g., pasted content or crawl results) they want the AI to reference later. They navigate to the Knowledge Base tab in AI Assistant, select an embedding endpoint and model, paste or select their content, provide a title and optional source URL, and click "Add to Knowledge Base." The system splits the text into chunks, generates embeddings for each chunk, and stores them. The user sees a success confirmation showing the number of chunks created.

**Why this priority**: Without ingestion, there is no knowledge base to search. This is the foundational capability that all other stories depend on.

**Independent Test**: Can be fully tested by adding a document and verifying it appears in the sources list with correct chunk count. Delivers value by persisting user knowledge for future retrieval.

**Acceptance Scenarios**:

1. **Given** the user is on the Knowledge Base tab with a valid endpoint selected, **When** they paste text content, provide a title, and click "Add to Knowledge Base," **Then** the system chunks the text, embeds each chunk, stores them, and displays a success message with the chunk count.
2. **Given** the user provides a very short document (under one chunk threshold), **When** they ingest it, **Then** the system creates a single chunk and stores it successfully.
3. **Given** the user provides a large document, **When** they ingest it, **Then** the system splits it into multiple overlapping chunks and shows progress or a loading indicator during processing.
4. **Given** the embedding endpoint is unreachable, **When** the user attempts to ingest, **Then** the system displays a clear error message and does not create partial entries.

---

### User Story 2 - Search the Knowledge Base (Priority: P1)

A user wants to find relevant information from their ingested documents. They type a natural-language question in the search panel, select an embedding endpoint/model, and submit. The system embeds the question, compares it against all stored chunks using similarity scoring, and returns the top matching chunks ranked by relevance. Each result shows the chunk text, source title, source URL, and similarity score.

**Why this priority**: Search is the core retrieval capability that makes the knowledge base useful. Without it, ingested documents have no practical value.

**Independent Test**: Can be fully tested by ingesting a document, then searching for a topic it covers, and verifying relevant chunks appear ranked by relevance score.

**Acceptance Scenarios**:

1. **Given** the knowledge base has ingested documents, **When** the user types a question and clicks search, **Then** the system returns the top-K most relevant chunks with source attribution and similarity scores, ordered by relevance.
2. **Given** the knowledge base is empty, **When** the user searches, **Then** the system displays a message indicating no documents have been ingested yet.
3. **Given** the user searches for a topic not covered by any document, **When** results are returned, **Then** the system shows low-scoring results or a "no strong matches found" message.

---

### User Story 3 - View and Manage Knowledge Sources (Priority: P2)

A user wants to see what documents are in their knowledge base. The Knowledge Base tab displays a list of all ingested sources showing title, source URL, chunk count, and date added. This helps users understand what knowledge the system has access to and manage their collection.

**Why this priority**: Source management provides visibility and control. Users need to know what's in their knowledge base to trust search results and decide what else to add.

**Independent Test**: Can be tested by ingesting multiple documents and verifying the sources list accurately reflects all entries with correct metadata.

**Acceptance Scenarios**:

1. **Given** the user has ingested multiple documents, **When** they view the Knowledge Base tab, **Then** they see a list of all sources with title, URL, chunk count, and date added.
2. **Given** no documents have been ingested, **When** the user views the Knowledge Base tab, **Then** they see an empty state with guidance on how to add their first document.

---

### User Story 4 - Use Search Results as AI Chat Context (Priority: P2)

After finding relevant chunks via search, the user wants to ask the AI a follow-up question informed by those results. They click "Ask AI about these results," which sends the matched chunks as context into the AI chat tab, pre-filling or augmenting the conversation so the AI can answer based on the user's own knowledge base.

**Why this priority**: This closes the RAG loop -- retrieval alone is useful, but combining retrieved context with AI generation is the key value proposition of RAG.

**Independent Test**: Can be tested by searching, clicking the "Ask AI" button, and verifying the chat tab opens with the retrieved chunks injected as context.

**Acceptance Scenarios**:

1. **Given** the user has search results displayed, **When** they click "Ask AI about these results," **Then** the system switches to the Chat tab with the top-K chunks injected as context for the AI to reference.
2. **Given** the user has no search results (empty or low-quality), **When** they attempt to ask AI, **Then** the button is disabled or the system warns that no useful context was found.

---

### Edge Cases

- What happens when the user ingests a duplicate document (same title and URL)? The system appends new chunks rather than rejecting, since content may have changed.
- What happens when the embedding model selected for search differs from the model used during ingestion? Results will be meaningless -- the system should warn the user or track which model was used per source.
- What happens when the knowledge base grows very large (thousands of chunks)? Search may become slow -- the system should handle this gracefully with loading indicators.
- What happens when the user's session expires mid-ingestion? The system should not leave partial or corrupt data in storage.
- What happens when text content contains only whitespace or very short text? The system should validate minimum content length before ingestion.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to ingest text content by providing a title, the text body, and an optional source URL.
- **FR-002**: System MUST split ingested text into chunks of approximately 1500 characters with 100-character overlap between consecutive chunks.
- **FR-003**: System MUST generate vector embeddings for each chunk using the user-selected embedding endpoint and model.
- **FR-004**: System MUST store all chunks and their embeddings persistently, scoped to the authenticated user.
- **FR-005**: System MUST store source metadata (title, URL, chunk count, ingestion date) separately for efficient listing.
- **FR-006**: System MUST allow users to search their knowledge base by natural-language question, returning the top-K most similar chunks ranked by relevance score.
- **FR-007**: System MUST embed the search question using the same mechanism as document ingestion, then compute similarity between the question embedding and all stored chunk embeddings.
- **FR-008**: System MUST display search results with chunk text, source title, source URL, and similarity score.
- **FR-009**: System MUST provide a way to send search results as context to the AI chat, enabling retrieval-augmented generation.
- **FR-010**: System MUST display a list of all ingested knowledge sources with title, URL, chunk count, and date.
- **FR-011**: System MUST allow the user to select which embedding endpoint and model to use for both ingestion and search (reusing existing endpoint/model selectors from AI Assistant).
- **FR-012**: System MUST validate that text content is non-empty and meets a minimum length before ingestion.
- **FR-013**: System MUST show appropriate loading states during ingestion (which may take time for large documents) and search operations.
- **FR-014**: System MUST handle embedding endpoint errors gracefully, displaying clear error messages without leaving partial data.
- **FR-015**: System MUST present the Knowledge Base as a new tab within the existing AI Assistant interface.
- **FR-016**: All user-facing text MUST be internationalized (available in English, Spanish, and Chinese).

### Key Entities

- **Knowledge Chunk**: A segment of ingested text with its vector embedding. Attributes: unique identifier, text content, source title, source URL, embedding vector.
- **Knowledge Source**: Metadata about an ingested document. Attributes: title, source URL, number of chunks, date added. One source corresponds to many chunks.
- **Search Result**: A knowledge chunk returned from a search query, augmented with a similarity score indicating relevance to the question.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can ingest a document of up to 50,000 characters and receive confirmation within 60 seconds.
- **SC-002**: Users can search their knowledge base and see ranked results within 5 seconds for a knowledge base of up to 1,000 chunks.
- **SC-003**: Search results for a question about an ingested topic return at least one highly relevant chunk in the top 3 results (measured by the chunk containing key terms from the ingested source).
- **SC-004**: Users can complete the full RAG workflow (ingest a document, search it, send results to AI chat) in under 3 minutes on first use.
- **SC-005**: The Knowledge Base tab is discoverable -- users can find and navigate to it without external guidance.
- **SC-006**: All UI elements in the Knowledge Base tab are available in all 3 supported languages.
- **SC-007**: The system handles error states (endpoint down, empty content, network issues) without data loss or corruption in 100% of cases.

## Assumptions

- Users have at least one configured Ollama endpoint with an embedding model (e.g., nomic-embed-text) available. The existing AI Assistant endpoint configuration is reused.
- Embedding dimensions are consistent within a model -- all chunks embedded with the same model produce vectors of equal length, enabling direct similarity comparison.
- The knowledge base is per-user and private. There is no sharing of knowledge bases between users.
- Dot product is used for similarity scoring, which equals cosine similarity when embeddings are normalized (as with nomic-embed-text).
- The "pick from crawl results" option in the ingest panel refers to reusing content from the existing AI Assistant's web crawl feature, if available.
- Default top-K value for search is 5 results, which can be adjusted by the user.
- Chunk overlap (100 characters) ensures context continuity at chunk boundaries without requiring the user to configure it.

## Scope Boundaries

**In scope**:
- Document ingestion via pasted text or crawl results
- Chunk-based text splitting with overlap
- Vector embedding generation via user-selected Ollama endpoint
- Semantic similarity search over stored embeddings
- Source metadata listing
- Piping search results into AI chat as context
- Internationalization (en/es/zh)

**Out of scope**:
- Direct file upload (PDF, DOCX, etc.) -- only plain text ingestion
- Automatic re-embedding when switching models
- Deleting individual chunks or sources from the knowledge base
- Sharing knowledge bases between users
- Scheduled or automatic re-ingestion of URLs
- Fine-tuning or training custom embedding models
