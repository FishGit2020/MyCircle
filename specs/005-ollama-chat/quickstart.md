# Quickstart: Ollama Chat Enhancement

**Branch**: `005-ollama-chat` | **Date**: 2026-03-19

---

## Prerequisites

1. **Local Ollama** running with a reasoning model:
   ```bash
   ollama pull deepseek-r1:8b
   ollama serve
   ```
   Or any Cloudflare-tunneled Ollama endpoint already configured in AI Assistant.

2. **Dev stack** running:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` → navigate to **AI Assistant**.

3. **Reasoning model selected** in the AI Assistant endpoint dropdown (e.g. `deepseek-r1:8b`).

---

## Scenario A — US1: `<think>` Tag Stripping

**Goal**: Verify that DeepSeek R1 reasoning content is routed to the collapsible Reasoning panel, not the chat bubble.

**Steps**:
1. In AI Assistant, select a DeepSeek R1 or Qwen3-thinking model.
2. Send: `"What is 17 × 23? Show your work."`
3. Watch the streaming response.

**Expected**:
- The chat bubble shows only the final answer (e.g. `"17 × 23 = 391"`).
- No `<think>` or `</think>` text appears anywhere in the chat bubble.
- A collapsible **Reasoning** panel (▸ icon) appears above or within the response showing the stripped reasoning steps.
- Expanding the panel shows the model's internal reasoning (e.g. `"Let me compute 17 × 23..."`).

**Failure indicators**:
- Raw `<think>Let me...` text appears in the chat bubble — `thinkBuffer` not intercepting.
- Reasoning panel does not appear — `thinking` SSE events not emitted.
- Partial tag like `<think>` appears at sentence start — chunk boundary not buffered.

---

## Scenario B — US1: Unclosed `<think>` Edge Case

**Goal**: Verify graceful handling when a model starts `<think>` but the stream ends without `</think>`.

**Steps** (unit test covers this; manual confirmation via server logs):
1. Open browser DevTools → Network tab → filter for `stream`.
2. Send a short prompt to a model known to sometimes abort mid-reasoning.
3. Kill the Ollama process mid-stream (`Ctrl+C` in terminal running `ollama serve`).

**Expected**:
- The partial reasoning content appears in the **chat bubble** (not silently dropped).
- No JavaScript errors in the console.
- The stream terminates cleanly with the abort UI (⬛ button disappears, retry button appears).

---

## Scenario C — US2: Markdown Heading Rendering

**Goal**: Verify `#`, `##`, `###` headings render as styled heading elements.

**Steps**:
1. In AI Assistant (any model), send:
   ```
   Give me a guide to setting up Ollama with 3 sections using # headings
   ```
2. Wait for the full response.

**Expected**:
- Lines starting with `# ` render as large bold text (h1-equivalent, `text-xl font-bold`).
- Lines starting with `## ` render as medium bold text (h2-equivalent, `text-lg font-semibold`).
- Lines starting with `### ` render as small bold text (h3-equivalent, `text-base font-semibold`).
- No `#` prefix character is visible in the rendered output.
- In dark mode (toggle via profile menu), heading text uses the `dark:text-gray-100` variant.

**Failure indicators**:
- `# My Heading` appears as plain text with a `#` character — heading regex not matching.
- Headings appear but `#` char is still visible — text extraction wrong.
- Dark mode shows invisible heading text — missing `dark:` variant.

---

## Scenario D — US3: Markdown Table Rendering

**Goal**: Verify pipe-delimited tables render as styled grid tables.

**Steps**:
1. In AI Assistant (any model), send:
   ```
   Compare Llama 3 and Mistral 7B in a markdown table with columns: Model, Size, Speed, Best For
   ```
2. Wait for the full response.

**Expected**:
- A proper table renders with a styled header row (gray background, bold text).
- Data rows alternate with subtle striping (`even:bg-gray-50 dark:even:bg-gray-800/50`).
- All borders are visible (`border border-gray-300 dark:border-gray-600`).
- Table scrolls horizontally on narrow viewports (wrapped in `overflow-x-auto`).
- Cell content with inline formatting (e.g. `**fast**`) renders as bold.

**Failure indicators**:
- Raw `| Model | Size |` pipe characters appear — table not detected.
- Table renders but overflows container on mobile — missing `overflow-x-auto`.
- Dark mode: table borders invisible or header background not themed.
- Bold in cells not rendered — `renderInline()` not applied to cell content.

---

## Scenario E — US3: Partial Table During Streaming

**Goal**: Verify that an incomplete table (header row arrived, separator not yet) does not crash rendering.

**Steps**:
1. Ask for a large table (many rows) and watch the streaming animation.
2. Observe the content as it streams token-by-token.

**Expected**:
- While the table is still streaming (separator row `|---|` not yet received), the content renders as pipe-separated plain text — no crash, no layout jump.
- Once streaming completes and the final message is committed, the full table renders correctly.

**Failure indicators**:
- React error or white screen during streaming — `isMarkdownTable` guard not protecting.
- Table renders correctly during streaming but breaks after — state management issue.

---

## Unit Test Smoke Check

After implementation, confirm test suite passes:

```bash
pnpm --filter @mycircle/ai-assistant test:run
```

Key test file: `packages/ai-assistant/src/components/MarkdownText.test.tsx`

Expected: all heading tests (h1/h2/h3), table tests, streaming partial-table safety test, and existing tests all pass.

For server-side changes:
```bash
cd functions && npx tsc --noEmit
```

---

## Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `<think>` still in chat bubble | `thinkBuffer` not wired in `aiChat.ts` | Check the Ollama streaming path (~line 760) |
| Reasoning panel missing | `thinking` SSE event not emitted | Verify `sendEvent('thinking', ...)` call |
| `#` heading renders as plain text | `headingMatch` regex not running before bullet check | Confirm detection order in Stage 2 loop |
| Table shows as pipes | `isMarkdownTable` returning false | Log `lines[1]` — separator regex may not match |
| Table crashes during stream | `isMarkdownTable` called on incomplete segment | Verify separator row check comes before rendering |
| Dark mode headings invisible | Missing `dark:text-gray-100` class | Add `dark:` variant to heading `classMap` entries |
