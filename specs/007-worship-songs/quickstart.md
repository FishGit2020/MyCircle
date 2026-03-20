# Quickstart: Worship Song Library — Setlist Management

**Branch**: `007-worship-songs` | **Date**: 2026-03-20

Prerequisites: running `pnpm dev`, signed in with a test account, at least 3 worship songs already in the library.

---

## Scenario A — Create a new setlist (US1)

1. Navigate to `/worship`
2. Click the "Setlists" tab or button
3. Click "New Setlist"
4. Enter name: "Sunday Morning March 22"
5. Enter service date: "2026-03-22" (optional)
6. Click "Save"
7. **Expected**: setlist appears in the setlists list with "0 songs"

---

## Scenario B — Add songs to a setlist (US1)

1. Open "Sunday Morning March 22" setlist
2. In the song search panel, type "Amazing"
3. Click "Add to Setlist" on "Amazing Grace"
4. Repeat for two more songs
5. **Expected**: setlist shows 3 songs in the order they were added; each row shows title + key + position number

---

## Scenario C — Reorder songs in a setlist (US1)

1. Open the setlist with 3 songs
2. Click "Move Down" on song 1
3. **Expected**: song 1 and song 2 swap positions instantly
4. Click "Move Up" on the now-song-2 (originally song 1)
5. **Expected**: songs return to original order
6. "Move Up" on song 1 is disabled; "Move Down" on song 3 is disabled

---

## Scenario D — Remove a song from a setlist (US1)

1. Open the setlist with 3 songs
2. Click the remove (×) icon on song 2
3. **Expected**: song 2 is removed; song 3 renumbers to position 2; the song still exists in the main library

---

## Scenario E — Delete a setlist (US1)

1. From the setlists list, open any setlist
2. Click "Delete Setlist"
3. Confirm the dialog
4. **Expected**: setlist is removed from the list; all songs referenced by it still appear in the song library

---

## Scenario F — Start a service session (US2)

1. Open a setlist with 3 songs
2. Click "Start Service"
3. **Expected**: Song 1 loads with full chord chart; header shows "Song 1 of 3"
4. Click "Next"
5. **Expected**: Song 2 loads; "Song 2 of 3"
6. Click "Previous"
7. **Expected**: Song 1 loads again; transposition resets to 0 (independent per song per session)

---

## Scenario G — Per-song transposition in present mode (US2)

1. Start a service session (3 songs)
2. On song 1, transpose up 2 semitones
3. Click "Next" to song 2
4. **Expected**: song 2 shows at its default key (0 semitones) — not inherited from song 1
5. Click "Previous" to song 1
6. **Expected**: song 1 still shows at +2 semitones (preserved within this session)
7. Exit and re-enter present mode
8. **Expected**: all transpositions reset to 0

---

## Scenario H — End-of-setlist boundary (US2)

1. Start a service session with 2 songs
2. Navigate to song 2
3. Click "Next"
4. **Expected**: "End of setlist" message appears; no navigation error; "Next" button is disabled

---

## Scenario I — Deleted song placeholder (edge case)

1. Add a song to a setlist, then delete that song from the library
2. Open the setlist
3. **Expected**: the entry shows "Song not found" with the snapshotTitle in muted text; no crash
4. Start the service session
5. **Expected**: the deleted song's position shows the "Song not found" placeholder; navigation continues normally

---

## Scenario J — Export setlist as print (US3)

1. Open a setlist with 3 songs
2. Click "Export → Print All Songs"
3. **Expected**: browser print dialog opens; print preview shows all 3 songs in order with title, key, and full chord content

---

## Scenario K — Export setlist as text (US3)

1. Open a setlist with 3 songs
2. Click "Export → Export as Text"
3. **Expected**: a `.txt` file downloads; opening it shows:
   ```
   Sunday Morning March 22
   2026-03-22

   1. Amazing Grace — Key: G — BPM: 72
   2. How Great Is Our God — Key: A — BPM: 68
   3. 10,000 Reasons — Key: G — BPM: 73
   ```

---

## Scenario L — Unauthenticated user (edge case)

1. Sign out
2. Navigate to `/worship/setlists`
3. **Expected**: setlist list is not shown; a "Sign in to manage setlists" prompt appears
4. "New Setlist" button is not rendered
