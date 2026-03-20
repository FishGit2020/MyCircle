# Feature Specification: Bible Enhancements

**Feature Branch**: `006-bible-enhancements`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Daily verse, passage lookup, and multiple Bible translations, check existing MFE and add new features if needed"

## Context

The Bible Reader MFE (`packages/bible-reader`) already provides:
- Daily verse display with automatic date-based rotation
- Multiple Bible translation support (KJV, NIV, ESV, NASB, NLT, AMP, MSG) with a translation picker
- Full passage navigation (book → chapter → verse with prev/next controls)
- Devotional content linked to the daily verse
- Bookmarks saved to localStorage (per-device only)

**What is missing** — three gaps discovered by auditing the existing implementation:

1. **Quick verse reference lookup** — Users cannot type a reference like "John 3:16" or "Genesis 1:1" and jump directly to that passage. Navigation requires clicking through book → chapter dropdowns, which is slow for users who already know the reference they want.

2. **Cross-device bookmark sync** — Bookmarks are stored in localStorage only and are lost when the user switches devices or clears browser data. Signed-in users have no way to access their saved verses on a different device.

3. **Side-by-side translation comparison** — Users can switch translations one at a time but cannot display the same passage in two translations simultaneously to compare wording. This is a common study feature for Bible apps.

This spec describes enhancements to close these three gaps.

---

## User Scenarios & Testing

### User Story 1 — Quick Verse Reference Lookup (Priority: P1)

A user who knows the passage they want types a reference string (e.g. "John 3:16", "Ps 23", "Romans 8:28") into a search input and is taken directly to that passage without navigating through book/chapter dropdowns.

**Why this priority**: The most common Bible app interaction is "go to a specific verse." The current book/chapter dropdown navigation requires many clicks for users who already know the reference. This is a blocking friction point for daily users.

**Independent Test**: Open Bible Reader → type "John 3:16" in the reference search input → press Enter or click Go → the passage display navigates to John chapter 3 and highlights verse 16, with no other feature needed.

**Acceptance Scenarios**:

1. **Given** the Bible Reader is open, **When** the user types "John 3:16" into the reference search and submits, **Then** the passage display navigates to John chapter 3 and scrolls to verse 16.
2. **Given** the user types a book abbreviation like "Ps 23" or "Gen 1:1", **When** submitted, **Then** the abbreviation is resolved to the full book name and the correct passage is shown.
3. **Given** the user types an invalid or unrecognized reference like "Zz 99:99", **When** submitted, **Then** an inline error message appears ("Reference not found") and the passage display does not change.
4. **Given** a partial reference with no verse like "Romans 8", **When** submitted, **Then** the chapter is shown starting at verse 1 with no verse highlight.
5. **Given** the reference search is empty and the user submits, **When** the action fires, **Then** nothing happens and no error is shown.

---

### User Story 2 — Cross-Device Bookmark Sync (Priority: P2)

A signed-in user's bookmarked verses are stored in the cloud so they are available on any device. When the user signs in on a new device, their bookmarks are restored. When signed out, bookmarks fall back to local-only storage.

**Why this priority**: Bookmarks are a core personal feature. Losing them on device switch is a significant frustration. This requires cloud persistence, which is more work than the lookup feature, but has high impact for returning users.

**Independent Test**: Sign in → bookmark "Philippians 4:13" on device A → sign out → sign in on device B → open Bible Reader → confirm "Philippians 4:13" appears in the bookmarks list on device B.

**Acceptance Scenarios**:

1. **Given** a signed-in user bookmarks a verse, **When** the bookmark is saved, **Then** it is persisted to the cloud and visible in the bookmarks list on all signed-in devices.
2. **Given** a user is signed out, **When** they bookmark a verse, **Then** the bookmark is saved to local storage only (existing behavior preserved).
3. **Given** a signed-in user signs in on a new device with no local bookmarks, **When** the Bible Reader loads, **Then** the user's cloud bookmarks are fetched and shown.
4. **Given** a user has local bookmarks and signs in for the first time, **When** sign-in completes, **Then** local bookmarks are merged with cloud bookmarks (union, no duplicates by book/chapter/verse).
5. **Given** a signed-in user removes a bookmark, **When** the deletion is confirmed, **Then** the bookmark is removed from the cloud and no longer appears on any device.

---

### User Story 3 — Side-by-Side Translation Comparison (Priority: P3)

A user studying a passage can open a comparison view that shows the same passage in two selected translations displayed in parallel columns, making it easy to compare wording without manually switching translations.

**Why this priority**: Useful for study but less essential than navigation speed (US1) or data persistence (US2). Requires UI layout work and a secondary translation fetch.

**Independent Test**: Navigate to any chapter → open the comparison view → select "NIV" as the first translation and "KJV" as the second → both translations of the same passage appear side by side in two columns.

**Acceptance Scenarios**:

