# Feature Specification: Anniversary Tracker

**Feature Branch**: `027-anniversary-mfe`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Create a new MFE to capture anniversaries. Per-user ownership with contributor support. Landing page with list + map pins. Drilldown page per year with activity, notes, pictures. Auto-generate yearly placeholders from initial date. Widget with countdown and years married. Quick access, header nav (family group), bottom nav."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create an Anniversary (Priority: P1)

A user opens the Anniversary page for the first time and creates their first anniversary by entering a title (e.g., "Our Wedding"), the original anniversary date, and an optional location. The system saves the anniversary and automatically generates placeholder entries for each year from the original date up to the current year (and the upcoming year if within the same calendar year). The user sees a timeline/list of yearly tiles they can click into.

**Why this priority**: This is the foundational action. Without creating an anniversary, no other features are usable. It establishes the core data model and the auto-generation of yearly entries.

**Independent Test**: Can be fully tested by navigating to the Anniversary page, filling in the creation form, and verifying that yearly placeholder tiles appear for each year since the original date.

**Acceptance Scenarios**:

1. **Given** a user with no anniversaries, **When** they click "Add Anniversary" and enter a title, date (e.g., 2020-06-15), and optional location, **Then** the system creates the anniversary and generates placeholder tiles for 2020, 2021, 2022, 2023, 2024, 2025, and 2026.
2. **Given** a user creating an anniversary, **When** they omit the location field, **Then** the anniversary is created successfully with the location left blank.
3. **Given** a user who already has one or more anniversaries, **When** they click "Add Anniversary," **Then** they can create an additional anniversary (e.g., dating anniversary, wedding anniversary).

---

### User Story 2 - Landing Page: List and Map View (Priority: P2)

A user navigates to the Anniversary landing page and sees all their anniversaries displayed as a list. Each anniversary shows its title, original date, and how many years since the original date. A map is displayed alongside (or toggled) showing pins for each yearly celebration that has a location recorded. Clicking a pin or list item navigates to the drilldown page for that anniversary.

**Why this priority**: The landing page is the primary entry point and gives users an overview of all their anniversaries and where celebrations took place geographically.

**Independent Test**: Can be tested by creating at least one anniversary with location data, then verifying the list renders with correct titles/dates and the map shows pins at the correct coordinates.

**Acceptance Scenarios**:

1. **Given** a user with 2 anniversaries, **When** they navigate to the Anniversary page, **Then** they see a list of both anniversaries with titles, original dates, and years elapsed.
2. **Given** anniversary years with locations recorded, **When** the map loads, **Then** pins appear at each recorded location with a tooltip showing the year and anniversary title.
3. **Given** a user clicks on an anniversary in the list, **Then** they are navigated to the drilldown page for that anniversary.
4. **Given** a user clicks on a map pin, **Then** they are navigated to the drilldown page for that anniversary, scrolled to the relevant year.
5. **Given** a user with no anniversaries, **When** they visit the landing page, **Then** they see an empty state prompting them to create their first anniversary.

---

### User Story 3 - Drilldown Page: Yearly Anniversary Details (Priority: P3)

A user clicks into a specific anniversary from the landing page and sees a timeline of yearly tiles (e.g., "Year 1 - 2021", "Year 2 - 2022"). Each tile shows a summary: activity, a photo thumbnail, and location if available. Clicking a tile opens an editor where the user can fill in or update the activity description, notes, pictures (upload), and location for that year.

**Why this priority**: This is the core value proposition - capturing memories and details for each yearly celebration. Without it, the anniversary is just a date with no rich content.

**Independent Test**: Can be tested by creating an anniversary, navigating to its drilldown page, clicking a yearly tile, adding an activity/note/picture, saving, and verifying the data persists on reload.

**Acceptance Scenarios**:

1. **Given** an anniversary created on 2020-06-15, **When** the user opens the drilldown page, **Then** they see tiles for Year 1 (2021), Year 2 (2022), ... up to the current/upcoming year, plus a "Year 0 (2020)" tile for the original event.
2. **Given** a yearly tile with no data, **When** the user clicks it, **Then** an edit form opens with empty fields for activity, notes, pictures, and location.
3. **Given** a user fills in activity "Dinner at La Maison", adds 3 photos, writes a note, and sets a location, **When** they save, **Then** the tile updates to show the activity summary and a photo thumbnail.
4. **Given** a user uploads pictures, **When** the upload completes, **Then** the pictures are displayed as a gallery within the yearly entry.
5. **Given** a user edits an existing yearly entry, **When** they change the activity text and save, **Then** the updated text is reflected immediately.

