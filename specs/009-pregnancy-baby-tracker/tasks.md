# Tasks: Pregnancy & Baby Memory Journal

**Input**: Design documents from `/specs/009-pregnancy-baby-tracker/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Approach**: Extends `packages/baby-tracker` — no new MFE, no new route, no new shell integration points.

**Organization**: Tasks grouped by phase. Phase 2 (Foundational) covers all backend/shared/shell changes that block every user story. User story phases cover only `packages/baby-tracker` frontend implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup

**Purpose**: Read existing code to understand structure before modifying anything.

- [x] T001 Confirm branch is `009-pregnancy-baby-tracker` and `packages/baby-tracker` compiles — run `pnpm --filter @mycircle/baby-tracker build` and confirm no errors
- [x] T002 [P] Read `packages/baby-tracker/src/components/BabyTracker.tsx` to understand current structure: stage cards, MilestonePhoto usage, useBabyPhotos import, child selector, and insertion points for new sections — do not modify
- [x] T003 [P] Read `packages/baby-tracker/src/data/babyGrowthData.ts` to confirm `developmentStages` structure (ids 1–10, weekStart, weekEnd, nameKey, descKey, icon) — this data is FROZEN and must never be edited
- [x] T004 [P] Read `functions/src/schema.ts` to understand existing type extension pattern and locate insertion points for the three new type groups
- [x] T005 [P] Read `functions/src/resolvers/notes.ts` (or another existing resolver) to understand the `createXxxResolvers()` factory pattern, `requireAuth` usage, and Firestore collection access pattern before authoring new resolvers

**Checkpoint**: All source patterns understood — implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: All GraphQL schema, resolvers, Cloud Function handler, shared query documents, StorageKeys, i18n keys, and shell wrapper. MUST be complete before any user story frontend work begins.

**⚠️ CRITICAL**: No user story implementation can start until this phase is complete.

### 2A — GraphQL Schema & Backend

- [x] T006 Extend `functions/src/schema.ts` — add all three type groups from `data-model.md`: `MilestoneEvent` type + `MilestoneEventInput` + `MilestoneEventUpdateInput`; `JournalPhoto` type + `JournalPhotoInput`; `InfantAchievement` type + `InfantAchievementInput` + `InfantAchievementUpdateInput`; extend `Query` with `milestoneEvents(childId: String, limit: Int)`, `journalPhotos(childId: String, limit: Int)`, `infantAchievements(childId: String!)`; extend `Mutation` with all 9 new mutations
- [x] T007 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` — first codegen pass after schema.ts change
- [x] T008 [P] Create `functions/src/resolvers/milestoneEvents.ts` — export `createMilestoneEventResolvers()` factory; `milestoneEvents` query reads `users/{uid}/milestoneEvents`, orders `eventDate DESC`, caps at 500, filters by optional `childId`; `addMilestoneEvent` validates `title` non-empty and `eventDate` is valid ISO date (throw `BAD_USER_INPUT` if invalid), server-sets `createdAt`/`updatedAt`; `updateMilestoneEvent` throws `NOT_FOUND` if doc missing or belongs to another user; `deleteMilestoneEvent` returns `true`/`false`; all resolvers use `requireAuth`
- [x] T009 [P] Create `functions/src/resolvers/journalPhotos.ts` — export `createJournalPhotoResolvers()` factory; `journalPhotos` query reads `users/{uid}/journalPhotos`, orders `photoDate DESC`, caps at 500, filters by optional `childId`; `addJournalPhoto` server-sets `createdAt`; `deleteJournalPhoto` deletes the Cloud Storage file at `storagePath` first, then the Firestore doc, returns `true`/`false`
- [x] T010 [P] Create `functions/src/resolvers/infantAchievements.ts` — export `createInfantAchievementResolvers()` factory; `infantAchievements` query reads `users/{uid}/milestoneAchievements` filtered by required `childId`; `addInfantAchievement` implements upsert: query for existing doc with matching `(childId, milestoneId)` — if found replace it, if not create new; server-sets `createdAt`/`updatedAt`; `updateInfantAchievement` returns `NOT_FOUND` guard; `deleteInfantAchievement` returns `true`/`false`
- [x] T011 Register all three new resolver factories in `functions/src/resolvers/index.ts` — import `createMilestoneEventResolvers`, `createJournalPhotoResolvers`, `createInfantAchievementResolvers` and merge into the resolvers object (after T008, T009, T010)
- [x] T012 Create `functions/src/handlers/journalPhotos.ts` — export `journalPhotoUpload` HTTP handler; verify `Authorization: Bearer {idToken}` header (return 401 if missing/invalid via Firebase Admin `verifyIdToken`); parse JSON body `{ imageBase64, childId, caption, photoDate }`; return 413 if decoded base64 size > 5 MB; generate UUID for `photoId`; upload decoded buffer to `users/{uid}/journal-photos/{photoId}.jpg` in Cloud Storage; return `{ photoUrl, storagePath, photoId }` on success, `{ error: "..." }` with 400/401/413/500 on failure
- [x] T013 Export `journalPhotoUpload` from `functions/src/index.ts` (after T012)
- [x] T014 [P] Add `/journal-photos/upload` → `journalPhotoUpload` hosting rewrite rule to `firebase.json` — insert BEFORE the existing `**` catch-all rule, not after it
- [x] T015 [P] Add 3 new subcollection Firestore security rules to `firestore.rules`: `users/{uid}/milestoneEvents/{docId}`, `users/{uid}/journalPhotos/{docId}`, `users/{uid}/milestoneAchievements/{docId}` — each `allow read, write: if request.auth.uid == uid`
- [x] T016 Verify backend TypeScript — run `cd functions && npx tsc --noEmit` and fix all errors (after T011, T013)

