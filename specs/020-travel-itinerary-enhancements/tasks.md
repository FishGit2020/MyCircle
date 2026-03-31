# Tasks: Travel Itinerary Builder Enhancements

**Input**: Design documents from `/specs/020-travel-itinerary-enhancements/`
**Branch**: `020-travel-itinerary-enhancements`
**MFEs modified**: `packages/trip-planner`, `packages/travel-map`, `packages/shared` (i18n only)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. No new MFE, no new Cloud Functions, no new Firestore collections.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US8)

---

## Phase 1: Setup — i18n Keys & Type Foundation

**Purpose**: Add all new i18n keys and TypeScript type changes before any feature work begins. These are shared prerequisites that block every user story.

- [x] T001 Add 17 new `tripPlanner.*` i18n keys to `packages/shared/src/i18n/en.ts` (see research.md R-007 for full key list: statusLabel, statusPlanning, statusConfirmed, statusCompleted, statusCancelled, checklist, checklistEmpty, checklistRemaining, addChecklistItem, checklistPlaceholder, duplicate, duplicatePrefix, export, exportCopied, exportDownload, activityNotes, ticketCost)
- [x] T002 [P] Add the same 17 i18n keys to `packages/shared/src/i18n/es.ts` using Unicode escapes for accented characters (read file before editing to match existing encoding style)
- [x] T003 [P] Add the same 17 i18n keys to `packages/shared/src/i18n/zh.ts`
- [x] T004 Update `packages/trip-planner/src/types.ts`: (a) add `export type TripStatus = 'planning' | 'confirmed' | 'completed' | 'cancelled'`, (b) add `export interface ChecklistItem { id: string; text: string; checked: boolean }`, (c) add `cost?: number` to the `Ticket` interface, (d) add `checklist?: ChecklistItem[]` and `status?: TripStatus` to the `Trip` interface
- [x] T005 Run `pnpm build:shared` to confirm i18n changes compile without errors; fix any TypeScript issues before continuing

**Checkpoint**: `pnpm build:shared` passes — all user stories can now proceed.

---

## Phase 2: Foundational — Nothing Needed

All foundational infrastructure (Firestore bridge, window bridge, `useTrips` hook, localStorage fallback) already exists and requires no changes. Phase 2 is skipped — proceed directly to user story phases after Phase 1 completes.

---

## Phase 3: User Stories 1 & 2 — Activity Editing and Notes (Priority: P1) 🎯 MVP

**US1 Goal**: Users can edit any saved activity's time, title, location, cost, and notes inline without deleting it first.

**US2 Goal**: The add-activity form exposes the notes field so users can annotate activities at creation time.

**Why combined**: US1's edit form should include the notes field — implementing US2 (add notes to the add form) first means the edit form (US1) inherits the same fields from the start. Both touch `TripDetail.tsx`.

**Independent Test**: Open a trip, add an activity with notes, then edit it to change the time and title — verify both changes persist in the day view.

### Implementation for US2 (Activity Notes — add form)

- [x] T006 [US2] In `packages/trip-planner/src/components/TripDetail.tsx`, add `actNotes` state (string, default `''`) alongside the existing `actTitle`, `actTime`, `actLocation`, `actCost` state variables in the add-activity inline form
- [x] T007 [US2] In the add-activity inline form in `TripDetail.tsx`, add a notes `<input>` or `<textarea>` (1 row) bound to `actNotes`, with `placeholder={t('tripPlanner.activityNotes')}` and matching border/dark-mode classes as the location field; include `actNotes.trim() || undefined` as `notes` in the `Activity` object built in `handleAddActivity`; reset `actNotes` to `''` after save
- [x] T008 [US2] In the activity row list in `TripDetail.tsx`, display `act.notes` as a small muted line below the activity title when `act.notes` is non-empty (e.g., `<p className="text-xs text-gray-400 dark:text-gray-500 truncate">{act.notes}</p>`)

### Implementation for US1 (Edit Existing Activities)

