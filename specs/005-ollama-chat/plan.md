# Implementation Plan: Ollama Chat Enhancement

**Branch**: `005-ollama-chat` | **Date**: 2026-03-19 | **Spec**: specs/005-ollama-chat/spec.md
**Input**: Feature specification from `/specs/005-ollama-chat/spec.md`

## Summary

The AI Assistant MFE (`packages/ai-assistant`) already provides complete Ollama streaming, typewriter UX, per-user endpoint management, model selection, tool calling, and an abort/retry flow. Cross-referencing the spec against the codebase identified **three rendering gaps** in the existing implementation. This plan closes them with minimal changes to two existing files:

1. **`<think>` tag stripping** — server-side buffer in `aiChat.ts` detects complete `<think>...</think>` blocks in the Ollama delta stream and routes them to `thinking` SSE events instead of leaking raw tags into response text.
2. **Markdown heading rendering** — `MarkdownText.tsx` gains `#`, `##`, `###` detection in the line-by-line stage.
3. **Markdown table rendering** — `MarkdownText.tsx` gains a table-splitting stage inserted between the existing code-block split and line-by-line processing.

No new MFE package, no GraphQL schema changes, no new i18n keys, no new shared exports.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18 (same as existing `ai-assistant` MFE)
**Primary Dependencies**: `packages/ai-assistant` (existing MFE), `functions/src/handlers/aiChat.ts` (existing SSE stream handler), `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys) — no new dependencies
**Storage**: No new storage — all state managed by existing hooks
**Testing**: Vitest + React Testing Library — existing test infrastructure in `packages/ai-assistant/src/components/` and `hooks/`
**Target Platform**: Web (same as existing AI Assistant MFE)
**Performance Goals**: `<think>` buffer processing < 1 ms per delta; heading/table rendering < 16 ms per render pass
**Constraints**:
- No new npm packages (pure Tailwind + React JSX for table/heading rendering)
- `<think>` stripping is server-only (SSE handler) — GraphQL fallback path is out of scope
- Partial table during streaming must not crash render — fallback to plain text for incomplete rows
- All new Tailwind classes must have `dark:` variants
**Scale/Scope**: 2 files modified, ~120 lines net added — no new components, hooks, or packages

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | All changes inside existing `ai-assistant` MFE components and existing Cloud Function handler — no new singleton imports, no new `@apollo/client` usage |
| II. Complete Integration | ✅ PASS | Enhancing existing MFE — no new package, no new integration touchpoints required (routes, nav, widgets, i18n keys, Dockerfile all unchanged) |
| III. GraphQL-First | ✅ PASS | `<think>` stripping is inside the existing SSE stream handler (not a new REST endpoint). `MarkdownText.tsx` is pure React UI with zero data layer. No schema changes required. |
| IV. Inclusive by Default | ✅ PASS | No new i18n keys needed — existing `ai.thinking` key reused for reasoning panel label. All new Tailwind classes carry `dark:` variants. Heading elements use semantic HTML (`<h1>`–`<h3>`). Table uses `<table>`/`<thead>`/`<tbody>`/`<th>`/`<td>` for accessibility. |
| V. Fast Tests, Safe Code | ✅ PASS | Server parses model output, not user input — no SSRF or XSS surface. Tests mock SSE streams using existing `createMockSSEStream` helper. No assertion timeouts > 5000 ms. |
| VI. Simplicity | ✅ PASS | Minimum viable change: two existing files extended, no new abstractions. Three similar rendering patterns (headings h1/h2/h3) are better expressed as a data-driven loop than a premature helper. |

**Post-design re-check**: All gates pass. No Complexity Tracking needed.

---

## Existing Implementation Validation

The following capabilities are **already complete** in `packages/ai-assistant` and require no changes:

| Capability | Location | Status |
|-----------|----------|--------|
| SSE streaming (token-by-token) | `hooks/useAiChatStream.ts` | ✅ Complete |
| Typewriter word-by-word (GraphQL fallback) | `hooks/useTypewriter.ts` | ✅ Complete |
| Blinking cursor during streaming | `components/ChatMessage.tsx:80-82` | ✅ Complete |
| Per-user Ollama endpoint management | `components/AiAssistant.tsx` + Firestore | ✅ Complete |
| Model selection per endpoint | `components/AiAssistant.tsx:50-97` | ✅ Complete |
| Tool calling while streaming | `handlers/aiChat.ts:758-837` | ✅ Complete |
| Thinking steps for tool execution | `useAiChatStream.ts:130-134` + `AiAssistant.tsx:347-398` | ✅ Complete |
| Chat history (localStorage, 50 msg) | `hooks/useAiChatWithStreaming.ts:66-82` | ✅ Complete |
| Abort (Escape + ■ button) | `AiAssistant.tsx:100-111`, `443-455` | ✅ Complete |
| GraphQL fallback when stream unavailable | `useAiChatWithStreaming.ts:241-275` | ✅ Complete |
| Monitor tab (Ollama status, charts) | `components/AiMonitor.tsx` | ✅ Complete |
| Markdown: code blocks, lists, bold, italic, inline code | `components/MarkdownText.tsx` | ✅ Complete |

**Gaps closed by this plan**:

| Gap | Affected File(s) | User Story |
|----|-----------------|-----------|
| `<think>` tags appear raw in chat bubble | `functions/src/handlers/aiChat.ts` | US1 |
| `#`/`##`/`###` headings render as plain text | `packages/ai-assistant/src/components/MarkdownText.tsx` | US2 |
| `\| col \|` tables render as raw characters | `packages/ai-assistant/src/components/MarkdownText.tsx` | US3 |

