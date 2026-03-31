# Implementation Plan: Travel Itinerary Builder Enhancements

**Branch**: `020-travel-itinerary-enhancements` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-travel-itinerary-enhancements/spec.md`

## Summary

Enhance the two existing travel MFEs (`packages/trip-planner` and `packages/travel-map`) by fixing three UX gaps (activity editing, activity notes form field, ticket cost tracking) and adding four new capabilities (trip status, packing checklist, trip duplication, itinerary export). No new MFE, no new backend service, no schema changes — all data additions are additive fields to the existing `Trip` document stored in `users/{uid}/trips` via the shell Firestore bridge.

## Technical Context

**Language/Version**: TypeScript 5.3.3
**Primary Dependencies**: React 18, `@mycircle/shared` (i18n, PageContent, createLogger), Tailwind CSS, MapLibre GL (already in `packages/trip-planner`)
**Storage**: Firestore `users/{uid}/trips` (existing subcollection via `window.__tripPlanner` bridge) + localStorage cache (existing fallback in `useTrips`)
**Testing**: Vitest + React Testing Library (existing `vitest.config.ts` in both packages)
**Target Platform**: Web (React MFE), mobile-first
**Project Type**: Enhancement to two existing MFEs — no new package
**Performance Goals**: UI interactions (edit open, checklist toggle) complete in < 100ms perceived latency
**Constraints**: No new npm dependencies; no new Cloud Functions; offline-capable (localStorage fallback preserved); Firestore document size limit — checklist + itinerary stored as arrays within the single trip document
**Scale/Scope**: Single-user data (trips are per-uid); typical trip has ≤ 14 days, ≤ 10 activities/day, ≤ 50 checklist items

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | Changes are within `packages/trip-planner` and `packages/travel-map`. No direct `@apollo/client` import — existing `useTrips` and `useTravelPins` hooks use the window bridge pattern, not Apollo. No MFE cross-import introduced. |
| II. Complete Integration | PASS | No new MFE is being added — only existing MFEs are modified. No new integration points (routes, nav, widgets) are required. i18n keys MUST be added to all 3 locales. |
| III. GraphQL-First Data Layer | PASS | Trip and pin data already flows through the Firestore window bridge (not GraphQL). This is pre-existing architecture. New fields (status, checklist, ticket cost, activity notes) are additive to the existing bridge payload — no new REST or GraphQL endpoints needed. |
| IV. Inclusive by Default | PASS | All new strings use `t('key')`. All new colours have `dark:` variants. All new interactive elements will have `type="button"`, `aria-label`, and ≥ 44px touch targets. |
| V. Fast Tests, Safe Code | PASS | All new tests mock the window bridge. No network calls in unit tests. Export feature writes to clipboard/download — no external fetch. |
| VI. Simplicity | PASS | All new fields are additive to the existing `Trip` type and document. No new abstraction layers introduced. Checklist stored as an array field on `Trip` (no new collection). Duplicate creates a new trip via existing `addTrip`. Export is a pure formatting function. |

## Project Structure

### Documentation (this feature)

```text
specs/020-travel-itinerary-enhancements/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
packages/trip-planner/
├── src/
│   ├── types.ts                    ← add status, checklist, ticket.cost, activity.notes
│   ├── components/
│   │   ├── TripDetail.tsx          ← edit activity, notes field, ticket cost, checklist, duplicate, export
│   │   ├── TripForm.tsx            ← add status field
│   │   ├── TripList.tsx            ← status badge, richer summary card
│   │   └── ChecklistSection.tsx    ← new component (inline checklist)
│   └── hooks/
│       └── useTrips.ts             ← no changes needed (bridge handles arbitrary fields)
└── test/
    └── (new test files for ChecklistSection, export, duplicate)

packages/travel-map/
└── src/
    └── components/
        └── PinForm.tsx             ← confirm "Plan Trip" present on wishlist pins (likely already works)

packages/shared/
└── src/
    └── i18n/
        ├── en.ts                   ← new keys: tripPlanner.status*, tripPlanner.checklist*, tripPlanner.duplicate, tripPlanner.export*
        ├── es.ts                   ← same keys
        └── zh.ts                   ← same keys
```

**Structure Decision**: Modifications only — no new packages, no new directories beyond `ChecklistSection.tsx` as a new component file within the existing `components/` folder.

## Complexity Tracking

No constitution violations — no entry required.
