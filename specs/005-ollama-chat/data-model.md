# Data Model: Ollama Chat Enhancement

**Branch**: `005-ollama-chat` | **Date**: 2026-03-19

This feature modifies two existing data representations — the SSE event stream contract and the `MarkdownText` segment model — without adding any new storage entities.

---

## Entity 1 — SSE StreamEvent (Modified)

**Location**: `packages/ai-assistant/src/hooks/useAiChatStream.ts` (existing `StreamEvent` interface)

The `StreamEvent.type` union gains no new members — the `'thinking'` variant already exists. The change is that the server now **emits `thinking` events for model-level `<think>` content** in addition to the existing tool-step thinking events.

```typescript
interface StreamEvent {
  type: 'text' | 'thinking' | 'tool_start' | 'tool_result' | 'done' | 'error';
  content?: string;   // present for 'text' and 'thinking'
  name?: string;      // present for 'tool_start', 'tool_result'
  args?: Record<string, unknown>;  // present for 'tool_start', 'tool_result'
  result?: string;    // present for 'tool_result'
  message?: string;   // present for 'error'
  metadata?: { ... }; // present for 'done'
}
```

**What changes**: The server-side `aiChat.ts` streaming handler gains a `thinkBuffer: string` that intercepts `<think>...</think>` blocks in Ollama delta content and routes them to `type: 'thinking'` events. The client already handles `'thinking'` events identically regardless of origin (tool vs. model).

### Think-Buffer State Machine

```
State: OUTSIDE_THINK | INSIDE_THINK
Initial: OUTSIDE_THINK

On each delta.content chunk:
  Append chunk to thinkBuffer

  Loop while thinkBuffer has complete <think>...</think>:
    Emit: thinking event with inner content
    Remove matched block from thinkBuffer

  If OUTSIDE_THINK (no remaining '<think>' in buffer):
    Emit: text event with thinkBuffer content
    Reset thinkBuffer = ''

  Elif buffer has leading text before next '<think>':
    Emit: text event with pre-think content
    thinkBuffer = '<think>' + remaining

  Else: buffer contains partial '<think...' prefix — wait for next chunk

On stream end:
  If thinkBuffer non-empty:
    Emit: text event with thinkBuffer (unclosed tag — safe fallback)
    Reset thinkBuffer = ''
```

---

## Entity 2 — MarkdownText Segment (Modified)

**Location**: `packages/ai-assistant/src/components/MarkdownText.tsx`

The current rendering pipeline processes text in two stages. This feature adds a Stage 1.5 for tables.

### Current Segment Types

| Segment Type | Detection | Renderer |
|-------------|-----------|---------|
| CodeBlock | `segment.startsWith('```') && segment.endsWith('```')` | `<pre><code>` |
| PlainText | Everything else | Line-by-line with inline formatting |

### New Segment Types (Post-Enhancement)

| Segment Type | Detection | Renderer |
|-------------|-----------|---------|
| CodeBlock | Same as above | Same as above (unchanged) |
| **MarkdownTable** | **`isMarkdownTable(segment)` — requires separator row** | **`renderMarkdownTable(segment, key)`** |
| PlainText | Everything else | Line-by-line with inline formatting (unchanged) |

### New Line Types Within PlainText (Post-Enhancement)

| Line Type | Detection | Renderer |
|----------|-----------|---------|
| Heading h1 | `/^#\s+.+/` | `<div className="text-xl font-bold ...">` |
| Heading h2 | `/^##\s+.+/` | `<div className="text-lg font-semibold ...">` |
| Heading h3 | `/^###\s+.+/` | `<div className="text-base font-semibold ...">` |
| Bullet | `/^[-*]\s+/` (existing) | `<div className="flex gap-1.5 ml-2">` (unchanged) |
| Numbered | `/^\d+[.)]\s+/` (existing) | `<div className="flex gap-1.5 ml-2">` (unchanged) |
| Empty | `trimmed === ''` (existing) | `<div className="h-2">` (unchanged) |
| Paragraph | default (existing) | `<React.Fragment>` (unchanged) |

> **Detection priority order** (headings checked FIRST to avoid conflict with `#` at start of bullet items):
> `heading (#/##/###)` → `bullet (- *)` → `numbered (1.)` → `empty` → `paragraph`

### Table Entity

```typescript
// Parsed representation (internal to renderMarkdownTable)
interface MarkdownTableData {
  headers: string[];       // Cells from row 0
  separator: string[];     // Cells from row 1 (e.g. ["---", ":---:", "---:"])
  rows: string[][];        // Cells from rows 2+
}
```

**Streaming behaviour**: An incomplete table (no separator row yet) is **not** detected as a `MarkdownTable` segment — it renders as `PlainText`. Once the stream completes and the final `ChatMessage` is committed to `messages[]`, the full table renders correctly. This means there is a brief period during streaming where a growing table renders as pipe-separated plain text, then snaps to a styled table when the message is committed. This is acceptable and consistent with how code blocks behave during streaming (closing ` ``` ` may not yet have arrived).

---

## State Flow: No New State

No new React state, localStorage keys, Firestore fields, or GraphQL types are introduced. The existing `thinkingSteps: string[]` in `StreamState` (from `useAiChatStream.ts`) accumulates model reasoning steps alongside tool-step reasoning without any modification.

```
Existing state (unchanged):
StreamState {
  streaming: boolean
  activeToolCalls: ActiveToolCall[]
  streamingContent: string          ← receives only non-think text
  thinkingSteps: string[]           ← receives both tool + model <think> content
}
```
