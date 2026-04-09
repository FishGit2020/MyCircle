# Tasks: Anniversary Tracker

**Input**: Design documents from `/specs/027-anniversary-mfe/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/graphql-schema.md, quickstart.md

**Tests**: Not explicitly requested — test tasks are omitted. Tests can be added later.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the `packages/anniversary/` MFE package and wire minimal shell routing so the component loads in dev mode.

- [x] T001 Create package directory structure: `packages/anniversary/src/components/`, `packages/anniversary/src/hooks/`, `packages/anniversary/test/`
- [x] T002 Create `packages/anniversary/package.json` with name `@mycircle/anniversary`, dependencies (react, react-dom, react-router, @mycircle/shared), devDependencies (vite, @originjs/vite-plugin-federation, vitest, @testing-library/react, tailwindcss, postcss, autoprefixer), and scripts (dev, build, preview, test:run)
- [x] T003 [P] Create `packages/anniversary/vite.config.ts` with Module Federation config: name `anniversary`, expose `./Anniversary` from `./src/components/Anniversary.tsx`, shared singletons (react, react-dom, react-router, @mycircle/shared), dev server port 3034
- [x] T004 [P] Create `packages/anniversary/vitest.config.ts` with jsdom environment, globals true, threads pool, testTimeout 15000, setupFiles `./test/setup.ts`, include `src/**/*.{test,spec}.{ts,tsx}`
- [x] T005 [P] Create `packages/anniversary/tsconfig.json` extending root tsconfig with paths for @mycircle/shared
- [x] T006 [P] Create `packages/anniversary/postcss.config.js` with tailwindcss and autoprefixer plugins
- [x] T007 [P] Create `packages/anniversary/src/index.css` with Tailwind directives (@tailwind base, components, utilities)
- [x] T008 [P] Create `packages/anniversary/test/setup.ts` with vitest-dom imports and any shared test utilities
- [x] T009 Create `packages/anniversary/src/main.tsx` as standalone dev entry with BrowserRouter, Routes for `/anniversary` and `/anniversary/:id`
- [x] T010 Create stub `packages/anniversary/src/components/Anniversary.tsx` — minimal component rendering "Anniversary" text wrapped in `<PageContent>` from `@mycircle/shared`, accepting route params for future `/anniversary/:id` navigation
- [x] T011 Add `dev:anniversary` and `preview:anniversary` scripts to root `package.json`, and add anniversary to the `dev` and `dev:mf` concurrently commands
- [x] T012 [P] Add anniversary alias to root `vitest.config.ts` resolve aliases
- [x] T013 Add `anniversary` remote URL (port 3034 dev, `/anniversary/assets/remoteEntry.js` prod) to `packages/shell/vite.config.ts` federation remotes
- [x] T014 [P] Add `declare module 'anniversary/Anniversary'` to `packages/shell/src/remotes.d.ts`
- [x] T015 Add lazy import `tracedLazy('mfe_anniversary_load', () => import('anniversary/Anniversary'), getPerf)` and `<Route path="anniversary" ...>` + `<Route path="anniversary/:id" ...>` to `packages/shell/src/App.tsx`
- [x] T016 [P] Add `'anniversary': 'nav.anniversary'` to ROUTE_LABEL_KEYS in `packages/shell/src/routeConfig.ts`
- [x] T017 [P] Add anniversary mock file in `packages/shell/test/mocks/anniversary.ts` and alias in `packages/shell/vitest.config.ts`
- [x] T018 [P] Add `'../packages/anniversary/src/**/*.{js,ts,jsx,tsx}'` to content array in `packages/shell/tailwind.config.js`

**Checkpoint**: `pnpm install && pnpm build:shared && pnpm dev:anniversary` should serve a blank Anniversary page at localhost:3034/anniversary. Shell route `/anniversary` should load the federated component.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend schema, resolvers, Firestore rules, client queries, codegen, and base i18n keys. ALL user stories depend on this.

**Warning**: No user story work can begin until this phase is complete.

- [x] T019 Add Anniversary, AnniversaryYear, Location, ContributorInfo, PictureInfo, UserSearchResult types to `functions/src/schema.ts` per `contracts/graphql-schema.md`
- [x] T020 Add CreateAnniversaryInput, UpdateAnniversaryInput, LocationInput, UpdateAnniversaryYearInput, AnniversaryPictureInput input types to `functions/src/schema.ts`
- [x] T021 Add anniversary queries (anniversaries, anniversary, anniversaryYear, searchUsers) to Query type in `functions/src/schema.ts`
- [x] T022 Add anniversary mutations (createAnniversary, updateAnniversary, deleteAnniversary, updateAnniversaryYear, uploadAnniversaryPicture, deleteAnniversaryPicture, addAnniversaryContributor, removeAnniversaryContributor) to Mutation type in `functions/src/schema.ts`
- [x] T023 Create `functions/src/resolvers/anniversary.ts` with `createAnniversaryQueryResolvers()` and `createAnniversaryMutationResolvers()` factory functions — implement `anniversaries` query (filter by ownerUid == uid OR uid in contributorUids), `anniversary` query (single doc + years subcollection), `anniversaryYear` query, and `searchUsers` query (Firebase Admin getUserByEmail with prefix matching)
- [x] T024 Implement `createAnniversary` mutation in `functions/src/resolvers/anniversary.ts` — create anniversary doc in `anniversaries/` collection, auto-generate AnniversaryYear subcollection docs from year 0 through current year, set ownerUid/ownerDisplayName/contributorUids([])/timestamps
- [x] T025 Implement `updateAnniversary` mutation in `functions/src/resolvers/anniversary.ts` — owner-only check, update title/location fields
- [x] T026 Implement `deleteAnniversary` mutation in `functions/src/resolvers/anniversary.ts` — owner-only check, cascade delete all years subcollection docs, delete all pictures from Firebase Storage (`anniversaries/{id}/years/`), delete anniversary doc
- [x] T027 Implement `updateAnniversaryYear` mutation in `functions/src/resolvers/anniversary.ts` — owner/contributor check, update activity/notes/location fields in `anniversaries/{id}/years/{yearNumber}`
- [x] T028 Implement `uploadAnniversaryPicture` mutation in `functions/src/resolvers/anniversary.ts` — validate MIME type (image/jpeg, image/png, image/webp) and base64 size (max 10MB), use `uploadToStorage()` from `functions/src/handlers/shared.ts`, store PictureInfo in years doc pictures array, return PictureInfo
- [x] T029 Implement `deleteAnniversaryPicture` mutation in `functions/src/resolvers/anniversary.ts` — remove picture from Storage by storagePath, remove PictureInfo from years doc pictures array
- [x] T030 Implement `addAnniversaryContributor` and `removeAnniversaryContributor` mutations in `functions/src/resolvers/anniversary.ts` — owner-only, update contributorUids array and contributors array
- [x] T031 Import and spread `createAnniversaryQueryResolvers()` and `createAnniversaryMutationResolvers()` in `functions/src/resolvers/index.ts`
- [x] T032 Add Firestore security rules for `anniversaries/{anniversaryId}` in `firestore.rules` — allow read/write if `request.auth.uid == resource.data.ownerUid || request.auth.uid in resource.data.contributorUids`, allow delete only if `request.auth.uid == resource.data.ownerUid`, allow create if `request.auth != null && request.resource.data.ownerUid == request.auth.uid`
- [x] T033 Add Firestore security rules for `anniversaries/{anniversaryId}/years/{yearNumber}` subcollection in `firestore.rules` — inherit access check from parent anniversary doc (function that reads parent and checks ownerUid/contributorUids)
- [x] T034 Add anniversary GraphQL queries (GET_ANNIVERSARIES, GET_ANNIVERSARY, GET_ANNIVERSARY_YEAR, SEARCH_USERS) and mutations (CREATE_ANNIVERSARY, UPDATE_ANNIVERSARY, DELETE_ANNIVERSARY, UPDATE_ANNIVERSARY_YEAR, UPLOAD_ANNIVERSARY_PICTURE, DELETE_ANNIVERSARY_PICTURE, ADD_ANNIVERSARY_CONTRIBUTOR, REMOVE_ANNIVERSARY_CONTRIBUTOR) to `packages/shared/src/apollo/queries.ts`
- [x] T035 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` with anniversary types
- [x] T036 Run `pnpm build:shared` to rebuild shared package with new queries and generated types
- [x] T037 Add base i18n keys to English locale in `packages/shared/src/i18n/en.ts`: `nav.anniversary`, `commandPalette.goToAnniversary`, `anniversary.title`, `anniversary.createNew`, `anniversary.noAnniversaries`, `anniversary.yearsSince`, `anniversary.addContributor`, `anniversary.removeContributor`, `anniversary.activity`, `anniversary.notes`, `anniversary.pictures`, `anniversary.location`, `anniversary.save`, `anniversary.delete`, `anniversary.confirmDelete`, `anniversary.shared`, `anniversary.owner`, `anniversary.search`, `anniversary.uploadPicture`, `anniversary.year`, `anniversary.originalEvent`, `anniversary.editDetails`, `anniversary.countdown`, `anniversary.happyAnniversary`, `anniversary.yearsMarried`, `anniversary.daysUntil`, `anniversary.contributors`, `anniversary.searchByEmail`
- [x] T038 [P] Add corresponding i18n keys (Spanish translations) to `packages/shared/src/i18n/es.ts` — use Unicode escapes for accented characters per CLAUDE.md
- [x] T039 [P] Add corresponding i18n keys (Chinese translations) to `packages/shared/src/i18n/zh.ts`
- [x] T040 Verify backend types: run `cd functions && npx tsc --noEmit` and fix any errors

