# Tasks: Cloud Files Manager Enhancements

**Input**: Design documents from `/specs/012-file-manager/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/graphql-schema-diff.md ✅ · quickstart.md ✅

**Tests**: Not explicitly requested in spec. No dedicated test tasks generated. Unit tests for helpers are included in Polish phase.

**Organization**: Tasks grouped by user story. Each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies)
- **[Story]**: User story this task belongs to (US1–US6)
- All file paths are absolute from repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema, codegen, and i18n foundations that every story depends on. Must complete before any user story work begins.

- [x] T001 Extend `functions/src/schema.ts` — add `Folder`, `TargetedSharedFile`, `ShareRecipient`, `TargetedShareResult` types; add `folderId: ID` to `CloudFile`; add all new queries (`folders`, `fileShareRecipients`, `filesSharedWithMe`) and mutations (`renameFile`, `createFolder`, `deleteFolder`, `renameFolder`, `moveFile`, `shareFileWith`, `revokeFileAccess`) per `contracts/graphql-schema-diff.md`
- [x] T002 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` and verify it compiles without errors
- [x] T003 Add all 10 new Apollo query/mutation constants to `packages/shared/src/apollo/queries.ts` per `contracts/graphql-schema-diff.md`: `GET_FOLDERS`, `GET_FILE_SHARE_RECIPIENTS`, `GET_FILES_SHARED_WITH_ME`, `RENAME_FILE`, `CREATE_FOLDER`, `DELETE_FOLDER`, `RENAME_FOLDER`, `MOVE_FILE`, `SHARE_FILE_WITH`, `REVOKE_FILE_ACCESS`
- [x] T004 Run `pnpm build:shared` and confirm the shared package builds cleanly after T002 and T003
- [x] T005 [P] Add Firestore security rules for `users/{uid}/folders/{folderId}` (owner-only read/write) and `sharedWithMe/{uid}/files/{shareId}` (recipient read-only, no client writes) to `firestore.rules`
- [x] T006 [P] Add all 35 i18n keys to `packages/shared/src/i18n/en.json` — keys listed in `quickstart.md` (cloudFiles.search, cloudFiles.filter*, cloudFiles.newFolder, cloudFiles.folder*, cloudFiles.emptyFolder, cloudFiles.preview*, cloudFiles.rename*, cloudFiles.shareWith*, cloudFiles.recipient*, cloudFiles.revoke*, cloudFiles.sharedWithMe, cloudFiles.storage*, cloudFiles.uploadBlocked)
- [x] T007 [P] Add the same 35 keys to `packages/shared/src/i18n/es.json` using Unicode escapes for accented characters (read existing file format before editing)
- [x] T008 [P] Add the same 35 keys to `packages/shared/src/i18n/zh.json`
- [x] T009 Extend TypeScript types in `packages/cloud-files/src/types.ts` — add `folderId?: string | null` to `FileItem`; add `Folder`, `ShareRecipient`, and `TargetedSharedFile` interfaces matching `data-model.md`

**Checkpoint**: Schema compiled, codegen complete, shared rebuilt, i18n keys in all 3 locales, TS types extended. Foundation ready — user story implementation can begin.

---

## Phase 2: Foundational Backend (Blocking Prerequisites)

**Purpose**: Create the new resolver file skeleton used by US2, US4, and US5. Must complete before those stories but can start immediately alongside Phase 1.

- [x] T010 Create `functions/src/resolvers/cloudFilesEnhancements.ts` with `createCloudFilesEnhancementResolvers()` factory function — export empty resolver stubs for all 7 mutations and 3 queries added in T001, following the same pattern as `functions/src/resolvers/cloudFiles.ts`
- [x] T011 Register `createCloudFilesEnhancementResolvers()` in `functions/src/schema.ts` alongside the existing `createCloudFileResolvers()` call (merge the resolver maps)
- [x] T012 Verify `cd functions && npx tsc --noEmit` passes with stub resolvers before filling in any logic

**Checkpoint**: Backend resolver file compiles. Stubs return `null`/`[]` — safe to fill in per-story.

---

## Phase 3: User Story 1 — Search & Filter (Priority: P1) 🎯 MVP

**Goal**: Users can search files by name and filter by type category in real time, client-side only, on both tabs.

**Independent Test**: Upload 5 files of different types. Type a partial filename — list narrows. Select "Images" filter — only images shown. Clear search — all files restored.

### Implementation for User Story 1

