# Feature Specification: Polls Enhancements

**Feature Branch**: `021-polls-enhancements`
**Created**: 2026-03-31
**Status**: Draft
**Input**: User description: "Create and vote on polls, view live results — improve existing polls MFE and add new features"

## Overview

The existing Polls feature allows authenticated users to create simple polls with options, vote once, and see results with percentage bars. It is functional but limited: there is no duplicate-vote prevention across sessions, no search or filtering, no anonymous vote tracking, and no result analytics. This spec defines enhancements that meaningfully raise the quality and usefulness of the feature for the MyCircle community.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One Vote Per User, Any Session (Priority: P1)

A user who already voted on a poll should not be able to vote again when they return later or from a different device. Currently votes are allowed repeatedly from the same account across different sessions, which corrupts results.

**Why this priority**: Voting integrity is the single most important correctness property of a poll feature. Without it, results are meaningless. This must be fixed before adding any new capabilities.

**Independent Test**: Log in, vote on a poll, log out, log back in, visit the same poll — the voted option is highlighted and no vote buttons are shown. Delivers trustworthy results.

**Acceptance Scenarios**:

1. **Given** a user has already voted on a poll, **When** they navigate back to that poll (same session), **Then** their chosen option is highlighted, all options are non-clickable, and no "Click to vote" prompt is shown.
2. **Given** a user has already voted on a poll, **When** they return in a new session (sign out and sign in), **Then** the same voted option is highlighted and voting is disabled for that poll.
3. **Given** a user has not voted on a poll, **When** they visit the poll detail page, **Then** all options are clickable and the "Click to vote" prompt is displayed.
4. **Given** a poll has expired, **When** any user visits it, **Then** voting is disabled regardless of whether they voted before, and results are shown in read-only mode.

---

### User Story 2 - Search and Filter Polls (Priority: P2)

A user browsing the poll list should be able to quickly find polls relevant to them by searching by keyword or filtering by status (active, expired, my polls, public).

**Why this priority**: As the number of polls grows, the flat chronological list becomes unusable. Search and filter are table-stakes for any content list feature.

**Independent Test**: Open the polls list with 10+ polls. Type a keyword in the search box — only matching polls appear. Switch the filter to "Active Only" — expired polls disappear. Delivers discoverability without any other new feature needed.

**Acceptance Scenarios**:

1. **Given** polls exist with varying questions, **When** the user types a keyword into the search field, **Then** only polls whose question contains that keyword are shown, and the match is case-insensitive.
2. **Given** the user selects the "Active" filter, **When** the list renders, **Then** only polls that have not expired (or have no expiration) are shown.
3. **Given** the user selects the "Expired" filter, **When** the list renders, **Then** only polls past their expiration date are shown.
4. **Given** the user selects "My Polls", **When** the list renders, **Then** only polls created by the signed-in user are shown.
5. **Given** search text is entered and a filter is active simultaneously, **When** the list renders, **Then** both constraints apply together (AND logic).
6. **Given** no polls match the active search/filter combination, **When** the list renders, **Then** a clear empty state message is shown (not a blank area).

---

### User Story 3 - Poll Results Analytics View (Priority: P3)

A poll creator wants to see richer results for their polls: total voters over time, which option was most popular at each point, and a breakdown summary — not just current vote counts.

**Why this priority**: Analytics motivate poll creators to engage more and share polls. This is a meaningful quality-of-life improvement that rewards the creator without blocking casual voters.

**Independent Test**: Open a poll created by the signed-in user. A "Results" tab or expandable section shows total vote count, winner label, and vote share per option. Delivers value to creators without changing the voter UX.

**Acceptance Scenarios**:

1. **Given** the user is viewing a poll they created, **When** the poll detail loads, **Then** a results summary is shown that includes: total vote count, percentage per option, and the leading option labelled as "Leading" or "Winner" (if expired).
2. **Given** a poll has zero votes, **When** the creator views the results summary, **Then** a "No votes yet" message is shown rather than division-by-zero display errors.
3. **Given** a poll has expired, **When** any user views it, **Then** the results summary is visible to all (not just the creator), with "Final Results" heading.
4. **Given** a poll is active and has votes, **When** a non-creator user views it after voting, **Then** results are shown in read-only mode with their voted option highlighted.

---

### User Story 4 - Change or Retract Vote (Priority: P4)

A user who already voted on an active poll should be able to change their vote to a different option or retract it entirely, up until the poll expires.

**Why this priority**: Allowing vote changes makes polls fairer (typos, second thoughts) and encourages more participation. Lower priority than vote integrity but significantly improves user trust.

**Independent Test**: Vote on an active poll. Return to the poll — a "Change Vote" button is visible. Click it, select a different option, confirm — the new option is now highlighted and vote counts update.

**Acceptance Scenarios**:

1. **Given** a user has voted on an active poll, **When** they view the poll detail, **Then** a "Change Vote" option is shown alongside their current selection.
2. **Given** the user clicks "Change Vote", **When** they select a different option and confirm, **Then** their previous vote is removed from the old option and added to the new one, and the updated percentages are reflected immediately.
3. **Given** a poll has expired, **When** the user views it, **Then** no "Change Vote" option is shown.
4. **Given** the user is in the "Change Vote" flow, **When** they cancel without selecting a new option, **Then** their original vote remains unchanged.

