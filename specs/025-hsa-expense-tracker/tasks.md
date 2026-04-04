# Tasks: HSA Expense Tracker

**Input**: Design documents from `/specs/025-hsa-expense-tracker/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/graphql.md

**Tests**: Not explicitly requested in spec. Unit tests included as part of Phase 8 (Polish) for constitution compliance (Principle V).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (MFE Scaffold)

**Purpose**: Create the `packages/hsa-expenses/` package with all config files

- [x] T001 Create `packages/hsa-expenses/package.json` with name `@mycircle/hsa-expenses`, port 3033, deps (shared, react, react-dom, react-router), devDeps (federation, vite, vitest, testing-library, typescript)
- [x] T002 Create `packages/hsa-expenses/vite.config.ts` with federation name `hsaExpenses`, exposes `./HsaExpenses` from `./src/components/HsaExpenses.tsx`, port 3033, shared singletons (react, react-dom, react-router, @mycircle/shared)
- [x] T003 [P] Create `packages/hsa-expenses/tsconfig.json` with ES2022 target, react-jsx, strict mode, path alias for `@mycircle/shared`
- [x] T004 [P] Create `packages/hsa-expenses/postcss.config.js` with autoprefixer plugin
- [x] T005 [P] Create `packages/hsa-expenses/index.html` with root div and module script to `/src/main.tsx`
- [x] T006 [P] Create `packages/hsa-expenses/vitest.config.ts` with jsdom environment, setup file `./test/setup.ts`, alias for `@mycircle/shared`
- [x] T007 [P] Create `packages/hsa-expenses/test/setup.ts` importing `@testing-library/jest-dom`
- [x] T008 Create `packages/hsa-expenses/src/main.tsx` dev entry rendering HsaExpenses in StrictMode
- [x] T009 Run `pnpm install` to link the new workspace package

**Checkpoint**: MFE scaffold exists and can be referenced by shell

---

## Phase 2: Foundational (Backend + Shared + Shell Wiring + Deploy)

**Purpose**: All blocking infrastructure — backend schema/resolvers/handler, shared queries/i18n, shell route wiring, deployment config, test mocks. MUST complete before user story work.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend

- [x] T010 Add GraphQL types (HSAExpense, HSAExpenseCategory, HSAExpenseStatus, HSAExpenseInput, HSAExpenseUpdateInput) + query `hsaExpenses` + mutations (addHsaExpense, updateHsaExpense, deleteHsaExpense, markHsaExpenseReimbursed) to `functions/src/schema.ts` — follow contracts/graphql.md exactly
- [x] T011 Create `functions/src/resolvers/hsaExpenses.ts` — export `createHsaExpenseResolvers()` factory with Query.hsaExpenses (list all, ordered by dateOfService desc) and Mutation.addHsaExpense, updateHsaExpense, deleteHsaExpense, markHsaExpenseReimbursed. Use `requireAuth()` pattern from cloudFiles.ts, Firestore path `users/{uid}/hsaExpenses/{expenseId}`, `FieldValue.serverTimestamp()` for timestamps, `toIso()` for timestamp conversion. deleteHsaExpense must also delete receipt from Storage if receiptStoragePath exists.
- [x] T012 Register resolvers in `functions/src/resolvers/index.ts` — import `createHsaExpenseResolvers`, instantiate, spread into Query and Mutation objects
- [x] T013 Create `functions/src/handlers/hsaExpenses.ts` — `onRequest()` Cloud Function with ALLOWED_ORIGINS cors, `verifyAuthToken()` auth, path-based routing: POST `/hsa-expenses/upload-receipt` (Zod validation: expenseId, fileBase64, fileName, contentType; 5MB limit; `uploadToStorage()` to `users/{uid}/hsa-receipts/{expenseId}/{fileName}`; update Firestore doc with receiptUrl, receiptStoragePath, receiptContentType) and POST `/hsa-expenses/delete-receipt` (delete from Storage, clear receipt fields on Firestore doc)
- [x] T014 [P] Export `hsaExpenses` handler in `functions/src/index.ts`
- [x] T015 [P] Add hosting rewrite `{"source": "/hsa-expenses/**", "function": "hsaExpenses"}` in `firebase.json` BEFORE the `**` catch-all rule
- [x] T016 [P] Add Firestore security rules for `match /users/{userId}/hsaExpenses/{expenseId}` with `allow read, write: if request.auth != null && request.auth.uid == userId` in `firestore.rules`
- [x] T017 Verify backend types: `cd functions && npx tsc --noEmit`

### Shared (Queries + i18n + Codegen)

- [x] T018 Add 5 GraphQL operations to `packages/shared/src/apollo/queries.ts`: GET_HSA_EXPENSES (query hsaExpenses with all fields), ADD_HSA_EXPENSE (mutation with HSAExpenseInput), UPDATE_HSA_EXPENSE (mutation with id + HSAExpenseUpdateInput), DELETE_HSA_EXPENSE (mutation with id), MARK_HSA_EXPENSE_REIMBURSED (mutation with id + reimbursed boolean)
- [x] T019 Add ~40 i18n keys to `packages/shared/src/i18n/locales/en.ts` under `hsaExpenses.*` namespace (title, addExpense, editExpense, deleteExpense, deleteConfirm, provider, dateOfService, amount, category, description, status, pending, reimbursed, receipt, uploadReceipt, viewReceipt, noExpenses, save, saving, cancel, searchPlaceholder, filterCategory, filterYear, filterStatus, allCategories, allYears, allStatuses, summary, yearTotal, categoryBreakdown, pendingTotal, reimbursedTotal, markReimbursed, markPending, expenseCount, receiptAttached, fileTooLarge, invalidFileType, uploadFailed) plus `nav.hsaExpenses`, `widgets.hsaExpenses`, `widgets.hsaExpensesDesc`, `commandPalette.goToHsaExpenses`
- [x] T020 [P] Add matching i18n keys to `packages/shared/src/i18n/locales/es.ts` with Spanish translations (use Unicode escapes for accented characters)
- [x] T021 [P] Add matching i18n keys to `packages/shared/src/i18n/locales/zh.ts` with Chinese translations
- [x] T022 Run `pnpm codegen && pnpm build:shared` to regenerate types and build shared package

### Shell Integration (Core Wiring)

- [x] T023 Add lazy import `const HsaExpensesMF = tracedLazy('mfe_hsa_expenses_load', () => import('hsaExpenses/HsaExpenses'), getPerf)` and `<Route path="hsa-expenses" element={<MFEPageWrapper component={HsaExpensesMF} name="HSA Expenses" />} />` in `packages/shell/src/App.tsx`
- [x] T024 [P] Add federation remote for hsaExpenses (prod: `/hsa-expenses/assets/remoteEntry.js`, dev: `http://localhost:3033/assets/remoteEntry.js`) in `packages/shell/vite.config.ts`
- [x] T025 [P] Add module declaration `declare module 'hsaExpenses/HsaExpenses'` in `packages/shell/src/remotes.d.ts`
- [x] T026 [P] Add content path `"../hsa-expenses/src/**/*.{js,ts,jsx,tsx}"` to `packages/shell/tailwind.config.js`
- [x] T027 [P] Add ROUTE_MODULE_MAP entry `'/hsa-expenses': () => import('hsaExpenses/HsaExpenses')` and NAV_GROUPS entry in "Workspace" group with `{ path: '/hsa-expenses', labelKey: 'nav.hsaExpenses', icon: 'hsaExpenses' }` in `packages/shell/src/lib/navConfig.ts`
- [x] T028 [P] Add breadcrumb label key `'hsa-expenses': 'nav.hsaExpenses'` in `packages/shell/src/routeConfig.ts`
- [x] T029 [P] Add `/hsa-expenses/` regex to navigateFallbackDenylist in `packages/shell/vite.config.ts` (for receipt upload API routes)

