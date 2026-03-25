# Tasks: Resume Tailor AI

**Input**: Design documents from `/specs/015-resume-tailor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tests are not included (not requested in spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (MFE Package Scaffolding)

**Purpose**: Create the `packages/resume-tailor/` package with all boilerplate. These tasks are all parallelizable once the directory exists.

- [ ] T001 Create directory `packages/resume-tailor/src/components/` and `packages/resume-tailor/src/hooks/` and `packages/resume-tailor/test/`
- [ ] T002 [P] Create `packages/resume-tailor/package.json` — name `@mycircle/resume-tailor`, port 3023, scripts `dev/build/preview/test/test:run/test:coverage`, deps `@mycircle/shared react react-dom react-router`, devDeps mirror `packages/digital-library/package.json`
- [ ] T003 [P] Create `packages/resume-tailor/vite.config.ts` — federation `name: 'resumeTailor'`, `filename: 'remoteEntry.js'`, exposes `'./ResumeTailor': './src/components/ResumeTailor.tsx'`, shared singletons (react, react-dom, react-router, @mycircle/shared), port 3023
- [ ] T004 [P] Create `packages/resume-tailor/tsconfig.json` and `packages/resume-tailor/tsconfig.node.json` — copy pattern from `packages/digital-library/`
- [ ] T005 [P] Create `packages/resume-tailor/vitest.config.ts` and `packages/resume-tailor/test/setup.ts` — copy and adapt from `packages/digital-library/`
- [ ] T006 [P] Create `packages/resume-tailor/index.html` (standalone dev HTML) and `packages/resume-tailor/postcss.config.js`

**Checkpoint**: `pnpm --filter @mycircle/resume-tailor build` completes without error

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: GraphQL schema, shared queries, i18n, Firestore rules, and OpenAI secret. MUST complete before any user story implementation.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T007 Add `"mammoth": "^1.8.0"` and `"pdfjs-dist": "^4.0.0"` to `functions/package.json` dependencies; run `cd functions && npm install`
- [ ] T008 Add all 15 new GraphQL types (ResumeContact, ResumeVersion, ResumeExperience, ResumeEducation, ResumeProject, ResumeFactBank, ResumeAtsScore, ResumeKeywordReport, GeneratedResumeResult, ResumeApplication, and corresponding Input types) plus `scrapeJobUrl`/`resumeFactBank`/`resumeApplications` to `type Query` and all 5 mutations to `type Mutation` in `functions/src/schema.ts` — see `contracts/graphql-schema.md` for exact SDL
- [ ] T009 [P] Add 7 new Apollo client constants (`GET_RESUME_FACT_BANK`, `GET_RESUME_APPLICATIONS`, `SCRAPE_JOB_URL`, `SAVE_RESUME_FACT_BANK`, `GENERATE_RESUME`, `BOOST_ATS_SCORE`, `SAVE_RESUME_APPLICATION`, `DELETE_RESUME_APPLICATION`) to `packages/shared/src/apollo/queries.ts` — see `contracts/graphql-schema.md` for exact gql strings
- [ ] T010 [P] Add all `resumeTailor.*`, `nav.resumeTailor`, and `commandPalette.goToResumeTailor` i18n keys to `packages/shared/src/i18n/locales/en.ts`; add translated equivalents (Unicode escapes) to `packages/shared/src/i18n/locales/es.ts` and `packages/shared/src/i18n/locales/zh.ts` — see `quickstart.md` Step 6 for full key list
- [ ] T011 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` from updated schema; commit the generated file
- [ ] T012 [P] Add Firestore security rules for `users/{uid}/resumeFactBank/{docId}` (read/write if `request.auth.uid == uid`) and `users/{uid}/resumeApplications/{appId}` (read/write/delete if `request.auth.uid == uid`) in `firestore.rules`
- [ ] T013 [P] Set up `OPENAI_API_KEY` Firebase secret using `printf` (not echo): `printf "sk-proj-..." | npx firebase functions:secrets:set OPENAI_API_KEY` then grant compute SA access via `gcloud secrets add-iam-policy-binding OPENAI_API_KEY --project=mycircle-dash --member="serviceAccount:441498720264-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"`
- [ ] T014 [P] Create `packages/resume-tailor/src/components/ResumeTailor.tsx` — tab controller rendering three tabs (Fact Bank / Generate / Applications) using `useTranslation`, `PageContent` from `@mycircle/shared`; stub tab content panels as placeholders
- [ ] T015 Create `packages/resume-tailor/src/main.tsx` standalone dev entry wrapping `<ResumeTailor />`; run `pnpm build:shared` to verify schema + codegen + i18n compile cleanly