---

## Project Structure

### Documentation (this feature)

```text
specs/005-ollama-chat/
├── plan.md              # This file
├── spec.md              # User stories (US1–US3)
├── research.md          # Phase 0 decisions
├── data-model.md        # Phase 1 entities (SSE event shapes, MarkdownText segments)
├── quickstart.md        # Dev setup + manual testing scenarios
├── contracts/
│   └── streaming-api.md # SSE event contract + MarkdownText segment model
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
functions/src/handlers/
└── aiChat.ts                      # MODIFIED — US1: add thinkBuffer inside Ollama streaming
                                   #   path; detect complete <think>...</think> blocks;
                                   #   emit sendEvent('thinking', ...) for inner content;
                                   #   emit sendEvent('text', ...) only for outer content

packages/ai-assistant/src/components/
└── MarkdownText.tsx               # MODIFIED — US2 + US3:
                                   #   US2: add heading detection in line-by-line Stage 2
                                   #   US3: add table split + renderTable() before Stage 2
└── MarkdownText.test.tsx          # MODIFIED — extend existing tests for headings + tables
                                   #   (streaming partial table safety test included)

# All other files unchanged:
packages/ai-assistant/src/hooks/
└── useAiChatStream.ts             # UNCHANGED — already handles 'thinking' events correctly
└── useAiChatWithStreaming.ts      # UNCHANGED
└── useTypewriter.ts               # UNCHANGED
packages/ai-assistant/src/components/
└── AiAssistant.tsx                # UNCHANGED — already renders thinkingSteps panel
└── ChatMessage.tsx                # UNCHANGED — already passes streaming prop to MarkdownText
```

**Structure Decision**: Enhancement to two existing files. No new components, hooks, packages, or GraphQL schema changes. The `thinking` SSE event type already exists in `StreamEvent` (defined in `useAiChatStream.ts:5`) — the server simply begins emitting it for model-level `<think>` tags, which the client already handles identically to tool thinking steps.

---

## Implementation Notes

### US1 — `<think>` Tag Stripping (Server Side)

**Location**: `functions/src/handlers/aiChat.ts`, inside the Ollama streaming path (around line 760).

**Algorithm**:
1. Introduce a `thinkBuffer: string` variable initialized to `''` before the `for await (chunk of stream)` loop.
2. On each `delta.content` chunk, append to `thinkBuffer` instead of immediately emitting.
3. After appending, extract complete `<think>...</think>` blocks:
   ```
   while thinkBuffer contains a complete <think>...</think> match:
     - emit sendEvent('thinking', { content: match[1] })   // inner text
     - replace the matched block from thinkBuffer with ''
   ```