- [x] T013 [P] [US1] Add `getFileTypeCategory(contentType: string): 'image' | 'pdf' | 'doc' | 'other'` helper to `packages/cloud-files/src/utils/fileHelpers.ts`
- [x] T014 [P] [US1] Create `packages/cloud-files/src/components/SearchFilterBar.tsx` — text input (`cloudFiles.search`) + four filter buttons (All / Images / PDFs / Docs) using `getFileTypeCategory`; accepts `query`, `typeFilter`, `onQueryChange`, `onTypeFilterChange` props; all buttons have `type="button"`, `aria-label`, min 44px touch targets, dark mode variants
- [x] T015 [US1] Modify `packages/cloud-files/src/components/CloudFiles.tsx` — add `query` and `typeFilter` state; compute `filteredMyFiles` and `filteredSharedFiles` with `useMemo` (text match + type filter); pass filtered arrays to `FileList`; render `<SearchFilterBar>` above the tabs (visible on both tabs)
- [x] T016 [US1] Modify `packages/cloud-files/src/components/FileList.tsx` — accept an already-filtered `files` prop (no change to internal logic needed); verify empty state message still renders correctly when filter yields zero results

**Checkpoint**: Search and filter work end-to-end on both tabs with no backend changes.

---

## Phase 4: User Story 2 — Folder Organization (Priority: P2)

**Goal**: Users can create folders, move files into them, navigate hierarchy (up to 5 levels), rename and delete folders.

**Independent Test**: Create "Work" folder. Upload a file. Move file to "Work". Navigate into "Work" — file is visible. Navigate back to root — file absent from root list. Delete "Work" with confirm — folder and file gone.

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement `folders` query resolver in `functions/src/resolvers/cloudFilesEnhancements.ts` — query `users/{uid}/folders` ordered by `createdAt`, return `Folder[]`
- [x] T018 [P] [US2] Implement `createFolder` mutation resolver — validate non-empty name, check duplicate name in same parent, enforce `depth ≤ 4`, write `users/{uid}/folders/{folderId}` with `FieldValue.serverTimestamp()`
- [x] T019 [US2] Implement `deleteFolder` mutation resolver — if `deleteContents: false`, reject when files or sub-folders exist; if `deleteContents: true`, batch-delete all `users/{uid}/files` where `folderId == folderId` (calling existing Storage delete logic), recursively delete sub-folders, then delete the folder document
- [x] T020 [P] [US2] Implement `renameFolder` mutation resolver — validate new name non-empty and unique within same parent, update Firestore `name` field
- [x] T021 [US2] Implement `moveFile` mutation resolver — validate `targetFolderId` exists and belongs to same user (or is `null` for root), validate target depth ≤ 4, update `users/{uid}/files/{fileId}.folderId`
- [x] T022 [P] [US2] Create `packages/cloud-files/src/hooks/useFolders.ts` — `useQuery(GET_FOLDERS)`, expose `folders`, `loading`, `error`; `createFolder(name, parentFolderId?)`, `deleteFolder(folderId, deleteContents)`, `renameFolder(folderId, newName)` using `useMutation` from `@mycircle/shared`; `refetchQueries: [GET_FOLDERS]` on mutations
- [x] T023 [US2] Extend `packages/cloud-files/src/hooks/useFiles.ts` — add `moveFile(fileId, targetFolderId)` using `MOVE_FILE` mutation; `refetchQueries: [GET_CLOUD_FILES]`
- [x] T024 [P] [US2] Create `packages/cloud-files/src/components/FolderBreadcrumb.tsx` — accepts `folderStack: Folder[]` and `onNavigate(index: number)` prop; renders root + each folder name as clickable crumb; `aria-label="breadcrumb"`, dark mode, mobile-friendly
- [x] T025 [P] [US2] Create `packages/cloud-files/src/components/FolderList.tsx` — renders folder entries above files; each row shows folder icon, name, created date; action buttons: Enter (navigate into), Rename (inline edit), Delete (confirm dialog); `type="button"`, aria-labels, 44px targets
- [x] T026 [US2] Modify `packages/cloud-files/src/components/CloudFiles.tsx` — add `currentFolderId` and `folderStack` state; on My Files tab: fetch only files where `folderId == currentFolderId` (client-side filter from loaded `files` array); render `<FolderBreadcrumb>` and `<FolderList>`; pass `onMove` handler to `FileCard`

**Checkpoint**: Full folder CRUD and file navigation work independently. `cd functions && npx tsc --noEmit` still passes.

---

## Phase 5: User Story 3 — File Preview (Priority: P3)

**Goal**: Clicking preview on an image or PDF opens an in-app modal. Other file types show no preview icon.