1. **Given** the user opens the comparison view for the current passage, **When** two translations are selected, **Then** the same chapter is displayed in two side-by-side columns, one per translation.
2. **Given** the comparison view is open, **When** the user navigates to a different chapter, **Then** both columns update to show the new chapter in their respective translations.
3. **Given** the two translation selectors both show the same translation, **When** the user tries to compare, **Then** the second selector rejects the duplicate and shows an inline hint ("Choose a different translation to compare").
4. **Given** the viewport is narrow (mobile), **When** the comparison view is open, **Then** the columns stack vertically rather than side by side, each still showing the full translation label.
5. **Given** the user closes the comparison view, **When** dismissed, **Then** the passage display returns to the single-translation view using the primary translation selected before comparison was opened.

---

### Edge Cases

- What happens when a verse reference points to a book that exists in some translations (e.g. Deuterocanonical books) but not the selected one? Show an error message: "This passage is not available in [Translation]."
- What happens when the cloud bookmark sync fails (network error)? Save to local storage as fallback and show a non-blocking toast: "Bookmarks saved locally — sync failed."
- What happens when a user types a reference with extra whitespace or mixed case like "  john 3 : 16  "? The parser normalizes whitespace and case before resolving the reference.
- What happens when the comparison view is opened for a chapter with many verses on a mobile device? Both stacked columns are independently scrollable.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide a reference search input that accepts book name (full or abbreviated), chapter, and optional verse in formats like "John 3:16", "Ps 23", "Gen 1".
- **FR-002**: System MUST resolve common book abbreviations (Ps → Psalms, Gen → Genesis, Rev → Revelation, etc.) to canonical book names before navigation.
- **FR-003**: System MUST display an inline error when a submitted reference cannot be resolved, without changing the current passage view.
- **FR-004**: Signed-in users' bookmarks MUST be persisted to cloud storage and synced across devices.
- **FR-005**: When a signed-out user signs in, local bookmarks MUST be merged with cloud bookmarks (union by unique book/chapter/verse, no duplicates).
- **FR-006**: Cloud bookmark operations MUST gracefully fall back to local-only behavior when the network or backend is unavailable.
- **FR-007**: System MUST provide a comparison view that renders two translations of the same chapter in parallel.
- **FR-008**: Comparison view translation selectors MUST prevent the same translation from being selected in both slots.
- **FR-009**: Comparison view MUST respond to chapter navigation events and update both columns simultaneously.
- **FR-010**: Comparison view MUST stack columns vertically on narrow viewports (below `md:` breakpoint).
- **FR-011**: Closing the comparison view MUST restore the single-translation display using the primary translation that was active before comparison was opened.
- **FR-012**: All new UI strings MUST be translated in English, Spanish, and Chinese locale files.

### Key Entities

- **Verse Reference**: A parsed representation of a user-typed reference — book name (resolved), chapter number, and optional verse number. Transient — not persisted.
- **Synced Bookmark**: A bookmark with a unique key (book/chapter/verse/translation) owned by a user UID, stored in cloud storage for signed-in users and merged with local bookmarks on sign-in.
- **Comparison View**: A UI state (not persisted) holding two translation IDs and the current chapter. Dismissed on navigation away from Bible Reader.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can navigate to a known verse reference in under 5 seconds from typing to passage display.
- **SC-002**: Bookmarked verses are available on a second device within 3 seconds of sign-in, with no manual action required.
- **SC-003**: The comparison view renders both translations of a chapter within 2 seconds of the second translation being selected.
- **SC-004**: Reference parser correctly resolves 95% of valid single-reference inputs, including the 10 most common book abbreviations.
- **SC-005**: Zero bookmark data loss occurs when syncing between local and cloud storage (merge produces the union, no deletions of valid bookmarks).
- **SC-006**: All three features are fully usable on mobile viewports (320px+) with no horizontal overflow or inaccessible controls.

---

## Out of Scope

- Full-text search across the entire Bible (search by keyword, phrase, or topic)
- Audio Bible playback
- Reading plans or streak tracking
- Social sharing of verses
- Offline support (service worker caching of Bible text)
- More than 2 translations in the comparison view
- Annotation or highlighting of individual words within a verse
- Support for Deuterocanonical books not present in the current translation API

---

## Assumptions

1. The existing translation API used by the Bible Reader MFE supports fetching the same chapter in multiple translation IDs with separate requests; no batch API is assumed.
2. Cloud bookmark storage will use the existing Firestore `users/{uid}` document or a subcollection — the exact path will be determined during planning.
3. The signed-in user's UID is accessible via the existing `window.__currentUid` shell global (consistent with other MFEs).
4. Common abbreviations resolved by the reference parser will cover the 66 canonical books of the Protestant Bible; Deuterocanonical books are out of scope.
5. The comparison view does not need to be deep-linkable via URL in the initial release.
