# Implementation Plan: Resume Tailor AI

**Branch**: `015-resume-tailor` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/015-resume-tailor/spec.md`

## Summary

Build a new MyCircle MFE at `/resume-tailor` that ports all features from the `resume-tailor-ai` reference repository into the MyCircle monorepo. Users maintain a "fact bank" of professional experiences, paste a job description URL or text, and receive an AI-tailored resume with ATS keyword scoring — then download a print-CSS-based PDF and track their application history. Data is stored in Firestore via GraphQL; binary file uploads use a REST Cloud Function following the established `cloudFiles` pattern; the AI generation pipeline uses GraphQL mutations calling the OpenAI API (SDK already in `functions/`).

---

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend), React 18
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, i18n, PageContent, StorageKeys), `@originjs/vite-plugin-federation` (MFE), `openai@^4.73.0` (already in `functions/`), `mammoth` (new — DOCX parsing), `pdfjs-dist` (new — PDF text extraction), `cheerio` (already in `functions/` — URL scraping)
**Storage**: Firestore `users/{uid}/resumeFactBank/default` (fact bank document), `users/{uid}/resumeApplications/{appId}` (application log subcollection)
**Testing**: Vitest + React Testing Library (frontend), `cd functions && npx tsc --noEmit` (backend)
**Target Platform**: Web (Module Federation MFE, same as all other MFEs)
**Project Type**: Micro-frontend + Cloud Functions (GraphQL resolvers + REST upload handler)
**Performance Goals**: Resume generation completes within 30 seconds; ATS score recalculation is instant (client-side, no API call); file upload and parse within 15 seconds
**Constraints**: MFE must be independently buildable; no `100vh` calculations; no direct `@apollo/client` imports; all strings via `t('key')` with 3 locale files; every color needs `dark:` variant; touch targets ≥ 44px
**Scale/Scope**: Single-user personal tool; Firestore document limits not a concern; OpenAI API latency is the primary constraint

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Federated Isolation ✅

- New `@mycircle/resume-tailor` package is independently buildable (own `vite.config.ts`, `package.json`, port 3023)
- All shared hooks and Apollo operations imported from `@mycircle/shared`, never from `@apollo/client` directly
- MFE exposes `./ResumeTailor` via Module Federation

### II. Complete Integration ✅

All 23+ integration points are documented in `quickstart.md`:
- Shell: `App.tsx`, `vite.config.ts`, `navConfig.ts`, `routeConfig.ts`, `widgetConfig.ts`, `CommandPalette.tsx`, `tailwind.config.js`, `remotes.d.ts`, test mocks, vitest aliases
- Deployment: `Dockerfile`, `assemble-firebase.mjs`, `server/production.ts`
- i18n: all 3 locales
- Root `package.json`: `dev:resume-tailor`, `preview:resume-tailor`, added to `dev` and `dev:mf`
- AI Tools: `mcp-tools/mfe-tools.ts`
- Docs: `docs/specs/015-resume-tailor/spec.md` (for `spec-check` CI gate)
- Firestore rules for new subcollections

### III. GraphQL-First Data Layer ✅ (with justified REST)

**GraphQL** for all data operations:
- `resumeFactBank` query + `saveResumeFactBank` mutation (CRUD for fact bank)
- `resumeApplications` query + `saveResumeApplication` / `deleteResumeApplication` mutations
- `scrapeJobUrl` query (server-side URL fetch, returns text)
- `generateResume` mutation (AI pipeline — follows `runBenchmark` pattern)
- `boostAtsScore` mutation (aggressive AI pass)

**REST exception** (two endpoints, both justified):
1. `POST /resume-tailor/upload` — binary file input (PDF/DOCX); follows established `cloudFiles`/`babyPhotos` pattern; justified because GraphQL is not suited for binary data upload

See Complexity Tracking below for formal justification table.

### IV. Inclusive by Default ✅

- All visible strings use `t('key')` — complete key list in `quickstart.md` Step 6
- All Tailwind colors require `dark:` variants (follow digital-library patterns)
- Semantic HTML: upload button (`<input type="file">`), edit controls with `aria-label`, `type="button"` on all non-submit buttons
- Touch targets ≥ 44px enforced via `min-h-[44px] min-w-[44px]` on interactive elements
- Mobile-first layout using `<PageContent>` from `@mycircle/shared`

### V. Fast Tests, Safe Code ✅

- Unit tests mock OpenAI API, GraphQL mutations, and file upload bridge
- `userEvent.setup({ delay: null })` for all interaction tests
- `scrapeJobUrl` resolver validates URL scheme (`https:` only) and blocks private IP ranges (SSRF protection per Constitution Principle V)
- File upload resolver validates content type against whitelist before processing
- `OPENAI_API_KEY` stored as Firebase secret, set with `printf` not `echo`

### VI. Simplicity ✅

- PDF generation: browser `window.print()` + print CSS — zero new frontend dependencies, zero new backend endpoint for PDF
- ATS recalculation: pure TypeScript function (no API call after inline edits)
- Fact bank auto-save: `useRef` + `setTimeout` debounce (3 lines, no library)
- No new charting library for ATS score — simple progress bar components with Tailwind

---

## Project Structure

### Documentation (this feature)

```text
specs/015-resume-tailor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output — 10 decisions documented
├── data-model.md        # Phase 1 output — entities + Firestore paths
├── quickstart.md        # Phase 1 output — 10-step implementation guide
├── contracts/
│   ├── graphql-schema.md   # GraphQL type/query/mutation additions
│   └── rest-api.md         # REST upload endpoint specification
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created yet)
```

### Source Code (repository root)

```text
# Backend (Cloud Functions)
functions/src/
├── handlers/
│   └── resumeTailor.ts          # REST: POST /resume-tailor/upload (file parse)
├── resolvers/
│   └── resumeTailor.ts          # GraphQL: fact bank, generate, boost, applications, scrape
└── schema.ts                     # Extended with 15 new types + 5 queries + 5 mutations

