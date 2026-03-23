# Implementation Plan: Pregnancy & Baby Memory Journal

**Branch**: `009-pregnancy-baby-tracker` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Revision**: Extends `packages/baby-tracker` — no new MFE, no new shell integration points.

---

## Summary

Extend the existing Baby Tracker MFE (`packages/baby-tracker`) with three new collapsible card sections added below the existing pregnancy content: **My Moments** (milestone event log), **Photo Album** (unified photo journal replacing the existing per-stage photos), and **Baby Milestones** (infant achievement tracker for ages 0–18 months). Introduces three new Firestore collections, three new GraphQL resolver files, one new Cloud Function HTTP handler, and a one-time migration script for existing per-stage photos. No new package, route, nav item, widget, or Dockerfile change required.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18 (same as existing baby-tracker)
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, i18n, useChildren, PageContent, StorageKeys), `@mycircle/child-development` (static milestone catalogue — new devDependency in baby-tracker), `react-router`, Tailwind CSS
**Storage**: Three new Firestore per-user subcollections (`users/{uid}/milestoneEvents`, `users/{uid}/journalPhotos`, `users/{uid}/milestoneAchievements`); new Cloud Storage prefix `users/{uid}/journal-photos/{id}.jpg`
**Testing**: Vitest + React Testing Library; mock all GraphQL hooks and `window.__journalPhotos`
**Target Platform**: Web (desktop + mobile-first); existing `/baby` route unchanged
**Project Type**: Extension to existing MFE (`packages/baby-tracker`)
**Performance Goals**: Photo album first paint < 2 s; event save < 500 ms round-trip
**Constraints**: Mobile-first; touch targets ≥ 44px; no `100vh` calculations; preserve all existing Baby Tracker functionality unchanged
**Scale/Scope**: < 500 entries per section per child

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | No new MFE; existing isolation preserved; all imports via `@mycircle/shared` |
| II. Complete Integration | ✅ PASS | No new MFE integration points required; only backend + shared package changes |
| III. GraphQL-First | ✅ PASS | All data ops through Apollo; photo upload via HTTP handler (binary exception per constitution) |
| IV. Inclusive by Default | ✅ PASS | i18n keys in all 3 locales; dark: variants; aria-labels; touch targets ≥ 44px |
| V. Fast Tests, Safe Code | ✅ PASS | Unit tests mock GraphQL; `userEvent.setup({ delay: null })`; no per-test timeout > 5000ms |
| VI. Simplicity | ✅ PASS | Extends existing component; reusable `CollapsibleSection`; client-side milestone filter |

**No violations.**

---

## Project Structure

### Documentation (this feature)

```text
specs/009-pregnancy-baby-tracker/
├── plan.md              # This file
├── research.md          # Architecture decisions
├── data-model.md        # Entities, GraphQL SDL, Firestore paths
├── quickstart.md        # Dev setup + migration script guide
├── contracts/
│   └── graphql.md       # Query/mutation contracts + HTTP upload contract
└── tasks.md             # Task list (/speckit.tasks output)
```

### Source Code Changes

