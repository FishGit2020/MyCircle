# Implementation Plan: Transit Tracker Improvements

**Branch**: `028-transit-improvements` | **Date**: 2026-04-29 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-transit-improvements/spec.md`

## Summary

Three focused improvements to the existing `transit-tracker` MFE under a strict resource-light constraint:

1. **Recent-stops cache** — store name/direction/route badges with each recent stop ID so the recent list renders instantly on reopen with zero network calls.
2. **Predictable failure states** — surface explicit, actionable UI for failed manual refresh, denied geolocation, empty arrivals, and zero search matches.
3. **Stale-arrival cleanup on refresh** — omit arrivals more than 60 seconds past predicted time and label recent-past arrivals as "departed" instead of negative ETAs.

Plus a cross-cutting fix: replace the hard-coded `OBA_API_KEY = 'TEST'` in `functions/src/resolvers/transit.ts` with a value read from a Firebase secret.

The work is entirely additive/corrective inside `packages/transit-tracker/` (frontend) and `functions/src/resolvers/transit.ts` (backend secret read). No GraphQL schema changes, no new Cloud Functions, no new external integrations, and no background polling.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: React 18, Tailwind CSS, Apollo Client (consumed via `@mycircle/shared`), Vite Module Federation
**Storage**: `localStorage` for the recent-stops cache (existing key `transit-recent-stops`, schema upgraded); Firebase secret for the OneBusAway API key
**Testing**: Vitest + React Testing Library (per-package), e2e in repo-root `e2e/`
**Target Platform**: MyCircle web monorepo (`packages/transit-tracker` MFE + `functions/` Cloud Functions for resolvers)
**Project Type**: Existing MFE within a pnpm + Vite Module Federation monorepo — no new package created
**Performance Goals**: Recent-stops list renders within 100ms of mount with zero network calls; idle MFE issues zero API calls per second; one upstream call per user-initiated refresh
**Constraints**: No background polling. No auto-refresh. No new external services. No GraphQL schema additions. No new MFE package (so the 20+ MFE-integration checklist does not apply — only i18n keys and existing-package wiring need updating)
**Scale/Scope**: At most 5 cached recent stops per user; existing OneBusAway feed coverage only; 3 user stories (US1 P1, US2 P2, US3 P3)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Federated Isolation | PASS | All Apollo hooks already imported via `@mycircle/shared`; no direct `@apollo/client` imports introduced. |
| II. Complete Integration | PASS | No new MFE created — package, route, nav, widget, Dockerfile, vitest aliases, dev scripts, etc. are unchanged. Only existing i18n keys are added (en/es/zh). |
| III. GraphQL-First | PASS | No schema or resolver-shape changes. The existing `transitArrivals`, `transitStop`, `transitNearbyStops` queries are reused unchanged. The secret-credential fix is internal to the existing resolver. |
| IV. Inclusive by Default | PASS | All new strings ship in en/es/zh (FR-013); all new colors get `dark:` variants (FR-014); existing semantic HTML / aria patterns preserved. |
| V. Fast Tests, Safe Code | PASS | Unit tests mock `localStorage`, `navigator.geolocation`, and Apollo. No `userEvent.type` without `{ delay: null }`. Per-test timeouts ≤ 5000ms. The OneBusAway URL is server-fetched in a Cloud Function — SSRF guard not needed for a single fixed origin, but the secret value MUST be read via `defineSecret` rather than embedded. |
| VI. Simplicity | PASS | Lean scope already enforced via clarification. No abstractions, no helpers, no future-proofing — three small, independent changes. |

**Result**: All gates pass. No Complexity Tracking entries needed.

## Project Structure

### Documentation (this feature)

```text
specs/028-transit-improvements/
├── plan.md              # This file
├── research.md          # Phase 0 — credential strategy, cache schema, stale-filter threshold
├── data-model.md        # Phase 1 — cached recent stop shape + arrival display rules
├── quickstart.md        # Phase 1 — how to verify each user story locally
├── contracts/
│   ├── recent-stops-cache.md  # localStorage schema (key, shape, version field, migration)
│   └── transit-secret.md      # Firebase secret name + resolver wiring contract
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
packages/transit-tracker/
├── src/
│   ├── components/
│   │   ├── TransitTracker.tsx     # CHANGED — load/save richer recent-stops cache; pass entries to StopSearch; failure-state messaging
│   │   ├── StopSearch.tsx         # CHANGED — render recent stops with name + direction + route badges; empty-state UI for no-search-match and denied geolocation
│   │   └── ArrivalsList.tsx       # CHANGED — empty-state UI when arrivals array is empty; "departed" label support
│   ├── hooks/
│   │   ├── useTransitArrivals.ts  # CHANGED — extend stale filter: omit > 60s past, label "departed" within recent past; surface refresh-failure flag distinct from initial error
│   │   ├── useNearbyStops.ts      # CHANGED — distinguish "permission denied" from "no stops found"; expose a permission-state for UI prompt
│   │   └── useFavoriteStops.ts    # UNCHANGED
│   ├── lib/
│   │   └── recentStops.ts         # NEW — load/save/migrate the recent-stops cache (single small module; replaces inline helpers in TransitTracker.tsx)
│   ├── types.ts                   # CHANGED — add RecentStopEntry; add `departed` boolean to ArrivalDeparture display shape
│   └── main.tsx                   # UNCHANGED
└── test/
    ├── setup.ts                   # UNCHANGED
    ├── TransitTracker.test.tsx    # CHANGED — update for new recent-stops rendering; add failure-state tests
    ├── StopSearch.test.tsx        # NEW — empty states, recent-stop rendering with metadata
    ├── recentStops.test.ts        # NEW — load/save/migrate behavior
    └── useTransitArrivals.test.ts # NEW — stale filtering and "departed" labeling

functions/
└── src/
    ├── resolvers/
    │   └── transit.ts             # CHANGED — read OBA_API_KEY from defineSecret('OBA_API_KEY'); fail closed if absent
    └── index.ts                   # CHANGED — register the OBA_API_KEY secret on the function that exposes the GraphQL gateway

packages/shell/
└── src/
    └── i18n/
        ├── locales/en.ts          # CHANGED — add transit.* keys (refreshFailed, retry, locationPermission*, noUpcoming*, noSearchMatch*, departed, stopNotFound)
        ├── locales/es.ts          # CHANGED — same keys (Spanish)
        └── locales/zh.ts          # CHANGED — same keys (Chinese)
```

**Structure Decision**: This is an existing MFE inside the MyCircle monorepo, not a greenfield project. The plan therefore lists only files that change relative to the current tree, plus one small new module (`lib/recentStops.ts`) to keep `TransitTracker.tsx` from gaining more inline helpers. No new package, no new route, no new GraphQL operation.

## Phases (planning artifacts)

- **Phase 0 — Research** → `research.md`. Resolves: how to read a Firebase secret in the existing GraphQL Cloud Function, the localStorage cache shape and migration approach, and the exact stale-prediction threshold semantics.
- **Phase 1 — Design & Contracts** → `data-model.md`, `contracts/recent-stops-cache.md`, `contracts/transit-secret.md`, `quickstart.md`. No GraphQL contract changes.

`/speckit.tasks` will produce `tasks.md` next; this plan stops at Phase 1.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. Section intentionally empty.