### Deployment Config

- [x] T030 [P] Add COPY lines for `packages/hsa-expenses/package.json` in both build-stage and runtime-stage of `deploy/docker/Dockerfile`
- [x] T031 [P] Add copy block for hsa-expenses dist + mfeDirs entry in `scripts/assemble-firebase.mjs`
- [x] T032 Add dev/preview scripts (`dev:hsa-expenses`, `preview:hsa-expenses`) to root `package.json` and add to `"dev"` + `"dev:mf"` concurrently commands

### Test Infrastructure

- [x] T033 [P] Create `packages/shell/test/mocks/HsaExpensesMock.tsx` — simple default export component with `data-testid="hsa-expenses-mock"`
- [x] T034 [P] Add vitest alias `'hsaExpenses/HsaExpenses'` → mock path in root `vitest.config.ts`
- [x] T035 [P] Add vitest alias `'hsaExpenses/HsaExpenses'` → mock path in `packages/shell/vitest.config.ts`

**Checkpoint**: Foundation ready — MFE route loads in shell, backend handles CRUD + receipt upload, i18n keys present, deployment configured. User story implementation can begin.

---

## Phase 3: User Story 1 — Add an HSA Expense (Priority: P1) 🎯 MVP

**Goal**: Users can create HSA expenses with provider, date, amount, category and see them in a list with "Pending" status.

