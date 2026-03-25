# Implementation Plan: Cloud Files Manager Enhancements

**Branch**: `012-file-manager` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/012-file-manager/spec.md`

## Summary

Extend the existing `cloud-files` MFE with six prioritized features: real-time client-side search & filter (P1), folder organization with hierarchy navigation (P2), browser-native file preview for images and PDFs (P3), inline file rename (P4), targeted per-user file sharing with revoke access (P5), and a storage quota usage indicator (P6). The MFE package `packages/cloud-files/` is enhanced in place — no new MFE is scaffolded. Backend changes are limited to new GraphQL mutations and resolvers for folder CRUD, rename, move, and targeted sharing.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend)
**Primary Dependencies**: React 18, Tailwind CSS, Apollo Client (via `@mycircle/shared`), Firebase Admin SDK (Cloud Functions), Vitest + React Testing Library
**Storage**: Firestore (`users/{uid}/files`, `users/{uid}/folders`, `sharedWithMe/{uid}/files`) + Firebase Storage (unchanged paths)
**Testing**: Vitest unit tests in `packages/cloud-files`; mocked Apollo + mocked `window.__cloudFiles`
**Target Platform**: Web (desktop + mobile-first); Firebase Cloud Functions v2 (backend)
**Project Type**: MFE enhancement (existing micro-frontend) + Cloud Function resolver additions
**Performance Goals**: Search/filter results appear within 100ms of keystroke (client-side); folder navigation loads within 500ms (single Firestore query); file preview opens within 3s for files ≤ 10 MB
**Constraints**: No new npm packages; no changes to Storage paths; backwards-compatible schema additions; 5-level folder depth max; 5 MB file size limit unchanged
**Scale/Scope**: Single MFE package (cloud-files); 2 new resolver files; ~10 new GraphQL operations; ~12 new React components/hooks; ~35 new i18n keys across 3 locales

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Pre-Design | Post-Design |
|-----------|-----------|-------------|
| I. Federated Isolation | ✅ No direct `@apollo/client` imports; all via `@mycircle/shared` | ✅ All new hooks import from `@mycircle/shared` |
| II. Complete Integration | ✅ No new MFE; only new i18n keys and firestore.rules needed | ✅ 35 i18n keys; `firestore.rules` updated; `pnpm codegen` run |
| III. GraphQL-First | ✅ All new data ops via GraphQL; upload REST bridge is pre-existing exempt | ✅ 7 new mutations + 3 new queries; no new REST endpoints |
| IV. Inclusive by Default | ✅ All strings i18n-keyed; dark: variants; aria-labels; 44px touch targets | ✅ See quickstart.md i18n key list |
| V. Fast Tests, Safe Code | ✅ Client-side search/filter unit-testable in memory; mutations mocked | ✅ No per-test timeouts > 5s; `userEvent.setup({ delay: null })` |
| VI. Simplicity | ✅ Client-side search/quota; browser-native preview; no new npm packages | ✅ No premature abstractions; all helpers are used in multiple places |

**No violations. Complexity Tracking table not required.**

## Project Structure

### Documentation (this feature)

```text
specs/012-file-manager/
├── plan.md                      # This file
├── research.md                  # Phase 0 — decisions log
├── data-model.md                # Phase 1 — entities + schema extensions
├── quickstart.md                # Phase 1 — dev setup + implementation order
├── contracts/
│   └── graphql-schema-diff.md  # Phase 1 — exact schema additions + new query constants
└── tasks.md                     # Phase 2 — created by /speckit.tasks (not yet)
```

### Source Code (repository root)

```text
packages/cloud-files/src/
├── components/
│   ├── CloudFiles.tsx             # MODIFY: wire search, folder nav, quota bar
│   ├── FileCard.tsx               # MODIFY: preview icon, inline rename
│   ├── FileList.tsx               # MODIFY: accept filtered files; render folders too
│   ├── FileUpload.tsx             # NO CHANGE
│   ├── FolderBreadcrumb.tsx       # NEW
│   ├── FolderList.tsx             # NEW
│   ├── FilePreviewModal.tsx       # NEW
│   ├── SearchFilterBar.tsx        # NEW
│   ├── StorageQuotaBar.tsx        # NEW
│   └── ShareRecipientsModal.tsx   # NEW
├── hooks/
│   ├── useFiles.ts                # MODIFY: add renameFile, moveFile
│   ├── useSharedFiles.ts          # NO CHANGE
│   ├── useFolders.ts              # NEW
│   ├── useTargetedSharing.ts      # NEW
│   └── useFilesSharedWithMe.ts    # NEW
├── types.ts                       # MODIFY: add Folder, TargetedSharedFile, ShareRecipient
└── utils/
    ├── fileHelpers.ts             # MODIFY: add getFileTypeCategory()
    └── fileHelpers.test.ts        # MODIFY: new tests for category helper

functions/src/
├── resolvers/
│   ├── cloudFiles.ts              # NO CHANGE
│   └── cloudFilesEnhancements.ts  # NEW: rename, folder CRUD, moveFile, targeted share
└── schema.ts                      # MODIFY: new types + queries + mutations

packages/shared/src/apollo/
├── queries.ts                     # MODIFY: +10 query/mutation constants
└── generated.ts                   # AUTO-GENERATED (pnpm codegen)

firestore.rules                    # MODIFY: add folders + sharedWithMe rules
packages/shared/src/i18n/
├── en.json                        # MODIFY: +35 keys
├── es.json                        # MODIFY: +35 keys (Unicode escapes)
└── zh.json                        # MODIFY: +35 keys
```

**Structure Decision**: Single existing MFE package enhanced in-place. Backend resolver split into `cloudFiles.ts` (existing, untouched) and `cloudFilesEnhancements.ts` (new) for clean separation and minimal diff risk.