**Checkpoint**: `pnpm build:shared` passes; `pnpm --filter @mycircle/resume-tailor build` passes; codegen types include ResumeFactBank, GeneratedResumeResult

---

## Phase 3: User Story 1 — Build & Manage Experience Fact Bank (Priority: P1) 🎯 MVP

**Goal**: Users can upload resume files (PDF/DOCX/text), have their experience extracted and structured, then view, edit, and save their fact bank. Data persists to Firestore across sessions.

**Independent Test**: Upload a PDF resume → verify contact info and experiences are extracted and displayed → edit a bullet point → reload the page → confirm the edit persisted

### Implementation for User Story 1

- [ ] T016 [US1] Create `functions/src/resolvers/resumeTailor.ts` — implement `createResumeTailorQueryResolvers()` with `resumeFactBank` resolver: reads `users/{uid}/resumeFactBank/default` from Firestore, returns typed object with `updatedAt` converted from Timestamp; implement `createResumeTailorMutationResolvers()` with `saveResumeFactBank` resolver: writes full document to `users/{uid}/resumeFactBank/default` with `FieldValue.serverTimestamp()` on updatedAt — follow `notes.ts` resolver pattern with `requireAuth()` and `GraphQLError`
- [ ] T017 [US1] Register `createResumeTailorQueryResolvers` and `createResumeTailorMutationResolvers` in `functions/src/resolvers/index.ts` — add import, spread into Query/Mutation objects, pass `() => openAiKey` closure; add `'OPENAI_API_KEY'` to the `secrets` array in `functions/src/handlers/graphql.ts` and wire `const openAiKey = process.env.OPENAI_API_KEY || ''` into `getServer()`
- [ ] T018 [P] [US1] Create `functions/src/handlers/resumeTailor.ts` — `onRequest` Cloud Function handling `POST /resume-tailor/upload`: verify Firebase ID token, rate limit (10 req/min per IP via NodeCache), validate request schema with Zod (`{ fileName, fileBase64, contentType }`), check content type against allowlist (PDF/DOCX/DOC/text), decode base64, enforce 5MB limit, parse file (pdfjs-dist for PDF, mammoth for DOCX, raw string for text), call OpenAI API to structure extracted text into fact bank JSON (JSON mode, temperature 0.1), return structured fact bank partial object — see `contracts/rest-api.md` for full request/response spec
- [ ] T019 [P] [US1] Export `resumeTailor` handler from `functions/src/index.ts`; add `{ "source": "/resume-tailor/**", "function": "resumeTailor" }` rewrite to `firebase.json` before the catch-all rule
- [ ] T020 [P] [US1] Add `window.__resumeTailor.uploadAndParse()` bridge to `packages/shell/src/lib/firebase.ts` — fetch Firebase ID token, POST to `/resume-tailor/upload`, return parsed JSON; add Window interface extension to type globals file — see `contracts/rest-api.md` for bridge implementation
- [ ] T021 [US1] Create `packages/resume-tailor/src/hooks/useFactBank.ts` — `GET_RESUME_FACT_BANK` query, `SAVE_RESUME_FACT_BANK` mutation, `debouncedSave(factBank)` function (1-second debounce via `useRef`+`setTimeout`), `uploadAndParse(file)` calling `window.__resumeTailor.uploadAndParse()` then merging result into local state; exports `{ factBank, loading, uploadAndParse, updateContact, updateExperience, addExperience, deleteExperience, addVersion, updateVersion, deleteVersion, updateEducation, addEducation, deleteEducation, updateSkills, updateProjects, exportJson, importJson }`
- [ ] T022 [P] [US1] Create `packages/resume-tailor/src/components/ExperienceCard.tsx` — displays one experience (company, dates, location) with a version selector tab (title pills), editable bullets list with add/delete, hover-reveal delete row button; emits `onChange(updated: ResumeExperience)` and `onDelete(id)` callbacks; uses `type="button"` on all non-submit buttons; `aria-label` on delete controls; touch targets ≥ 44px
- [ ] T023 [US1] Create `packages/resume-tailor/src/components/FactBankEditor.tsx` — file drop zone accepting PDF/DOCX/text with upload button, displays `ExperienceCard` per experience (add/reorder), education list (add/edit/delete), skills textarea (comma-separated categories), projects list (add/edit/delete); Export JSON button (`type="button"`); Import JSON file input; loading/saving status indicator; all labels via `t('resumeTailor.factBank.*')` keys; dark mode variants on all colors
- [ ] T024 [US1] Wire `FactBankEditor` into the Fact Bank tab in `packages/resume-tailor/src/components/ResumeTailor.tsx` using `useFactBank` hook; ensure `<PageContent>` wraps the tab content