---

### User Story 4 - Contributor Management (Priority: P4)

An anniversary owner wants to share their anniversary with another user so they can both add memories. The owner searches for an existing user by name or email, selects them, and adds them as a contributor. Contributors can view and edit all yearly entries for that anniversary. The owner can remove contributors at any time. Contributors see shared anniversaries in their own Anniversary landing page.

**Why this priority**: Sharing is essential for couples to collaboratively build their anniversary memories, but the core single-user flow must work first.

**Independent Test**: Can be tested by having User A create an anniversary, search for User B, add them as a contributor, then verify User B sees the anniversary in their landing page and can edit a yearly entry.

**Acceptance Scenarios**:

1. **Given** an anniversary owner, **When** they open contributor settings and search for a user by name, **Then** matching users appear in a search results list.
2. **Given** search results showing matching users, **When** the owner selects a user and confirms, **Then** that user is added as a contributor.
3. **Given** a user added as a contributor, **When** they navigate to their Anniversary page, **Then** they see the shared anniversary in their list (visually distinguished as shared).
4. **Given** a contributor, **When** they open a yearly tile on a shared anniversary, **Then** they can add/edit activity, notes, and pictures.
5. **Given** an anniversary owner, **When** they remove a contributor, **Then** that user no longer sees the anniversary in their list and cannot access it.
6. **Given** a contributor, **When** they try to delete the anniversary or manage other contributors, **Then** the system prevents the action (owner-only privileges).

---

### User Story 5 - Dashboard Widget (Priority: P5)

A user adds the Anniversary widget to their dashboard. The widget displays: the next upcoming anniversary date with a countdown (e.g., "Wedding Anniversary in 42 days"), and the number of years since the original date (e.g., "6 years married"). If the user has multiple anniversaries, the widget shows the one with the nearest upcoming date.

**Why this priority**: The widget provides at-a-glance value on the dashboard without navigating to the full Anniversary page, but it depends on the core anniversary data existing first.

**Independent Test**: Can be tested by creating an anniversary with a known date, adding the widget to the dashboard, and verifying the countdown and year count are mathematically correct.

**Acceptance Scenarios**:

1. **Given** a user with an anniversary dated 2020-06-15 and today is 2026-04-09, **When** the widget renders, **Then** it shows "67 days" (countdown to June 15) and "6 years" (since 2020).
2. **Given** a user with multiple anniversaries, **When** the widget renders, **Then** it shows the anniversary with the nearest upcoming date.
3. **Given** a user with no anniversaries, **When** the widget renders, **Then** it shows a prompt to create their first anniversary with a link to the Anniversary page.
4. **Given** the anniversary date is today, **When** the widget renders, **Then** it shows a celebratory message (e.g., "Happy Anniversary! 6 years today").

---

### User Story 6 - Navigation Integration (Priority: P6)

The Anniversary feature is accessible from the header navigation under the "Family" group, the bottom navigation bar, and the command palette quick access. Users can navigate to the Anniversary page from any of these entry points.

**Why this priority**: Navigation integration is necessary for discoverability but depends on the page existing first.

**Independent Test**: Can be tested by verifying the Anniversary link appears in the header (Family group), bottom nav, and command palette, and that clicking each navigates to the Anniversary landing page.

**Acceptance Scenarios**:

1. **Given** a user on any page, **When** they open the header navigation, **Then** they see "Anniversary" under the "Family" group.
2. **Given** a user on mobile, **When** they look at the bottom navigation bar, **Then** they see an Anniversary icon/link.
3. **Given** a user opens the command palette, **When** they type "anniversary," **Then** a "Go to Anniversary" option appears and navigating to it opens the Anniversary page.

---

### Edge Cases