- [x] T009 [US1] In `TripDetail.tsx`, add `editingActivity` state: `{ date: string; actId: string } | null`, defaulting to `null`; add an edit icon button (pencil SVG) on each activity row alongside the existing delete button — clicking it sets `editingActivity` to `{ date, actId: act.id }` and clears any `addingTo` state
- [x] T010 [US1] In `TripDetail.tsx`, when `editingActivity` matches a row (`editingActivity?.actId === act.id`), replace the activity display row with an inline edit form pre-populated with the activity's current `time`, `title`, `location`, `cost`, and `notes` values; the form fields must use the same CSS classes as the add-activity form for visual consistency
- [x] T011 [US1] In `TripDetail.tsx`, implement `handleEditActivity(date: string, actId: string, updates: Partial<Activity>)`: find the day, map over its activities to replace the matching id with merged updates (maintaining time-sort order via `.sort((a, b) => a.time.localeCompare(b.time))`), call `onUpdate(trip.id, { itinerary: updatedItinerary })`, then clear `editingActivity`; wire the edit form's save button to this handler and the cancel button to `setEditingActivity(null)`
- [x] T012 [US1] Add `aria-label={t('tripPlanner.edit')}` to the edit icon button; ensure the button has `type="button"` and a touch target of at least 44px (use `p-2` or equivalent padding); add `aria-label` to the cancel/save buttons in the edit form

**Checkpoint**: Add an activity, note the id in devtools, edit it — verify the row updates in place with correct values and no page reload.

---

## Phase 4: User Story 3 — Ticket Cost Tracking (Priority: P2)

**US3 Goal**: Each ticket entry can record a cost; the budget "total spent" includes both activity and ticket costs.

**Independent Test**: Add a ticket with a cost of 200 — verify the budget bar shows the ticket cost added to activity spend.

### Implementation for US3

- [x] T013 [US3] In `TripDetail.tsx`, add `ticketCost` state (number, default `0`) to the add-ticket form section; add a cost `<input type="number" min="0">` field below the ticket description input, bound to `ticketCost`, with `placeholder={t('tripPlanner.ticketCost')}` and matching CSS classes; include `cost: ticketCost || undefined` in the `Ticket` object built in `handleAddTicket`; reset `ticketCost` to `0` after save
- [x] T014 [US3] In `TripDetail.tsx`, update the `totalSpent` calculation: replace the current activity-only sum with `activitySpend + ticketSpend` where `ticketSpend = (trip.tickets || []).reduce((s, t) => s + (t.cost || 0), 0)` (see data-model.md Budget Calculation Change section for exact formula)
- [x] T015 [US3] In `TripDetail.tsx`, on each ticket card in the ticket list, display the cost when non-zero: append `· {trip.currency} {ticket.cost}` to the ticket's date line (small muted text, matching the activity cost display style)

**Checkpoint**: Budget summary accurately sums activities + tickets; ticket cards show their cost; tickets with no cost show nothing extra.

---

## Phase 5: User Story 5 — Trip Status Field (Priority: P2)

**US5 Goal**: Each trip has a status (Planning / Confirmed / Completed / Cancelled) displayed as a colour badge in the list and detail views.

*Note: US5 is implemented before US4 because it touches `TripForm.tsx` and `TripList.tsx` independently — no shared files with the checklist component.*

**Independent Test**: Create a trip, set status to "Confirmed", return to the list — verify a green badge appears on the trip card.

### Implementation for US5

- [x] T016 [US5] In `packages/trip-planner/src/components/TripForm.tsx`, add a `status` field: a `<select>` with options for `planning | confirmed | completed | cancelled` using `t('tripPlanner.statusPlanning')` etc. as labels; initialise from `trip?.status || 'planning'`; include `status` in the `onSave` payload (add it to the destructured data object passed to `onSave`)
- [x] T017 [US5] In `packages/trip-planner/src/components/TripList.tsx`, add a status badge to each trip card: a `<span>` with the status label and colour-coded classes per research.md R-006 (planning=blue, confirmed=green, completed=gray, cancelled=red, all with `dark:` variants); default missing status to `'planning'`
- [x] T018 [P] [US5] In `packages/trip-planner/src/components/TripDetail.tsx`, display the trip status as a colour-coded badge in the trip header area (next to the destination name), using the same badge classes as `TripList.tsx`; completed/cancelled trips should visually indicate their terminal state (e.g., muted opacity on the badge)