**Independent Test**: Create a new expense with all required fields → verify it appears in expense list with correct details and "Pending" status.

### Implementation

- [x] T036 [P] [US1] Create TypeScript types in `packages/hsa-expenses/src/types.ts` — HSAExpense interface (matching GraphQL type), HSAExpenseCategory enum, HSAExpenseStatus enum, HSAExpenseInput/UpdateInput types
- [x] T037 [P] [US1] Create utility functions in `packages/hsa-expenses/src/utils/expenseHelpers.ts` — `formatAmount(cents: number): string` (e.g., 4599 → "$45.99"), `dollarsToAmountCents(dollars: string): number`, `getCategoryLabel(category, t)`, `getStatusLabel(status, t)`, `CATEGORY_OPTIONS` array
- [x] T038 [US1] Create `useHsaExpenses` hook in `packages/hsa-expenses/src/hooks/useHsaExpenses.ts` — import `useQuery`/`useMutation` from `@mycircle/shared` (NEVER from @apollo/client); implement: `expenses` list from GET_HSA_EXPENSES query, `addExpense(input)` via ADD_HSA_EXPENSE mutation with cache update, `loading`/`error` states. Receipt upload and other mutations will be added in later stories.
- [x] T039 [US1] Create ExpenseForm component in `packages/hsa-expenses/src/components/ExpenseForm.tsx` — modal form with fields: provider (text input, required), dateOfService (date input, required), amount (dollar input with decimal, required, converts to cents via `dollarsToAmountCents`), category (select from CATEGORY_OPTIONS, required), description (textarea, optional). Form validation: all required fields filled, amount > 0. On submit: calls `addExpense()` from hook. Cancel button closes modal. Dark mode + responsive + a11y (aria-labels, type="button" on cancel).
- [x] T040 [US1] Create ExpenseCard component in `packages/hsa-expenses/src/components/ExpenseCard.tsx` — card displaying: formatted amount (`formatAmount`), provider name, category badge (colored by category), status badge ("Pending" yellow / "Reimbursed" green), date of service, receipt indicator icon (if receiptUrl exists), action buttons placeholder (edit/delete added in US5). Dark mode variants on all colors. Touch target ≥ 44px on interactive elements.
- [x] T041 [US1] Create ExpenseList component in `packages/hsa-expenses/src/components/ExpenseList.tsx` — renders grid of ExpenseCard components. Empty state when no expenses: illustration + text from `t('hsaExpenses.noExpenses')` + "Add Expense" CTA button. Responsive grid: 1 col mobile, 2 col md, 3 col lg.
- [x] T042 [US1] Create main HsaExpenses component in `packages/hsa-expenses/src/components/HsaExpenses.tsx` — default export. Auth gate: check `window.__currentUid`, show sign-in prompt if not authenticated. Wrap in `<PageContent>` from `@mycircle/shared`. State: `showForm` boolean for add modal. Renders: page title with `t('hsaExpenses.title')`, "Add Expense" button (opens form), ExpenseList with expenses from `useHsaExpenses()`. Loading spinner while query loads. Error message on query error.

**Checkpoint**: User Story 1 complete — users can add expenses and see them in a list. This is the MVP.

---

## Phase 4: User Story 2 — Upload and View Receipts (Priority: P2)

**Goal**: Users can attach receipt images/PDFs to expenses and view them in a detail modal.

**Independent Test**: Upload a JPEG receipt to an expense → open expense detail → verify receipt image displays.

### Implementation