4. Extract any leading text that precedes the next `<think>` opening (safe to emit as `text`):
   ```
   if thinkBuffer has no opening '<think>':
     emit sendEvent('text', { content: thinkBuffer })
     thinkBuffer = ''
   elif thinkBuffer has content before the first '<think>':
     emit sendEvent('text', { content: content_before_think })
     thinkBuffer = '<think>' + rest
   // else: partial tag in buffer — wait for more chunks
   ```
5. On stream end: flush any remaining `thinkBuffer` content as a `text` event (handles unclosed `<think>` gracefully — the reasoning shows as visible text rather than being silently dropped).

**Why server-side** (not client-side): Consistent with the existing tool-call delta buffering pattern; the server already uses `toolCallBuffers` to assemble split function-call arguments across chunks. Adding `thinkBuffer` follows the identical pattern. Client-side would require adding regex parsing to `useAiChatStream.ts` and managing state in a second buffer — more fragile and harder to test.

**Edge cases**:
- Split `<think>` across chunks: handled — buffer accumulates until `</think>` is found
- Unclosed `<think>` at stream end: flush as `text` (content visible, not silently dropped)
- Multiple `<think>` blocks in one response: each detected separately in the while-loop
- No `<think>` tags: zero overhead — `thinkBuffer` fills and flushes at stream end identically to current behaviour

### US2 — Heading Rendering (Client Side)

**Location**: `MarkdownText.tsx`, Stage 2 line-by-line renderer (around line 48).

**Algorithm**: Before the existing bullet/numbered list checks, add:
```typescript
// Headings: #, ##, ### (ATX-style only, space required)
const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
if (headingMatch) {
  const level = headingMatch[1].length; // 1, 2, or 3
  const text = headingMatch[2];
  // h1: text-xl font-bold, h2: text-lg font-semibold, h3: text-base font-semibold
  const classMap = ['text-xl font-bold', 'text-lg font-semibold', 'text-base font-semibold'];
  return (
    <div key={j} className={`mt-3 mb-1 text-gray-900 dark:text-gray-100 ${classMap[level - 1]}`}>
      {renderInline(text)}
    </div>
  );
}
```

This runs **inside** the existing text-segment loop, so heading detection only applies to non-code-block text — correct behaviour.

### US3 — Table Rendering (Client Side)

**Location**: `MarkdownText.tsx`, new Stage 1.5 inserted between code-block split and line-by-line processing.

**Algorithm**:
1. After the code-block `processedContent.split(/(```[\s\S]*?```)/g)`, map over each non-code-block segment and further split by markdown table blocks:
   ```typescript
   // Table block pattern: ≥2 consecutive pipe-delimited lines
   const TABLE_PATTERN = /((?:\|[^\n]+\|\n?){2,})/g;
   // Flatten: each segment is either a code block, a table block, or plain text
   ```
2. In the render loop, add a table case **before** the existing code-block check:
   ```typescript
   if (isMarkdownTable(segment)) return renderMarkdownTable(segment, i);
   ```
3. `isMarkdownTable`: returns `true` if the first line contains `|`, second line matches `/^\|[\s\-:\s|]+\|$/` (separator row), and there is at least one data row.
4. `renderMarkdownTable`: parses header cells from line 0, skips the separator (line 1), renders data rows from line 2+. Uses `overflow-x-auto` wrapper for mobile. Uses `renderInline()` for cell content so bold/italic inside cells still works.

**Streaming safety**: During streaming a table may arrive incomplete. The `isMarkdownTable` guard requires a separator row (line 1 must match `|---|`). An incomplete table (no separator yet) is NOT detected as a table — it falls through to plain text rendering. This means partial table content during streaming renders as pipe-separated text rather than crashing. Once the stream finalises and the full table is present, it renders correctly in the final message.

---

## Complexity Tracking

> No constitution violations — table omitted.