**Checkpoint**: Upload a real PDF → fact bank populated → edit a bullet → wait 1 second → reload page → edit persisted in Firestore

---

## Phase 4: User Story 2 — Generate AI-Tailored Resume (Priority: P1)

**Goal**: Users paste a job description URL or text, click Generate, and receive a tailored resume with before/after ATS scores and a keyword report within 30 seconds.

**Independent Test**: Paste a job description → click Generate → within 30 seconds, a resume is displayed with distinct before/after ATS scores and a keyword breakdown — verifiable without downloading or saving

### Implementation for User Story 2

- [ ] T025 [US2] Add `generateResume` mutation resolver to `functions/src/resolvers/resumeTailor.ts` — reads user's fact bank from Firestore, runs 4 OpenAI calls: (1) keyword report extraction from JD (JSON mode, temp 0.1) and (2) version selection per company (JSON mode, temp 0.1) in parallel via `Promise.all`; then (3) bullet rewrite for missing keywords (JSON mode, temp 0.2) and (4) skills reorganization into 2–3 categories (JSON mode, temp 0.2) in parallel; calculates before/after ATS scores using weighted keyword matching (hardSkills 2x, titleKeywords 1.5x, businessContext 1x) with suffix-based stemming; returns `GeneratedResumeResult`
- [ ] T026 [P] [US2] Add `boostAtsScore` mutation resolver to `functions/src/resolvers/resumeTailor.ts` — accepts `resumeJson` (stringified current resume) and `jdText`; runs aggressive rewrite pass (temp 0.3) to insert remaining missing business context and hard skill keywords naturally into bullets; re-calculates ATS score; returns updated `GeneratedResumeResult`
- [ ] T027 [P] [US2] Add `scrapeJobUrl` query resolver to `functions/src/resolvers/resumeTailor.ts` — validates URL scheme (`https:` only), blocks private IP ranges (`127.x`, `10.x`, `172.16-31.x`, `192.168.x` — SSRF protection per Constitution Principle V), fetches URL with 5-second timeout via `axios`, uses `cheerio` to extract main text content (remove script/style/nav/footer), truncates to 8000 chars, returns plain text string; returns `null` if fetch fails (client falls back to manual paste)
- [ ] T028 [US2] Create `packages/resume-tailor/src/hooks/useResumeGeneration.ts` — `GENERATE_RESUME` mutation hook, `BOOST_ATS_SCORE` mutation hook, `SCRAPE_JOB_URL` lazy query hook; exports `calculateAtsScore(resume, keywordReport)` as a pure TypeScript function (stemming + weighted keyword matching — runs client-side for recalculation, no API call); exports `{ jdText, setJdText, scrapeUrl, isScrapingUrl, generate, isGenerating, generatedResume, boost, isBoosting, recalculate, error }`
- [ ] T029 [P] [US2] Create `packages/resume-tailor/src/components/AtsScoreCard.tsx` — displays `beforeScore` and `score` as percentage bars or circular indicators; shows improvement badge (`+N pts`) in green; handles loading skeleton during generation; dark mode variants; all text via `t('resumeTailor.generate.*')` keys; `aria-label` on score elements
- [ ] T030 [P] [US2] Create `packages/resume-tailor/src/components/KeywordReportPanel.tsx` — collapsible accordion panel showing keyword categories (hardSkills, titleKeywords, actionKeywords, businessContext, domainKeywords, hardFilters); each category shows keyword chips colored green (covered) or red (missing); top10 list shown prominently; `type="button"` on expand/collapse toggle
- [ ] T031 [US2] Create `packages/resume-tailor/src/components/ResumeGenerator.tsx` — URL/text toggle switch at top, URL input with Fetch button (calls `scrapeUrl`, shows scraping spinner, shows error if fails), JD text area; Generate Resume button (disabled until JD text present and fact bank not empty); Boost ATS Score button (shown after generation); Recalculate Score button; renders `AtsScoreCard` and `KeywordReportPanel` after generation; all loading states with accessible spinner text
- [ ] T032 [US2] Wire `ResumeGenerator` and its child display components into the Generate tab in `packages/resume-tailor/src/components/ResumeTailor.tsx`; pass `generatedResume` state down to child tabs for later use (US3, US4)

