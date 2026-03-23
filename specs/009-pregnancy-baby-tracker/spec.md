# Feature Specification: Pregnancy & Baby Memory Journal

**Feature Branch**: `009-pregnancy-baby-tracker`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Pregnancy milestones, baby photo journal, and developmental tracking — make sure no conflicts with current MFE"

## Context & Scope Boundary

MyCircle already ships two related MFEs:

- **Baby Tracker** (`/baby-tracker`, `packages/baby-tracker`): Week-by-week pregnancy progress, gestational age, trimester info, fruit-size comparisons, and per-pregnancy-stage milestone photos. **This is the MFE that will be extended.**
- **Child Development** (`/child-development`): Reference developmental milestone timelines for children ages 0–17 (toddler, middle childhood, teens).

This feature extends the existing **Baby Tracker MFE** — no new MFE package is created. New capabilities (personal milestone event logging, a dedicated photo journal album, and developmental achievement recording) are added to `packages/baby-tracker` as **collapsible card sections** below the existing pregnancy content on the same scrolling page. It does **not** duplicate the week-by-week pregnancy tracker or the reference milestone data already in the above MFEs.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Log a Personal Pregnancy Milestone (Priority: P1)

An expectant parent wants to record specific memorable moments during pregnancy — "felt first kick", "third trimester started", "baby shower" — with a date, note, and optional photo. Right now, Baby Tracker shows gestational progress but has no way to log personal events.

**Why this priority**: Pregnancy is fleeting. Parents need to capture personal moments before they're forgotten. This is the most emotionally valuable slice of the feature and the foundation everything else builds on.

**Independent Test**: Can be tested by creating a pregnancy milestone event with a title, date, and note. The entry should appear in a chronological journal. No photo or child profile required for MVP of this story.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Memory Journal page, **When** they tap "Add Milestone" and fill in a title ("Felt first kick"), date, and optional note, **Then** the entry is saved and appears in the journal sorted by date.
2. **Given** an existing milestone entry, **When** the user edits the title or note, **Then** the updated content is reflected immediately.
3. **Given** an existing milestone entry, **When** the user deletes it, **Then** it is permanently removed after a confirmation prompt.
4. **Given** a user who is not signed in, **When** they view the journal, **Then** they see a sign-in prompt explaining that entries are saved to their account.

---

### User Story 2 — Dedicated Photo Album with Timeline View (Priority: P2)

A parent wants to browse all their baby/pregnancy photos in a single chronological album rather than hunting through individual week/stage entries in Baby Tracker. They want to see a scrollable photo timeline sorted by date taken.

**Why this priority**: Photo browsing is a high-frequency use case once a child is born. The current milestone-attached photo experience in Baby Tracker lacks album-style navigation.

**Independent Test**: Can be fully tested by uploading photos with dates and captions, then verifying they appear in a scrollable timeline grouped by month, sorted newest-first. No milestone entries required.

**Acceptance Scenarios**:

1. **Given** a user with uploaded baby photos, **When** they open the Photo Album tab, **Then** they see photos displayed in a scrollable timeline grouped by month.
2. **Given** the photo album, **When** the user taps a photo, **Then** a fullscreen lightbox opens with the photo, caption, and date.
3. **Given** the lightbox, **When** the user swipes left/right (or taps arrows on desktop), **Then** they navigate to adjacent photos without closing the lightbox.
4. **Given** the photo upload flow, **When** the user selects a photo and optionally adds a caption and date, **Then** the photo is stored and immediately appears in the album.
5. **Given** a user who has not uploaded any photos, **When** they open the Photo Album tab, **Then** they see an empty state with a clear call-to-action to add the first photo.

---

### User Story 3 — Record Personal Developmental Milestone Achievements (Priority: P3)

A parent wants to record the actual date their child accomplished each developmental milestone (e.g., "first smile", "first steps", "first words") — not just see the reference chart in Child Development, but log their own child's personal achievement with a date and optional note.

**Why this priority**: Child Development shows what to expect; this story lets parents log what actually happened for their child. It complements (not replaces) the existing reference view.

**Independent Test**: Can be fully tested by selecting a child, marking a milestone as achieved with a date, and verifying the achievement date is shown persistently. No photos required.

**Acceptance Scenarios**:

1. **Given** a user with a child profile, **When** they open the Milestones tab and tap a milestone (e.g., "First smile"), **Then** they can enter the achievement date and an optional note.
2. **Given** a logged milestone achievement, **When** the user returns to the Milestones tab, **Then** the milestone shows as completed with the recorded date.
3. **Given** a logged milestone achievement, **When** the user taps it, **Then** they can edit the date/note or clear the achievement.
4. **Given** a user viewing milestones, **When** they filter by "Achieved" vs "Upcoming", **Then** only the relevant milestones are shown.

---

### Edge Cases