```text
packages/baby-tracker/src/
├── components/
│   ├── BabyTracker.tsx               MODIFIED: add 3 collapsible sections; remove MilestonePhoto usage
│   ├── CollapsibleSection.tsx        NEW: reusable expand/collapse card wrapper
│   ├── MilestoneEventsSection.tsx    NEW: events list + add/edit/delete (US1)
│   ├── JournalPhotoSection.tsx       NEW: photo album grid + lightbox + upload (US2)
│   ├── PhotoLightbox.tsx             NEW: fullscreen lightbox with prev/next nav
│   ├── InfantMilestonesSection.tsx   NEW: achievement tracker grouped by domain (US3)
│   ├── MilestoneAchievementRow.tsx   NEW: single milestone row
│   ├── MilestonePhoto.tsx            DELETED
│   └── [test files]                  NEW/UPDATED/DELETED as above
├── hooks/
│   ├── useMilestoneEvents.ts         NEW
│   ├── useJournalPhotos.ts           NEW
│   ├── useInfantAchievements.ts      NEW
│   └── useBabyPhotos.ts              DELETED
└── package.json                      ADD @mycircle/child-development devDependency

functions/src/
├── schema.ts                         ADD 3 new type groups
├── resolvers/
│   ├── milestoneEvents.ts            NEW
│   ├── journalPhotos.ts              NEW
│   ├── infantAchievements.ts         NEW
│   ├── babyPhotos.ts                 KEEP (deprecated, alive until migration)
│   └── index.ts                      ADD 3 new factories
└── handlers/
    └── journalPhotos.ts              NEW: journalPhotoUpload handler

packages/shared/src/
├── apollo/queries.ts                 ADD new GQL documents
├── StorageKeys.ts                    ADD 3 collapsible-section keys
└── i18n/{en,es,zh}.json             ADD new keys

firebase.json                         ADD /journal-photos/upload rewrite
firestore.rules                       ADD 3 subcollection rules
scripts/migrate-baby-photos.mjs       NEW: one-time migration script
docs/specs/009-baby-journal/spec.md   NEW: spec-check CI gate
```

---

## Implementation Phases

### Phase A: Backend (GraphQL + Cloud Function)

1. Extend `functions/src/schema.ts` with `MilestoneEvent`, `JournalPhoto`, `InfantAchievement` type groups — see `data-model.md` for exact SDL
2. Run `pnpm codegen` — regenerates `packages/shared/src/apollo/generated.ts`
3. Create `functions/src/resolvers/milestoneEvents.ts` — `createMilestoneEventResolvers()` factory following `notes.ts` pattern (`requireAuth`, `eventDate DESC` order, `NOT_FOUND` guard on update/delete)
4. Create `functions/src/resolvers/journalPhotos.ts` — `createJournalPhotoResolvers()` factory (`photoDate DESC` order; `deleteJournalPhoto` removes Storage file at `storagePath` then Firestore doc)
5. Create `functions/src/resolvers/infantAchievements.ts` — `createInfantAchievementResolvers()` factory (upsert for `addInfantAchievement`: query `(childId, milestoneId)` → replace if found)
6. Register all three new factories in `functions/src/resolvers/index.ts`
7. Create `functions/src/handlers/journalPhotos.ts` — `journalPhotoUpload` handler: verify `Authorization` Bearer token, decode base64 body, upload to `users/{uid}/journal-photos/{uuid}.jpg`, return `{ photoUrl, storagePath, photoId }`
8. Export `journalPhotoUpload` in `functions/src/index.ts`
9. Add `/journal-photos/upload` → `journalPhotoUpload` rewrite to `firebase.json` (before `**` catch-all)
10. Add 3 new subcollection rules to `firestore.rules`
11. Verify: `cd functions && npx tsc --noEmit`

### Phase B: Shared Layer

1. Add `GET_MILESTONE_EVENTS` + `ADD/UPDATE/DELETE_MILESTONE_EVENT` to `packages/shared/src/apollo/queries.ts`
2. Add `GET_JOURNAL_PHOTOS` + `ADD/DELETE_JOURNAL_PHOTO` to `packages/shared/src/apollo/queries.ts`
3. Add `GET_INFANT_ACHIEVEMENTS` + `ADD/UPDATE/DELETE_INFANT_ACHIEVEMENT` to `packages/shared/src/apollo/queries.ts`
4. Run `pnpm codegen` again (queries.ts changed)
5. Add `BABY_EVENTS_EXPANDED`, `BABY_PHOTOS_EXPANDED`, `BABY_MILESTONES_EXPANDED` to `packages/shared/src/StorageKeys.ts`
6. Add i18n keys to `en.json` (all UI strings: section headers, form labels, placeholders, empty states, confirmations)
7. Add same keys to `es.json` (Unicode escapes for accented chars — read existing lines before editing)
8. Add same keys to `zh.json`
9. Run `pnpm build:shared`

