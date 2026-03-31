# Research: Travel Itinerary Builder Enhancements

**Feature**: 020-travel-itinerary-enhancements
**Date**: 2026-03-31

---

## R-001: Data Storage Strategy for New Fields

**Question**: Where should the new fields (status, checklist, ticket.cost, activity.notes) live — new Firestore collections, subcollections, or additive fields on the existing `Trip` document?

**Decision**: Additive fields on the existing `Trip` document in `users/{uid}/trips/{tripId}`.

**Rationale**:
- All existing trip data (itinerary array, tickets array) already lives in a single document. Adding `status` (string), `checklist` (array of `{id, text, checked}` objects), `ticket.cost` (number on each ticket), and `activity.notes` (string on each activity) follows the same pattern.
- Firestore document size limit is 1 MB. A trip with 14 days × 10 activities × 200-char notes + 50 checklist items ≈ ~50 KB — well within the limit.
- The shell bridge (`window.__tripPlanner.update(id, updates)`) passes arbitrary partial updates — no changes to `firebase.ts` are needed. New fields are written through the existing `updateTrip` path.
- Avoids creating a new `checklists` subcollection, which would require new Firestore rules, a new bridge method, and a new hook — three layers of unnecessary complexity.

**Alternatives Considered**:
- `users/{uid}/tripChecklists/{tripId}` subcollection — rejected; requires new rules, bridge, hook for one simple array.
- Separate `checklist` field on a top-level `tripMeta` document — rejected; splits a single conceptual entity across two reads.

---

## R-002: Inline Activity Edit Pattern

**Question**: Should editing an activity open a modal, a slide-over, or an inline form in the day row?

**Decision**: Inline form replacing the activity row, matching the existing "add activity" inline form pattern in `TripDetail.tsx`.

**Rationale**:
- The existing add-activity form (`addingTo` state) renders an inline form below the day header. Using the same pattern for editing (`editingActivity` state) keeps the interaction model consistent and reuses existing form field classes.
- No new UI component (modal/drawer) required — reduces scope and test surface.
- On mobile the inline approach avoids z-index/overflow issues with a modal inside a scrollable day list.

**Alternatives Considered**:
- Modal overlay — rejected; adds complexity, breaks mobile scroll context.
- Slide-over panel — rejected; existing codebase has no slide-over pattern; would require new component.

---

## R-003: Checklist Component Scope

**Question**: Should the checklist be a standalone component or inline in `TripDetail.tsx`?

**Decision**: New `ChecklistSection.tsx` component, rendered inside `TripDetail.tsx`.

**Rationale**:
- `TripDetail.tsx` is already 393 lines with tickets + itinerary sections. Adding a full checklist inline would push it over 500 lines and make it harder to test independently.
- A single-responsibility `ChecklistSection` component can be unit-tested with a mock `trip` prop and `onUpdate` callback — same pattern as could be applied to tickets or itinerary sections in future.
- The component is purely presentational + interaction; it calls `onUpdate(trip.id, { checklist: updated })` and relies on `TripDetail`'s existing update path.

**Alternatives Considered**:
- Inline in `TripDetail.tsx` — rejected; file already large; harder to test.
- Generic `ChecklistSection` shared to `@mycircle/shared` — rejected; only used in one MFE; premature abstraction.

---

## R-004: Trip Duplication

**Question**: How should "Duplicate trip" be implemented — client-side deep copy or a Cloud Function?

**Decision**: Client-side deep copy using `structuredClone` + `addTrip` via the existing window bridge.

**Rationale**:
- `structuredClone` correctly deep-copies nested arrays (itinerary, tickets, checklist) without mutating the original.
- The result is passed to `window.__tripPlanner.add(newTrip)` — the exact same path used for creating a new trip manually.
- No backend code needed; no new Cloud Function; no new Firestore rules.
- Activity IDs and ticket IDs should be regenerated to avoid duplicate IDs. Simple `crypto.randomUUID()` on each nested item at copy time.