---

### User Story 5 - Export Poll Results (Priority: P5)

A poll creator wants to download their poll's results as a file to share or analyze outside the app.

**Why this priority**: Useful for organizers running community or group decisions, but not needed for the core polling experience. A nice-to-have that rounds out the feature.

**Independent Test**: On a poll the user created with at least one vote, a "Download Results" button is present. Clicking it downloads a file containing the question, each option, and its vote count and percentage.

**Acceptance Scenarios**:

1. **Given** the user is the poll creator and the poll has at least one vote, **When** they click "Download Results", **Then** a file is downloaded containing the poll question, all options with vote counts and percentages, total votes, and poll status.
2. **Given** a poll has zero votes, **When** the creator clicks "Download Results", **Then** the download still works but shows zero counts for all options.
3. **Given** the user is not the poll creator, **When** they view a poll, **Then** no "Download Results" button is visible.

---

### Edge Cases

- What happens when two users vote on the same poll at the exact same moment — are vote counts consistent?
- What happens if a user's session expires mid-vote — is the vote recorded or lost?
- What happens when a poll has options with exactly equal vote counts — is no "leading" label shown or are all tied options labelled?
- How does the system handle a poll with a very long question (500+ characters) — does it truncate gracefully in the list view?
- What happens when a user searches and no polls match — is the empty state clearly differentiated from a loading state?
- What happens if an exported file cannot be generated (e.g., download blocked by browser) — is the user notified?

## Requirements *(mandatory)*

### Functional Requirements

**Vote Integrity**
- **FR-001**: The system MUST record each authenticated user's vote selection per poll so that duplicate votes from the same account are prevented across sessions and devices.
- **FR-002**: When a user has already voted on a poll, the system MUST display their previously selected option as highlighted and disable all option vote buttons.
- **FR-003**: When a poll has expired, the system MUST disable voting for all users, regardless of whether they have voted before.

**Search & Filter**
- **FR-004**: The polls list MUST include a text search input that filters visible polls by question content in real time (no submit required), case-insensitively.
- **FR-005**: The polls list MUST include status filter options: All, Active, Expired, and My Polls.
- **FR-006**: Search text and status filters MUST apply simultaneously using AND logic.
- **FR-007**: When no polls match the current search/filter combination, the system MUST display a descriptive empty-state message.

**Results & Analytics**
- **FR-008**: Every poll detail view MUST display the total vote count, each option's vote count, and each option's percentage of total votes.
- **FR-009**: The leading option among active polls MUST be visually distinguished (e.g., labelled or styled differently).
- **FR-010**: When a poll has expired, the system MUST show results to all authenticated users (not only the creator), with a "Final Results" label.
- **FR-011**: When a poll has zero votes, the results section MUST show a "No votes yet" message and display 0% for all options without errors.

**Vote Change**
- **FR-012**: Users MUST be able to change their vote on an active poll to a different option, with the previous vote removed and the new one recorded atomically.
- **FR-013**: A user changing their vote MUST see their current selection clearly indicated and MUST confirm the change before it is applied.
- **FR-014**: Vote changing MUST NOT be available on expired polls.

**Export**
- **FR-015**: Poll creators MUST be able to download poll results as a structured file (containing question, options, vote counts, percentages, and total votes).
- **FR-016**: The download option MUST only be visible to the poll creator.
- **FR-017**: Export MUST work even when a poll has zero votes.

### Key Entities

- **Poll**: Represents a question posed to the community. Has a question, 2 or more options, a creator, a public/private flag, an optional expiration, and creation/update timestamps.
- **Poll Option**: A selectable answer within a poll. Has display text and an aggregate vote count.
- **Vote Record**: Tracks which option a specific authenticated user selected for a specific poll. One per (user, poll) pair. Enables duplicate prevention and vote-change capability.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user who has previously voted on a poll cannot vote again on that same poll in any subsequent session — verified by re-logging in and confirming voting controls are disabled with the prior selection shown.
- **SC-002**: Users can find a specific poll among 50+ polls using search or filter in under 15 seconds.
- **SC-003**: Poll results (vote counts and percentages) update and display within 3 seconds of a vote being cast, without a page reload.
- **SC-004**: Poll creators can export results for any of their polls in a single action, and the downloaded file contains correct counts matching what is displayed in the UI.
- **SC-005**: 100% of poll options display a percentage value at all times — no division-by-zero or blank percentage shown even when total votes is zero.
- **SC-006**: Users can change their vote on an active poll and see the updated result reflect their new choice within 3 seconds.

## Assumptions

- Authentication is required for all poll interactions (creating, voting, viewing) — anonymous access is not in scope for this enhancement.
- The existing Firestore data model for polls will be extended (adding a vote records subcollection) rather than replaced; existing poll documents are not migrated.
- "Export" format is a plain CSV or JSON file downloaded in the browser — no server-side email delivery is required.
- The existing real-time subscription (live update on vote) already handles concurrency at the Firestore level; no custom conflict-resolution logic is needed beyond atomic increments.
- Performance targets assume a typical MyCircle household/community group scale (dozens of active users, hundreds of polls) — not social-media-scale virality.
- The "My Polls" filter shows polls where the signed-in user is the creator; it does not show polls where they have voted.
