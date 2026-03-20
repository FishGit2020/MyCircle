# UI Contracts: Worship Song Library — Setlist Management

**Branch**: `007-worship-songs` | **Date**: 2026-03-20

---

## Contract 1: `useWorshipSetlists` Hook

**File**: `packages/worship-songs/src/hooks/useWorshipSetlists.ts`

**Mirrors**: `useWorshipSongs.ts` pattern — wraps Apollo mutations, exposes typed operations.

```typescript
interface UseWorshipSetlistsReturn {
  setlists: SetlistListItem[];   // all setlists for current user, ordered by updatedAt desc
  loading: boolean;
  isAuthenticated: boolean;
  addSetlist(input: { name: string; serviceDate?: string }): Promise<string>; // returns new id
  updateSetlist(id: string, input: SetlistUpdateInput): Promise<void>;
  deleteSetlist(id: string): Promise<void>;
  getSetlist(id: string): Promise<Setlist | null>;
}
```

**Invariants**:
- `setlists` is always an array (empty array, never null/undefined)
- `addSetlist` returns the new setlist's ID on success
- `deleteSetlist` resolves when the mutation completes; the caller navigates away
- `isAuthenticated` follows the same `window.__getFirebaseIdToken` pattern as `useWorshipSongs`

---

## Contract 2: `SetlistList` Component

**File**: `packages/worship-songs/src/components/SetlistList.tsx`

**Props**:
```typescript
interface SetlistListProps {
  setlists: SetlistListItem[];
  loading: boolean;
  isAuthenticated: boolean;
  onSelectSetlist: (id: string) => void;
  onNewSetlist: () => void;
}
```

**Rendering rules**:
- Shows a "New Setlist" button only when `isAuthenticated === true`
- Each setlist card shows: name, optional service date, song count (e.g., "5 songs")
- Empty state: "No setlists yet. Create one to plan your service."
- Loading state: skeleton or spinner matching `SongList` loading pattern

---

## Contract 3: `SetlistEditor` Component

**File**: `packages/worship-songs/src/components/SetlistEditor.tsx`

**Props**:
```typescript
interface SetlistEditorProps {
  setlist?: Setlist;               // undefined = new setlist mode
  allSongs: WorshipSongListItem[]; // for the song-search-and-add panel
  songsLoading: boolean;
  onSave: (data: SetlistSaveData) => Promise<void>;
  onDelete?: () => Promise<void>;  // undefined = new setlist (no delete button)
  onCancel: () => void;
}

interface SetlistSaveData {
  name: string;
  serviceDate?: string;
  entries: SetlistEntryInput[];
}
```

**Rendering rules**:
- Name field: required, shows inline error if blank on save attempt
- Song search: filters `allSongs` client-side by title or artist
- Each entry row shows: position number, snapshot title, snapshot key, move-up button (disabled at position 0), move-down button (disabled at last position), remove button
- Save button: disabled while saving
- Delete button: shown only when `onDelete` is defined; requires `window.confirm` before calling

---

## Contract 4: `SetlistPresenter` Component

**File**: `packages/worship-songs/src/components/SetlistPresenter.tsx`

**Props**:
```typescript
interface SetlistPresenterProps {
  setlist: Setlist;
  songs: Record<string, WorshipSong | null>; // pre-loaded or loading map; null = deleted song
  onExit: () => void;
}
```

**Rendering rules**:
- Header bar: "Song {currentIndex + 1} of {entries.length}" label + Prev button + Next button + Exit button
- Prev button: disabled when `currentIndex === 0`
- Next button: disabled when `currentIndex === entries.length - 1`; at end shows "End of setlist" message below (does not crash)
- When `songs[entry.songId] === null`: renders a "Song not found" placeholder with the `snapshotTitle` and `snapshotKey` for context
- When `songs[entry.songId]` is a valid `WorshipSong`: renders `<SongViewer>` component with the song (suppressing the Edit button — `isAuthenticated=false` in presenter context)
- Transposition state (`semitonesBySongId`) is local to this component — `React.useState<Record<string, number>>({})` — resets when component unmounts

---

## Contract 5: `SetlistPrintView` Component