**Alternatives Considered**:
- Cloud Function for server-side duplication — rejected; overkill for a client-side data copy; adds latency.
- Shallow copy — rejected; itinerary and tickets arrays must be deep-copied or mutations on the copy would affect the original in the cache.

---

## R-005: Itinerary Export Format

**Question**: What format should the export produce — PDF, plain text, Markdown, or structured JSON? And what delivery mechanism — download or clipboard?

**Decision**: Plain text (human-readable), delivered via `navigator.clipboard.writeText()` with a fallback download as a `.txt` file.

**Rationale**:
- Plain text is universally pasteable into messaging apps, email, and notes — the primary sharing scenarios.
- `navigator.clipboard.writeText` works in all modern browsers without any new dependency. A `<a download>` fallback covers iOS/Safari clipboard restrictions.
- PDF generation (e.g. `jspdf`) is already used in `016-document-scanner` but would require importing it into `trip-planner` — a new dependency for a feature that plain text serves adequately.
- Markdown is parseable by notes apps but adds escaping complexity for no user-visible benefit in the primary use case.

**Export content structure**:
```
[Trip Name / Destination]
Dates: [start] → [end]   Status: [status]
Budget: [currency] [spent] / [budget]

=== Checklist ===
[ ] Item 1
[x] Item 2

=== Tickets ===
✈ Flight — [description] — [date] — [currency] [cost]

=== Day 1 — Mon, Apr 1 ===
09:00  Visit Eiffel Tower
       Champ de Mars, Paris
       Cost: USD 30
       Notes: Book tickets online

=== Day 2 — Tue, Apr 2 ===
(no activities)
```

**Alternatives Considered**:
- PDF via `jspdf` — rejected; new dependency; plain text serves sharing use case better.
- Markdown — rejected; escaping complexity; no user-visible benefit over plain text.
- JSON export — rejected; not human-readable; user story is about sharing with travel companions.

---

## R-006: Trip Status Values and Visual Treatment

**Question**: How many status values are needed and how should they be visualised?

**Decision**: Four values — `planning | confirmed | completed | cancelled` — displayed as colour-coded pill badges.

**Colour mapping** (with dark variants):
- `planning` → blue (`bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`)
- `confirmed` → green (`bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300`)
- `completed` → gray (`bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400`)
- `cancelled` → red (`bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-400`)

**Rationale**:
- Four values cover the full lifecycle without over-engineering. Matches common travel app vocabulary.
- Completed and cancelled trips are visually de-emphasised with muted colours — active trips (planning, confirmed) use saturated colours.
- Default value for new trips: `planning`.

**Alternatives Considered**:
- Two values (planned/completed) — rejected; no way to distinguish a confirmed booking from a vague idea.
- Free-text status — rejected; inconsistent display and filtering.

---

## R-007: i18n Key Scope

**Question**: Which i18n keys need to be added?

**Identified new keys** (all three locales — en, es, zh):

```
tripPlanner.statusLabel          "Status"
tripPlanner.statusPlanning       "Planning"
tripPlanner.statusConfirmed      "Confirmed"
tripPlanner.statusCompleted      "Completed"
tripPlanner.statusCancelled      "Cancelled"
tripPlanner.checklist            "Checklist"
tripPlanner.checklistEmpty       "No items yet"
tripPlanner.checklistRemaining   "{count} remaining"
tripPlanner.addChecklistItem     "Add item"
tripPlanner.checklistPlaceholder "e.g. Book hotel, Pack charger"
tripPlanner.duplicate            "Duplicate trip"
tripPlanner.duplicatePrefix      "Copy of"
tripPlanner.export               "Export itinerary"
tripPlanner.exportCopied         "Copied to clipboard"
tripPlanner.exportDownload       "Download .txt"
tripPlanner.activityNotes        "Notes"
tripPlanner.ticketCost           "Cost"
```

All existing `travelMap.*` keys are unchanged.
