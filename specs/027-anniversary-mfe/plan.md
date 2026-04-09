# Implementation Plan: Anniversary Tracker

**Branch**: `027-anniversary-mfe` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-anniversary-mfe/spec.md`

## Summary

A new micro-frontend for tracking anniversaries with per-user ownership and contributor sharing. Users create anniversaries with a date and optional location; the system auto-generates yearly placeholder entries. The landing page shows a list of all anniversaries plus a MapLibre map with location pins. A drilldown page presents a timeline of yearly tiles where users can capture activity, notes, pictures, and location. Owners can search existing users by email and add them as contributors with equal edit access. A dashboard widget displays the countdown to the next anniversary and years elapsed. Integrated into the shell via Family nav group, bottom nav, command palette, and breadcrumbs.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)
**Primary Dependencies**: React 18, Tailwind CSS, Apollo Client (via `@mycircle/shared`), MapLibre GL (via `@mycircle/shared`), Vite Module Federation
**Storage**: Firestore (top-level `anniversaries/` collection + `years/` subcollection), Firebase Storage (pictures)
**Testing**: Vitest, React Testing Library, jsdom
**Target Platform**: Web (PWA), mobile-responsive
**Project Type**: Micro-frontend (federated module in pnpm monorepo)
**Performance Goals**: Landing page loads in < 2s, search results in < 1s, picture upload < 5s per image
**Constraints**: Max 10 pictures per yearly entry, max 10 contributors per anniversary, max 10 MB per image
**Scale/Scope**: Personal/family use — typically 1-5 anniversaries per user, each with 1-50 yearly entries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Research Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | New MFE package with Module Federation; all shared imports via `@mycircle/shared` |
| II. Complete Integration | PASS | Plan addresses all 20+ integration points (see quickstart.md) |
| III. GraphQL-First Data Layer | PASS | All data operations via GraphQL queries/mutations; no REST endpoints for MFE data |
| IV. Inclusive by Default | PASS | i18n (3 locales), dark mode, semantic HTML, aria-labels, mobile-first planned |
| V. Fast Tests, Safe Code | PASS | Vitest with mocked network calls; `userEvent.setup({ delay: null })`; input validation at system boundaries |
| VI. Simplicity | PASS | Minimal viable approach — no over-engineering; follows existing patterns |

### Post-Design Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | `packages/anniversary/` is independently buildable; exposes single component via federation |
| II. Complete Integration | PASS | All integration points enumerated in quickstart.md |
| III. GraphQL-First Data Layer | PASS | Schema contract defined in `contracts/graphql-schema.md`; resolver factory pattern followed |
| IV. Inclusive by Default | PASS | All UI strings use `t('key')`; dark variants required; `<PageContent>` wrapper |
| V. Fast Tests, Safe Code | PASS | All hooks mock GraphQL; no real network calls in unit tests; server-side image validation |
| VI. Simplicity | PASS | No unnecessary abstractions; shared map hook reused; existing upload pattern reused |

## Project Structure

### Documentation (this feature)

```text
specs/027-anniversary-mfe/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── graphql-schema.md
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/anniversary/
├── src/
│   ├── components/
│   │   ├── Anniversary.tsx           # Main entry — landing page (list + map)
│   │   ├── AnniversaryDetail.tsx     # Drilldown — yearly timeline
│   │   ├── AnniversaryForm.tsx       # Create/edit anniversary dialog
│   │   ├── YearlyTile.tsx            # Single year card in timeline
│   │   ├── YearlyEditor.tsx          # Edit form for year (activity, notes, pics, location)
│   │   ├── AnniversaryMap.tsx        # MapLibre map with location pins
│   │   ├── PictureGallery.tsx        # Upload + display image gallery
│   │   ├── ContributorManager.tsx    # Contributor list + add/remove
│   │   └── UserSearch.tsx            # Email-based user search
│   ├── hooks/
│   │   ├── useAnniversaries.ts       # Query: all user's anniversaries
│   │   ├── useAnniversaryDetail.ts   # Query: single anniversary + years
│   │   └── useAnniversaryMutations.ts # All mutations
│   ├── main.tsx                      # Standalone dev entry
│   └── index.css
├── test/
│   └── setup.ts
├── vite.config.ts
├── vitest.config.ts
├── package.json
├── tsconfig.json
└── postcss.config.js

packages/shell/src/components/widgets/
└── AnniversaryWidget.tsx             # Dashboard countdown widget

functions/src/resolvers/
└── anniversary.ts                    # GraphQL resolver factory
```

**Structure Decision**: Standard MFE package following established patterns (`weather-display`, `baby-tracker`, `travel-map`). Components organized by page/feature. Hooks separate query/mutation logic. Widget lives in shell's widget directory. Resolver follows factory pattern in functions.

## Design Decisions

### D1: Top-Level Firestore Collection

Anniversary data lives in `anniversaries/{id}` (not nested under `users/{uid}/`) to support shared access. See [research.md — R1](./research.md#r1-data-storage--top-level-vs-user-scoped-collection).

### D2: Year Subcollection

Yearly entries are stored as subcollection documents (`years/{yearNumber}`) to handle variable content size (up to 10 pictures metadata per year). See [research.md — R2](./research.md#r2-yearly-entries--subcollection-vs-array).

### D3: Email-Based Contributor Search

Contributors are added by email address using Firebase Admin `getUserByEmail()`. This matches the existing cloud-files sharing pattern. See [research.md — R3](./research.md#r3-contributor-user-search).

### D4: GraphQL Image Upload

Pictures uploaded as base64 via GraphQL mutation, processed server-side using the shared `uploadToStorage()` helper. See [research.md — R4](./research.md#r4-image-upload-flow).

### D5: Shared Map Hook

Uses `useMapLibre` from `@mycircle/shared` with GeoJSON pin markers, following the travel-map MFE pattern. See [research.md — R5](./research.md#r5-map-integration).

### D6: Client-Side Widget Countdown

Pure date arithmetic in the widget component — no server calls for countdown. See [research.md — R6](./research.md#r6-widget-countdown-logic).

### D7: Dev Port 3034

Next available sequential port after existing MFEs. See [research.md — R7](./research.md#r7-dev-server-port).

## Complexity Tracking

> No constitution violations. All design decisions follow established patterns.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none)    | —          | —                                   |