**Independent Test**: Upload a JPEG and a PDF. Click preview on JPEG — image displays in overlay. Click preview on PDF — PDF renders inline. Upload a DOCX — no preview icon shown.

### Implementation for User Story 3

- [x] T027 [P] [US3] Create `packages/cloud-files/src/components/FilePreviewModal.tsx` — accepts `file: { fileName, contentType, downloadUrl } | null` and `onClose: () => void`; renders `null` when `file` is null (closed state); image types → `<img src={downloadUrl} alt={fileName} className="max-h-full max-w-full" />`; PDF → `<iframe src={downloadUrl} title={fileName} className="w-full h-full" />`; modal overlay with backdrop click + Escape key to close; `aria-modal="true"`, `aria-label={t('cloudFiles.preview')}`, close button with `aria-label={t('cloudFiles.closePreview')}`; dark overlay backdrop; no new npm packages
- [x] T028 [US3] Modify `packages/cloud-files/src/components/FileCard.tsx` — add preview icon button (shown only when `contentType` starts with `image/` or equals `application/pdf`); button calls `onPreview?.()` prop; `type="button"`, min 44px, `aria-label={t('cloudFiles.preview') + ' ' + fileName}`
- [x] T029 [US3] Modify `packages/cloud-files/src/components/CloudFiles.tsx` — add `previewFile` state (`FileItem | null`); pass `onPreview` to `FileCard` via `FileList`; render `<FilePreviewModal>` at bottom of component tree

**Checkpoint**: Preview modal opens and closes correctly. No backend changes required.

---

## Phase 6: User Story 4 — Rename Files (Priority: P4)

**Goal**: Users can rename any owned file inline. Empty name is rejected. Escape cancels edit.

**Independent Test**: Upload a file. Click rename. Edit name to "My Report.pdf". Confirm — new name persists after page refresh. Click rename again, press Escape — original name unchanged.

### Implementation for User Story 4

- [x] T030 [US4] Implement `renameFile` mutation resolver in `functions/src/resolvers/cloudFilesEnhancements.ts` — validate `newName` non-empty and ≤ 255 chars; update `users/{uid}/files/{fileId}.fileName`; return updated `CloudFile` object (Storage path unchanged)
- [x] T031 [US4] Extend `packages/cloud-files/src/hooks/useFiles.ts` — add `renameFile(fileId, newName)` using `RENAME_FILE` mutation from `@mycircle/shared`; `refetchQueries: [GET_CLOUD_FILES]`
- [x] T032 [US4] Modify `packages/cloud-files/src/components/FileCard.tsx` — add `onRename?: (newName: string) => void` prop; add rename button (pencil icon) alongside existing actions; clicking it switches the filename `<h4>` to an `<input>` pre-filled with current name; Enter/blur confirms (calls `onRename`, shows error if empty), Escape restores original; `aria-label={t('cloudFiles.rename')}`, 44px button

**Checkpoint**: Rename persists to Firestore. `cd functions && npx tsc --noEmit` passes.

---

## Phase 7: User Story 5 — Targeted File Sharing (Priority: P5)

**Goal**: Users can share a file with a specific registered user by email. Owner sees recipient list and can revoke access. Recipient sees file in their own "Shared With Me" view.

**Independent Test**: Share a file with a test user's email. Sign in as that user — file appears in their Shared With Me list. Return to owner — revoke access. Verify file disappears from recipient's list.

### Implementation for User Story 5

