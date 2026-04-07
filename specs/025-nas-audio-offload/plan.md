# Implementation Plan: Synology NAS Integration for Digital Library Audio Offload

**Branch**: `025-nas-audio-offload` | **Date**: 2026-04-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/025-nas-audio-offload/spec.md`

## Summary

Add Synology NAS cold-storage offload for TTS-converted audiobook chapters. Users configure a NAS connection in Setup, then offload (or batch-offload) audio chapters to NAS — freeing Firebase Storage — and restore on demand. Firebase Storage remains the sole playback layer. Implementation follows the existing SQL connection pattern exactly: `nasClient.ts` → `resolvers/nas.ts` → GraphQL schema extension → shared queries → Setup NAS tab → Digital Library chapter UI.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions Node 22)
**Primary Dependencies**: React 18, Apollo Client via `@mycircle/shared`, Firebase Admin SDK, `form-data` (Node built-in, no new dep needed for multipart), `node-fetch` (already in functions)
**Storage**: Firestore `users/{uid}/nasConnection/config` (NAS config) + `books/{bookId}/chapters/{chapterId}` (new `nasArchived`/`nasPath` fields) + Firebase Storage (audio serving)
**Testing**: Vitest, React Testing Library (existing)
**Target Platform**: Firebase Cloud Functions (backend) + Vite MFE (frontend)
**Project Type**: Monorepo MFE feature — backend resolver + existing MFE UI extension (no new MFE package)
**Performance Goals**: Single-chapter offload/restore under 60s; batch 20-chapter offload within 540s Cloud Function timeout
**Constraints**: NAS is cold storage only — no direct streaming; credentials never returned via GraphQL; synchronous mutations (no job queue)
**Scale/Scope**: Per-user feature; one NAS connection per user; extends 2 existing packages (setup, digital-library)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | No new MFE. All shared hooks/types via `@mycircle/shared`. No direct `@apollo/client` imports in MFEs. |
| II. Complete Integration | ✅ PASS | No new MFE — no 20-point checklist required. Extends existing `setup` and `digital-library` packages. `validate_all` must pass before merge. |
| III. GraphQL-First Data Layer | ✅ PASS | All NAS operations go through new GraphQL mutations/queries. No REST endpoints added for MFE data. (NAS FileStation API is a third-party API accessed server-side only — acceptable under exception.) |
| IV. Inclusive by Default | ✅ PASS | All new strings use `t('key')`. Keys added to all 3 locales. Dark mode variants on all new Tailwind classes. Semantic HTML, `type="button"`, touch targets ≥44px. |
| V. Fast Tests, Safe Code | ✅ PASS | Unit tests mock all network/NAS calls. Credentials never logged. NAS URL is user-supplied external URL — no SSRF risk since it's the user's own server, but URL validation via Zod still applied. |
| VI. Simplicity | ✅ PASS | Follows the established SQL connection pattern exactly. No new abstractions. No job queue (synchronous mutations sufficient for file sizes). |

No violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/025-nas-audio-offload/
├── plan.md              ← This file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── graphql.md       ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
functions/src/
├── nasClient.ts                     ← NEW: Synology FileStation client + cache
└── resolvers/
    ├── nas.ts                       ← NEW: NAS query + mutation resolvers
    ├── index.ts                     ← MODIFY: import + spread NAS resolvers
    └── digitalLibrary.ts            ← MODIFY: add nasArchived/nasPath to bookChapters

packages/shared/src/apollo/
└── queries.ts                       ← MODIFY: extend GET_BOOK_CHAPTERS + add NAS queries/mutations

packages/setup/src/components/
├── Setup.tsx                        ← MODIFY: add NAS tab
└── NasConnectionSection.tsx         ← NEW: NAS connection form (mirrors SqlConnectionSection)

packages/digital-library/src/components/
└── ChapterConvertList.tsx           ← MODIFY: NAS offload/restore buttons + batch action

packages/shared/src/i18n/locales/
├── en.ts                            ← MODIFY: ~20 new setup.nas.* + library.nas.* keys
├── zh.ts                            ← MODIFY: Chinese translations
└── es.ts                            ← MODIFY: Spanish translations (Unicode escapes)

firestore.rules                      ← MODIFY: explicit nasConnection subcollection rule
```

**Structure Decision**: Two-tier split — all server-side NAS logic in `functions/src/`, UI split between `packages/setup` (connection management) and `packages/digital-library` (chapter actions). No new packages. Follows SQL analytics feature structure exactly.