- [x] T043 [P] [US2] Add `fileToBase64(file: File): Promise<string>` and `isFileTooLarge(file: File, maxMB: number): boolean` utilities to `packages/hsa-expenses/src/utils/expenseHelpers.ts`
- [x] T044 [US2] Add `uploadReceipt(expenseId, file)` and `deleteReceipt(expenseId)` methods to `useHsaExpenses` hook in `packages/hsa-expenses/src/hooks/useHsaExpenses.ts` — HTTP POST to `/hsa-expenses/upload-receipt` with base64 body (pattern from cloud-files useFiles.ts), update Apollo cache with returned receiptUrl. Include auth token header from `window.__getIdToken?.()`. Delete receipt via POST to `/hsa-expenses/delete-receipt`.
- [x] T045 [US2] Create ReceiptUpload component in `packages/hsa-expenses/src/components/ReceiptUpload.tsx` — drag-and-drop zone + file browse button. Accept: image/jpeg, image/png, application/pdf. Max 5MB validation with error toast. Shows upload progress/loading state. On successful upload, shows thumbnail preview (image) or PDF icon. Delete receipt button if receipt exists. Dark mode + a11y.
- [x] T046 [US2] Create ExpenseDetailModal component in `packages/hsa-expenses/src/components/ExpenseDetailModal.tsx` — modal showing full expense metadata (provider, date, amount, category, status, description) + receipt preview. For images: render `<img>` with receiptUrl. For PDFs: render download link + embedded `<object>` or `<iframe>`. Close button. Dark mode. Responsive (full-screen on mobile).
- [x] T047 [US2] Integrate ReceiptUpload into ExpenseForm (optional upload during creation) and add "View Detail" action on ExpenseCard that opens ExpenseDetailModal in `packages/hsa-expenses/src/components/HsaExpenses.tsx`

**Checkpoint**: Users can attach and view receipts on expenses.

---

## Phase 5: User Story 3 — Track Reimbursement Status (Priority: P2)

**Goal**: Users can toggle expenses between "Pending" and "Reimbursed" status.

**Independent Test**: Mark a pending expense as reimbursed → verify status badge changes to green "Reimbursed".

### Implementation

- [x] T048 [US3] Add `markReimbursed(id, reimbursed)` method to `useHsaExpenses` hook in `packages/hsa-expenses/src/hooks/useHsaExpenses.ts` — calls MARK_HSA_EXPENSE_REIMBURSED mutation, updates Apollo cache
- [x] T049 [US3] Add status toggle button to ExpenseCard in `packages/hsa-expenses/src/components/ExpenseCard.tsx` — shows "Mark Reimbursed" (when PENDING) or "Mark Pending" (when REIMBURSED). Uses `t('hsaExpenses.markReimbursed')` / `t('hsaExpenses.markPending')`. Calls `markReimbursed()` from hook. Visual feedback: status badge color changes (yellow → green or vice versa).

**Checkpoint**: Users can track reimbursement status on expenses.

---

## Phase 6: User Story 4 — Search, Filter, and Summarize (Priority: P3)

**Goal**: Users can find specific expenses via search/filter and see spending summaries.

**Independent Test**: Create expenses across categories and years → filter by "Dental" → verify only dental expenses shown and summary updates.

### Implementation

- [x] T050 [US4] Create SearchFilterBar component in `packages/hsa-expenses/src/components/SearchFilterBar.tsx` — search input (filters by provider name, case-insensitive), category dropdown (All + 7 categories), year dropdown (auto-populated from expense dates), status dropdown (All / Pending / Reimbursed). All filters are client-side on the loaded expense list. Dark mode + responsive (stacked on mobile, inline on desktop).
- [x] T051 [US4] Create ExpenseSummary component in `packages/hsa-expenses/src/components/ExpenseSummary.tsx` — computes from filtered expense list: year total (`formatAmount`), per-category breakdown (category label + amount), pending vs. reimbursed split totals, expense count. Collapsible on mobile. Dark mode.
- [x] T052 [US4] Integrate SearchFilterBar and ExpenseSummary into HsaExpenses main component in `packages/hsa-expenses/src/components/HsaExpenses.tsx` — add filter state (searchQuery, categoryFilter, yearFilter, statusFilter), derive filtered expenses list, pass to ExpenseList and ExpenseSummary

**Checkpoint**: Users can search, filter, and see summaries of their expenses.

---

## Phase 7: User Story 5 — Edit and Delete Expenses (Priority: P3)

**Goal**: Users can edit expense details and delete expenses with confirmation.

**Independent Test**: Edit an expense amount → verify updated in list. Delete an expense → verify removed.

### Implementation