**Checkpoint**: Trip list shows colour-coded status badges for every trip; new trips default to "Planning" blue; editing a trip preserves status.

---

## Phase 6: User Story 4 — Trip Packing Checklist (Priority: P2)

**US4 Goal**: Each trip has a packing/task checklist; users can add, check/uncheck, and delete items; the header shows the count of unchecked items.

**Independent Test**: Open a trip, add three checklist items, check two — verify the header shows "1 remaining" and checked items have a strikethrough.

### Implementation for US4

- [x] T019 [US4] Create `packages/trip-planner/src/components/ChecklistSection.tsx`: a component accepting `trip: Trip` and `onUpdate: (id: string, data: Partial<Trip>) => void` as props; renders a section with a header showing `t('tripPlanner.checklist')` and the unchecked count using `t('tripPlanner.checklistRemaining')` with `{count}` interpolation (or "Checklist" when all done); includes an empty state message using `t('tripPlanner.checklistEmpty')` when `(trip.checklist || []).length === 0`
- [x] T020 [US4] In `ChecklistSection.tsx`, implement add-item UI: a single text `<input>` with `placeholder={t('tripPlanner.checklistPlaceholder')}` and an add button; on submit (Enter key or button click), create a new `ChecklistItem` with `id: crypto.randomUUID()`, `text: input.trim()`, `checked: false`, append to `trip.checklist || []`, and call `onUpdate(trip.id, { checklist: updated })`; clear input after add; disable add button when input is empty
- [x] T021 [US4] In `ChecklistSection.tsx`, render each checklist item as a row with: a checkbox (`<input type="checkbox">`) bound to `item.checked` (toggling calls `onUpdate` with the mapped array), the item text with `line-through` class when checked, and a delete button (×) that removes the item; all interactive elements must have `aria-label`, `type="button"`, and ≥ 44px touch targets
- [x] T022 [US4] Import and render `<ChecklistSection trip={trip} onUpdate={onUpdate} />` in `packages/trip-planner/src/components/TripDetail.tsx`, placed between the budget summary and the tickets section

**Checkpoint**: Add three items, check one, delete one — header count updates correctly; checked item shows strikethrough; deleted item disappears.

---

## Phase 7: User Story 6 — Trip Duplication (Priority: P3)

**US6 Goal**: Users can duplicate any trip, creating a copy with all itinerary/tickets/checklist preserved but dates cleared and status reset to Planning.

**Independent Test**: Duplicate a trip with 2 activities and 1 ticket — verify a new trip appears in the list with "Copy of [name]", empty dates, and all original content intact.

### Implementation for US6

- [x] T023 [US6] In `packages/trip-planner/src/components/TripDetail.tsx`, add a "Duplicate trip" button in the header action area (next to Edit and Delete); the button must have `type="button"` and `aria-label={t('tripPlanner.duplicate')}`
- [x] T024 [US6] In `packages/trip-planner/src/components/TripPlanner.tsx`, implement `handleDuplicate(trip: Trip)`: deep-clone the trip using `structuredClone`, apply the duplication mapping from data-model.md (cleared dates, reset status, regenerated IDs on all activities/tickets/checklist items, all checklist `checked` → `false`, destination name prefixed with `t('tripPlanner.duplicatePrefix') + ' '`); call `addTrip(duplicated)` via the existing `useTrips` hook; after save, navigate to the new trip's edit form (`setSelectedTrip(newTrip); setView('new')`)
- [x] T025 [US6] Wire the duplicate button in `TripDetail.tsx` by adding an `onDuplicate: () => void` prop, then passing `() => handleDuplicate(currentTrip)` from `TripPlanner.tsx`

**Checkpoint**: Duplicate a trip → new trip opens in edit form with "Copy of…" name, blank dates, Status = Planning; original trip unchanged in list.

---

## Phase 8: User Story 7 — Wishlist Pin "Plan Trip" Verification (Priority: P3)

**US7 Goal**: Confirm the "Plan Trip" button in `PinForm.tsx` works correctly for wishlist-type pins (same cross-MFE navigation as visited/lived pins).

