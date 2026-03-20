# Quickstart / Integration Test Scenarios: Personal Notes

**Branch**: `008-personal-notes` | **Date**: 2026-03-20

Run these scenarios in a local dev environment (`pnpm dev`) to validate the three user stories end-to-end.

---

## Setup

1. Start the dev environment: `pnpm dev`
2. Open `http://localhost:3000` and sign in with a test account
3. Navigate to **Notebook** (sidebar → Workspace → Notebook, or direct URL `/notebook`)

---

## User Story 1: Create and Manage Notes

### Scenario A — Create a new note with title and body

1. Click **New Note**
2. Type title: "Meeting recap"
3. Type body: "Discussed Q2 roadmap with Alice"
4. Click **Save**
5. ✅ Note appears at top of the list with title "Meeting recap"
6. ✅ Preview shows truncated body text

### Scenario B — Create untitled note (body only)

1. Click **New Note**
2. Leave title blank; type body: "Just some thoughts"
3. Click **Save**
4. ✅ Note appears in list shown as "Untitled" (or first line of body)
5. ✅ Full body visible when note is opened

### Scenario C — Save disabled when both fields empty

1. Click **New Note**
2. Leave both title and body empty
3. ✅ Save button is disabled

### Scenario D — Edit an existing note

1. Open "Meeting recap" note
2. Append " — action items assigned" to the body
3. Click **Save**
4. ✅ Note is back in the list; opening it shows the updated text
5. ✅ `updatedAt` timestamp is more recent than before

### Scenario E — Delete a note

1. Open "Meeting recap" note
2. Click **Delete**
3. ✅ Confirmation dialog appears
4. Confirm deletion
5. ✅ Note is removed from the list; navigating to `/notebook/<id>` redirects to `/notebook`

---

## User Story 2: Search Notes

### Scenario F — Filter by title keyword

1. Create three notes: "Budget 2026", "Team standup notes", "Grocery list"
2. Type "budget" in the search box
3. ✅ Only "Budget 2026" is shown; other notes are hidden
4. ✅ Result appears within 1 second

### Scenario G — Filter by body keyword

1. Ensure "Team standup notes" has body "Sprint velocity was 42"
2. Type "velocity" in the search box
3. ✅ "Team standup notes" is shown

### Scenario H — Clear search returns full list

1. With "budget" in the search box, showing 1 result
2. Clear the search box
3. ✅ All 3 notes appear again

### Scenario I — No results empty state

1. Type "zzzznotexist" in the search box
2. ✅ A "No notes match your search" message is shown (not an error, not blank)

---

## User Story 3: Sync Across Devices

### Scenario J — New note appears on second session

1. Open two browser windows (or use private/incognito) both signed in as the same user
2. In Window A, create note "Sync test"
3. ✅ "Sync test" appears in Window B's note list within 10 seconds (no manual refresh)

### Scenario K — Edit propagates to second session

1. With both windows open, edit "Sync test" in Window A to add " — updated"
2. ✅ Window B shows the updated note title/body within 10 seconds

### Scenario L — Delete propagates to second session

1. Delete "Sync test" in Window A
2. ✅ "Sync test" disappears from Window B's list within 10 seconds

---

## Regression Check

### Scenario M — Unauthenticated user sees sign-in prompt

1. Sign out
2. Navigate to `/notebook`
3. ✅ Sign-in prompt is shown; no note data is visible
4. Sign in
5. ✅ Note list loads normally

### Scenario N — Empty state for new user

1. Sign in with a fresh test account that has no notes
2. Navigate to `/notebook`
3. ✅ Empty state message is shown with a "New Note" call to action
