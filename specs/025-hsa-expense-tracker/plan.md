# Implementation Plan: HSA Expense Tracker

**Branch**: `025-hsa-expense-tracker` | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-hsa-expense-tracker/spec.md`

## Summary

Personal HSA expense tracker MFE with GraphQL CRUD, receipt upload via Cloud Function (base64 → Firebase Storage), category/status tracking, search/filter, and expense summary. Follows the existing cloud-files dual-handler architecture (GraphQL for data, REST for file upload).

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions Node 22)
**Primary Dependencies**: React 18, Apollo Client (via `@mycircle/shared`), Firebase Cloud Functions v2, Tailwind CSS
**Storage**: Firestore `users/{uid}/hsaExpenses/{expenseId}` + Firebase Storage `users/{uid}/hsa-receipts/{expenseId}/{fileName}`
**Testing**: Vitest, React Testing Library
**Target Platform**: Web (SPA, Module Federation MFE)
**Project Type**: Micro-frontend (MFE) in pnpm monorepo
**Performance Goals**: Expense list renders <1s, receipt upload <10s on broadband
**Constraints**: Mobile-first (360px+), dark mode, a11y (aria-labels, keyboard nav, 44px touch targets)
**Scale/Scope**: Single user, personal data, ~100s of expenses typical

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | MFE independently buildable; all imports via `@mycircle/shared` |
| II. Complete Integration | PASS | All 20+ touchpoints addressed in Phase 5 below |
| III. GraphQL-First | PASS | CRUD via GraphQL; REST only for receipt file upload (acceptable per constitution) |
| IV. Inclusive by Default | PASS | i18n in 3 locales, dark mode, a11y, mobile-first, PageContent wrapper |
| V. Fast Tests, Safe Code | PASS | Vitest with mocked network, `{ delay: null }`, auth verification on endpoints |
| VI. Simplicity | PASS | Minimal scope: CRUD + receipts + filter/summary. No premature abstractions. |

**Post-Phase 1 re-check**: All gates still pass. REST handler for receipt upload is justified (binary file upload via base64, same pattern as cloud-files and baby-photos).

## Project Structure

### Documentation (this feature)

```text
specs/025-hsa-expense-tracker/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 research decisions
├── data-model.md        # Entity model
├── quickstart.md        # Developer quickstart
├── contracts/
│   └── graphql.md       # GraphQL + REST API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # (Phase 2 — /speckit.tasks)
```

### Source Code (repository root)

```text
functions/src/
├── schema.ts                        # +HSAExpense types, query, mutations
├── index.ts                         # +export hsaExpenses handler
├── resolvers/
│   ├── index.ts                     # +spread hsaExpense resolvers
│   └── hsaExpenses.ts               # NEW — query + mutation resolvers
└── handlers/
    ├── shared.ts                    # REUSE — uploadToStorage, verifyAuthToken
    └── hsaExpenses.ts               # NEW — receipt upload/delete handler

packages/shared/src/
├── apollo/queries.ts                # +5 GraphQL operations (GET, ADD, UPDATE, DELETE, MARK)
└── i18n/locales/
    ├── en.ts                        # +~40 hsaExpenses.* keys
    ├── es.ts                        # +~40 hsaExpenses.* keys
    └── zh.ts                        # +~40 hsaExpenses.* keys

packages/hsa-expenses/
├── package.json                     # @mycircle/hsa-expenses, port 3033
├── vite.config.ts                   # federation: hsaExpenses, exposes ./HsaExpenses
├── tsconfig.json
├── postcss.config.js
├── index.html
├── vitest.config.ts
├── test/setup.ts
└── src/
    ├── main.tsx                     # Dev entry
    ├── types.ts                     # HSAExpense, category/status types
    ├── utils/
    │   └── expenseHelpers.ts        # formatAmount, fileToBase64, isFileTooLarge
    ├── hooks/
    │   └── useHsaExpenses.ts        # Apollo CRUD + receipt HTTP upload
    └── components/
        ├── HsaExpenses.tsx          # Main container (default export)
        ├── ExpenseList.tsx           # Card grid + empty state
        ├── ExpenseCard.tsx           # Individual expense card
        ├── ExpenseForm.tsx           # Add/edit modal form
        ├── ReceiptUpload.tsx         # Drag-drop receipt upload
        ├── ExpenseDetailModal.tsx    # Receipt preview + metadata
        ├── SearchFilterBar.tsx       # Search + category/year/status filters
        └── ExpenseSummary.tsx        # Year totals, category breakdown

packages/shell/
├── src/
│   ├── App.tsx                      # +lazy import + route
│   ├── remotes.d.ts                 # +module declaration
│   ├── routeConfig.ts               # +breadcrumb label key
│   ├── lib/navConfig.ts             # +ROUTE_MODULE_MAP + NAV_GROUPS entry
│   └── components/
│       ├── layout/
│       │   ├── iconRegistry.tsx     # +hsaExpenses icon
│       │   └── CommandPalette.tsx   # +nav item
│       └── widgets/
│           ├── widgetConfig.ts      # +WidgetType + WIDGET_COMPONENTS + WIDGET_ROUTES
│           └── HsaExpensesWidget.tsx # NEW — dashboard widget
├── vite.config.ts                   # +federation remote + denylist
├── tailwind.config.js               # +content path
└── test/mocks/
    └── HsaExpensesMock.tsx          # NEW — test mock