### Phase C: Shell Wrapper

1. Add `window.__journalPhotos` wrapper to `packages/shell/src/` alongside existing `window.__babyPhotos`: `upload(file, options: { childId?, caption?, photoDate? })` — base64-encodes `file`, POSTs to `/journal-photos/upload`, returns `{ photoUrl, storagePath, photoId }`
2. Add TypeScript type declaration to `packages/shell/src/types/globals.d.ts`

### Phase D: US1 — My Moments (Milestone Events)

1. Create `packages/baby-tracker/src/hooks/useMilestoneEvents.ts`: wraps `GET_MILESTONE_EVENTS` (passes `childId`, returns all when null), `ADD/UPDATE/DELETE_MILESTONE_EVENT`; exposes `{ events, loading, addEvent, updateEvent, deleteEvent }`
2. Create `packages/baby-tracker/src/components/CollapsibleSection.tsx`: takes `titleKey`, `storageKey`, `children`; reads/writes expand state to `localStorage`; renders arrow toggle; accessible (`aria-expanded`)
3. Create `packages/baby-tracker/src/components/MilestoneEventsSection.tsx`: events list sorted `eventDate DESC`; "Add" opens inline form (title required max 120, date required, note optional max 2000); future-date events show "upcoming" badge; edit/delete per event; confirmation on delete; sign-in gate when unauthenticated
4. Wire into `BabyTracker.tsx` below existing pregnancy content using `<CollapsibleSection storageKey={StorageKeys.BABY_EVENTS_EXPANDED}>`
5. Write tests: `CollapsibleSection.test.tsx`, `useMilestoneEvents.test.ts`, `MilestoneEventsSection.test.tsx`

### Phase E: US2 — Photo Album

1. Create `packages/baby-tracker/src/hooks/useJournalPhotos.ts`: `upload(file, options)` → calls `window.__journalPhotos.upload(...)` then `ADD_JOURNAL_PHOTO`; `deletePhoto(id)` → `DELETE_JOURNAL_PHOTO`; exposes `{ photos, loading, uploading, error, upload, deletePhoto }`
2. Create `packages/baby-tracker/src/components/PhotoLightbox.tsx`: fullscreen overlay (`role="dialog"`); current photo, caption, `stageLabel` badge (if set), date; prev/next buttons + keyboard arrow keys; close (`aria-label`); `dark:` variants
3. Create `packages/baby-tracker/src/components/JournalPhotoSection.tsx`: photos grouped by month (`photoDate DESC`); grid of thumbnails; month-year section headers; upload button (file picker + optional caption + optional date); skeleton loading; empty state with CTA; migrated photos show `stageLabel` badge; lightbox on tap; delete per photo with confirmation
4. **Remove** `packages/baby-tracker/src/components/MilestonePhoto.tsx` and `packages/baby-tracker/src/hooks/useBabyPhotos.ts`
5. **Modify** `BabyTracker.tsx`: remove all `useBabyPhotos`, `MilestonePhoto` imports and JSX from stage cards; wire in `<JournalPhotoSection>` wrapped in `<CollapsibleSection storageKey={StorageKeys.BABY_PHOTOS_EXPANDED}>`
6. Write tests: `useJournalPhotos.test.ts`, `JournalPhotoSection.test.tsx`; delete `MilestonePhoto.test.tsx`

### Phase F: US3 — Baby Milestones

