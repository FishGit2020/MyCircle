# Feature Specification: Ollama Chat Enhancement

**Feature Branch**: `005-ollama-chat`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Chat with self-hosted Ollama model, stream response or typewriter UX render on chat. validate your plan with existed MFE and improve it for the missing parts."

## Context

The AI Assistant MFE (`packages/ai-assistant`) already provides:
- Real-time SSE streaming from self-hosted Ollama endpoints (token-by-token delivery)
- Word-by-word typewriter effect for non-streamed (GraphQL fallback) responses
- Per-user Ollama endpoint management (Cloudflare-tunneled URLs, CF Access credentials)
- Model selection per endpoint, tool calling, thinking steps for tool execution, abort/retry, chat history, and a Monitor tab

**What is missing** — three rendering gaps discovered by cross-referencing the spec against the existing implementation:

1. **Reasoning model `<think>` tag handling** — Models like DeepSeek R1 and Qwen3 emit raw `<think>reasoning steps...</think>` blocks inside their text stream. These tags pass through unfiltered and appear verbatim in chat bubbles (e.g. `<think>Let me consider this...`), which is confusing and noisy for users.

2. **Markdown heading rendering** — The `MarkdownText` component handles code blocks, lists, bold, italic, and inline code, but not headings. AI responses that use `# Title`, `## Section`, or `### Subsection` syntax render as plain text with a `#` prefix rather than styled heading elements.

3. **Markdown table rendering** — The `MarkdownText` component has no table support. AI responses that include pipe-delimited tables (`| col | col |`) render as raw character noise.

This spec describes enhancements to close these three gaps so that Ollama-powered chat is fully usable with modern reasoning models and long-form structured responses.

---

## User Scenarios & Testing

### User Story 1 — Reasoning Model Think-Tag Display (Priority: P1)

When using a reasoning model (e.g. DeepSeek R1, Qwen3-thinking), the AI's internal reasoning process is surfaced as a collapsible "Reasoning" section rather than leaking raw `<think>` tags into the chat bubble.

**Why this priority**: Reasoning models are increasingly common with self-hosted Ollama. Without filtering, raw tags break the chat UX immediately — this is a blocking visual defect for any user running DeepSeek R1 or similar.

**Independent Test**: In AI Assistant, select a DeepSeek R1 model → send a question → during/after streaming, the chat bubble shows no `<think>` or `</think>` text; a collapsible "Reasoning" panel appears above the response showing the stripped reasoning content.

**Acceptance Scenarios**:

1. **Given** a reasoning model emits `<think>content</think>` inside its streaming text, **When** the SSE event is processed, **Then** the text within `<think>` tags is separated into a `thinking` SSE event and excluded from the visible response text.
2. **Given** a `thinking` SSE event arrives before or during the response text, **When** the streaming message renders, **Then** the existing collapsible "Reasoning" panel (already used for tool thinking steps) shows the content.
3. **Given** the `<think>` block spans multiple SSE chunks (partial tags), **When** the streaming handler assembles the buffer, **Then** no partial tag text leaks into the visible response.
4. **Given** the model does not emit any `<think>` tags, **When** the response streams, **Then** behaviour is unchanged — no "Reasoning" panel appears.
5. **Given** a `<think>` block is not closed before the stream ends, **When** the handler finalises, **Then** the unclosed reasoning content is emitted as visible response text (not silently dropped).

---

### User Story 2 — Markdown Heading Rendering (Priority: P1)

AI responses that include `#`, `##`, or `###` heading syntax render as visually distinct heading elements rather than plain text with a `#` prefix.

**Why this priority**: Long-form answers, structured explanations, and how-to guides from AI commonly use headings to organise content. Without heading support these responses are hard to read.

**Independent Test**: Ask the AI a question that produces a structured response with headings (e.g. "Give me a guide to setting up Ollama") → the response renders `# Title` as a large heading, `## Section` as a medium heading, and `### Sub-section` as a small heading, all styled distinctly from body text.

**Acceptance Scenarios**:

1. **Given** AI response text contains `# Heading`, **When** `MarkdownText` renders it, **Then** it renders as an `<h1>`-level element with larger, bold styling.
2. **Given** AI response text contains `## Heading`, **When** `MarkdownText` renders it, **Then** it renders as an `<h2>`-level element with medium heading styling.
3. **Given** AI response text contains `### Heading`, **When** `MarkdownText` renders it, **Then** it renders as an `<h3>`-level element with smaller-bold styling, distinct from body text.
4. **Given** a heading appears during streaming (partial line), **When** the heading line is complete, **Then** it renders as a heading without visual glitches during token delivery.
5. **Given** all heading levels use Tailwind color classes, **When** dark mode is active, **Then** each heading level has an appropriate `dark:` variant.

---

### User Story 3 — Markdown Table Rendering (Priority: P2)

AI responses that include pipe-delimited markdown tables render as readable grid tables rather than raw pipe characters and dashes.

**Why this priority**: Tables appear in many AI responses (comparisons, data summaries, specifications). Without table support the content is unreadable. Lower priority than headings since tables are less universal than headings in Ollama chat.

**Independent Test**: Ask the AI to compare two things in a table (e.g. "Compare Llama 3 and Mistral in a table") → the response renders a styled table with header row, separator line, and data rows, all correctly aligned with borders.

**Acceptance Scenarios**:

1. **Given** AI response text contains a pipe-delimited table with a header row and separator line (`|---|`), **When** `MarkdownText` renders it, **Then** a table element appears with a styled header row and data rows.
2. **Given** a table has varying column widths, **When** rendered, **Then** the table does not overflow its container and uses `overflow-x-auto` for scroll on narrow viewports.
3. **Given** dark mode is active, **When** the table renders, **Then** all table borders, header background, and row text have `dark:` Tailwind variants.
4. **Given** a table appears during streaming (incomplete rows), **When** the partial content arrives, **Then** the table does not cause a layout crash — partial rows render as best-effort or fallback to plain text.

---

## Out of Scope

- Adding new tools to the AI assistant (separate feature)
- Support for `<think>` tags in the GraphQL non-streaming fallback path (applies only to the SSE streaming handler; the GraphQL fallback returns full text and `<think>` tags are uncommon in that context)
- Rendering LaTeX or mathematical notation
- Supporting additional Markdown syntax beyond headings and tables (e.g. `>` blockquotes, `---` horizontal rules, nested lists deeper than 2 levels)
- Changes to the endpoint management UI, monitor tab, or tool calling