**Checkpoint**: `pnpm codegen && pnpm build:shared` succeeds. `cd functions && npx tsc --noEmit` passes. Firestore rules deploy without errors. All anniversary GraphQL operations are typed and available.

---

## Phase 3: User Story 1 — Create an Anniversary (Priority: P1) MVP

**Goal**: Users can create a new anniversary with title, date, and optional location. System auto-generates yearly placeholder tiles. Users see their anniversaries listed.

**Independent Test**: Navigate to `/anniversary`, click "Add Anniversary", fill in title + date, submit. Verify yearly tiles appear for each year from original date to current year.

### Implementation for User Story 1

- [x] T041 [US1] Create `packages/anniversary/src/hooks/useAnniversaries.ts` — `useQuery<GetAnniversariesQuery>(GET_ANNIVERSARIES)` hook returning anniversaries list, loading, error states
- [x] T042 [US1] Create `packages/anniversary/src/hooks/useAnniversaryMutations.ts` — export `useCreateAnniversary()`, `useUpdateAnniversary()`, `useDeleteAnniversary()` hooks wrapping corresponding mutations with cache update (refetch GET_ANNIVERSARIES on create/delete)
- [x] T043 [US1] Create `packages/anniversary/src/components/AnniversaryForm.tsx` — modal/dialog form with title (required, max 100 chars), date picker (required), optional location input (lat/lon/name). On submit calls createAnniversary mutation. Dark mode, responsive, all strings via `t()`, proper aria-labels and `type="button"` on non-submit buttons
- [x] T044 [US1] Implement `packages/anniversary/src/components/Anniversary.tsx` — landing page component: if no anniversaries show empty state with create prompt; if anniversaries exist show a list with title, original date, years elapsed. "Add Anniversary" button opens AnniversaryForm. Wrap in `<PageContent>`. Use `useAnniversaries` hook. Handle loading/error states. Dark mode + responsive (mobile-first, `md:` breakpoint)
- [x] T045 [US1] Wire routing: Anniversary.tsx should handle both `/anniversary` (list) and `/anniversary/:id` (drilldown, stubbed for US3) using `useParams` — if id param present, render placeholder for detail view; otherwise render landing list