**Independent Test**: On Travel Map, place a wishlist pin, click "Plan Trip" — verify Trip Planner opens with destination and coordinates pre-filled.

### Implementation for US7

- [x] T026 [US7] Read `packages/travel-map/src/components/PinForm.tsx` lines 170–189; verify the "Plan Trip" button renders unconditionally for `editPin` (not gated on `editPin.type`); if it is gated on type, remove the gate so it shows for all pin types including `'wishlist'`
- [x] T027 [P] [US7] In `packages/travel-map/src/components/PinForm.tsx`, confirm the button label uses `t('travelMap.planTrip')` and the button has `type="button"` and `aria-label={t('travelMap.planTrip')}`; if these are missing, add them

**Checkpoint**: Wishlist pin → click "Plan Trip" → Trip Planner at `/trip-planner?destination=...&lat=...&lon=...` opens with values pre-filled.

---

## Phase 9: User Story 8 — Itinerary Export (Priority: P3)

**US8 Goal**: Users can export a formatted plain-text itinerary to clipboard (with `.txt` download fallback).

**Independent Test**: Click "Export itinerary" on a trip with 2 days, 1 activity, 1 ticket, and 2 checklist items — verify the clipboard/download contains all sections in order.

### Implementation for US8

- [x] T028 [US8] Create a pure formatting function `formatTripExport(trip: Trip, currency: string): string` in a new file `packages/trip-planner/src/utils/exportTrip.ts`; the function builds the plain-text structure from research.md R-005 (destination header, dates, status, budget, checklist section, tickets section, day-by-day itinerary with activities); dates displayed as `YYYY-MM-DD` or `'TBD'` if empty; days with no activities show `(no activities)`; ticket cost displayed when `> 0`
- [x] T029 [US8] In `packages/trip-planner/src/components/TripDetail.tsx`, add an "Export itinerary" button in the header action area (next to Duplicate); implement the click handler: call `formatTripExport(trip, trip.currency)`, attempt `navigator.clipboard.writeText(text)` and show a brief `t('tripPlanner.exportCopied')` confirmation (e.g., change button label for 2 seconds); on clipboard failure, trigger a `.txt` file download using the Blob + `<a download>` pattern from quickstart.md
- [x] T030 [P] [US8] Add `aria-label={t('tripPlanner.export')}`, `type="button"`, and appropriate Tailwind classes (neutral colour, not competing with the primary action buttons) to the export button; ensure dark-mode classes are present

**Checkpoint**: Export on a non-empty trip → text appears in clipboard (or downloads); text includes destination, dates, all activities with their notes, all tickets with costs, and checklist with checked state.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Validate integration, run full suite, ensure nothing is broken.

- [x] T031 Run `pnpm --filter @mycircle/shared build` to confirm final i18n state compiles
- [x] T032 [P] Run `pnpm --filter @mycircle/trip-planner test:run` and fix any failures (existing tests for TripPlanner.test.tsx may need updating if component props changed)
- [x] T033 [P] Run `pnpm --filter @mycircle/travel-map test:run` and fix any failures
- [x] T034 Run `pnpm lint && pnpm typecheck` from repo root; fix all lint and TypeScript errors
- [x] T035 Verify the `TripForm.tsx` `onSave` payload includes `status` (check that `useTrips.addTrip` and `useTrips.updateTrip` pass the full object through to the window bridge — they accept `Record<string, unknown>` so no change needed, but confirm)
- [x] T036 [P] Spot-check dark mode: open trip detail, checklist, and trip list in dark mode — verify all new elements have correct `dark:` colour variants with no white-on-white or invisible text
- [x] T037 [P] Spot-check mobile layout: on a 375px viewport, verify checklist items, edit forms, and export/duplicate buttons have ≥ 44px touch targets and do not overflow

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 3 (US1 & US2)**: Depends on Phase 1 (i18n keys + types)
- **Phase 4 (US3)**: Depends on Phase 1; independent of Phase 3
- **Phase 5 (US5)**: Depends on Phase 1; independent of Phases 3 and 4
- **Phase 6 (US4)**: Depends on Phase 1 (ChecklistItem type); independent of Phases 3–5
- **Phase 7 (US6)**: Depends on Phase 1; benefits from US5 being complete (status reset on duplicate), but can proceed without it
- **Phase 8 (US7)**: Depends on Phase 1; independent of all other phases
- **Phase 9 (US8)**: Depends on Phase 1; independent of all other phases
- **Phase 10 (Polish)**: Depends on all desired user stories