**Checkpoint**: Enter job description → click Generate → resume returned with two distinct ATS scores and keyword report visible

---

## Phase 5: User Story 3 — Download ATS-Friendly PDF (Priority: P2)

**Goal**: Users click "Download PDF" and receive a single-page, ATS-safe PDF via the browser print dialog. The application is automatically saved to the Applications Log.

**Independent Test**: Click Download PDF on a generated resume → browser print dialog opens with a clean single-page layout → after confirming print, the application appears in the Applications tab

### Implementation for User Story 3

- [ ] T033 [US3] Add `saveResumeApplication` mutation resolver and `deleteResumeApplication` mutation resolver to `functions/src/resolvers/resumeTailor.ts` — `saveResumeApplication`: generates UUID, writes to `users/{uid}/resumeApplications/{id}` with `resumeSnapshot: JSON.stringify(input.resumeSnapshot)` and `FieldValue.serverTimestamp()` on `date`, returns Application record; `deleteResumeApplication`: verifies document exists for uid then deletes; add `resumeApplications` query resolver: reads subcollection ordered by `date` desc, limit capped at 100, converts Timestamps, parses `resumeSnapshot` from JSON string
- [ ] T034 [US3] Create `packages/resume-tailor/src/hooks/useApplicationsLog.ts` — `GET_RESUME_APPLICATIONS` query (limit 50), `SAVE_RESUME_APPLICATION` mutation, `DELETE_RESUME_APPLICATION` mutation; exports `{ applications, loading, saveApplication(resume, jdText), deleteApplication(id), exportJson(), importJson(file) }`; `importJson` merges by id to avoid duplicates; `exportJson` triggers browser file download with dated filename
- [ ] T035 [US3] Create `packages/resume-tailor/src/components/GeneratedResumeView.tsx` — renders the complete resume in a print-friendly HTML layout using a container `div` with `data-print-target="true"`; includes print CSS via `<style>` tag with `@media print` rules (hide everything except `[data-print-target]`, use Georgia/Times font, no colors, `@page { size: letter; margin: 0.5in; }`); "Download PDF" button (`type="button"`) calls `window.print()` then immediately fires `onPdfDownloaded()` callback; shows contact section, experiences (selected version only), education, skills, projects; all section headings and data rendered as semantic HTML (`<h1>`, `<h2>`, `<ul>`, `<li>`)
- [ ] T036 [US3] Wire PDF download auto-save: pass `onPdfDownloaded` callback from `ResumeTailor.tsx` to `GeneratedResumeView.tsx`; callback calls `saveApplication(generatedResume, jdText)` from `useApplicationsLog` hook; show brief "Application saved" toast after mutation completes