**Checkpoint**: User can navigate to `/anniversary`, see empty state, create an anniversary, and see it appear in the list with auto-generated year count. Full CRUD cycle works via GraphQL.

---

## Phase 4: User Story 2 — Landing Page: List and Map View (Priority: P2)

**Goal**: Landing page displays all anniversaries as a list with a MapLibre map showing location pins for each yearly celebration.

**Independent Test**: Create an anniversary with a location, add location data to a yearly entry. Verify pins appear on the map at correct coordinates. Click a pin or list item to navigate to drilldown.

### Implementation for User Story 2

- [x] T046 [US2] Create `packages/anniversary/src/components/AnniversaryMap.tsx` — MapLibre map using `useMapLibre` hook from `@mycircle/shared`. Accept an array of location points (lat, lon, label, anniversaryId, yearNumber). Render GeoJSON source with circle+symbol layers following travel-map PinMarker pattern. On pin click, navigate to `/anniversary/:id`. Handle `style.load` event to re-add sources/layers. Call `map.resize()` on load + ResizeObserver. Dark mode map style. Wrap GL layer operations in try/catch per MapLibre gotchas
- [x] T047 [US2] Enhance `packages/anniversary/src/components/Anniversary.tsx` — add split layout: list panel (left/top on mobile) + map panel (right/bottom on mobile). Collect all locations from all anniversaries' yearly entries. Pass location data to AnniversaryMap. On list item click navigate to `/anniversary/:id`. Show years elapsed and next anniversary date in each list item. Responsive: stack vertically on mobile, side-by-side on `md:` and above