- [x] T053 [US5] Add `updateExpense(id, input)` and `deleteExpense(id)` methods to `useHsaExpenses` hook in `packages/hsa-expenses/src/hooks/useHsaExpenses.ts` — UPDATE_HSA_EXPENSE mutation with partial input, DELETE_HSA_EXPENSE mutation with cache eviction. deleteExpense also removes receipt from cache display.
- [x] T054 [US5] Extend ExpenseForm to support edit mode in `packages/hsa-expenses/src/components/ExpenseForm.tsx` — accept optional `expense` prop; when provided, pre-fill form fields (convert amountCents back to dollar string), change title to "Edit Expense", on submit call `updateExpense()` instead of `addExpense()`
- [x] T055 [US5] Add edit and delete action buttons to ExpenseCard in `packages/hsa-expenses/src/components/ExpenseCard.tsx` — edit button opens ExpenseForm in edit mode, delete button shows confirmation dialog (`t('hsaExpenses.deleteConfirm')`), on confirm calls `deleteExpense()`. Both buttons have type="button", aria-labels, 44px touch targets.
- [x] T056 [US5] Wire edit/delete actions in HsaExpenses main component in `packages/hsa-expenses/src/components/HsaExpenses.tsx` — add `editingExpense` state, pass edit/delete callbacks through ExpenseList to ExpenseCard

**Checkpoint**: All 5 user stories complete and independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Widget, remaining shell integration, tests, deployment docs, validation

### Shell Integration (Polish)

- [x] T057 [P] Add hsaExpenses icon SVG factory to `packages/shell/src/components/layout/iconRegistry.tsx` — dollar/receipt themed icon matching existing style
- [x] T058 [P] Add command palette entry (ROUTE_LABEL_KEYS + navItems array) for HSA Expenses in `packages/shell/src/components/layout/CommandPalette.tsx`
- [x] T059 Create `packages/shell/src/components/widgets/HsaExpensesWidget.tsx` — dashboard widget showing pending expense count + total pending amount. Uses `useQuery(GET_HSA_EXPENSES)` from `@mycircle/shared`. Links to `/hsa-expenses`. Dark mode + responsive.
- [x] T060 Add WidgetType `'hsaExpenses'` + WIDGET_COMPONENTS entry + WIDGET_ROUTES entry in `packages/shell/src/components/widgets/widgetConfig.ts`

### Unit Tests

- [x] T061 [P] Write unit tests for `expenseHelpers.ts` in `packages/hsa-expenses/src/utils/expenseHelpers.test.ts` — test formatAmount (0, 100, 4599, edge cases), dollarsToAmountCents, isFileTooLarge, fileToBase64
- [x] T062 [P] Write unit tests for HsaExpenses component in `packages/hsa-expenses/src/components/HsaExpenses.test.tsx` — mock useQuery/useMutation from @mycircle/shared, test: loading state, empty state, expense list renders, add expense flow, auth gate
- [x] T063 [P] Write unit tests for ExpenseForm in `packages/hsa-expenses/src/components/ExpenseForm.test.tsx` — test: required field validation, amount conversion, form submission, edit mode pre-fill, cancel closes form
- [x] T064 [P] Write unit tests for ExpenseCard in `packages/hsa-expenses/src/components/ExpenseCard.test.tsx` — test: renders expense data, category/status badges, receipt indicator, action buttons

### E2E & Existing Test Updates

- [x] T065 Create e2e smoke test in `e2e/hsa-expenses.spec.ts` — navigate to /hsa-expenses, verify page loads, check for title text
- [x] T066 Update hardcoded widget/nav counts in existing shell tests (search for count assertions in `packages/shell/src/` test files)

### Documentation & AI Tools

- [x] T067 [P] Add `hsa-expenses` to navigateTo page list in `scripts/mcp-tools/mfe-tools.ts` description and parameters
- [x] T068 [P] Update `docs/architecture.md` with HSA Expense Tracker MFE entry
- [x] T069 [P] Update `README.md` with HSA Expense Tracker in features list
- [x] T070 [P] Add active technologies entry for 025-hsa-expense-tracker in `CLAUDE.md`

### Spec File (CI Gate)

- [x] T071 Create spec file at `docs/specs/025-hsa-expense-tracker/spec.md` (copy or symlink from `specs/025-hsa-expense-tracker/spec.md`) — required by `spec-check` CI job

### Verification