**Checkpoint**: Click Download PDF → browser print dialog opens → after print, Applications tab shows a new entry with correct company, role, and ATS scores

---

## Phase 6: User Story 4 — Inline Editing & Score Recalculation (Priority: P2)

**Goal**: Every field in the generated resume is click-to-edit. After edits, users can recalculate the ATS score instantly without any API call.

**Independent Test**: Click on a bullet point in the generated resume → edit the text → click outside → click Recalculate Score → ATS score updates to reflect the change with no network request

### Implementation for User Story 4

- [ ] T037 [US4] Add inline editing state to `packages/resume-tailor/src/components/GeneratedResumeView.tsx` — replace static text with `contentEditable` spans (or controlled `<input>`/`<textarea>` on click) for: contact fields, experience bullet text, education notes, skills text; on `onBlur` dispatch `onResumeChange(updated)` callback; add hover-reveal delete buttons (`type="button"`, `aria-label={t('resumeTailor.generate.deleteBullet')}`) on each bullet and experience row; maintain `isEdited` flag to show "unsaved edits" indicator; touch targets ≥ 44px on delete controls
- [ ] T038 [US4] Connect Recalculate Score button in `packages/resume-tailor/src/components/ResumeGenerator.tsx` to `recalculate()` from `useResumeGeneration.ts` — when `generatedResume` has been locally edited via `onResumeChange`, call `calculateAtsScore(editedResume, keywordReport)` pure function (no mutation/API call) and update `AtsScoreCard` display; mark score as "recalculated" (vs. AI-generated) with a subtle indicator

**Checkpoint**: Edit a bullet to include a missing keyword → click Recalculate Score → ATS score increases; network tab in DevTools shows no API request was made

---

## Phase 7: User Story 5 — Track & Review Past Applications (Priority: P3)

**Goal**: Users can view all saved applications sorted by date, expand any to see the full resume, delete unwanted entries, and export/import the full history.

**Independent Test**: Navigate to Applications tab → see list of saved applications → expand one → view full resume and job description → delete it → verify it's removed

### Implementation for User Story 5

- [ ] T039 [US5] Create `packages/resume-tailor/src/components/ApplicationsLog.tsx` — sorted list of application cards (newest first) each showing: date, company, role, before/after ATS score, improvement badge; expand/collapse toggle on each card revealing full resume content (parsed from `resumeSnapshot` JSON) and truncated JD text; delete button with `window.confirm()` confirmation; "Export Applications" button (`type="button"`) triggering JSON download; file input for "Import Applications" that merges without duplicates; empty state with `t('resumeTailor.applications.emptyState')`; all interactive controls use `type="button"`, `aria-label`, dark mode variants
- [ ] T040 [US5] Wire `ApplicationsLog` into the Applications tab in `packages/resume-tailor/src/components/ResumeTailor.tsx` using `useApplicationsLog` hook

**Checkpoint**: Applications tab shows all saved applications; expand one to see full resume; delete removes it from list; export produces valid JSON file

---

## Phase 8: Polish & Shell Integration (23 Touchpoints)

**Purpose**: Wire the new MFE into the Shell and deployment pipeline. All `[P]` tasks are independent and can run in any order.