**Checkpoint**: Landing page shows anniversary list alongside map with pins. Pins correspond to yearly entry locations. Clicking list items or pins navigates to drilldown route.

---

## Phase 5: User Story 3 — Drilldown Page: Yearly Anniversary Details (Priority: P3)

**Goal**: Clicking an anniversary from the landing page shows a timeline of yearly tiles. Each tile can be clicked to edit activity, notes, pictures, and location for that year.

**Independent Test**: Create an anniversary, navigate to its drilldown page, click a yearly tile, add activity text + notes + upload a picture + set location, save. Reload and verify data persists.

### Implementation for User Story 3

- [x] T048 [US3] Create `packages/anniversary/src/hooks/useAnniversaryDetail.ts` — `useQuery<GetAnniversaryQuery>(GET_ANNIVERSARY, { variables: { id } })` hook returning single anniversary with all years, loading, error. Include `useUpdateAnniversaryYear`, `useUploadAnniversaryPicture`, `useDeleteAnniversaryPicture` mutation hooks
- [x] T049 [US3] Create `packages/anniversary/src/components/YearlyTile.tsx` — card component displaying year number ("Year 3 - 2023"), activity summary (truncated), photo thumbnail (first picture if any), location name badge. Click handler to open editor. Visual distinction for populated vs placeholder tiles. Dark mode + responsive
- [x] T050 [US3] Create `packages/anniversary/src/components/PictureGallery.tsx` — displays grid of uploaded pictures with lightbox on click. Upload button (file input accepting image/jpeg, image/png, image/webp, max 10MB). Client-side image compression before base64 encoding. Delete button on each picture (confirm before delete). Show upload progress. Max 10 pictures per year with count indicator. Dark mode + responsive
- [x] T051 [US3] Create `packages/anniversary/src/components/YearlyEditor.tsx` — slide-over or modal form for editing a yearly entry. Fields: activity (textarea, max 500 chars), notes (textarea, max 5000 chars), location (lat/lon/name input or map picker), PictureGallery component for pictures. Save button calls updateAnniversaryYear mutation. Close button returns to timeline. All strings via `t()`, proper aria-labels, dark mode
- [x] T052 [US3] Create `packages/anniversary/src/components/AnniversaryDetail.tsx` — drilldown page showing anniversary title + original date header, timeline/grid of YearlyTile components sorted by yearNumber ascending (Year 0 first). Back button to `/anniversary`. Edit anniversary title/delete button for owner. Load data via useAnniversaryDetail hook. Handle loading/error. Wrap in `<PageContent>`. Dark mode + responsive
- [x] T053 [US3] Update `packages/anniversary/src/components/Anniversary.tsx` — when route has `:id` param, render AnniversaryDetail instead of landing page

**Checkpoint**: Full drilldown flow works: list → click anniversary → see yearly timeline → click tile → edit activity/notes/pictures/location → save → data persists. Picture upload and gallery display work.

---

## Phase 6: User Story 4 — Contributor Management (Priority: P4)

**Goal**: Anniversary owners can search users by email, add them as contributors, and remove contributors. Contributors see shared anniversaries in their landing page.

**Independent Test**: User A creates anniversary. User A searches for User B's email, adds as contributor. User B sees the shared anniversary in their list (visually distinct). User B edits a yearly entry. User A removes User B.

### Implementation for User Story 4