**File**: `packages/worship-songs/src/components/SetlistPrintView.tsx`

**Props**:
```typescript
interface SetlistPrintViewProps {
  setlist: Setlist;
  songs: Record<string, WorshipSong | null>;
}
```

**Rendering rules**:
- Renders all songs in setlist order in a single scrollable/printable page
- Each song block: title (h2), artist (subtitle), key badge, then either full chord content or "Song not found" placeholder
- Uses `data-print-show` / `data-print-hide` classes consistent with existing SongViewer print CSS
- Not shown in the normal view hierarchy — rendered in a hidden div and triggered via `window.print()`

---

## Contract 6: Route Extensions in `WorshipSongs.tsx`

**Extends**: `packages/worship-songs/src/components/WorshipSongs.tsx`

New view states added to the existing `type View` union:

```typescript
type View = 'list' | 'view' | 'edit' | 'new'
           | 'setlist-list'       // /worship/setlists
           | 'setlist-new'        // /worship/setlists/new
           | 'setlist-edit'       // /worship/setlists/:setlistId
           | 'setlist-present';   // /worship/setlists/:setlistId/present
```

URL routing additions:
- `/worship/setlists` → `view = 'setlist-list'`
- `/worship/setlists/new` → `view = 'setlist-new'`
- `/worship/setlists/:setlistId` → `view = 'setlist-edit'`
- `/worship/setlists/:setlistId/present` → `view = 'setlist-present'`

The existing song-list view adds a "Setlists" tab/button to navigate to `/worship/setlists`.

---

## Contract 7: New i18n Keys

All keys MUST be added to `en.ts`, `es.ts`, and `zh.ts`.

```typescript
// Setlist management
'worship.setlists': 'Setlists'
'worship.newSetlist': 'New Setlist'
'worship.editSetlist': 'Edit Setlist'
'worship.deleteSetlist': 'Delete Setlist'
'worship.deleteSetlistConfirm': 'Are you sure you want to delete this setlist?'
'worship.setlistName': 'Setlist Name'
'worship.serviceDate': 'Service Date (optional)'
'worship.setlistSongs': 'Songs in Setlist'
'worship.addSongToSetlist': 'Add to Setlist'
'worship.noSetlists': 'No setlists yet. Create one to plan your service.'
'worship.emptySetlist': 'No songs in this setlist yet.'
'worship.startService': 'Start Service'
'worship.songNotFound': 'Song not found'
'worship.songOfTotal': 'Song {current} of {total}'
'worship.exportSetlist': 'Export Setlist'
'worship.exportPrint': 'Print All Songs'
'worship.exportText': 'Export as Text'
'worship.setlistNameRequired': 'Setlist name is required'
'worship.endOfSetlist': 'End of setlist'
```

Total: 19 new keys × 3 locales = 57 i18n additions.

---

## Contract 8: GraphQL Queries and Mutations in `queries.ts`

**File**: `packages/shared/src/apollo/queries.ts`

New fragments and operations to add:

```graphql
fragment SetlistEntryFields on SetlistEntry {
  songId
  position
  snapshotTitle
  snapshotKey
}

fragment SetlistFields on Setlist {
  id
  name
  serviceDate
  entries { ...SetlistEntryFields }
  createdAt
  updatedAt
  createdBy
}

fragment SetlistListFields on Setlist {
  id
  name
  serviceDate
  updatedAt
  createdBy
  entries { songId position snapshotTitle snapshotKey }
}

query GetWorshipSetlists {
  worshipSetlists { ...SetlistListFields }
}

query GetWorshipSetlist($id: ID!) {
  worshipSetlist(id: $id) { ...SetlistFields }
}

mutation AddWorshipSetlist($input: WorshipSetlistInput!) {
  addWorshipSetlist(input: $input) { ...SetlistFields }
}

mutation UpdateWorshipSetlist($id: ID!, $input: WorshipSetlistUpdateInput!) {
  updateWorshipSetlist(id: $id, input: $input) { ...SetlistFields }
}

mutation DeleteWorshipSetlist($id: ID!) {
  deleteWorshipSetlist(id: $id)
}
```