- [ ] T041 [P] Add resumeTailor remote to `packages/shell/vite.config.ts` — `const resumeTailorRemote = isProduction ? '/resume-tailor/assets/remoteEntry.js' : 'http://localhost:3023/assets/remoteEntry.js'`; add `resumeTailor: resumeTailorRemote` to federation `remotes` object
- [ ] T042 [P] Add lazy import `const ResumeTailorMF = tracedLazy('mfe_resume_tailor_load', () => import('resumeTailor/ResumeTailor'), getPerf)` and `<Route path="resume-tailor" element={<MFEPageWrapper component={ResumeTailorMF} name="Resume Tailor" />} />` to `packages/shell/src/App.tsx`
- [ ] T043 [P] Add `/resume-tailor` to `ROUTE_MODULE_MAP` (`() => import('resumeTailor/ResumeTailor')`), add nav item to `NAV_GROUPS` (suggest "Workspace" or new "Career" group), add to `ALL_NAV_ITEMS` in `packages/shell/src/lib/navConfig.ts`
- [ ] T044 [P] Add `'resume-tailor': 'nav.resumeTailor'` to `ROUTE_LABEL_KEYS` in `packages/shell/src/routeConfig.ts`
- [ ] T045 [P] Create `packages/shell/src/components/widgets/ResumeTailorWidget.tsx` — compact widget showing most recent application (company, role, ATS score improvement) or empty state prompt; uses `useQuery(GET_RESUME_APPLICATIONS, { variables: { limit: 1 } })` from `@mycircle/shared`
- [ ] T046 Add `'resumeTailor'` to `WidgetType` union, import and register `ResumeTailorWidget` in `WIDGET_COMPONENTS`, add `resumeTailor: '/resume-tailor'` to `WIDGET_ROUTES`, add to `DEFAULT_LAYOUT` and `ALL_WIDGET_IDS` set in `packages/shell/src/components/widgets/widgetConfig.ts`; update hardcoded widget count in any shell tests that assert total widget count
- [ ] T047 [P] Add `'/resume-tailor': 'commandPalette.goToResumeTailor'` to `ROUTE_LABEL_KEYS` in `packages/shell/src/components/layout/CommandPalette.tsx`
- [ ] T048 [P] Add `'../../packages/resume-tailor/src/**/*.{ts,tsx}'` to `content` array in `packages/shell/tailwind.config.js`
- [ ] T049 [P] Add type declaration for `declare module 'resumeTailor/ResumeTailor'` (default export `React.FC`) to `packages/shell/remotes.d.ts`
- [ ] T050 [P] Create mock file at `packages/shell/test/mocks/resumeTailor/ResumeTailor.tsx` — simple `export default function ResumeTailor() { return null; }`
- [ ] T051 [P] Add `'resumeTailor/ResumeTailor': path.resolve(__dirname, 'test/mocks/resumeTailor/ResumeTailor.tsx')` alias to both root `vitest.config.ts` and `packages/shell/vitest.config.ts`; update hardcoded nav item count in shell tests that assert `ALL_NAV_ITEMS.length`
- [ ] T052 [P] Add `"dev:resume-tailor": "pnpm --filter @mycircle/resume-tailor dev"` and `"preview:resume-tailor": "pnpm --filter @mycircle/resume-tailor preview"` scripts to root `package.json`; add `pnpm preview:resume-tailor` to both `"dev"` concurrently command and `"dev:mf"` concurrently command
- [ ] T053 [P] Add COPY lines for `packages/resume-tailor/` in build stage and runtime stage of `deploy/docker/Dockerfile` — follow the pattern for `packages/family-games/` (copy package.json in first COPY block, copy built dist in second COPY block)
- [ ] T054 [P] Add `'resume-tailor'` to `mfeDirs` array in `scripts/assemble-firebase.mjs`; add `'/resume-tailor'` to `MFE_PREFIXES` array in `server/production.ts`
- [ ] T055 [P] Add `'/resume-tailor'` to the `navigateTo` page list in `scripts/mcp-tools/mfe-tools.ts` with comment `// Resume Tailor — AI resume builder and job application tracker`
- [ ] T056 [P] Create `docs/specs/015-resume-tailor/spec.md` by copying `specs/015-resume-tailor/spec.md` (required for `spec-check` CI gate that blocks PR merge)
- [ ] T057 Run full validation: `pnpm validate_all` (MCP validators), `pnpm build:shared`, `pnpm lint && pnpm test:run && pnpm typecheck`, `cd functions && npx tsc --noEmit`; fix any failures before opening PR