- [x] T054 [US4] Create `packages/anniversary/src/components/UserSearch.tsx` — email input with debounced search (300ms). Calls SEARCH_USERS query. Shows dropdown with matching users (displayName + email). Select handler returns selected user's uid. Loading/empty states. Aria-label, dark mode
- [x] T055 [US4] Create `packages/anniversary/src/components/ContributorManager.tsx` — panel/section in AnniversaryDetail showing list of current contributors (displayName, email, addedAt). "Add Contributor" button reveals UserSearch. On user select, calls addAnniversaryContributor mutation. Remove button per contributor calls removeAnniversaryContributor mutation with confirmation. Only visible to anniversary owner. Dark mode + responsive
- [x] T056 [US4] Integrate ContributorManager into `packages/anniversary/src/components/AnniversaryDetail.tsx` — show contributor section below timeline for owner users. Add visual badge/indicator on landing page list items for shared anniversaries (e.g., "Shared" tag) in `packages/anniversary/src/components/Anniversary.tsx`

**Checkpoint**: Owner can search users by email, add/remove contributors. Contributors see shared anniversaries marked as "Shared" in their landing page. Contributors can edit yearly entries but cannot delete anniversary or manage contributors.

---

## Phase 7: User Story 5 — Dashboard Widget (Priority: P5)

**Goal**: Dashboard widget shows countdown to nearest upcoming anniversary and years elapsed since original date.

**Independent Test**: Create an anniversary with a known date. Add the Anniversary widget to dashboard. Verify countdown days and years are mathematically correct. Verify "Happy Anniversary" message on the actual date.

### Implementation for User Story 5

- [x] T057 [US5] Create `packages/shell/src/components/widgets/AnniversaryWidget.tsx` — compact widget using `useQuery(GET_ANNIVERSARIES)` from `@mycircle/shared`. Compute: (1) find anniversary with nearest upcoming date this year, (2) days until = diff between next occurrence and today, (3) years elapsed = current year minus original year. Display: anniversary title, "X days until" or "Happy Anniversary! X years today" if today, "X years together". Empty state: prompt to create first anniversary with link to `/anniversary`. Dark mode, responsive, all strings via `t()`
- [x] T058 [US5] Register widget in `packages/shell/src/components/widgets/widgetConfig.ts` — add `'anniversary'` to WidgetType union, ALL_WIDGET_IDS set, WIDGET_COMPONENTS map (import AnniversaryWidget), WIDGET_ROUTES map (`anniversary: '/anniversary'`)

**Checkpoint**: Anniversary widget renders on dashboard with correct countdown and year count. Shows nearest anniversary if multiple exist. Empty state links to Anniversary page.

---

## Phase 8: User Story 6 — Navigation Integration (Priority: P6)

**Goal**: Anniversary is accessible from header nav (Family group), bottom nav, and command palette.

**Independent Test**: Verify Anniversary link appears in header under Family group. Verify Anniversary icon in bottom nav on mobile. Verify "Go to Anniversary" in command palette search.

### Implementation for User Story 6

- [x] T059 [US6] Add `{ path: '/anniversary', labelKey: 'nav.anniversary', icon: 'anniversary' }` to the Family group items in NAV_GROUPS in `packages/shell/src/lib/navConfig.ts`
- [x] T060 [P] [US6] Add `{ path: '/anniversary', labelKey: 'nav.anniversary', icon: 'anniversary' }` to ALL_NAV_ITEMS array in `packages/shell/src/lib/navConfig.ts`
- [x] T061 [P] [US6] Add `'/anniversary': () => import('anniversary/Anniversary')` to ROUTE_MODULE_MAP in `packages/shell/src/lib/navConfig.ts`
- [x] T062 [US6] Add anniversary command palette entry (`'/anniversary': 'commandPalette.goToAnniversary'`) in `packages/shell/src/components/layout/CommandPalette.tsx`
- [x] T063 [US6] Add NavIcon case for `'anniversary'` icon in `packages/shell/src/components/layout/Layout.tsx` (or wherever NavIcon/icon mapping lives) — use a heart or calendar icon from the existing icon set

**Checkpoint**: Anniversary is discoverable from all 3 navigation entry points. Header shows it under Family group. Bottom nav shows icon on mobile. Command palette finds "Go to Anniversary".

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Deployment config, docs, CI gates, and final validation.