# Shared (Apollo queries + i18n)
packages/shared/src/
├── apollo/
│   └── queries.ts               # 7 new query/mutation constants
└── i18n/locales/
    ├── en.ts                    # resumeTailor.* keys
    ├── es.ts                    # resumeTailor.* keys (Unicode escapes)
    └── zh.ts                    # resumeTailor.* keys (Unicode escapes)

# New MFE Package
packages/resume-tailor/
├── src/
│   ├── main.tsx                 # Standalone dev entry
│   └── components/
│       ├── ResumeTailor.tsx              # Tab controller (Fact Bank / Generate / Applications)
│       ├── FactBankEditor.tsx            # Upload area + experience/education/skills editor
│       ├── ExperienceCard.tsx            # Single experience with version switcher + inline edit
│       ├── ResumeGenerator.tsx           # JD input (URL toggle / paste area) + action buttons
│       ├── GeneratedResumeView.tsx       # Inline-editable resume output + print CSS target
│       ├── AtsScoreCard.tsx              # Before/after donut or bar + improvement badge
│       ├── KeywordReportPanel.tsx        # Collapsible category breakdown + coverage chips
│       └── ApplicationsLog.tsx           # Sorted list + expand/delete + export/import JSON
│   └── hooks/
│       ├── useFactBank.ts               # GET_RESUME_FACT_BANK + debounced SAVE_RESUME_FACT_BANK
│       ├── useResumeGeneration.ts        # GENERATE_RESUME + BOOST_ATS_SCORE + atsRecalculate()
│       └── useApplicationsLog.ts         # GET_RESUME_APPLICATIONS + SAVE + DELETE mutations
├── test/
│   └── setup.ts
├── package.json                 # @mycircle/resume-tailor, port 3023
├── vite.config.ts               # federation name: resumeTailor, exposes ./ResumeTailor
├── vitest.config.ts
├── tsconfig.json
└── tsconfig.node.json

# Shell (integration points — see quickstart.md for full list)
packages/shell/src/
├── App.tsx                      # Lazy import + route /resume-tailor
├── vite.config.ts               # resumeTailor remote URL (dev:3023, prod:/resume-tailor/assets/...)
├── lib/
│   ├── navConfig.ts             # ROUTE_MODULE_MAP + NAV_GROUPS + ALL_NAV_ITEMS
│   └── firebase.ts              # window.__resumeTailor bridge
├── routeConfig.ts               # 'resume-tailor': 'nav.resumeTailor'
├── components/
│   ├── layout/CommandPalette.tsx    # goToResumeTailor key
│   └── widgets/
│       ├── widgetConfig.ts          # WidgetType union + registration
│       └── ResumeTailorWidget.tsx   # Widget showing latest application ATS score
└── tailwind.config.js           # content path for packages/resume-tailor/src

# Deployment
deploy/docker/Dockerfile         # COPY for resume-tailor in build + runtime stages
scripts/assemble-firebase.mjs    # mfeDirs array addition
server/production.ts             # MFE_PREFIXES addition

# Config
firebase.json                    # /resume-tailor/** rewrite → resumeTailor function
firestore.rules                  # resumeFactBank + resumeApplications rules
root package.json                # dev:resume-tailor, preview:resume-tailor, concurrently commands
```

**Structure Decision**: Follows the established MyCircle MFE pattern (Option 2 — web application with MFE frontend + Cloud Functions backend). Backend resolvers live in `functions/src/resolvers/resumeTailor.ts`; REST handler in `functions/src/handlers/resumeTailor.ts`. Frontend package at `packages/resume-tailor/` using the digital-library package as the structural template.

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| REST endpoint `POST /resume-tailor/upload` | Resume files (PDF, DOCX) are binary data sent as base64; server-side PDF.js and mammoth parsing require Node.js runtime | GraphQL mutations are JSON-only; large base64 binary payloads over GraphQL hit Apollo's body size limits and add unnecessary overhead; binary-to-text encoding is not suited for the mutation pattern. The established `cloudFiles` and `babyPhotos` patterns confirm REST for binary uploads is the project standard. |
| Two new `functions/` dependencies (`mammoth`, `pdfjs-dist`) | DOCX and PDF parsing require Node.js runtime libraries unavailable in browser | Client-side parsing libraries are too large for MFE bundles and lack the reliability of server-side parsing; `cheerio` is already in `functions/` confirming the pattern of adding parsing utilities server-side |
