# Feature Specification: Daily Log Journal Enhancements

**Feature Branch**: `011-daily-log-enhancements`
**Created**: 2026-03-24
**Status**: Draft
**Input**: Enhance the existing daily-log MFE with full-featured journaling: mood tracking, tags, search, and stats

## Context

The existing `daily-log` MFE provides a timeline-based activity log with plain-text entries, time filters, and real-time Firestore sync. This spec covers four additive enhancements to transform it into a richer journaling experience. Each enhancement is independently deliverable.

**Current entry model**: `{ id, date, content, createdAt }`
**Current capabilities**: create/edit/delete/move entries, today/month/all filters, weekday/weekend toggles, real-time sync.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Mood Tracking Per Entry (Priority: P1)

A user writes a journal entry and wants to record how they felt. They select an emoji mood indicator (e.g., 😊 happy, 😐 neutral, 😔 sad, 😤 frustrated, 🔥 energized) alongside the text. Over time, they can glance at the timeline and see a color-coded or emoji-annotated history of their emotional patterns.

**Why this priority**: Mood is the most visceral and personal dimension of journaling. It adds immediate expressive value with zero learning curve, and enables the mood-trend stats in Story 4.

**Independent Test**: Can be tested by adding an entry with a mood selection, verifying the mood persists after reload, and seeing the mood indicator in the timeline — all without tags, search, or stats being present.

**Acceptance Scenarios**:

1. **Given** a new entry form is open, **When** the user taps a mood emoji, **Then** the mood is visually selected and stored with the entry on save.
2. **Given** an existing entry with mood "happy", **When** the user edits and changes mood to "frustrated", **Then** the updated mood is reflected immediately in the timeline.
3. **Given** an entry has no mood selected, **When** the user saves it, **Then** the entry saves successfully with no mood indicator shown (mood is optional).
4. **Given** a timeline with entries of mixed moods, **When** the user views the timeline, **Then** each entry displays its mood emoji inline with the text.

---

### User Story 2 — Tags / Labels on Entries (Priority: P2)

A user tags an entry with categories like `#work`, `#health`, or `#family`. They can click a tag anywhere in the timeline to filter the view to only entries with that tag, letting them trace a single theme across many days.

**Why this priority**: Tags enable cross-day thematic navigation that time filters alone cannot provide. They also feed the stats view for most-used tag analysis.

**Independent Test**: Can be tested by adding tags to entries, filtering by tag, and verifying only matching entries appear — without mood, search, or stats.

**Acceptance Scenarios**:

1. **Given** a new entry form, **When** the user types a tag name and confirms it, **Then** the tag is attached to the entry and shown as a chip in the timeline.
2. **Given** an entry with three tags, **When** the user removes one tag during edit, **Then** the removed tag disappears from that entry only; other entries are unchanged.
3. **Given** a timeline with entries tagged `#work` and `#family`, **When** the user taps the `#work` tag chip, **Then** only entries with `#work` are displayed.
4. **Given** a tag filter is active, **When** the user clears it, **Then** the full entry list (respecting other active filters) is restored.
5. **Given** a user tries to add more than 10 tags to a single entry, **When** they attempt to add the 11th, **Then** they are informed of the limit and the entry is unchanged.

---

### User Story 3 — Full-Text Search (Priority: P3)

A user wants to find entries mentioning a specific topic (e.g., "dentist" or "sprint planning"). They type into a search box and see matching entries highlighted in real time, regardless of date.

**Why this priority**: Search is essential for recall-oriented journaling but requires mood and tags to already exist to provide maximum value (search also matches tags). It also works independently on plain text.

**Independent Test**: Can be tested by searching for a known word in existing entry content, verifying matching entries appear with the search term highlighted, and non-matching entries are hidden.

**Acceptance Scenarios**:

1. **Given** entries exist with text "dentist appointment", **When** the user types "dentist" in the search box, **Then** only entries containing "dentist" are shown, with the word highlighted.
2. **Given** a search query is active, **When** the user clears the search field, **Then** the full entry list (respecting other active filters) is restored.
3. **Given** a search query matches an entry's tag but not its text content, **When** the user searches for that tag name, **Then** that entry appears in results.
4. **Given** no entries match the search query, **When** the user finishes typing, **Then** an empty state message is shown (not an error).
5. **Given** the user has 500 entries, **When** they search, **Then** results appear without noticeable delay (under 1 second).

---

### User Story 4 — Journaling Stats & Insights (Priority: P4)

A user taps a "Stats" tab or panel and sees a summary of their journaling habits: current writing streak (days in a row with at least one entry), entries per week chart, most-used tags, and a mood distribution breakdown.

**Why this priority**: Stats are motivational and retrospective — they depend on mood and tag data from Stories 1 and 2 to be meaningful, making them the last piece of the full experience.

**Independent Test**: Can be tested with only plain-text entries (streak + entries-per-week work without mood/tags) and incrementally gains richness as mood/tags are present.