- [x] T072 Run `cd functions && npx tsc --noEmit` to verify backend types
- [x] T073 Run `pnpm codegen && pnpm build:shared` to verify shared build
- [x] T074 Run `pnpm --filter @mycircle/hsa-expenses build` to verify MFE build
- [x] T075 Run `pnpm lint && pnpm test:run && pnpm typecheck` — full suite must pass
- [x] T076 Run MCP `validate_all` to check widget registry, i18n parity, Dockerfile, PWA shortcuts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T009 pnpm install) — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion
- **User Story 2 (Phase 4)**: Depends on Phase 3 (needs expense to exist for receipt attach)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (needs expense to exist for status toggle)
- **User Story 4 (Phase 6)**: Depends on Phase 3 (needs expense list for filtering)
- **User Story 5 (Phase 7)**: Depends on Phase 3 (needs expense to edit/delete)
- **Polish (Phase 8)**: Depends on all user stories

### User Story Dependencies

- **US1 (P1)**: Foundational only — no dependency on other stories
- **US2 (P2)**: Depends on US1 (needs expense cards to attach receipts to)
- **US3 (P2)**: Depends on US1 (needs expense cards with status) — can run in parallel with US2
- **US4 (P3)**: Depends on US1 (needs expense list to filter) — can run in parallel with US2/US3
- **US5 (P3)**: Depends on US1 (needs expense cards with actions) — can run in parallel with US2/US3/US4

### Within Each User Story

- Types/utils before hook
- Hook before components
- Container component last (wires everything)

### Parallel Opportunities

- Phase 1: T003-T007 can all run in parallel
- Phase 2: T014-T016 in parallel, T019-T021 in parallel (after T019 template), T024-T029 in parallel, T030-T035 in parallel
- Phase 3: T036-T037 in parallel, then T038-T042 sequential (hook → components)
- Phase 4: T043 parallel with others, T044-T047 sequential
- Phase 5: T048 → T049 sequential (small phase)
- Phase 6: T050-T051 parallel, then T052
- Phase 7: T053 → T054-T055 parallel → T056
- Phase 8: T057-T058 parallel, T061-T064 parallel, T067-T071 parallel

---

## Parallel Example: Phase 2 Foundational

```
# Backend tasks that can run in parallel (different files):
T014: Export handler in functions/src/index.ts
T015: Add rewrite in firebase.json
T016: Add rules in firestore.rules

# Shell wiring tasks that can run in parallel (different files):
T024: vite.config.ts federation remote
T025: remotes.d.ts type declaration
T026: tailwind.config.js content path
T027: navConfig.ts route + nav entry
T028: routeConfig.ts breadcrumb
T029: vite.config.ts denylist

# Deploy + test infra in parallel (different files):
T030: Dockerfile
T031: assemble-firebase.mjs
T033: Shell mock
T034: Root vitest alias
T035: Shell vitest alias
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks everything)
3. Complete Phase 3: User Story 1 (Add Expense)
4. **STOP and VALIDATE**: Test expense creation and list independently
5. Deploy/demo — users can already track HSA expenses

### Incremental Delivery

1. Setup + Foundational → MFE skeleton loads in shell
2. Add US1 (Add Expense) → MVP! Users can record expenses
3. Add US2 (Receipts) + US3 (Reimbursement) → Core value complete
4. Add US4 (Search/Filter) + US5 (Edit/Delete) → Full feature set
5. Polish → Widget, tests, docs → Production ready

### Suggested Execution Order

For a single developer working sequentially:

Phase 1 → Phase 2 → Phase 3 (MVP) → Phase 5 (small, quick) → Phase 4 → Phase 6 → Phase 7 → Phase 8

Rationale: US3 (reimbursement status) is very small and adds high value right after US1. US2 (receipts) is the most complex remaining story. US4 and US5 can go in either order.

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story
- Each user story is independently completable and testable after Phase 2
- Apollo imports in MFE: ALWAYS from `@mycircle/shared`, NEVER from `@apollo/client`
- Amount stored as integer cents, displayed as formatted dollars
- Receipt upload is HTTP POST (not GraphQL) — matches cloud-files pattern
- All Tailwind classes need `dark:` variants
- All buttons need `type="button"` unless they are form submit
- All interactive elements need aria-labels and 44px touch targets
- Spanish locale uses Unicode escapes — read exact lines before editing