**Checkpoint**: `pnpm validate_all` passes; `pnpm lint && pnpm test:run && pnpm typecheck` all pass; MFE visible at `http://localhost:3000/resume-tailor` in full dev mode

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **US1 (Phase 3)**: Depends on Phase 2 — Fact Bank is prerequisite for US2 (generation reads from it)
- **US2 (Phase 4)**: Depends on US1 complete — `generateResume` resolver reads the user's fact bank
- **US3 (Phase 5)**: Depends on US2 complete — PDF download requires a generated resume to display
- **US4 (Phase 6)**: Depends on US3 complete — inline editing operates on `GeneratedResumeView` created in US3
- **US5 (Phase 7)**: Depends on US3 complete — application saving uses `useApplicationsLog` and relies on `saveResumeApplication` resolver from US3
- **Polish (Phase 8)**: Can begin as soon as Phase 2 is complete (shell integration is independent of user stories); T057 (validation run) must be last

### User Story Dependencies

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational)
        └─→ Phase 3 (US1 - Fact Bank) ─→ Phase 4 (US2 - Generate) ─→ Phase 5 (US3 - PDF)
                                                                              ├─→ Phase 6 (US4 - Inline Edit)
                                                                              └─→ Phase 7 (US5 - App Log)
        └─→ Phase 8 (Polish — T041–T056 can run in parallel with US phases)
```

### Within Each User Story

- Resolver tasks before hook tasks (hooks call resolvers)
- Hook tasks before component tasks (components use hooks)
- Individual components marked [P] within a story can run in parallel
- Shell integration tasks (Phase 8) can run in parallel with US1–US5 tasks except for T057

---

## Parallel Opportunities

### Phase 2 (Foundational) — Run simultaneously after T007:
```
T008 (schema.ts) || T009 (queries.ts) || T010 (i18n locales) || T012 (firestore.rules) || T013 (Firebase secret) || T014 (ResumeTailor.tsx skeleton)
```

### Phase 3 (US1) — Run simultaneously after T016+T017:
```
T018 (REST handler) || T020 (window bridge) || T022 (ExperienceCard.tsx)
```

### Phase 4 (US2) — Run simultaneously after T025:
```
T026 (boostAtsScore resolver) || T027 (scrapeJobUrl resolver) || T029 (AtsScoreCard.tsx) || T030 (KeywordReportPanel.tsx)
```

### Phase 8 (Polish) — All parallelizable simultaneously:
```
T041 (vite remote) || T042 (App.tsx) || T043 (navConfig) || T044 (routeConfig) || T045 (Widget component)
|| T047 (CommandPalette) || T048 (tailwind content) || T049 (remotes.d.ts) || T050 (mock file)
|| T051 (vitest aliases) || T052 (package.json scripts) || T053 (Dockerfile) || T054 (assemble+server)
|| T055 (mcp-tools) || T056 (docs/specs copy)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks all stories)
3. Complete Phase 3: US1 (Fact Bank) — upload, edit, persist
4. Complete Phase 4: US2 (Generate) — AI generation, ATS score, keyword report
5. **STOP and VALIDATE**: Full workflow works (upload → JD → generate → view score)
6. Begin Phase 8 shell integration in parallel

### Incremental Delivery

1. Phase 1+2 → Foundation ready
2. Phase 3 → Fact Bank works → Independent value as resume editor
3. Phase 4 → AI generation works → Core product value delivered (MVP!)
4. Phase 5 → PDF download works → Users can submit applications
5. Phase 6 → Inline editing → Users can refine AI output
6. Phase 7 → Applications Log → Full job search tracker
7. Phase 8 → Shell integration → Feature accessible in production

### Solo Developer (Sequential)

Recommended order: T001→T006, then T007→T015, then T016→T024, then T025→T032, then T033→T036, then T037→T038, then T039→T040, then T041–T057.

---

## Notes

- `[P]` tasks = different files, no blocking dependencies — safe to run concurrently
- `[USN]` label maps task to user story for traceability
- Each user story is independently completable and testable (see checkpoint at end of each phase)
- Commit after each phase checkpoint to keep git history clean
- Run `pnpm build:shared` after any change to schema, queries, or i18n files
- Never import from `@apollo/client` directly in MFE — always use `@mycircle/shared`
- Use `printf` not `echo` for Firebase secret values
- After rebase, run `pnpm build:shared` to catch duplicate i18n keys (per CLAUDE.md CI gotcha)