**Acceptance Scenarios**:

1. **Given** a user has logged entries 7 days in a row, **When** they open Stats, **Then** their current streak is shown as "7 days."
2. **Given** a user missed yesterday but logged today, **When** they open Stats, **Then** the streak shows "1 day" (streak resets on a missed day).
3. **Given** entries with mood data exist, **When** the user views Stats, **Then** a mood distribution (e.g., "60% happy, 20% neutral, 20% frustrated") is shown.
4. **Given** entries with tags exist, **When** the user views Stats, **Then** the top 5 most-used tags are shown with entry counts.
5. **Given** fewer than 7 days of data exist, **When** the user views the weekly chart, **Then** available days are shown without error (graceful partial data).

---

### Edge Cases

- When an entry is moved to a different date, the streak must recalculate correctly.
- Tag filtering and time filters must AND together — only entries satisfying both conditions appear.
- Search and tag filter must AND together — only entries satisfying both constraints appear.
- Search with special characters or a single-character query should not crash; it may return no results gracefully.
- Existing entries without mood or tag fields must display and function correctly after the enhancement is deployed.

---

## Requirements *(mandatory)*

### Functional Requirements

**Mood Tracking**

- **FR-001**: The entry form MUST offer a fixed set of 5 mood options (happy, neutral, sad, frustrated, energized); mood selection is optional.
- **FR-002**: Each entry's mood MUST be stored alongside its text and persisted as part of the existing entry document.
- **FR-003**: The timeline MUST display each entry's mood indicator inline; entries without a mood show no indicator.
- **FR-004**: Users MUST be able to update an entry's mood through the existing edit flow.

**Tags**

- **FR-005**: Users MUST be able to attach 1–10 tags per entry; tags are free-form short strings (max 30 characters each).
- **FR-006**: Tags MUST be stored as an array on the entry document and persisted.
- **FR-007**: The timeline MUST render each entry's tags as tappable chips that activate a tag filter.
- **FR-008**: Only one tag filter may be active at a time; activating a second tag filter replaces the first.
- **FR-009**: The active tag filter MUST compose with existing time filters and the search query (AND logic).

**Search**

- **FR-010**: A search input MUST be accessible from the main daily-log view without navigating away.
- **FR-011**: Search MUST match against entry text content and tag names, case-insensitive.
- **FR-012**: Matching text within entry content MUST be visually highlighted in the results.
- **FR-013**: Search results MUST respect all other active filters (time filter, tag filter, day-type toggle).
- **FR-014**: Clearing the search field MUST restore the previous filtered view instantly.

**Stats**

- **FR-015**: A Stats view MUST show the user's current consecutive-day writing streak, recalculated on each view.
- **FR-016**: The Stats view MUST show a chart of entry counts per day for the past 30 days.
- **FR-017**: When mood data is present, the Stats view MUST show a mood distribution summary (percentage per mood).
- **FR-018**: When tag data is present, the Stats view MUST show the top 5 tags by entry count.
- **FR-019**: Stats MUST be computed from the already-loaded entry list — no additional network requests.

**Backward Compatibility**

- **FR-020**: Existing entries without mood or tag fields MUST continue to display and function correctly after deployment.

### Key Entities

- **JournalEntry** (extends existing `WorkEntry`): text content, date, optional mood (one of 5 fixed values), optional tags array (0–10 strings), createdAt timestamp.
- **MoodValue**: one of five fixed options (happy, neutral, sad, frustrated, energized); maps to a display emoji and a color for visual distinction.
- **Tag**: a short free-form label attached to one or more entries; stored inline on each entry (not a standalone entity or shared taxonomy).
- **WritingStreak**: a derived value — count of consecutive calendar days up to and including today that have at least one entry.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a mood to a new or existing entry in under 5 seconds.
- **SC-002**: A user can attach a tag to an entry and filter the timeline by that tag in under 10 seconds total.
- **SC-003**: Search results appear within 1 second for a user with up to 500 entries.
- **SC-004**: The Stats view loads without a loading spinner for users with up to 500 entries (computed from already-loaded data).
- **SC-005**: All existing entries without mood or tag data continue to display correctly after deployment — zero data loss or display errors.
- **SC-006**: Each of the four enhancements (mood, tags, search, stats) functions independently; removing any one does not break the others.

---

## Assumptions

- Mood options are fixed at 5 and not user-customizable in this iteration.
- Tags are free-form text — no global taxonomy, no autocomplete in this iteration.
- Search is client-side (filtering the already-loaded entry list), not a server-side full-text index.
- Stats are computed from the already-loaded Firestore entry list; no new backend aggregation is needed.
- The Firestore entry document (`users/{uid}/dailylog/{entryId}`) gains two optional fields: `mood` and `tags`. No migration is needed for existing documents — missing fields are treated as "no mood" and "no tags."
- The shell's `window.__workTracker.add` and `.update` methods will need to accept `mood` and `tags` as optional fields — this is a backward-compatible extension.