### 2B — Shared Layer (Queries, StorageKeys, i18n)

- [x] T017 Add `GET_MILESTONE_EVENTS` query document and `ADD_MILESTONE_EVENT`, `UPDATE_MILESTONE_EVENT`, `DELETE_MILESTONE_EVENT` mutation documents to `packages/shared/src/apollo/queries.ts` — use field selections from `contracts/graphql.md`
- [x] T018 Add `GET_JOURNAL_PHOTOS` query document and `ADD_JOURNAL_PHOTO`, `DELETE_JOURNAL_PHOTO` mutation documents to `packages/shared/src/apollo/queries.ts` (same file as T017, edit sequentially)
- [x] T019 Add `GET_INFANT_ACHIEVEMENTS` query document and `ADD_INFANT_ACHIEVEMENT`, `UPDATE_INFANT_ACHIEVEMENT`, `DELETE_INFANT_ACHIEVEMENT` mutation documents to `packages/shared/src/apollo/queries.ts` (same file, edit sequentially after T018)
- [x] T020 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` — second codegen pass after queries.ts changes (after T017, T018, T019)
- [x] T021 [P] Add `BABY_EVENTS_EXPANDED = 'baby_events_expanded'`, `BABY_PHOTOS_EXPANDED = 'baby_photos_expanded'`, `BABY_MILESTONES_EXPANDED = 'baby_milestones_expanded'` to `packages/shared/src/StorageKeys.ts`
- [x] T022 Add all new i18n keys to `packages/shared/src/i18n/en.json` — keys needed: section titles (`babyTracker.eventsSection`, `babyTracker.photosSection`, `babyTracker.milestonesSection`), form labels (title, date, note, caption, photoDate), button labels (add, edit, delete, save, cancel, upload, clear), placeholders, empty-state messages, delete confirmation prompt, upcoming event badge label, sign-in gate message, "select a child" prompt, filter labels (all, achieved, upcoming) — read file structure before editing
- [x] T023 Add the same i18n keys to `packages/shared/src/i18n/es.json` — MUST read the exact current file first; use Unicode escapes for all accented characters (e.g., `\u00f3` for ó, `\u00e9` for é) per project convention — do not use literal accented characters
- [x] T024 [P] Add the same i18n keys to `packages/shared/src/i18n/zh.json` — read the file before editing; use Unicode escapes for Chinese characters
- [x] T025 Run `pnpm build:shared` to rebuild shared package with all new exports (after T020, T021, T022, T023, T024)

### 2C — Shell Wrapper

- [x] T026 Read the existing `window.__babyPhotos` wrapper file in `packages/shell/src/` to understand the base64 + fetch pattern, then create `packages/shell/src/journalPhotos.ts` (matching filename pattern) — export `setupJournalPhotosGlobal()` that sets `window.__journalPhotos = { upload(file: File, options?): Promise<{ photoUrl, storagePath, photoId }> }` where `upload` reads `window.__currentUid` for the auth token, base64-encodes the file, POSTs `{ imageBase64, childId, caption, photoDate }` to `/journal-photos/upload` with `Authorization: Bearer {idToken}`, and resolves/rejects based on HTTP response status
- [x] T027 Add TypeScript declaration `__journalPhotos: { upload(file: File, options?: { childId?: string | null; caption?: string | null; photoDate?: string | null }): Promise<{ photoUrl: string; storagePath: string; photoId: string }> }` to `packages/shell/src/types/globals.d.ts`
- [x] T028 Import and invoke `setupJournalPhotosGlobal()` in the shell initialization code at the same location where `window.__babyPhotos` is set up in `packages/shell/src/`

**Checkpoint**: Backend compiled, codegen regenerated twice, shared rebuilt, shell wrapper wired. All three user story phases can now begin.

---

## Phase 3: User Story 1 — Log a Personal Pregnancy Milestone (Priority: P1) 🎯 MVP

**Goal**: Users can create, edit, and delete text-only personal milestone events (title, date, optional note) that appear in a date-sorted collapsible section below the existing pregnancy stage cards in Baby Tracker.

**Independent Test**: Open `/baby` → expand "My Moments" section → tap "Add" → fill title + date + note → verify event appears sorted by date → edit the note → delete with confirmation → verify removal. Sign out → verify sign-in gate renders instead of list. Enter future date → verify "Upcoming" badge.

### Implementation for User Story 1

- [x] T029 [US1] Create `packages/baby-tracker/src/components/CollapsibleSection.tsx` — reusable collapsible card; props: `titleKey: string`, `storageKey: string`, `children: ReactNode`; reads/writes expand state to `localStorage[storageKey]` (default `false` = collapsed); renders a full-width header button (`type="button"`, `aria-expanded`, `aria-controls`) with i18n title and chevron icon (rotates when open); conditionally renders `children` when expanded; all touch targets ≥ 44px; `dark:` variants on all color classes
- [x] T030 [US1] Create `packages/baby-tracker/src/hooks/useMilestoneEvents.ts` — wraps `useQuery(GET_MILESTONE_EVENTS, { variables: { childId } })` and `useMutation` for `ADD_MILESTONE_EVENT`, `UPDATE_MILESTONE_EVENT`, `DELETE_MILESTONE_EVENT`; exposes `{ events, loading, addEvent, updateEvent, deleteEvent }`; all Apollo hooks imported from `@mycircle/shared` (never from `@apollo/client` directly)
- [x] T031 [US1] Create `packages/baby-tracker/src/components/MilestoneEventsSection.tsx` — events list sorted `eventDate DESC`; "Add" button (`type="button"`, touch target ≥ 44px) opens an inline form with: title input (required, max 120 chars), date input (required, accepts future dates), note textarea (optional, max 2000 chars); submit saves via `addEvent`; future-date events show a `t('babyTracker.upcomingBadge')` badge; each event row has Edit and Delete icon buttons (`type="button"`, ≥ 44px); Delete shows inline confirmation text + confirm/cancel before calling `deleteEvent`; unauthenticated users see a sign-in gate instead of form/list; loading skeleton; empty state with CTA; all visible strings via `t()`; `dark:` variants
- [x] T032 [US1] Modify `packages/baby-tracker/src/components/BabyTracker.tsx` — add imports for `CollapsibleSection`, `MilestoneEventsSection`, and `StorageKeys` from `@mycircle/shared`; append `<CollapsibleSection titleKey="babyTracker.eventsSection" storageKey={StorageKeys.BABY_EVENTS_EXPANDED}><MilestoneEventsSection childId={selectedChildId} /></CollapsibleSection>` BELOW the existing pregnancy stage card list; do NOT touch any stage card rendering, `developmentStages` iteration, trimester labels, fruit comparisons, or any other existing content
- [x] T033 [US1] Write `packages/baby-tracker/src/components/CollapsibleSection.test.tsx` — test: renders i18n title; body is hidden by default (collapsed); clicking header toggles open state; open state persists to localStorage; `aria-expanded` matches open state; children render when open; `userEvent.setup({ delay: null })`
- [x] T034 [P] [US1] Write `packages/baby-tracker/src/hooks/useMilestoneEvents.test.ts` — mock `GET_MILESTONE_EVENTS` query and all three mutations from `@mycircle/shared`; test: events array returned from query; `addEvent` calls `ADD_MILESTONE_EVENT` mutation with correct variables; `updateEvent` calls `UPDATE_MILESTONE_EVENT`; `deleteEvent` calls `DELETE_MILESTONE_EVENT`; `loading` state propagated
- [x] T035 [P] [US1] Write `packages/baby-tracker/src/components/MilestoneEventsSection.test.tsx` — test: events list renders from mock data sorted by date; upcoming badge shows for future-date events; "Add" form opens on button click; title field is required (submit blocked when empty); delete shows confirmation before calling deleteEvent; sign-in gate renders when no auth; empty state CTA renders with zero events; `userEvent.setup({ delay: null })`

**Checkpoint**: US1 complete — personal milestone event log works end-to-end on `/baby` route.

---

## Phase 4: User Story 2 — Dedicated Photo Album with Timeline View (Priority: P2)

**Goal**: A unified photo album (grouped by month, newest-first) with fullscreen lightbox replaces the per-stage `MilestonePhoto` UI that was embedded in stage cards. Existing per-stage milestone photos are migrated into the new album via a separate migration script (Phase 6).

**Independent Test**: Open `/baby` → expand "Photo Album" → upload a photo with caption and date → verify it appears in the correct month group → tap to open lightbox → navigate prev/next with arrows and keyboard → delete with confirmation → verify removal. Migrated photos show stage label badge. Empty state has upload CTA. Per-stage photo buttons no longer appear in stage cards.

### Implementation for User Story 2

- [x] T036 [US2] Create `packages/baby-tracker/src/hooks/useJournalPhotos.ts` — wraps `useQuery(GET_JOURNAL_PHOTOS, { variables: { childId } })`; `upload(file, options)` calls `window.__journalPhotos.upload(file, options)` then fires `useMutation(ADD_JOURNAL_PHOTO)` with returned `{ photoUrl, storagePath, photoId, caption, photoDate, childId }`; `deletePhoto(id)` calls `useMutation(DELETE_JOURNAL_PHOTO)`; exposes `{ photos, loading, uploading, error, upload, deletePhoto }`; all Apollo imports from `@mycircle/shared`
- [x] T037 [US2] Create `packages/baby-tracker/src/components/PhotoLightbox.tsx` — fullscreen overlay (`role="dialog"`, `aria-modal="true"`); displays current photo, caption (if set), `stageLabel` badge (if set), formatted `photoDate`; Prev/Next navigation buttons (`type="button"`, ≥ 44px, disabled at bounds); keyboard `ArrowLeft`/`ArrowRight` via `useEffect` keydown listener (clean up on unmount); Close button with `aria-label={t('common.close')}` and Escape key also closes; `dark:` variants on all colors; mobile-first layout with `object-contain` image
- [x] T038 [US2] Create `packages/baby-tracker/src/components/JournalPhotoSection.tsx` — photos sorted `photoDate DESC` and grouped by month-year headers; responsive thumbnail grid (mobile 2-col, md 3-col); tap/click opens `PhotoLightbox`; Upload button (`type="button"`) opens `<input type="file" accept="image/*">` + optional caption textarea (max 200 chars) + optional date input, then calls `upload()`; skeleton placeholders while `uploading`; empty state with upload CTA when no photos; each thumbnail has a delete button (`type="button"`, ≥ 44px) with inline confirmation before calling `deletePhoto`; migrated photos with non-null `stageLabel` display a stage badge overlay; all strings via `t()`; `dark:` variants
- [x] T039 [US2] Delete `packages/baby-tracker/src/components/MilestonePhoto.tsx` — remove the file; also remove all `import MilestonePhoto` statements and `<MilestonePhoto ... />` JSX from `packages/baby-tracker/src/components/BabyTracker.tsx`; do NOT touch any other content in stage cards (descriptions, fruit comparisons, icons must remain)
- [x] T040 [US2] Delete `packages/baby-tracker/src/hooks/useBabyPhotos.ts` — remove the file; also remove its `import useBabyPhotos` and all its usage from `packages/baby-tracker/src/components/BabyTracker.tsx`
- [x] T041 [US2] Modify `packages/baby-tracker/src/components/BabyTracker.tsx` — add imports for `JournalPhotoSection`; append `<CollapsibleSection titleKey="babyTracker.photosSection" storageKey={StorageKeys.BABY_PHOTOS_EXPANDED}><JournalPhotoSection childId={selectedChildId} /></CollapsibleSection>` as the second collapsible section (after the events section from US1); ensure no MilestonePhoto or useBabyPhotos references remain; all `developmentStages` stage card content (descriptions, icons, fruit comparisons) must remain exactly as-is
- [x] T042 [US2] Delete `packages/baby-tracker/src/components/MilestonePhoto.test.tsx` if it exists — this test is no longer needed
- [x] T043 [US2] Write `packages/baby-tracker/src/hooks/useJournalPhotos.test.ts` — mock `window.__journalPhotos.upload` and Apollo mutations; test: `upload()` calls window global then `ADD_JOURNAL_PHOTO` mutation with the returned values; `uploading` is true during upload then false; `deletePhoto()` calls `DELETE_JOURNAL_PHOTO`; error state exposed on upload failure
- [x] T044 [P] [US2] Write `packages/baby-tracker/src/components/JournalPhotoSection.test.tsx` — test: photos render in month-year groups newest-first; tapping thumbnail opens PhotoLightbox; upload form appears on button click and calls useJournalPhotos.upload; delete shows confirmation then calls deletePhoto; stageLabel badge renders on migrated photos; empty state CTA renders; skeleton renders while uploading; `userEvent.setup({ delay: null })`

**Checkpoint**: US2 complete — unified photo album on `/baby` route; per-stage MilestonePhoto UI fully removed.

---

## Phase 5: User Story 3 — Record Personal Developmental Milestone Achievements (Priority: P3)

**Goal**: Parents select a child and log the actual date their child achieved each of the 115 infant milestones (0–18 months, 5 age bands, 5 domains). Achievement data persists per child. Existing `developmentStages` pregnancy data is completely unaffected.

**Independent Test**: Select child → open "Baby Milestones" section → tick a milestone → enter date → save → reload page → verify milestone shows as achieved with date → filter to "Achieved" → verify only achieved milestones shown → clear milestone with confirmation → verify it returns to unchecked. No child selected → "Select a child" prompt renders.

### Implementation for User Story 3

- [x] T045 [US3] Add `"@mycircle/child-development": "workspace:*"` as a `devDependency` (not `dependency`) in `packages/baby-tracker/package.json`; run `pnpm install` to link the workspace package
- [x] T046 [US3] Create `packages/baby-tracker/src/hooks/useInfantAchievements.ts` — wraps `useQuery(GET_INFANT_ACHIEVEMENTS, { variables: { childId }, skip: !childId })`; `logAchievement(milestoneId, achievedDate, note?)` calls `ADD_INFANT_ACHIEVEMENT` (upsert handled by resolver); `updateAchievement(id, achievedDate, note?)` calls `UPDATE_INFANT_ACHIEVEMENT`; `clearAchievement(id)` calls `DELETE_INFANT_ACHIEVEMENT`; exposes `{ achievementMap, loading, logAchievement, updateAchievement, clearAchievement }` where `achievementMap` is `Record<milestoneId, InfantAchievement>`; all Apollo imports from `@mycircle/shared`
- [x] T047 [US3] Create `packages/baby-tracker/src/components/MilestoneAchievementRow.tsx` — renders `t(milestone.nameKey)` as the row label; checkbox marks achieved/not; when checked: `achievedDate` date input becomes visible and required; optional note text input; Save/update button; Clear button (`type="button"`) with inline confirmation before calling `clearAchievement`; `isRedFlag` prop adds a visual warning indicator (color + icon); all buttons `type="button"`; touch targets ≥ 44px; `dark:` variants
- [x] T048 [US3] Create `packages/baby-tracker/src/components/InfantMilestonesSection.tsx` — if `childId` is null/undefined render `t('babyTracker.selectChildPrompt')` message; otherwise: import `getMilestonesByAgeRange` and `getDomainMeta` from `@mycircle/child-development`; call `getMilestonesByAgeRange` for each of the 5 bands (`0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m`) to get 115 milestones; group milestones by domain within each band using `getDomainMeta`; render filter toggle bar (All / Achieved / Upcoming — based on presence/absence in `achievementMap`); render each age band section with domain sub-groups, each containing a `MilestoneAchievementRow` per milestone; pass `achievement={achievementMap[m.id]}` to each row; `dark:` variants; all strings via `t()`
- [x] T049 [US3] Modify `packages/baby-tracker/src/components/BabyTracker.tsx` — import `InfantMilestonesSection`; append `<CollapsibleSection titleKey="babyTracker.milestonesSection" storageKey={StorageKeys.BABY_MILESTONES_EXPANDED}><InfantMilestonesSection childId={selectedChildId} /></CollapsibleSection>` as the third and final collapsible section; no other changes to `BabyTracker.tsx`; existing stage card content (descriptions, fruit comparisons, icons, gestational data) must remain exactly as-is
- [x] T050 [US3] Write `packages/baby-tracker/src/hooks/useInfantAchievements.test.ts` — mock `GET_INFANT_ACHIEVEMENTS` and all three mutations from `@mycircle/shared`; test: `achievementMap` is keyed by `milestoneId` from query result; `logAchievement` calls `ADD_INFANT_ACHIEVEMENT` with correct variables; `clearAchievement` calls `DELETE_INFANT_ACHIEVEMENT`; query is skipped when `childId` is null; `loading` state propagated correctly
- [x] T051 [P] [US3] Write `packages/baby-tracker/src/components/InfantMilestonesSection.test.tsx` — mock `@mycircle/child-development` exports (`getMilestonesByAgeRange`, `getDomainMeta`); test: "select a child" prompt renders when childId is null; milestone rows render for valid childId; filter All/Achieved/Upcoming correctly shows/hides rows; ticking a milestone row calls `logAchievement`; clearing shows confirmation then calls `clearAchievement`; `userEvent.setup({ delay: null })`

**Checkpoint**: All 3 user stories independently functional on `/baby` route.

---

## Phase 6: Migration Script

**Purpose**: One-time manual migration for users who have existing per-stage baby photos in Baby Tracker.

- [x] T052 Create `scripts/migrate-baby-photos.mjs` using Firebase Admin SDK — accepts `--uid=<firebase-uid>` (single user, for testing) or `--all` (all users in Firestore); for each `users/{uid}/babyMilestones/{stageId}` document: skip if a `users/{uid}/journalPhotos` doc already exists with `storagePath === "users/{uid}/baby-photos/${stageId}.jpg"` (idempotent guard); look up the stage name from `babyGrowthData.developmentStages` matching `stageId` (e.g., stage 1 → "Weeks 1–3"); write new `users/{uid}/journalPhotos/{uuid}` doc with fields: `photoUrl` (copy as-is), `caption` (copy as-is), `photoDate` (old `uploadedAt` Timestamp → `.toMillis()` → ISO date string), `storagePath` (`users/{uid}/baby-photos/${stageId}.jpg`), `stageLabel` (looked-up stage name), `childId` (null — legacy data pre-dates child profiles), `id` (new UUID), `createdAt` (current ISO timestamp); does NOT delete old `babyMilestones` docs; does NOT copy or move Cloud Storage files (existing `photoUrl` remains valid); prints `Migrated N / skipped M photos for uid: ${uid}` per user and a final total

---

## Phase 7: Polish & Completion

**Purpose**: Validation, CI gate requirement, docs, and full suite run.

- [x] T053 Run `validate_all` MCP tool (`mcp__mycircle__validate_all`) and fix any reported gaps — specifically check i18n key consistency across all 3 locales, Dockerfile validity (baby-tracker should already be there), and widget registry sync
- [x] T054 [P] Create `docs/specs/009-baby-journal/spec.md` — required by the `spec-check` CI gate (`.github/workflows/spec-guard.yml`); content: brief feature overview referencing `specs/009-pregnancy-baby-tracker/spec.md` for full detail; include feature name, branch, and key user stories
- [x] T055 [P] Update `docs/architecture.md` — add a note under the Baby Tracker section describing the three new collapsible sections (My Moments, Photo Album, Baby Milestones), the unified photo journal replacing per-stage photos, and the three new Firestore subcollections
- [x] T056 Run full local suite `pnpm lint && pnpm test:run && pnpm typecheck` — all three MUST pass; fix all failures before proceeding
- [x] T057 Run `cd functions && npx tsc --noEmit` to verify backend strict TypeScript (separate strict tsconfig in `functions/`) — fix all errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — read-only, start immediately
- **Phase 2 (Foundational)**: After Phase 1 reads — BLOCKS all user stories
  - 2A (Schema → first codegen) → 2B (Queries → second codegen → build:shared) → 2C (Shell wrapper)
- **Phase 3 (US1)**: After Phase 2 complete
- **Phase 4 (US2)**: After Phase 2 complete — can start in parallel with Phase 3
- **Phase 5 (US3)**: After Phase 2 complete — can start in parallel with Phases 3 and 4
- **Phase 6 (Migration)**: Independent of Phases 3–5; can be authored any time after Phase 2
- **Phase 7 (Polish)**: After all user story phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: After Phase 2 — no dependency on US1 or US3; modifies `BabyTracker.tsx` (coordinate with US1/US3)
- **US3 (P3)**: After Phase 2 — no dependency on US1 or US2; modifies `BabyTracker.tsx` (coordinate)

> **Note**: US1 (T032), US2 (T041), and US3 (T049) all modify `BabyTracker.tsx`. If implementing sequentially (recommended for solo dev), do US1 → US2 → US3 so each addition builds on the previous. If parallel, split `BabyTracker.tsx` edits by section and merge carefully.

### Within Each User Story

- Hook before component (component imports the hook)
- Component before `BabyTracker.tsx` wiring
- Tests can be written alongside or after implementation

---

## Parallel Opportunities

### Phase 2A (after T007 — first codegen):

```
T008 functions/src/resolvers/milestoneEvents.ts
T009 functions/src/resolvers/journalPhotos.ts      ← all three in parallel
T010 functions/src/resolvers/infantAchievements.ts
T014 firebase.json rewrite                          ← independent
T015 firestore.rules additions                      ← independent
```

### Phase 2B (sequential for same-file, parallel across files):

```
T017 → T018 → T019  (queries.ts — same file, sequential additions)
T021 StorageKeys.ts  (parallel with T017–T019)
T022 en.json         (parallel with T017–T021)
T023 es.json         (after T022 — use T022 key list as reference)
T024 zh.json         (parallel with T023)
```

### Phase 3 (after T032):

```
T033 CollapsibleSection.test.tsx
T034 useMilestoneEvents.test.ts      ← all three tests in parallel
T035 MilestoneEventsSection.test.tsx
```

### Phase 4 (after T041):

```
T043 useJournalPhotos.test.ts
T044 JournalPhotoSection.test.tsx    ← parallel
```

### Phase 5 (after T049):

```
T050 useInfantAchievements.test.ts
T051 InfantMilestonesSection.test.tsx ← parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup reads (no code changes)
2. Phase 2: All foundational backend/shared/shell work
3. Phase 3: US1 (My Moments — personal milestone events) only
4. **STOP and VALIDATE**: `pnpm --filter @mycircle/baby-tracker test:run` + manual test on `/baby`
5. US1 alone is shippable — parents can log personal pregnancy moments immediately

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. Phase 3 (US1) → Events section live ✅
3. Phase 4 (US2) → Unified photo album live; per-stage photo UI removed ✅
4. Phase 5 (US3) → Infant milestone tracking live ✅
5. Phase 6 (Migration) → Run once per environment after US2 ships ✅
6. Phase 7 (Polish) → Full validation + docs → PR merge-ready ✅

### Key Constraints During Implementation

- **Never touch** `packages/baby-tracker/src/data/babyGrowthData.ts` — frozen validated data
- **Never modify** stage card content in `BabyTracker.tsx` — only add below stage list and remove `MilestonePhoto` inline component from within cards
- **Always import** Apollo hooks from `@mycircle/shared`, never from `@apollo/client`
- **Always use** `userEvent.setup({ delay: null })` in all Vitest tests
- **Run** `pnpm build:shared` after any change to `packages/shared/src/`
- **Run** `pnpm codegen` TWICE: once after `functions/src/schema.ts` (T007), once after `packages/shared/src/apollo/queries.ts` (T020)

---

## Notes

- [P] tasks = different files, no blocking dependencies — safe to parallelize
- [Story] label maps each task to its user story for traceability
- Total tasks: **57** (T001–T057)
- Codegen runs twice (T007 and T020) — do not skip the second run
- `es.json` must be read before editing — Unicode escapes required for accented chars
- `MilestonePhoto.tsx` and `useBabyPhotos.ts` are fully deleted in Phase 4 — search entire package for stray references before deleting
- Migration script (T052) is idempotent — always test with `--uid` before running `--all`