- [x] T033 [P] [US5] Implement `shareFileWith` mutation resolver in `functions/src/resolvers/cloudFilesEnhancements.ts` — look up recipient email via `getAuth().getUserByEmail(recipientEmail)`; throw `NOT_FOUND` if not registered; throw `FORBIDDEN` if sharing with self; write `sharedWithMe/{recipientUid}/files/{shareId}` with denormalized file metadata and `revokedAt: null`; return `{ ok: true, shareId }`
- [x] T034 [P] [US5] Implement `revokeFileAccess` mutation resolver — set `revokedAt: FieldValue.serverTimestamp()` on `sharedWithMe/{recipientUid}/files/{shareId}`; verify caller is the owner (`ownerUid == uid`)
- [x] T035 [P] [US5] Implement `fileShareRecipients` query resolver — query across `sharedWithMe` collection group for documents where `ownerUid == uid && fileId == fileId && revokedAt == null`; return `ShareRecipient[]`
- [x] T036 [P] [US5] Implement `filesSharedWithMe` query resolver — query `sharedWithMe/{uid}/files` where `revokedAt == null` ordered by `sharedAt desc`; return `TargetedSharedFile[]`
- [x] T037 [P] [US5] Create `packages/cloud-files/src/hooks/useTargetedSharing.ts` — `shareFileWith(fileId, recipientEmail)` using `SHARE_FILE_WITH`; `revokeFileAccess(shareId)` using `REVOKE_FILE_ACCESS`; `getRecipients(fileId)` using `GET_FILE_SHARE_RECIPIENTS` lazy query; import all from `@mycircle/shared`
- [x] T038 [P] [US5] Create `packages/cloud-files/src/hooks/useFilesSharedWithMe.ts` — `useQuery(GET_FILES_SHARED_WITH_ME)`; expose `files: TargetedSharedFile[]`, `loading`, `error`, `reload`
- [x] T039 [P] [US5] Create `packages/cloud-files/src/components/ShareRecipientsModal.tsx` — opened from `FileCard` "Share with…" action; contains email input + submit button (`cloudFiles.shareWith`); below input, lists current recipients with "Revoke" button each; shows `recipientNotFound` error inline; `aria-modal`, close button, 44px targets, dark mode
- [x] T040 [US5] Modify `packages/cloud-files/src/components/FileCard.tsx` — add "Share with…" button (person+ icon) alongside existing global Share button; calls `onShareWith?.()` prop; keep existing global `onShare` intact
- [x] T041 [US5] Modify `packages/cloud-files/src/components/CloudFiles.tsx` — add third "Shared With Me" tab rendering `useFilesSharedWithMe` results; wire `ShareRecipientsModal` state; pass `onShareWith` down to `FileCard` via `FileList`; the existing global Share button and "Shared Files" tab remain unchanged

**Checkpoint**: Targeted sharing and revoke work end-to-end. Collection group query requires Firestore index — add to `firestore.indexes.json` if needed.

---

## Phase 8: User Story 6 — Storage Quota Display (Priority: P6)

**Goal**: My Files page always shows used vs. total storage with a visual bar. A warning appears when usage ≥ 90%.

**Independent Test**: Open My Files — quota bar shows used/total (e.g., "12 MB of 500 MB"). Upload a file — bar updates. Delete a file — bar decreases.

### Implementation for User Story 6

- [x] T042 [P] [US6] Create `packages/cloud-files/src/components/StorageQuotaBar.tsx` — accepts `usedBytes: number` and `totalBytes: number` props; renders a progress bar with label (`cloudFiles.storageUsed`, `cloudFiles.storageOf`) using `formatFileSize` from `fileHelpers.ts`; when `usedBytes / totalBytes >= 0.9`, renders warning banner (`cloudFiles.storageNearFull`); dark mode, accessible `role="progressbar"` with `aria-valuenow` / `aria-valuemax`
- [x] T043 [US6] Modify `packages/cloud-files/src/components/CloudFiles.tsx` — compute `usedBytes = files.reduce((s, f) => s + f.size, 0)` from the loaded `files` array; define `TOTAL_BYTES = 500 * 1024 * 1024`; render `<StorageQuotaBar>` at top of My Files tab; add upload guard: if `usedBytes >= TOTAL_BYTES` disable the `FileUpload` component and show `cloudFiles.uploadBlocked` error instead

**Checkpoint**: Quota bar renders and updates reactively from the existing loaded files array. No backend changes.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T044 [P] Add unit tests for `getFileTypeCategory()` in `packages/cloud-files/src/utils/fileHelpers.test.ts` — cover all MIME type categories and edge cases
- [x] T045 [P] Add unit test for `StorageQuotaBar.tsx` — renders correct percentage, shows warning at 90%, accessible attributes
- [x] T046 Run `pnpm lint && pnpm test:run && pnpm typecheck` from repo root and fix any failures
- [x] T047 Run `cd functions && npx tsc --noEmit` to verify backend types are clean
- [x] T048 Run `validate_all` MCP tool — confirm i18n, Dockerfile, widget registry, PWA shortcuts all pass (no new MFE, but i18n keys must be consistent across all 3 locales)
- [x] T049 [P] Verify Firestore indexes are defined in `firestore.indexes.json` for: `users/{uid}/files (folderId ASC, uploadedAt DESC)`, `users/{uid}/folders (parentFolderId ASC, createdAt ASC)`, `sharedWithMe/{uid}/files (revokedAt ASC, sharedAt DESC)`, and collection group `sharedWithMe` for `fileShareRecipients` query

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational Backend)**: Can start in parallel with Phase 1 after T001 is done
- **Phase 3 (US1 Search)**: Requires Phase 1 complete (needs T009 for types, T006–T008 for i18n)
- **Phase 4 (US2 Folders)**: Requires Phase 1 + Phase 2 complete (needs schema, codegen, resolver stub)
- **Phase 5 (US3 Preview)**: Requires Phase 1 complete (needs i18n keys); no backend dependency
- **Phase 6 (US4 Rename)**: Requires Phase 1 + Phase 2 complete
- **Phase 7 (US5 Targeted Share)**: Requires Phase 1 + Phase 2 complete
- **Phase 8 (US6 Quota)**: Requires Phase 1 complete (needs i18n); no backend dependency
- **Polish**: Requires all desired stories complete

