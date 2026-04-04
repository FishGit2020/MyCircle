# Quickstart: HSA Expense Tracker

**Feature**: 025-hsa-expense-tracker | **Date**: 2026-04-04

## Prerequisites

- Node.js 22+, pnpm 9+
- Firebase CLI (`npx firebase`)
- Existing MyCircle monorepo checked out on branch `025-hsa-expense-tracker`

## Development Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared (after schema/query/i18n changes)
pnpm codegen && pnpm build:shared

# 3. Build backend types
cd functions && npx tsc --noEmit && cd ..

# 4. Start dev (all MFEs + shell)
pnpm dev
# HSA Expenses MFE available at http://localhost:3033
# Shell (with all MFEs) at http://localhost:3000/hsa-expenses
```

## Key Files

| Layer | File | Purpose |
|-------|------|---------|
| Schema | `functions/src/schema.ts` | GraphQL type definitions |
| Resolvers | `functions/src/resolvers/hsaExpenses.ts` | Query + mutation resolvers |
| HTTP Handler | `functions/src/handlers/hsaExpenses.ts` | Receipt upload/delete |
| Queries | `packages/shared/src/apollo/queries.ts` | Client-side GraphQL operations |
| i18n | `packages/shared/src/i18n/locales/{en,es,zh}.ts` | Translations |
| Main Component | `packages/hsa-expenses/src/components/HsaExpenses.tsx` | MFE entry point |
| Hook | `packages/hsa-expenses/src/hooks/useHsaExpenses.ts` | Apollo CRUD + receipt upload |

## Verification Commands

```bash
# Backend types
cd functions && npx tsc --noEmit

# Codegen + shared build
pnpm codegen && pnpm build:shared

# MFE build
pnpm --filter @mycircle/hsa-expenses build

# Full test suite
pnpm lint && pnpm test:run && pnpm typecheck
```

## MCP Validation

After implementation, run `validate_all` to check:
- Widget registry sync (WidgetType / WIDGET_COMPONENTS / WIDGET_ROUTES)
- i18n key parity across en/es/zh
- Dockerfile package references
- PWA shortcuts count (max 10)