- What happens when a user creates an anniversary with a future date? The system creates only the "Year 0" tile for the original event date with no additional yearly tiles until subsequent years pass.
- What happens when a contributor is deleted from the platform? Their contributions (notes, pictures) remain on the anniversary, but they are automatically removed from the contributor list.
- What happens when the owner deletes an anniversary? All yearly entries, pictures, and contributor associations are permanently removed after a confirmation prompt.
- How does the system handle leap year anniversary dates (e.g., Feb 29)? The yearly anniversary falls on Feb 28 in non-leap years for countdown purposes.
- What happens when a user uploads an image that exceeds the size limit? The system shows an error message and suggests compressing the image. Maximum file size per image is 10 MB.
- What happens when two contributors edit the same yearly entry simultaneously? Last-write-wins with the most recent save taking precedence (standard for this type of personal content).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create an anniversary with a title, date, and optional location.
- **FR-002**: System MUST automatically generate yearly placeholder entries from the original anniversary date through the current year (plus upcoming year if within the calendar year).
- **FR-003**: System MUST display a landing page with a list of all anniversaries (owned and shared) and a map with location pins.
- **FR-004**: System MUST provide a drilldown page showing a timeline of yearly tiles for a selected anniversary.
- **FR-005**: Users MUST be able to add and edit activity descriptions, notes, pictures, and location for each yearly entry.
- **FR-006**: System MUST support picture uploads with gallery display within yearly entries.
- **FR-007**: Anniversary owners MUST be able to search for existing users and add them as contributors.
- **FR-008**: Anniversary owners MUST be able to remove contributors at any time.
- **FR-009**: Contributors MUST be able to view and edit yearly entries on shared anniversaries but MUST NOT be able to delete the anniversary or manage contributors.
- **FR-010**: System MUST display a dashboard widget showing the next anniversary countdown and years elapsed since the original date.
- **FR-011**: System MUST integrate with header navigation (Family group), bottom navigation, and command palette.
- **FR-012**: Users MUST be able to create multiple anniversaries (e.g., wedding, dating, etc.).
- **FR-013**: System MUST display shared anniversaries with a visual distinction from owned anniversaries.
- **FR-014**: System MUST generate new yearly placeholder entries automatically as new years begin.
- **FR-015**: System MUST support dark mode for all Anniversary UI components.
- **FR-016**: System MUST be fully responsive with mobile-first design.
- **FR-017**: All user-facing text MUST be internationalized (English, Spanish, Chinese).

### Key Entities

- **Anniversary**: Represents a recurring annual event. Key attributes: title, original date, location (optional), owner, list of contributors. A user can own multiple anniversaries.
- **AnniversaryYear**: Represents one year's celebration within an anniversary. Key attributes: year number, celebration date, activity description, notes (free text), pictures (list of images), location (optional). Belongs to exactly one Anniversary.
- **Contributor**: Represents a user who has been granted access to view and edit an anniversary they do not own. Relationship between a User and an Anniversary.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new anniversary and see auto-generated yearly tiles in under 30 seconds.
- **SC-002**: Landing page loads and displays all anniversaries (list + map) within 2 seconds for users with up to 50 anniversary years.
- **SC-003**: Users can upload up to 10 pictures per yearly entry and view them in a gallery.
- **SC-004**: Contributor search returns matching users within 1 second of typing.
- **SC-005**: Dashboard widget accurately displays countdown (within 1-day precision) and years elapsed for the nearest anniversary.
- **SC-006**: 90% of users can navigate to the Anniversary page via header, bottom nav, or command palette on first attempt without guidance.
- **SC-007**: All pages and the widget render correctly on mobile (320px width) and desktop (1440px width) viewports.
- **SC-008**: Feature is fully usable in all 3 supported languages (English, Spanish, Chinese) with no untranslated strings.

## Assumptions

- "Anniversary" is a general concept - users can track any recurring annual event (wedding, dating, friendship, etc.), though the widget text defaults to relationship-oriented language ("years married" / "years together").
- Each yearly entry can have its own location (where that year's celebration took place), independent of the original anniversary location.
- Pictures are stored as user-uploaded images (standard web image formats: JPEG, PNG, WebP).
- Contributors have equal edit access to all yearly entries but cannot delete the anniversary itself or manage other contributors.
- The map uses the same MapLibre GL integration already present in the codebase.
- The widget shows only the single nearest upcoming anniversary; users with multiple anniversaries see the one coming up soonest.
- User search for adding contributors searches across all registered users in the system by display name or email.
- Anniversary data is per-user (owned) but stored in a way that allows contributor access through shared references, not data duplication.
