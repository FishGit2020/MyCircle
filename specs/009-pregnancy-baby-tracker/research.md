# Research: Pregnancy & Baby Memory Journal (revised)

**Branch**: `009-pregnancy-baby-tracker` | **Phase**: 0 — Research
**Revision**: Updated to reflect extending `packages/baby-tracker` rather than creating a new MFE.

---

## Decision 1: Extension approach — no new MFE

**Decision**: All new code lives inside `packages/baby-tracker`. No new package, route, Module Federation remote, nav item, widget, Dockerfile entry, or shell integration point is added.

**Rationale**: Confirmed by user. Baby Tracker already owns the `/baby` route and the child profile infrastructure. Adding features as collapsible sections preserves the existing UX without fragmenting the experience across two MFEs.

**Alternatives considered**: New `packages/baby-journal` MFE — rejected by user.

---

## Decision 2: UI — collapsible card sections on existing scroll page

**Decision**: Three new collapsible sections appended below the existing pregnancy content:
1. **My Moments** — milestone event log
2. **Photo Album** — unified photo journal
3. **Baby Milestones** — infant achievement tracker (0–18 months)

**Rationale**: Confirmed by user. Baby Tracker is already a single scrolling page; collapsible sections follow the existing card pattern and avoid introducing a new tab/nav paradigm into the component.

**Implementation note**: A reusable `CollapsibleSection.tsx` component with expand/collapse toggle, persisting open/closed state in `localStorage`.

---

## Decision 3: Photo journal replaces per-stage milestone photos

**Decision**: The existing `useBabyPhotos` hook, `MilestonePhoto` component, `babyPhotos` resolver, and per-stage photo UI are **removed**. Replaced by a unified `JournalPhoto` entity with free-form date, caption, and optional stage label for migrated photos. A one-time migration script is provided.

**Migration path**:
- Existing Firestore `users/{uid}/babyMilestones/{stageId}` docs → new `users/{uid}/journalPhotos/{uuid}` docs
- Cloud Storage files at `users/{uid}/baby-photos/{stageId}.jpg` are kept at their current paths (no file copy) — migrated `journalPhotos` docs simply reference the original `photoUrl`
- New uploads go to `users/{uid}/journal-photos/{uuid}.jpg` (distinct prefix)
- Migration script (`scripts/migrate-baby-photos.mjs`) is idempotent: checks for existing migrated docs before creating

**Rationale**: Unification confirmed by user. Keeping existing storage files at their paths avoids expensive server-side copy operations and preserves existing signed URLs.

---

## Decision 4: New Cloud Function handler for journal photo uploads

**Decision**: Add a new `journalPhotoUpload` Cloud Function handler at `/journal-photos/upload`. The shell exposes `window.__journalPhotos.upload(file, options)` following the same pattern as `window.__babyPhotos`. The existing `window.__babyPhotos` and its handler are removed after the per-stage photo UI is dropped.

**Rationale**: The new upload is conceptually different — no `stageId`, accepts a `photoDate`, and writes to a different Firestore collection and Storage path. Reusing the old handler would require significant conditional branching. A clean new handler is simpler.

**Upload encoding**: Keep base64 JSON POST (same as existing) for consistency with the shell pattern. Max file size: 5 MB (same as existing).

---

## Decision 5: Infant milestones scope (0–18 months, 115 milestones)

**Decision**: Import `getMilestonesByAgeRange` from `@mycircle/child-development` and filter to the five infant age bands: `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m` (115 milestones: 25 + 25 + 25 + 20 + 20).

**Rationale**: Confirmed by user — Baby Tracker's `babyFilter` already gates to children under 12 months or with a due date. Showing toddler/teen milestones here would be misleading. Older milestones remain in Child Development MFE.

**Import note**: `@mycircle/child-development` needs to be added as a `devDependency` (build-time static data) in `packages/baby-tracker/package.json`. No runtime Module Federation dependency.

---

## Decision 6: GraphQL schema — add new types, deprecate BabyPhoto

**Decision**: Add `MilestoneEvent`, `JournalPhoto`, and `InfantAchievement` types to `functions/src/schema.ts`. Deprecate (but do not immediately remove) `BabyPhoto` type and `babyPhotos` query — keep them alive until the migration script has been run. Mark `deleteBabyPhoto` mutation as still available for the migration script cleanup phase.

**Rationale**: Immediate removal of `BabyPhoto` would break existing users who haven't run the migration. Safe deprecation window.

---

## Decision 7: Collapsible section state persistence

**Decision**: Each section's open/closed state is persisted in `localStorage` under keys like `StorageKeys.BABY_EVENTS_EXPANDED`, `StorageKeys.BABY_PHOTOS_EXPANDED`, `StorageKeys.BABY_MILESTONES_EXPANDED`. Default: all sections collapsed on first visit (to avoid overwhelming the page).

**Rationale**: Consistent with Baby Tracker's existing `localStorage` usage for preferences. No Firestore round-trip needed for UI state.

---

## Decision 8: DevelopmentalAchievement uniqueness — upsert by (childId, milestoneId)

**Decision**: The resolver enforces one achievement record per `(childId, milestoneId)` pair via an upsert (query for existing → replace if found). Not enforced at the Firestore level (no composite index constraint), which is acceptable for private personal data with low write contention.

**Rationale**: Matches the pattern established in earlier research. Firestore doesn't support unique constraints natively; client-side upsert is the standard pattern in this codebase.
