# Feature Specification: Travel Itinerary Builder Enhancements

**Feature Branch**: `020-travel-itinerary-enhancements`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "Travel itinerary builder with destinations, activities, and day-by-day planning, this is an existed MFE, see what we have, and how to improve it, and add new features."

## Context: What Exists Today

The app has two related MFEs:

**Travel Map** (`/travel-map`): A map where users pin destinations they have lived in, visited, or wish to visit. Pins store a name, notes, optional date range, and coordinates. Users can filter by pin type, search for locations, and tap the map to place new pins. A "Plan Trip" button on any pin navigates to the Trip Planner with the destination pre-filled.

**Trip Planner** (`/trip-planner`): A trip management tool where users create trips with a destination, date range, budget, currency, and notes. Each trip has a day-by-day itinerary where activities (time, title, location, cost) can be added to each day. Trips also support a ticket log (flight, train, bus, boat, other) with a date and description. A "View on Map" button navigates back to the Travel Map centered on the destination.

**Gaps and improvement opportunities identified:**
- Activities cannot be edited after creation — only deleted and re-created
- Activities have no notes field in the add form (the data model supports it but the UI doesn't expose it)
- Ticket entries have no cost field — there is no way to track transport spend separately from activities
- Budget tracking only shows a total spent vs budget; there is no breakdown by day or category
- There is no way to reorder activities within a day (only time-sorted, no drag or manual reorder)
- The trip list shows no summary statistics (total days, budget used, activity count)
- No packing list or checklist feature per trip
- No trip duplication — users planning similar trips must re-enter everything
- No trip status field (planning, confirmed, completed, cancelled)
- No photo or attachment support per trip or per activity
- The map pin "wishlist" type and the Trip Planner have no explicit connection — a wishlist pin cannot be promoted to a planned trip with one action
- There is no way to export or share a trip itinerary

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Existing Activities (Priority: P1)

A user added an activity with the wrong time or a typo in the title. They want to correct it without deleting and re-creating it, which would lose any details already entered.

**Why this priority**: This is a basic data-integrity expectation. The current delete-and-recreate workaround is lossy and frustrating. Fixing it unblocks confident use of the itinerary feature.

**Independent Test**: Open a trip detail view, find an existing activity, tap edit, change the title and time, save — verify the activity reflects the changes in the list.

**Acceptance Scenarios**:

1. **Given** a trip with at least one activity on a day, **When** the user taps the edit icon on that activity, **Then** an inline form pre-filled with the current values appears.
2. **Given** the edit form is open, **When** the user changes the title and saves, **Then** the activity updates in place, the day list reflects the new values, and the form closes.
3. **Given** the edit form is open, **When** the user taps Cancel, **Then** the activity is unchanged and the form closes.

---

### User Story 2 - Activity Notes in the Add/Edit Form (Priority: P1)

A user wants to add reminders or context to a specific activity — for example, a reservation confirmation number for a restaurant booking. The data model supports a notes field but the add form does not expose it.

**Why this priority**: Notes are already stored in the data structure; surfacing them in the UI completes an already-half-built feature with minimal risk.

**Independent Test**: Add a new activity and fill in the notes field — verify the notes appear on the activity card in the day view.

**Acceptance Scenarios**:

1. **Given** the add-activity form is open, **When** the user enters text in the notes field and saves, **Then** the saved activity displays notes below the title.
2. **Given** an existing activity with notes, **When** the user opens the edit form, **Then** the notes field is pre-populated with the existing text.

---

### User Story 3 - Ticket Cost Tracking (Priority: P2)

A user books flights for a trip and wants to track how much they spent on transport alongside their activity costs so they can see total trip expenditure accurately.

**Why this priority**: Budget accuracy is a key value of the planner. Transport costs are typically the largest expense category; omitting them makes the budget tracker misleading.

**Independent Test**: Add a ticket with a cost value — verify the ticket shows the cost and the budget "total spent" includes it.

**Acceptance Scenarios**:

1. **Given** the add-ticket form is open, **When** the user enters a cost amount and saves, **Then** the ticket displays the cost in the ticket list.
2. **Given** a trip with tickets that have costs, **When** the user views the budget summary, **Then** the total spent includes both activity costs and ticket costs.
3. **Given** a ticket with cost = 0, **Then** no cost is displayed on the ticket card (cost is optional).

---

### User Story 4 - Trip Packing List / Checklist (Priority: P2)

A user preparing for a trip wants a simple checklist to track what to pack or what tasks to complete before departure (e.g., "Book hotel", "Get travel insurance", "Pack charger").

**Why this priority**: Checklists are a high-frequency travel planning behaviour. They extend the planner from dates-and-activities into full trip preparation without requiring a separate app.

**Independent Test**: Open a trip, add three checklist items, check two of them — verify checked items appear visually distinguished and the unchecked count is shown.

**Acceptance Scenarios**:

1. **Given** a trip detail view, **When** the user opens the Checklist section and adds an item, **Then** the item appears in the list as unchecked.
2. **Given** a checklist with items, **When** the user taps an item, **Then** it toggles between checked and unchecked states with a visual strikethrough on checked items.
3. **Given** a mix of checked and unchecked items, **Then** the checklist header shows the count of remaining unchecked items (e.g., "Checklist — 3 remaining").
4. **Given** a checklist item, **When** the user deletes it, **Then** it is removed from the list.

---

### User Story 5 - Trip Status Field (Priority: P2)

A user has several trips in various stages — some are ideas, one is confirmed with tickets, another is already completed. They want a quick visual indicator of each trip's status in the list view.

**Why this priority**: As the trip list grows, distinguishing planning intent from confirmed bookings from completed travel is essential for navigating the list efficiently.

**Independent Test**: Change a trip's status to "Confirmed" — verify the badge appears on the trip card in the list.

**Acceptance Scenarios**:

1. **Given** the trip form, **When** the user selects a status (Planning / Confirmed / Completed / Cancelled), **Then** the status is saved with the trip.
2. **Given** the trip list, **Then** each trip card shows a colour-coded status badge.
3. **Given** a Completed trip, **Then** the card is visually de-emphasised (e.g., muted colours) so active trips are more prominent.

---

### User Story 6 - Duplicate a Trip (Priority: P3)

A user runs the same annual trip and wants to re-use an existing itinerary as a starting point for next year's version, then update dates and adjust activities.

**Why this priority**: Reduces data-entry friction for repeat travellers. Lower priority because it is a convenience feature; the workaround (manual re-entry) is functional.

**Independent Test**: Duplicate a trip, verify a new trip is created with the same destination, itinerary, and tickets but with a "Copy of …" name and blank dates — update the dates and save.

**Acceptance Scenarios**:

1. **Given** a trip in the list, **When** the user selects "Duplicate", **Then** a new trip is created with the same destination, notes, activities, tickets, and checklist, but with a name prefixed "Copy of", blank start/end dates, and status set to "Planning".
2. **Given** the duplicated trip, **When** the user opens it, **Then** all the original content is present and editable.

---

### User Story 7 - Promote Wishlist Pin to Trip (Priority: P3)

A user has a destination on their Travel Map wishlist and is now ready to plan it. They want to convert it into a trip without switching apps and re-searching for the location.

**Why this priority**: Cross-MFE workflows increase perceived product cohesion. This extends the existing "Plan Trip" button on visited pins so wishlist pins are equally actionable.

**Independent Test**: On the Travel Map, click "Plan Trip" on a wishlist pin — verify the Trip Planner opens with the destination and coordinates pre-filled.

**Acceptance Scenarios**:

1. **Given** a wishlist pin on the Travel Map, **When** the user taps "Plan Trip", **Then** the Trip Planner opens with the pin's name and coordinates pre-filled in a new trip form.
2. **Given** the new trip was saved, **When** the user returns to the Travel Map, **Then** the pin's type can optionally be promoted from "wishlist" to "visited" (separate manual action, not automatic).

---

### User Story 8 - Trip Itinerary Export (Priority: P3)

A travel companion or family member wants a printed or shareable summary of the day-by-day itinerary to keep offline or share with others in the group.

**Why this priority**: Export is a quality-of-life feature that makes the planner useful beyond the app itself. Lower priority as it requires no backend change — purely a presentation/formatting concern.

**Independent Test**: Tap "Export" on a trip — a text or structured summary of all days, activities, and tickets is downloaded or copied to the clipboard.

**Acceptance Scenarios**:

1. **Given** a trip with at least one day and activity, **When** the user taps "Export itinerary", **Then** a formatted summary (destination, dates, budget, days with activities, tickets) is made available for download or clipboard copy.
2. **Given** an empty itinerary, **Then** the export still succeeds and produces a minimal summary with only destination and dates.

---

### Edge Cases

- What happens when a user edits an activity's time so it conflicts with another activity on the same day? (Activities should re-sort by time; no collision blocking needed — the same time slot is allowed.)
- What happens if a user deletes all activities from a day? (The day row remains visible as long as it falls within the trip date range — it shows as empty with the "Add activity" button.)
- What happens if a trip's start date is changed so that existing activity days fall outside the new date range? (Days outside the new range are still stored but not shown — they reappear if the date range is extended again.)
- What happens when the budget is set to 0? (Budget summary is hidden, as today.)
- What happens if a checklist is exported? (Checklist items should appear in the export with their checked/unchecked state.)
- What happens if a trip is duplicated and immediately exported? (Blank dates in the export should show a placeholder such as "Dates TBD".)

## Requirements *(mandatory)*

### Functional Requirements

**Improvements to existing functionality:**

- **FR-001**: Users MUST be able to edit an existing activity's time, title, location, cost, and notes after it has been saved.
- **FR-002**: The add-activity and edit-activity forms MUST include a notes field that is saved to the activity.
- **FR-003**: The add-ticket and edit-ticket forms MUST include an optional cost field. Ticket costs MUST be included in the trip's total-spent calculation.
- **FR-004**: The trip list view MUST display a summary card for each trip showing: destination, date range, status badge, total activity count, and budget utilisation (spent/total if budget > 0).

**New features:**

- **FR-005**: Each trip MUST have a status field with four possible values: Planning, Confirmed, Completed, Cancelled. New trips default to Planning.
- **FR-006**: Users MUST be able to add, check/uncheck, and delete checklist items on any trip. The checklist header MUST show the count of unchecked items.
- **FR-007**: Users MUST be able to duplicate a trip. The duplicate MUST copy all fields (destination, notes, itinerary, tickets, checklist) except: the name is prefixed with "Copy of", start/end dates are cleared, status is reset to Planning.
- **FR-008**: The "Plan Trip" button on Travel Map pins MUST be available on wishlist-type pins (currently it appears to exist for all pin types already, but must be confirmed and tested).
- **FR-009**: Users MUST be able to export a trip itinerary as a formatted plain-text or structured document available for download or clipboard copy.

### Key Entities

- **Trip**: A planned journey with destination, date range, status, notes, budget, currency, itinerary (list of days), tickets (list of transport bookings), and checklist (list of items). Identified by a unique ID; persisted per user.
- **ItineraryDay**: A single calendar date within the trip date range, containing an ordered list of Activities.
- **Activity**: A single scheduled event on a day, with time, title, location, cost, and notes. Activities within a day are sorted by time.
- **Ticket**: A transport booking record with type (flight/train/bus/boat/other), description, date, and cost.
- **ChecklistItem**: A text item attached to a trip with a boolean completed state. Items are ordered by creation time.
- **TravelPin** (Travel Map): An existing entity. Pins of type "wishlist" are the cross-MFE entry point for promoting a destination to a planned trip.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit an existing activity in under 30 seconds without leaving the trip detail view.
- **SC-002**: Budget summary accurately reflects 100% of tracked spend — activities and tickets — so users never see a lower total than they actually spent.
- **SC-003**: Users can create a checklist and mark all items complete for a trip without navigating away from the trip detail view.
- **SC-004**: A user can duplicate a trip and have the new trip fully editable in under 5 taps/clicks.
- **SC-005**: Trip list cards provide enough summary information (status, dates, activity count, budget) that users can identify and select the correct trip without opening it first.
- **SC-006**: 100% of wishlist pins on the Travel Map offer a "Plan Trip" action that pre-fills the Trip Planner form (same behaviour as visited/lived pins).
- **SC-007**: A user can export a complete trip itinerary in a human-readable format in under 3 taps/clicks with no data loss (all days, activities, tickets, and checklist items included).

## Assumptions

- The `Activity.notes` field already exists in the data model (`packages/trip-planner/src/types.ts`) — this spec assumes it does; only the UI form needs updating.
- The "Plan Trip" button appears to already be present on all pin types in `PinForm.tsx`; Story 7 may require only testing and minor style confirmation rather than new development.
- Checklist items will be stored as part of the `Trip` document (a new `checklist` array field) — no separate collection is needed.
- Export format will be plain text or clipboard-first; PDF export is out of scope for this spec.
- Activity reordering by drag-and-drop is out of scope; activities remain time-sorted automatically.
- Photo/attachment support per activity is out of scope for this spec.
- Multi-user trip sharing (collaborative editing) is out of scope; export (read-only sharing) is in scope.