### User Story Dependencies

- **US1 (P1) Search & Filter**: Independent — no other story required
- **US2 (P2) Folders**: Independent — no other story required; integrates into same `CloudFiles.tsx` as US1
- **US3 (P3) Preview**: Independent — adds props to `FileCard.tsx`; no conflict with US1/US2
- **US4 (P4) Rename**: Independent — adds props to `FileCard.tsx`; no conflict with prior stories
- **US5 (P5) Targeted Share**: Independent — adds new tab and modal; existing share flow unchanged
- **US6 (P6) Quota**: Independent — reads from already-loaded `files` array

### Parallel Opportunities Within Stories

- **US2 Folders backend tasks**: T017, T018, T020 can run in parallel (different resolver functions)
- **US5 Targeted Share backend tasks**: T033, T034, T035, T036 can run in parallel (different resolver functions)
- **US5 hooks**: T037, T038 can run in parallel (different files)
- **Polish**: T044, T045, T049 can run in parallel

---

## Parallel Example: User Story 2 Backend

```text
# These four resolver implementations have no dependencies on each other:
Task T017: "folders query resolver in functions/src/resolvers/cloudFilesEnhancements.ts"
Task T018: "createFolder mutation resolver in functions/src/resolvers/cloudFilesEnhancements.ts"
Task T020: "renameFolder mutation resolver in functions/src/resolvers/cloudFilesEnhancements.ts"
Task T022: "Create packages/cloud-files/src/hooks/useFolders.ts"
```

## Parallel Example: User Story 5 Backend

```text
# These four resolver implementations are independent:
Task T033: "shareFileWith mutation resolver"
Task T034: "revokeFileAccess mutation resolver"
Task T035: "fileShareRecipients query resolver"
Task T036: "filesSharedWithMe query resolver"
```

---

## Implementation Strategy

### MVP (User Story 1 Only — no backend changes)

1. Complete **Phase 1** (T001–T009) — schema, codegen, i18n, types
2. Complete **Phase 3** (T013–T016) — search bar + filter, pure client-side
3. **STOP and VALIDATE**: Search + filter work on both tabs
4. Optionally demo/deploy — fully functional increment with zero backend risk

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1 Search) → Demo search/filter (no backend)
3. Phase 5 (US3 Preview) → Demo preview (no backend)
4. Phase 8 (US6 Quota) → Demo quota bar (no backend)
5. Phase 4 (US2 Folders) → Demo folder organization (backend involved)
6. Phase 6 (US4 Rename) → Demo rename (backend involved)
7. Phase 7 (US5 Targeted Share) → Demo targeted share (backend involved)
8. Polish → Final validation

### Parallel Team Strategy

With two developers:
- **Dev A**: Phase 1 + Phase 2 → then US1 → US2 backend (T017–T021) → US4 → US5 backend (T033–T036)
- **Dev B**: Phase 1 in parallel → US3 → US6 → US5 frontend (T037–T041) → Polish

---

## Task Summary

| Phase | Story | Tasks | Notes |
|-------|-------|-------|-------|
| Phase 1 (Setup) | — | T001–T009 | 9 tasks; T005–T009 parallelizable |
| Phase 2 (Foundational) | — | T010–T012 | 3 tasks; sequential |
| Phase 3 | US1 Search & Filter | T013–T016 | 4 tasks; T013–T014 parallel |
| Phase 4 | US2 Folders | T017–T026 | 10 tasks; T017–T018, T020, T022, T024–T025 parallel |
| Phase 5 | US3 Preview | T027–T029 | 3 tasks; T027 parallel |
| Phase 6 | US4 Rename | T030–T032 | 3 tasks; sequential |
| Phase 7 | US5 Targeted Share | T033–T041 | 9 tasks; T033–T038 parallel |
| Phase 8 | US6 Quota | T042–T043 | 2 tasks; T042 parallel |
| Polish | — | T044–T049 | 6 tasks; T044–T045, T049 parallel |
| **Total** | | **49 tasks** | |
