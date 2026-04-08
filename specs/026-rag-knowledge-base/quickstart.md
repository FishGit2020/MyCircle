# Quickstart: RAG Knowledge Base

**Feature**: 026-rag-knowledge-base  
**Date**: 2026-04-04

## Prerequisites

- Node.js 22+, pnpm 9+
- Firebase emulator suite (for local dev)
- At least one Ollama endpoint configured in AI Assistant with an embedding model (e.g., `nomic-embed-text`)

## Local Development

```bash
# 1. Ensure you're on the feature branch
git checkout 026-rag-knowledge-base

# 2. Install dependencies
pnpm install

# 3. Build shared (required after i18n or query changes)
pnpm build:shared

# 4. Start dev servers (all MFEs + shell)
pnpm dev

# 5. Open AI Assistant → Knowledge Base tab
# http://localhost:5173/ai-assistant?tab=knowledge-base
```

## Backend Development

```bash
# After changing schema or resolvers:
cd functions && npx tsc --noEmit   # Verify strict typecheck
cd ..
pnpm codegen                       # Regenerate GraphQL types after schema changes
pnpm build:shared                  # Rebuild shared with new generated types
```

## Testing

```bash
# Run AI Assistant tests
pnpm --filter @mycircle/ai-assistant test:run

# Run Cloud Functions typecheck
cd functions && npx tsc --noEmit

# Run full suite before pushing
pnpm lint && pnpm test:run && pnpm typecheck
```

## Key Files

| File | Purpose |
|------|---------|
| `functions/src/schema.ts` | GraphQL type definitions |
| `functions/src/resolvers/rag.ts` | RAG resolver logic (new) |
| `functions/src/resolvers/index.ts` | Resolver wiring |
| `packages/shared/src/apollo/queries.ts` | Frontend GraphQL operations |
| `packages/shared/src/apollo/generated.ts` | Auto-generated types (do not edit) |
| `packages/ai-assistant/src/components/KnowledgeBase.tsx` | Knowledge Base tab UI (new) |
| `packages/ai-assistant/src/components/AiAssistant.tsx` | Tab integration |
| `packages/shared/src/i18n/locales/en.ts` | English i18n keys |
| `packages/shared/src/i18n/locales/es.ts` | Spanish i18n keys |
| `packages/shared/src/i18n/locales/zh.ts` | Chinese i18n keys |

## Verification Checklist

- [ ] Knowledge Base tab appears in AI Assistant
- [ ] Endpoint/model selectors work on Knowledge Base tab
- [ ] Document ingestion succeeds with chunk count shown
- [ ] Sources list displays ingested documents
- [ ] Search returns ranked results with scores
- [ ] "Ask AI about these results" switches to chat tab with context
- [ ] All text is translated (en/es/zh)
- [ ] Dark mode works on all new UI elements
- [ ] `pnpm lint && pnpm test:run && pnpm typecheck` all pass
- [ ] `cd functions && npx tsc --noEmit` passes