deploy/docker/Dockerfile             # +COPY lines (build + runtime)
scripts/assemble-firebase.mjs        # +copy block + mfeDirs entry
server/production.ts                 # (auto-discovers, no change needed)
firebase.json                        # +rewrite before catch-all
firestore.rules                      # +users/{userId}/hsaExpenses/{expenseId}
vitest.config.ts                     # +alias
package.json                         # +dev/preview scripts + concurrently
```

**Structure Decision**: Standard MFE dual-handler architecture following cloud-files pattern. Backend in `functions/src/`, MFE in `packages/hsa-expenses/`, shell integration across 20+ touchpoints.

## Complexity Tracking

No violations. All patterns follow established codebase conventions.

## Key Reusable Code

| Utility | Location | Usage |
|---------|----------|-------|
| `uploadToStorage()` | `functions/src/handlers/shared.ts:103` | Receipt upload to Firebase Storage |
| `getStorageDownloadUrl()` | `functions/src/handlers/shared.ts:124` | Generate download URLs |
| `verifyAuthToken()` | `functions/src/handlers/shared.ts` | Auth verification in HTTP handler |
| `ALLOWED_ORIGINS` | `functions/src/handlers/shared.ts` | CORS whitelist |
| `checkRateLimit()` | `functions/src/handlers/shared.ts` | Rate limiting |
| `requireAuth()` | Pattern from `functions/src/resolvers/cloudFiles.ts:14` | GraphQL auth guard |
| `toIso()` | Pattern from `functions/src/resolvers/cloudFiles.ts:19` | Timestamp conversion |
| `tracedLazy()` | `packages/shell/src/App.tsx` | Perf-traced lazy loading |
| `PageContent` | `@mycircle/shared` | MFE page wrapper |
| `useTranslation` | `@mycircle/shared` | i18n hook |
| `useQuery`/`useMutation` | `@mycircle/shared` | Apollo hooks (NEVER from @apollo/client) |

## Implementation Phases

### Phase 1: Backend (schema, resolvers, handler, rules)
1. Add GraphQL types + query/mutation to `functions/src/schema.ts`
2. Create `functions/src/resolvers/hsaExpenses.ts` with `createHsaExpenseResolvers()`
3. Register in `functions/src/resolvers/index.ts`
4. Create `functions/src/handlers/hsaExpenses.ts` (receipt upload/delete)
5. Export in `functions/src/index.ts`
6. Add rewrite in `firebase.json` before catch-all
7. Add rules in `firestore.rules`
8. Verify: `cd functions && npx tsc --noEmit`

### Phase 2: Shared (queries, i18n, codegen)
1. Add 5 GraphQL operations to `packages/shared/src/apollo/queries.ts`
2. Add ~40 i18n keys to all 3 locale files
3. Run `pnpm codegen && pnpm build:shared`

### Phase 3: MFE scaffold
1. Create `packages/hsa-expenses/` with package.json, vite.config.ts, tsconfig.json, postcss.config.js, index.html, vitest.config.ts, test/setup.ts, src/main.tsx

### Phase 4: MFE components & logic
1. Types, utils, hook
2. Main component (HsaExpenses.tsx) with auth gate + PageContent
3. ExpenseForm, ExpenseList, ExpenseCard
4. ReceiptUpload, ExpenseDetailModal
5. SearchFilterBar, ExpenseSummary

### Phase 5: Shell integration (20+ touchpoints)
1. App.tsx: lazy import + route
2. vite.config.ts: federation remote + denylist
3. remotes.d.ts: module declaration
4. tailwind.config.js: content path
5. navConfig.ts: ROUTE_MODULE_MAP + NAV_GROUPS
6. iconRegistry.tsx: icon
7. routeConfig.ts: breadcrumb
8. CommandPalette.tsx: nav item
9. widgetConfig.ts + HsaExpensesWidget.tsx

### Phase 6: Tests
1. Shell mock + vitest aliases (root + shell)
2. MFE unit tests
3. E2E smoke test
4. Update hardcoded widget/nav counts in existing shell tests

### Phase 7: Deployment & docs
1. Dockerfile COPY lines
2. assemble-firebase.mjs
3. Root package.json scripts
4. AI tools (mfe-tools.ts navigateTo list)
5. architecture.md, README.md, CLAUDE.md active technologies

### Verification
```bash
cd functions && npx tsc --noEmit
pnpm codegen && pnpm build:shared
pnpm --filter @mycircle/hsa-expenses build
pnpm lint && pnpm test:run && pnpm typecheck
```
Then run MCP `validate_all`.
