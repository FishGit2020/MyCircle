# Contract: SSE Streaming API & MarkdownText Segment Model

**Branch**: `005-ollama-chat` | **Date**: 2026-03-19

---

## SSE Streaming Endpoint

### Endpoint

```
POST /ai/chat/stream
```

**Auth**: `Authorization: Bearer <firebaseIdToken>` (required)
**Optional**: `x-recaptcha-token: <token>`

### Request Body

```typescript
{
  message: string;          // User's input
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  context: Record<string, unknown>;  // User context (watchlist, cities, etc.)
  model?: string;           // Ollama model name (e.g. "deepseek-r1:8b")
  endpointId?: string;      // Firestore ID of user's benchmarkEndpoint
  toolMode?: string;        // "native" | "mcp" | undefined
}
```

### Response: Server-Sent Events

Each event is prefixed with `data: ` and contains a JSON payload on a single line, followed by `\n\n`.

#### Event Types (unchanged from existing contract)

| `type` | When emitted | Payload fields |
|--------|-------------|----------------|
| `text` | Each text token from the model | `content: string` |
| `thinking` | **Model `<think>` block** (NEW) or tool execution step | `content: string` |
| `tool_start` | Tool call begins | `name: string`, `args: object` |
| `tool_result` | Tool call completes | `name: string`, `result: string` |
| `done` | Stream complete | `metadata: { provider, model, tokens, latencyMs, actions? }` |
| `error` | Stream error | `message: string` |

#### `thinking` event — extended behaviour (US1)

**Before this feature**: `thinking` events were emitted only during tool execution steps (e.g. "Looking up weather..." before calling `getWeather`).

**After this feature**: `thinking` events are **also** emitted when the Ollama model emits `<think>...</think>` blocks in its text output. The `content` field contains the text inside the tags. The `text` event stream contains only the visible response (tags stripped). The client receives both types identically — no client changes required.

**Example SSE sequence for a DeepSeek R1 response**:
```
data: {"type":"thinking","content":"The user is asking about the weather. I should use the getWeather tool..."}

data: {"type":"text","content":"Let me "}

data: {"type":"text","content":"check the weather for you."}

data: {"type":"tool_start","name":"getWeather","args":{"location":"New York"}}

data: {"type":"thinking","content":"Fetching weather data..."}

data: {"type":"tool_result","name":"getWeather","result":"{\"temp\":72,\"condition\":\"Sunny\"}"}

data: {"type":"text","content":"It's currently 72°F and sunny in New York."}

data: {"type":"done","metadata":{"provider":"ollama","model":"deepseek-r1:8b","tokens":{"input":150,"output":45},"latencyMs":1234}}
```

#### Error Scenario: Unclosed `<think>` tag

If the stream ends with an unclosed `<think>` block, the buffer content is emitted as a final `text` event (not silently dropped, not emitted as `thinking`):

```
data: {"type":"text","content":"Here is my analysis: (reasoning content here)"}
data: {"type":"done",...}
```

---

## MarkdownText Segment Contract

### Segment Priority (evaluation order)

```
Input: string
  ↓
Stage 1: Split by code blocks  (```...```)
  ↓ → CodeBlock segments → render as <pre><code>
  ↓ → Text segments continue ↓
Stage 1.5: Split text segments by markdown tables (|...|  NEW)
  ↓ → Table segments → render as <table> (NEW)
  ↓ → Plain text segments continue ↓
Stage 2: Line-by-line processing
  For each line (priority order):
    1. Heading (#/##/###)    → <div> with heading class  (NEW)
    2. Bullet (- or *)       → <div className="flex gap-1.5 ml-2">
    3. Numbered (1. or 1))   → <div className="flex gap-1.5 ml-2">
    4. Empty                 → <div className="h-2">
    5. Paragraph             → renderInline(line)
```

### Heading Styles

| Markdown | HTML Role | Tailwind Classes |
|----------|-----------|-----------------|
| `# Text` | h1-equivalent | `text-xl font-bold mt-3 mb-1 text-gray-900 dark:text-gray-100` |
| `## Text` | h2-equivalent | `text-lg font-semibold mt-3 mb-1 text-gray-900 dark:text-gray-100` |
| `### Text` | h3-equivalent | `text-base font-semibold mt-2 mb-1 text-gray-900 dark:text-gray-100` |

All headings are `<div>` (not `<h1>`–`<h3>`) to avoid conflicting with any host page heading hierarchy. `renderInline()` is applied so bold/italic in headings works.

### Table Styles

```
Wrapper:   <div className="overflow-x-auto my-2">
Table:     <table className="w-full text-sm border-collapse">
Header:    <thead>
  Row:     <tr>
  Cell:    <th className="text-left px-3 py-2 font-semibold bg-gray-100 dark:bg-gray-700
                          border border-gray-300 dark:border-gray-600
                          text-gray-700 dark:text-gray-200">
Body:      <tbody>
  Row:     <tr className="even:bg-gray-50 dark:even:bg-gray-800/50">
  Cell:    <td className="px-3 py-2 border border-gray-300 dark:border-gray-600
                          text-gray-700 dark:text-gray-300">
```

Cell content is processed with `renderInline()` (bold, italic, inline code inside cells work).

### Table Detection

```typescript
function isMarkdownTable(text: string): boolean {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;
  if (!lines[0].includes('|')) return false;
  // Separator row: only pipes, dashes, colons, spaces
  return /^\|[\s\-:|]+\|$/.test(lines[1].trim());
}
```

### Streaming Safety

During active streaming, `streamingContent` is passed to `<ChatMessage streaming={true}>` which passes it to `<MarkdownText streaming={true}>`. The `streaming` prop activates the existing unclosed code-block fix (`appendClosingBackticks`). For tables, the `isMarkdownTable` guard requires the separator row — an incomplete table (separator not yet received) falls through to plain-text rendering, preventing layout crashes.

### `renderInline()` Contract (existing, unchanged)

Processes a single line and returns `React.ReactNode`. Handles:
- `` `code` `` → `<code className="px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-sm font-mono">`
- `**bold**` → `<strong>`
- `*italic*` → `<em>`
- Plain text → string literal
