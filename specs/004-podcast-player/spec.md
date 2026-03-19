# Feature Specification: Podcast Player MFE

**Feature Branch**: `004-podcast-player`
**Created**: 2026-03-19
**Status**: Draft
**Input**: User description: "Search, browse, and stream podcasts with episode management"

## Context

MyCircle adds a full-featured Podcast Player as a new MFE. Users can search the PodcastIndex catalogue, browse trending shows, subscribe to feeds, list and stream individual episodes, and manage playback from within the app. Audio playback is delegated to the shell's `GlobalAudioPlayer` so a persistent mini-player bar is always visible regardless of which route the user navigates to.

---

## User Scenarios & Testing

### User Story 1 — Search & Discover Podcasts (Priority: P1)

A user can type a search query and see matching podcast feeds from PodcastIndex. They can also browse a "Trending" list without searching.

**Why this priority**: Core entry point to all other functionality; without discovery there is nothing to stream.

**Independent Test**: Open `/podcasts` → trending list appears → type "history" → matching podcast cards load within 300 ms (debounced).

**Acceptance Scenarios**:

1. **Given** the user opens `/podcasts`, **When** the page loads, **Then** a grid of trending podcast cards is displayed with artwork, title, and author.
2. **Given** a search query is typed (≥ 2 chars), **When** 300 ms have elapsed since the last keystroke, **Then** matching podcasts from PodcastIndex are shown.
3. **Given** fewer than 2 characters in the search field, **When** the user pauses, **Then** no query is fired and no results replace the trending list.
4. **Given** the API returns an error, **When** results would load, **Then** an error message is shown (no crash).

---

### User Story 2 — Browse Episodes & Subscribe (Priority: P1)

Selecting a podcast opens a detail view showing feed metadata (artwork, title, author, description) and its episode list. The user can subscribe or unsubscribe.

**Why this priority**: Prerequisite for playback; episodes cannot be played without browsing them first.

**Independent Test**: Click any podcast card → detail view loads → episode list with title/date/duration renders → click Subscribe → button switches to Unsubscribe.

**Acceptance Scenarios**:

1. **Given** a podcast is selected, **When** the detail view opens, **Then** feed artwork, title, author, and truncated description are shown alongside the episode list.
2. **Given** an episode list loads, **When** more than 20 episodes exist, **Then** only 20 are shown initially with a "Show more" button that loads the next 20.
3. **Given** the user is on a podcast detail page, **When** they click Subscribe, **Then** the subscription is saved to localStorage and the button switches to Unsubscribe.
4. **Given** the user subscribes or unsubscribes, **When** the action completes, **Then** `WindowEvents.SUBSCRIPTIONS_CHANGED` fires regardless of authentication state; the shell syncs the change to Firestore only if the user is currently signed in.
5. **Given** a direct URL `/podcasts/:feedId` is opened, **When** the page loads without router state, **Then** a `GET_PODCAST_FEED` query fetches feed metadata and the detail view renders correctly.

---

### User Story 3 — Stream an Episode (Priority: P1)

Clicking the play button on any episode starts audio streaming via the shell's `GlobalAudioPlayer`. Inline playback controls appear within the podcast detail view when the now-playing episode belongs to the currently viewed podcast.

**Why this priority**: The primary feature value; everything else is a prerequisite or companion to streaming.

**Independent Test**: Select podcast → episode list loads → click play on episode → global bottom player bar appears → inline controls appear in detail view → seek bar advances.

**Acceptance Scenarios**:

1. **Given** an episode play button is clicked, **When** the event fires, **Then** `MFEvents.PODCAST_PLAY_EPISODE` is published on the eventBus and the shell's `GlobalAudioPlayer` begins loading the `enclosureUrl`.
2. **Given** an episode is playing, **When** the user navigates to a different route, **Then** the global mini-player bar in the shell continues playback uninterrupted.
3. **Given** an episode from the currently viewed podcast is playing, **When** the inline playback controls render, **Then** the seek bar reflects current position and updates at least every 500 ms.
4. **Given** the user drags the seek bar, **When** they release, **Then** `MFEvents.AUDIO_SEEK` is published and playback jumps to the selected position.
5. **Given** playback is active, **When** the user picks a playback speed (0.5×, 1×, 1.25×, 1.5×, 2×), **Then** audio speed updates immediately.
6. **Given** a URL with `?autoplay=true&episode=<id>` is opened, **When** episodes finish loading, **Then** the matching episode starts playing automatically and the autoplay params are removed from the URL.