- What happens when a user logs a milestone with a future date? → Accept and display as a planned/upcoming event with a visual indicator.
- What happens when a photo upload fails mid-stream? → Show an inline error with a retry button; do not partially add the photo to the album.
- What happens when the user has no child profiles and tries to log a developmental achievement? → Prompt them to add a child profile first.
- What happens when the journal has hundreds of entries? → Apply pagination so the page remains responsive.
- What happens when the user switches to a different child? → All journal views (photos, milestones, achievements) update to reflect the selected child.
- What happens when the same photo already exists in Baby Tracker's milestone stage? → Memory Journal photos are a separate collection; no automatic deduplication is attempted.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create a named milestone event with a title, date, and optional note. Milestone events are text-only — photos are managed exclusively in the journal album section.
- **FR-002**: Users MUST be able to edit and delete previously logged milestone events.
- **FR-003**: Users MUST be able to upload photos with an optional caption and date into a unified photo journal album that replaces the existing per-stage milestone photo UI.
- **FR-004**: The photo album MUST display photos grouped by month in newest-first order.
- **FR-005**: Users MUST be able to open a fullscreen lightbox from any album photo and navigate between adjacent photos.
- **FR-006**: Users MUST be able to mark an infant developmental milestone (ages 0–18 months: age bands `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m`) as achieved, recording the date and an optional note against their child's profile. Milestones for ages beyond 18 months are covered by the Child Development MFE and are out of scope here.
- **FR-007**: Achieved developmental milestones MUST persist across sessions and be associated with the specific child profile.
- **FR-008**: ~~Unified timeline~~ — dropped. The single-page collapsible layout makes a merged timeline redundant.
- **FR-009**: All journal data MUST be scoped to the signed-in user and NOT accessible to other users.
- **FR-010**: The feature MUST support the existing multi-child profile selector — all content is per-child.
- **FR-011**: The feature MUST NOT re-implement pregnancy week tracking, gestational age, or fruit comparisons (those remain in Baby Tracker).
- **FR-012**: The feature MUST NOT re-implement the reference developmental milestone charts (those remain in Child Development).
- **FR-013**: The existing pregnancy development stages MUST remain unchanged — the `developmentStages` data (stage names, week ranges, descriptions, comparisons, icons in `babyGrowthData.ts`) and all stage card rendering in `BabyTracker.tsx` MUST NOT be modified. Only the `MilestonePhoto` sub-component within each stage card is removed as part of the photo album unification.

### Key Entities

- **MilestoneEvent**: A personally logged moment — title, date, optional note, child association, and owner user. Text-only; no photo attachment.
- **JournalPhoto**: A photo in the dedicated album — photo URL, optional caption, date (user-provided or upload date), child association, owner user.
- **DevelopmentalAchievement**: A record that a child achieved a known milestone — milestone reference ID, achievement date, optional note, child association.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can log a milestone event in under 30 seconds from tapping "Add".
- **SC-002**: The photo album loads and displays the first screen of photos in under 2 seconds on a standard mobile connection.
- **SC-003**: 95% of users can locate the "Log achievement" action for a developmental milestone without assistance on first use.
- **SC-004**: All journal entries (milestones, photos, achievements) survive app restart and sign-out/sign-in without data loss.
- **SC-005**: Each collapsible section (events, photos, achievements) remains responsive when a child has 100+ entries in that section.
- **SC-006**: No existing Baby Tracker or Child Development functionality is removed or degraded by this feature.

---

## Clarifications

### Session 2026-03-23

- Q: Should the new features be delivered as a new standalone MFE package or as extensions to the existing Baby Tracker MFE? → A: Extend the existing Baby Tracker MFE (`packages/baby-tracker`). No new MFE package is created.
- Q: How should the new features be integrated into the existing Baby Tracker UI? → A: Keep the single scrolling page layout; add the new features as collapsible card sections below the existing pregnancy content.
- Q: How should the new free-form photo journal relate to the existing per-stage milestone photos? → A: Unify — migrate existing per-stage milestone photos into the new journal album (tagged with their original stage label); remove the old per-stage photo UI. A one-time migration script is provided as a manual step for users with existing photos.
- Q: Which developmental milestone age range should the achievements section inside Baby Tracker cover? → A: Infant only (0–12 months) — milestones from age bands `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m`. Older-child milestones remain in the separate Child Development MFE.
- Q: Should the Unified Memory Timeline (US4) be included given the single-page collapsible layout already surfaces all content? → A: Drop it — the collapsible layout makes it redundant.
- Q: Should milestone events support an optional photo attachment, or should all photos live exclusively in the journal album section? → A: Photos only in the album — milestone events are text-only (title, date, note).
- Q: Should the existing pregnancy development stages in baby-tracker (developmentStages data, stage card text, descriptions, icons) be modified by this feature? → A: No — all existing stage data and display are frozen and must not change. The `developmentStages` array in `babyGrowthData.ts` (stage names, week ranges, descriptions, fruit comparisons, icons) and all stage card rendering in `BabyTracker.tsx` MUST remain exactly as-is. Only the `MilestonePhoto` component embedded within stage cards is removed; the stage card content itself is fully preserved.

---

## Assumptions

- Child profiles are managed via the existing shared child profile infrastructure; this feature reuses that.
- The new features are added to the existing `packages/baby-tracker` package — no new package, route, or Module Federation remote is introduced.
- The existing pregnancy tracker UI (gestational weeks, trimester, fruit comparisons, verse of day) is preserved unchanged. The `developmentStages` array in `babyGrowthData.ts` — containing validated stage names, week ranges, descriptions, fruit/size comparisons, and icons — is frozen and MUST NOT be edited. The only change to stage cards is the removal of the embedded `MilestonePhoto` component; all other stage card content stays exactly as-is.
- Existing per-stage milestone photos (`users/{uid}/baby-photos/{stageId}.jpg` in Cloud Storage, `users/{uid}/babyMilestones/{stageId}` in Firestore) are migrated into the unified journal album via a one-time manual migration script. After migration the old per-stage photo UI is removed.
- The developmental milestone reference data (IDs and labels) comes from the existing Child Development package; this feature adds a personal achievement layer on top.
- Photo storage uses a different path prefix from Baby Tracker's existing per-stage photos to avoid collisions.
- No sharing or export feature is in scope for this iteration — all data is private to the owner.
- Users with existing data in Baby Tracker or Child Development do NOT need to re-enter it; new features are purely additive.