1. Add `@mycircle/child-development` as devDependency in `packages/baby-tracker/package.json`
2. Create `packages/baby-tracker/src/hooks/useInfantAchievements.ts`: wraps `GET_INFANT_ACHIEVEMENTS`; `logAchievement(milestoneId, achievedDate, note?)` → `ADD_INFANT_ACHIEVEMENT` (upsert); `updateAchievement(id, ...)` → `UPDATE_INFANT_ACHIEVEMENT`; `clearAchievement(id)` → `DELETE_INFANT_ACHIEVEMENT`; exposes `{ achievementMap, loading, logAchievement, updateAchievement, clearAchievement }` (map keyed by `milestoneId`)
3. Create `packages/baby-tracker/src/components/MilestoneAchievementRow.tsx`: renders `t(milestone.nameKey)`; checkbox; date input when checked; optional note; clear button with confirmation; `isRedFlag` indicator; all buttons `type="button"`; touch targets ≥ 44px
4. Create `packages/baby-tracker/src/components/InfantMilestonesSection.tsx`: calls `getMilestonesByAgeRange` for each of `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m`; groups by domain using `getDomainMeta`; filter toggle: All / Achieved / Upcoming; renders `MilestoneAchievementRow` per milestone; requires `selectedChild` (shows "Select a child" prompt if none)
5. Wire into `BabyTracker.tsx` as third collapsible section
6. Write tests: `useInfantAchievements.test.ts`, `InfantMilestonesSection.test.tsx`

### Phase G: Migration Script

1. Create `scripts/migrate-baby-photos.mjs` using Firebase Admin SDK
2. For each user (or `--uid` arg): read `users/{uid}/babyMilestones/*` docs; for each: skip if `users/{uid}/journalPhotos` already has a doc with matching `storagePath` (idempotent); look up stage name from `babyGrowthData.developmentStages` by `stageId`; write new `users/{uid}/journalPhotos/{uuid}` doc; log progress
3. Does NOT delete old `babyMilestones` docs (leave for manual cleanup post-verification)
4. Print summary: `Migrated N / skipped M photos for uid`

### Phase H: Completion

1. Run `validate_all` MCP tool and fix any gaps
2. Create `docs/specs/009-baby-journal/spec.md` for `spec-check` CI gate
3. Update `docs/architecture.md` with baby-tracker extension note
4. Run full suite: `pnpm lint && pnpm test:run && pnpm typecheck`
5. Run `cd functions && npx tsc --noEmit`

---

## Integration Points Changed (vs. a new MFE)

**Not needed** (extension, not new MFE):
- Shell App.tsx route, vite.config.ts remote, remotes.d.ts, tailwind.config.js content path
- WidgetDashboard, BottomNav, Layout, CommandPalette, routeConfig
- Dockerfile COPY, assemble-firebase.mjs, server/production.ts, root package.json scripts
- New e2e test file (existing `e2e/baby-tracker.spec.ts` can be extended)

**Required** (outside `packages/baby-tracker`):

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add 3 type groups |
| `functions/src/resolvers/{milestoneEvents,journalPhotos,infantAchievements}.ts` | New resolver files |
| `functions/src/handlers/journalPhotos.ts` | New upload handler |
| `functions/src/index.ts` | Export `journalPhotoUpload` |
| `firebase.json` | Add `/journal-photos/upload` rewrite |
| `firestore.rules` | Add 3 subcollection rules |
| `packages/shared/src/apollo/queries.ts` | Add GQL documents |
| `packages/shared/src/StorageKeys.ts` | Add 3 keys |
| `packages/shared/src/i18n/{en,es,zh}.json` | Add i18n keys |
| `packages/shell/src/` | Add `window.__journalPhotos` wrapper |
| `scripts/migrate-baby-photos.mjs` | New migration script |
| `docs/specs/009-baby-journal/spec.md` | `spec-check` CI gate |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Migration script corrupts photo metadata | Low | High | Idempotent; creates new docs only; test with `--uid` before `--all` |
| Removing `useBabyPhotos` breaks existing tests | Medium | Low | Delete `MilestonePhoto.test.tsx`; update `BabyTracker.test.tsx` |
| `@mycircle/child-development` causes Module Federation issue | Low | Medium | devDependency only (no runtime remote); inline milestone data if needed |
| `BabyPhoto` type removal before all users migrate | Low | High | Keep `babyPhotos` query alive until migration confirmed complete |
| Second `pnpm codegen` missed after queries.ts changes | Medium | Low | Phase B step 4 explicitly re-runs codegen |
