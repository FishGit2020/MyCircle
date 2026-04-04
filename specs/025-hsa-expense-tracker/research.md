# Research: HSA Expense Tracker

**Feature**: 025-hsa-expense-tracker | **Date**: 2026-04-04

## R-001: GraphQL vs REST for Expense CRUD

**Decision**: GraphQL for all CRUD operations; REST (Cloud Function) for receipt file upload only.

**Rationale**: Constitution Principle III (GraphQL-First) requires all MFE data operations to go through Apollo GraphQL. File uploads need base64 → Cloud Function → Firebase Storage, which is an established REST pattern in the codebase (cloudFiles handler). This is the same dual-handler architecture used by cloud-files and baby-photos.

**Alternatives considered**:
- Pure GraphQL (upload via mutation): Rejected — base64 payloads in GraphQL bloat the schema and complicate error handling. The existing `uploadToStorage` shared helper expects an HTTP handler context.
- Pure REST: Rejected — violates constitution. All query/filter/status operations must be GraphQL.

## R-002: Resolver Pattern

**Decision**: Single resolver file `functions/src/resolvers/hsaExpenses.ts` exporting `createHsaExpenseResolvers()` factory with `{ Query, Mutation }`.

**Rationale**: Matches `createCloudFileResolvers()` pattern in `functions/src/resolvers/cloudFiles.ts`. Feature scope is small enough for one file (5 operations: list, add, update, delete, markReimbursed). Registered in `functions/src/resolvers/index.ts` via spread composition.

**Alternatives considered**:
- Separate query/mutation files: Rejected — unnecessary for 5 operations.

## R-003: Firestore Data Path

**Decision**: `users/{uid}/hsaExpenses/{expenseId}` — user-scoped subcollection.

**Rationale**: Matches the `users/{uid}/files/{fileId}` pattern for cloud-files. User-scoped by design (FR-012). Security rules enforce `request.auth.uid == userId`.

**Alternatives considered**:
- Top-level collection with `createdBy` field (like `worshipSetlists`): Rejected — HSA data is strictly personal, no sharing needed. Subcollection provides implicit access control.

## R-004: Receipt Storage Path

**Decision**: `users/{uid}/hsa-receipts/{expenseId}/{fileName}` in Firebase Storage.

**Rationale**: User-scoped storage path mirrors Firestore path. One receipt per expense (assumption from spec). Reuses `uploadToStorage()` from `functions/src/handlers/shared.ts`.

**Alternatives considered**:
- `hsa-expenses/{expenseId}/{fileName}` (flat): Rejected — no user scoping, harder to enforce security rules.

## R-005: Amount Storage Format

**Decision**: Integer cents in Firestore, dollar display in UI.

**Rationale**: Avoids floating-point precision issues. `formatAmount(4599)` → `"$45.99"`. Standard pattern for financial data.

**Alternatives considered**:
- Float dollars: Rejected — precision loss on arithmetic (e.g., `0.1 + 0.2 !== 0.3`).
- String: Rejected — can't aggregate in queries.

## R-006: HTTP Handler Pattern for Receipt Upload

**Decision**: New Cloud Function `hsaExpenses` in `functions/src/handlers/hsaExpenses.ts` with routes:
- `POST /hsa-expenses/upload-receipt` — upload receipt (base64)
- `POST /hsa-expenses/delete-receipt` — delete receipt from storage

**Rationale**: Matches `cloudFiles` handler pattern. Uses `onRequest()` with path-based routing, `verifyAuthToken()` for auth, Zod for input validation, `uploadToStorage()` for storage.

**Alternatives considered**:
- Reuse cloudFiles handler with a new route: Rejected — separation of concerns. Each MFE with file operations gets its own handler.

## R-007: Shell Integration Port & Module Names

**Decision**: Port 3033, federation name `hsaExpenses`, export `./HsaExpenses`, route `/hsa-expenses`.

**Rationale**: Port 3033 is the next available. Naming follows existing conventions: camelCase federation name, PascalCase export, kebab-case route.

## R-008: i18n Key Namespace

**Decision**: `hsaExpenses.*` for feature keys, plus standard `nav.hsaExpenses`, `widgets.hsaExpenses`, `commandPalette.goToHsaExpenses`.

**Rationale**: Matches existing MFE namespace patterns (e.g., `worship.*`, `cloudFiles.*`).

## R-009: Widget Design

**Decision**: Dashboard widget showing count of pending expenses and total pending amount. Clicking navigates to `/hsa-expenses`.

**Rationale**: Matches existing widget patterns (simple summary + link to full MFE). No complex interactions in widget.

## R-010: Nav Group Placement

**Decision**: Place in "Workspace" nav group alongside files, notes, resume, etc.

**Rationale**: HSA expense tracking is a personal productivity/workspace tool, not daily, faith, family, or learning.