### User Story Dependencies

| Story | Depends on | Files |
|---|---|---|
| US1 (edit activity) | Phase 1, US2 recommended first | TripDetail.tsx |
| US2 (activity notes) | Phase 1 | TripDetail.tsx |
| US3 (ticket cost) | Phase 1 | TripDetail.tsx |
| US4 (checklist) | Phase 1 | ChecklistSection.tsx (new), TripDetail.tsx |
| US5 (status) | Phase 1 | TripForm.tsx, TripList.tsx, TripDetail.tsx |
| US6 (duplicate) | Phase 1 | TripPlanner.tsx, TripDetail.tsx |
| US7 (wishlist pin) | Phase 1 | PinForm.tsx |
| US8 (export) | Phase 1 | exportTrip.ts (new), TripDetail.tsx |

### Within Each User Story

- Models/types before UI components
- Add form changes before edit form changes (US1/US2)
- New component file before integrating into parent (US4, US8)
- Display changes can be [P] with logic changes when they target different DOM sections

---

## Parallel Opportunities

### Phase 1 (after T001 is written, T002 and T003 can run alongside each other)

```
T001 → T002 [P] es.ts
     → T003 [P] zh.ts
→ T004 (types) → T005 (build:shared)
```

### P2 stories (Phases 4–6) are fully parallel after Phase 1

```
Phase 1 complete →
  Phase 4 (US3 — TripDetail.tsx, ticket section)
  Phase 5 (US5 — TripForm.tsx, TripList.tsx)
  Phase 6 (US4 — ChecklistSection.tsx new file)
```

### P3 stories (Phases 7–9) are fully parallel after Phase 1

```
Phase 1 complete →
  Phase 7 (US6 — TripPlanner.tsx + TripDetail.tsx duplicate)
  Phase 8 (US7 — PinForm.tsx travel-map)
  Phase 9 (US8 — exportTrip.ts new + TripDetail.tsx export button)
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 — Activity Editing and Notes)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 3: US1 + US2 (T006–T012)
3. **STOP and VALIDATE**: Run trip-planner, add an activity, edit it, verify notes display
4. This alone closes the most-reported UX gap (can't edit activities)

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 3 (US1+US2) → Activity editing MVP ← demonstrate here
3. Phase 4 (US3) → Complete budget tracking
4. Phase 5 (US5) → Trip status badges
5. Phase 6 (US4) → Packing checklist
6. Phases 7–9 (US6, US7, US8) → Power features (parallel)
7. Phase 10 → Polish and ship

### Single Developer Sequence

```
T001 → T002 → T003 → T004 → T005
→ T006 → T007 → T008           (US2 — notes add form)
→ T009 → T010 → T011 → T012    (US1 — edit activity)
→ T013 → T014 → T015           (US3 — ticket cost)
→ T016 → T017 → T018           (US5 — status)
→ T019 → T020 → T021 → T022    (US4 — checklist)
→ T023 → T024 → T025           (US6 — duplicate)
→ T026 → T027                  (US7 — wishlist pin)
→ T028 → T029 → T030           (US8 — export)
→ T031 → T032 → T033 → T034 → T035 → T036 → T037
```

---

## Notes

- `[P]` tasks modify different files or non-conflicting sections — safe to run in parallel
- `[Story]` label maps each task to a specific user story for traceability
- `Activity.notes` already exists in the TypeScript type — T004 only needs to add the 4 missing fields
- `useTrips` hook requires no changes — the window bridge accepts arbitrary `Partial<Trip>` updates
- After any i18n file edit, run `pnpm build:shared` before starting MFE dev server
- Commit after each phase checkpoint to preserve independently working increments
- Total tasks: **37** (T001–T037)
