# Research: Ollama Chat Enhancement

**Branch**: `005-ollama-chat` | **Date**: 2026-03-19

---

## Decision 1 — `<think>` Tag Parsing: Server vs Client

**Decision**: Parse and strip `<think>...</think>` tags **server-side** inside `functions/src/handlers/aiChat.ts`.

**Rationale**:
- The server already uses a `toolCallBuffers` map to assemble split tool-call argument deltas across chunks (`aiChat.ts:758`). Adding a `thinkBuffer` string follows the identical delta-accumulation pattern.
- The client (`useAiChatStream.ts`) already handles `thinking` SSE events correctly (lines 130–134 route them to `thinkingSteps`, which the `AiAssistant.tsx` renders in the collapsible panel at lines 347–398). Zero client changes are needed.
- Server parsing eliminates a class of client-side edge case: if a `<think>` tag spans two SSE `data:` lines, the client-side SSE line parser would need to manage an additional buffer independent of the line buffer — adding fragile statefulness to the already-clean event switch.

**Alternatives considered**:
- **Client-side in `useAiChatStream.ts`**: Would require a secondary buffer inside the `text` event handler and new state routing logic. Rejected — adds complexity to the client for no benefit over the equivalent server buffer.
- **Client-side in `ChatMessage.tsx`**: Post-hoc regex over the final `message.content` to extract `<think>` blocks. Rejected — doesn't work for streaming (content arrives incrementally), and replacing tags after-the-fact would cause a visible flicker as `<think>...` appears then disappears.
- **GraphQL fallback handling**: Extending the non-stream `aiChat` GraphQL resolver to also strip `<think>` tags. Deferred — out of scope per spec. The full response text in GraphQL could be stripped with a simple regex, but the spec explicitly limits US1 to the streaming path.

---

## Decision 2 — `<think>` Unclosed Tag Behaviour

**Decision**: Flush any content remaining in `thinkBuffer` at stream end as a **`text` event** (not silently dropped, not as a `thinking` event).

**Rationale**: If a model starts a `<think>` block but never closes it (stream ends or is aborted mid-thinking), the user should still see the partial content rather than having it silently discarded. Emitting it as `text` is the safe default — the raw `<think>` prefix is already stripped since the buffer accumulation strips it on entry.

**Alternatives considered**:
- **Emit as `thinking` event**: The content could be shown in the reasoning panel. Rejected — without a closing `</think>` we cannot be confident the entire block is reasoning vs. accidentally unclosed markup. Showing it as plain text preserves the content safely.
- **Silently drop**: Rejected — information loss; could hide useful model output.

---

## Decision 3 — Markdown Heading Scope (ATX-style only)

**Decision**: Support only ATX-style headings (`# Heading`, `## Heading`, `### Heading`) — not Setext-style (`Heading\n======` or `Heading\n------`).

**Rationale**: ATX-style headings (`#` prefix) are by far the most common format in AI model output. Setext-style is rare in generated text and would require multi-line lookahead logic that conflicts with the existing line-by-line processing model. The simplest implementation handles 99% of real AI responses.

**Alternatives considered**:
- **Setext-style too**: Rejected — requires state across lines (detect if the next line is `===` or `---`). Conflicts with the `MarkdownText` single-pass line iterator. Would add complexity for < 1% of real-world output.
- **Only `##` and `###` (skip `h1`)**: Rejected — AI often uses `#` for document-level titles. All three levels needed.

---

## Decision 4 — Table Streaming Safety (Partial Tables)

**Decision**: Use the **separator row (`|---|`) as the detection gate**. A markdown table is only recognised if it has at least two pipe-containing lines where the second line matches `/^\|[\s\-:\s|]+\|$/`. During streaming, until the separator row arrives, the content falls through to plain-text rendering.

**Rationale**: The separator row is the canonical Markdown table delimiter. Requiring it means:
- Partial first rows during streaming (incomplete line, no separator yet) are treated as plain text — no layout crash.
- Once the separator arrives (the full header + separator exist in the final rendered message), the table renders correctly.
- The gate is cheap — two `includes('|')` checks per text segment.

**Alternatives considered**:
- **Detect table by first pipe character only**: Would misfire on non-table content containing pipes (e.g. `PATH=/usr/bin:/usr/local/bin`). Rejected.
- **Buffer complete tables client-side before rendering**: Would delay streaming feedback. Rejected — the streaming state renders immediately, the final state renders with the table.

---

## Decision 5 — Table Cell Content: `renderInline()` Reuse

**Decision**: Table cell content is processed with the existing `renderInline()` helper from `MarkdownText.tsx`, enabling **bold, italic, and inline code** inside table cells.

**Rationale**: `renderInline()` is already an exported function within the module. Reusing it for table cells costs nothing and makes tables consistent with the rest of the markdown renderer (e.g. `| **bold** | *italic* |` just works).

**Alternatives considered**:
- **Plain text cells only**: Simpler but would force cell content to be raw strings even when AI-generated tables use formatting. Rejected — no additional complexity to reuse `renderInline`.

---

## Decision 6 — `MarkdownText` Table Architecture: Stage 1.5

**Decision**: Insert table splitting as **Stage 1.5** — after the code-block regex split, before the line-by-line text processing.

**Rationale**: This preserves the existing two-stage pipeline and requires no refactoring of existing code paths. Table blocks are block-level elements (like code blocks) and must be extracted before line-by-line processing would break them. The insertion point is clean: map over non-code-block segments, split by table pattern, flatten, then render with a new `isMarkdownTable` guard in the switch.

**Alternatives considered**:
- **Multi-pass regex over full content before code-block split**: Would interfere with code blocks that contain pipe characters (e.g. a code example of a CSV file). Rejected.
- **New `processSegment()` abstraction**: A recursive helper. Rejected — three similar block types (code, table, text) do not warrant a recursive abstraction. The flat switch is readable.