- [x] T064 [P] Add COPY lines for `packages/anniversary/` in both build and runtime stages of `deploy/docker/Dockerfile`
- [x] T065 [P] Add anniversary to copy block and mfeDirs array in `scripts/assemble-firebase.mjs`
- [x] T066 [P] Add `'anniversary'` to MFE_PREFIXES array in `server/production.ts`
- [x] T067 Create spec file at `docs/specs/027-anniversary-mfe/spec.md` (copy or symlink from `specs/027-anniversary-mfe/spec.md`) to pass `spec-check` CI gate
- [x] T068 [P] Update `scripts/mcp-tools/mfe-tools.ts` — add `/anniversary` to navigateTo page list
- [x] T069 [P] Update `docs/architecture.md` and `README.md` with Anniversary MFE entry
- [x] T070 [P] Update hardcoded widget/nav counts in existing shell tests (e.g., total widget count, nav item count assertions)
- [x] T071 Run `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` and fix all failures
- [x] T072 Run `cd functions && npx tsc --noEmit` and fix any backend type errors
- [x] T073 Run MCP `validate_all` tool and fix any reported issues (i18n, Dockerfile, widget registry, PWA shortcuts)

**Checkpoint**: All CI gates pass. `validate_all` reports no issues. Feature is deployment-ready.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — no other story dependencies
- **US2 (Phase 4)**: Depends on US1 (needs anniversary data to display)
- **US3 (Phase 5)**: Depends on US1 (needs anniversary + year data to drill into)
- **US4 (Phase 6)**: Depends on US3 (contributor edits happen in drilldown page)
- **US5 (Phase 7)**: Depends on US1 only (widget reads anniversary list)
- **US6 (Phase 8)**: Depends on Setup (Phase 1) only (nav points to route)
- **Polish (Phase 9)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) ──→ Phase 2 (Foundational) ──→ Phase 3 (US1: Create) ──┬──→ Phase 4 (US2: Landing)
                                                                         ├──→ Phase 5 (US3: Drilldown) ──→ Phase 6 (US4: Contributors)
                                                                         └──→ Phase 7 (US5: Widget)
                                               Phase 2 ──→ Phase 8 (US6: Nav)
                                               All stories ──→ Phase 9 (Polish)
```

### Within Each User Story

- Hooks before components (data layer before UI)
- Parent components before child components
- Core implementation before integration/enhancement

### Parallel Opportunities

- **Phase 1**: T003-T008 can all run in parallel (different config files)
- **Phase 2**: T037-T039 (i18n for 3 locales) can run in parallel
- **After US1 completes**: US2, US3, US5, US6 can start in parallel (US2+US3 share data, US5+US6 are independent)
- **Phase 9**: T064-T070 can all run in parallel (different files)

---

## Parallel Example: Phase 1 Setup

```
# These can all run in parallel (different files):
Task T003: Create vite.config.ts
Task T004: Create vitest.config.ts
Task T005: Create tsconfig.json
Task T006: Create postcss.config.js
Task T007: Create index.css
Task T008: Create test/setup.ts
```

## Parallel Example: Phase 2 i18n

```
# After T037 (English) is complete as reference, these run in parallel:
Task T038: Spanish translations in es.ts
Task T039: Chinese translations in zh.ts
```

## Parallel Example: After US1

```
# These can start simultaneously after US1 is complete:
Task T046-T047: US2 (Landing Page map)
Task T048-T053: US3 (Drilldown Page)
Task T057-T058: US5 (Dashboard Widget)
Task T059-T063: US6 (Navigation)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Create Anniversary)
4. **STOP and VALIDATE**: Test creating/viewing anniversaries independently
5. Deploy/demo if ready — users can already create and track anniversaries

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test independently → Deploy (MVP — create/view anniversaries)
3. Add US2 → Test independently → Deploy (map view on landing page)
4. Add US3 → Test independently → Deploy (yearly detail editing + pictures)
5. Add US4 → Test independently → Deploy (sharing with contributors)
6. Add US5 → Test independently → Deploy (dashboard widget)
7. Add US6 → Test independently → Deploy (full navigation integration)
8. Polish → Final validation → Production release

### Parallel Team Strategy

With multiple developers after Foundational is complete:

- **Developer A**: US1 → US2 → US4 (data creation → landing page → sharing)
- **Developer B**: US3 → US5 (drilldown page → widget, after US1 data exists)
- **Developer C**: US6 → Polish (navigation → deployment config)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Run `pnpm build:shared` after any changes to shared queries or i18n keys
- Run `pnpm codegen` after any changes to `functions/src/schema.ts`
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