---

### User Story 4 — Episode Management (Priority: P2)

Users can mark episodes as played/unplayed, add episodes to a playback queue, view episode show-notes, and share deep links to episodes.

**Why this priority**: Enriches the listening experience but the app is usable for streaming without it.

**Independent Test**: On episode list → click check icon → "Completed" badge appears → click share icon → deep link copied to clipboard → click show notes chevron → description expands.

**Acceptance Scenarios**:

1. **Given** an episode has been listened to past the last 5 seconds, **When** the episode list renders, **Then** a "Completed" badge is shown automatically.
2. **Given** the user manually clicks "Mark as played", **When** it is toggled, **Then** the badge appears/disappears and the state is persisted in `localStorage`.
3. **Given** the user clicks "Add to queue" on an episode, **When** `MFEvents.PODCAST_QUEUE_EPISODE` is published, **Then** the episode appears in the inline queue panel with a remove button.
4. **Given** `navigator.share` is available, **When** the user clicks share, **Then** the OS share sheet opens with episode title, podcast name, duration, and a deep link.
5. **Given** `navigator.share` is unavailable, **When** the user clicks share, **Then** the deep link is copied to the clipboard and a "Copied" checkmark is shown for 2 s.
6. **Given** an episode has a description, **When** the user clicks the show-notes chevron, **Then** the sanitized HTML description expands inline (dangerous tags stripped).

---

### User Story 5 — Subscriptions View (Priority: P2)

Authenticated users can view all subscribed podcasts on the "Subscriptions" tab. They can navigate to a feed or unsubscribe directly from the list.

**Why this priority**: Convenience feature; non-authenticated users and those with no subscriptions still have access to Discover.

**Independent Test**: Subscribe to two podcasts → tap "Subscriptions" tab (visible only when authenticated) → both appear → click Unsubscribe on one → it disappears.

**Acceptance Scenarios**:

1. **Given** the user is not authenticated, **When** the page loads, **Then** the Subscriptions tab is hidden.
2. **Given** the user is authenticated with subscriptions, **When** they switch to the Subscriptions tab, **Then** subscribed podcasts are listed with unsubscribe buttons.
3. **Given** the subscriptions list is empty, **When** the Subscriptions tab is active, **Then** a friendly empty-state message is shown.

---

### User Story 6 — Sleep Timer (Priority: P3)

Users can set a sleep timer (5, 15, 30, 45, or 60 minutes) that automatically stops playback when it expires. The remaining time is shown as a badge on the sleep icon.

**Independent Test**: Start playing an episode → open sleep timer menu in inline controls → select 5 min → badge shows "5" on sleep icon → advance time to expiry → playback pauses automatically.

**Acceptance Scenarios**:

1. **Given** a sleep timer is set, **When** the countdown reaches zero, **Then** `GlobalAudioPlayer` pauses playback and clears the timer.
2. **Given** the remaining time is > 0, **When** the inline controls render, **Then** the remaining minutes badge is displayed on the sleep icon.

---

## Integration Notes

- A `NowPlayingWidget` is added to the shell's home dashboard as a required integration point for new MFEs. It shows the currently playing episode title and a play/pause toggle linking to `/podcasts/:feedId`. This widget is a shell-owned component, not a user-facing feature of the Podcast Player MFE itself.

## Out of Scope

- Offline/download support (no service worker caching of audio files)
- Podcast categories filter beyond what PodcastIndex returns by default
- Manual RSS feed URL entry
- Firestore-side subscription storage (shell syncs localStorage → Firestore on `SUBSCRIPTIONS_CHANGED`; that sync lives in the shell, not this MFE)
- Notifications for new episodes
