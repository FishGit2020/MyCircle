# Implementation Plan: Worship Song Library — Setlist Management

**Branch**: `007-worship-songs` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-worship-songs/spec.md`

## Summary

Add setlist management to the existing `worship-songs` MFE. The song library, ChordPro rendering, transposition, and all existing features are already fully implemented — this plan adds setlists only. Three user stories: (US1) create/manage setlists, (US2) present a setlist live with per-song per-session transposition, (US3) export a setlist as print or text. Implementation extends the existing GraphQL schema and resolver factory pattern with ~5 new files in the MFE and ~3 backend files.

---

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, PageContent) — no new packages
**Storage**: Firestore `worshipSetlists` collection (new, top-level, `createdBy`-scoped) via GraphQL
**Testing**: Vitest + React Testing Library (existing vitest.config.ts in `packages/worship-songs/`)
**Target Platform**: Web (same as existing worship-songs MFE), mobile-first responsive
**Project Type**: Enhancement to existing MFE (not a new MFE)
**Performance Goals**: Song navigation < 1s; setlist list loads < 2s
**Constraints**: No new npm packages, no new Cloud Function endpoint (GraphQL only), no schema changes to existing worship types
**Scale/Scope**: ≤20 songs per setlist; single-user setlists (no sharing)

---

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | All Apollo imports via `@mycircle/shared`; MFE independently buildable |
| II. Complete Integration | ✅ PASS | No new MFE — existing worship-songs routes extend; no new 20-point checklist required |
| III. GraphQL-First | ✅ PASS | New resolver file `worshipSetlists.ts`; schema extension; `pnpm codegen` required |
| IV. Inclusive by Default | ✅ PASS | 19 new i18n keys × 3 locales; dark: variants; aria-labels; touch targets ≥ 44px |
| V. Fast Tests, Safe Code | ✅ PASS | All Apollo calls mocked in tests; `userEvent.setup({ delay: null })` |
| VI. Simplicity | ✅ PASS | No drag-to-reorder (move-up/down buttons); reuses SongViewer for presenter; no PDF generation |

**No violations. No Complexity Tracking entries required.**

---

## Project Structure

### Documentation (this feature)

```text
specs/007-worship-songs/
├── plan.md              ✅ This file
├── research.md          ✅ Phase 0 output
├── data-model.md        ✅ Phase 1 output
├── quickstart.md        ✅ Phase 1 output
├── contracts/
│   └── ui-contracts.md  ✅ Phase 1 output
└── tasks.md             (Phase 2 — /speckit.tasks)
```

### Source Code

```text
# Backend (GraphQL schema + resolver)
functions/src/
├── schema.ts                              MODIFY — add Setlist/SetlistEntry types, queries, mutations
└── resolvers/
    ├── worshipSetlists.ts                 NEW — createWorshipSetlistResolvers() factory
    └── index.ts                           MODIFY — register worshipSetlistResolvers

# Shared (Apollo queries + codegen)
packages/shared/src/apollo/
├── queries.ts                             MODIFY — add GetWorshipSetlists, GetWorshipSetlist, mutations
└── generated.ts                           REGENERATE via pnpm codegen

# MFE (components, hooks, i18n)
packages/worship-songs/src/
├── types.ts                               MODIFY — add Setlist, SetlistEntry, SetlistListItem types
├── hooks/
│   └── useWorshipSetlists.ts              NEW
└── components/
    ├── WorshipSongs.tsx                   MODIFY — add setlist sub-routes/views
    ├── SetlistList.tsx                    NEW
    ├── SetlistEditor.tsx                  NEW
    ├── SetlistPresenter.tsx               NEW
    └── SetlistPrintView.tsx               NEW

# i18n (3 locales)
packages/shared/src/i18n/locales/
├── en.ts                                  MODIFY — 19 new worship.setlist* keys
├── es.ts                                  MODIFY — 19 Spanish translations
└── zh.ts                                  MODIFY — 19 Chinese translations
```

**Structure Decision**: Enhancement to existing MFE sub-structure. No new packages, no new Docker/deploy changes, no shell integration updates (worship route already exists). Backend uses existing resolver factory pattern.

---

## Files to Create (5 new files)

| File | Purpose |
|------|---------|
| `functions/src/resolvers/worshipSetlists.ts` | GraphQL resolver: list, get, add, update, delete setlists |
| `packages/worship-songs/src/hooks/useWorshipSetlists.ts` | Apollo hook wrapping setlist queries/mutations |
| `packages/worship-songs/src/components/SetlistList.tsx` | List of setlists with "New Setlist" button |
| `packages/worship-songs/src/components/SetlistEditor.tsx` | Create/edit setlist: name, date, song search, entry reorder |
| `packages/worship-songs/src/components/SetlistPresenter.tsx` | Present mode: song-by-song navigation wrapping SongViewer |
| `packages/worship-songs/src/components/SetlistPrintView.tsx` | Print-ready multi-song render for export |

---

## Files to Modify (8 existing files)

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add SetlistEntry, Setlist types, inputs, queries, mutations |
| `functions/src/resolvers/index.ts` | Import and register `createWorshipSetlistResolvers()` |
| `packages/shared/src/apollo/queries.ts` | Add fragments + 5 new operations |
| `packages/shared/src/apollo/generated.ts` | Regenerated by `pnpm codegen` |
| `packages/worship-songs/src/types.ts` | Add `Setlist`, `SetlistEntry`, `SetlistListItem` TS types |
| `packages/worship-songs/src/components/WorshipSongs.tsx` | Add setlist view states and routing |
| `packages/shared/src/i18n/locales/en.ts` | 19 new keys |
| `packages/shared/src/i18n/locales/es.ts` | 19 Spanish translations |
| `packages/shared/src/i18n/locales/zh.ts` | 19 Chinese translations |

---

## Implementation Phases

### Phase 1: Backend Schema + Resolver (Foundation)
Extend GraphQL schema → add resolver → run codegen → update shared queries. Nothing in the MFE yet.

### Phase 2: MFE Types + Hook (Foundation)
Add TypeScript types to `types.ts`. Create `useWorshipSetlists.ts` hook that wraps the codegen'd mutations/queries.

### Phase 3: US1 — Setlist Management UI
Create `SetlistList`, `SetlistEditor` components. Wire setlist sub-routes into `WorshipSongs.tsx`. Add i18n keys for US1 operations.

### Phase 4: US2 — Present Mode
Create `SetlistPresenter` component wrapping existing `SongViewer`. Wire present route. Add i18n keys for present mode.

### Phase 5: US3 — Export
Create `SetlistPrintView` component. Add Export button and text export to `SetlistEditor`/detail view. Add i18n keys for export.

### Phase 6: Tests + Polish
Extend `useWorshipSetlists.test.ts`, `SetlistEditor.test.tsx`, `SetlistPresenter.test.tsx`. Run full lint + typecheck + test suite.
