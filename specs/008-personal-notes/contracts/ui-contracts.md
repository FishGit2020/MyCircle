# UI Contracts: Personal Notes

**Branch**: `008-personal-notes` | **Date**: 2026-03-20

These contracts describe the interface boundaries between components, hooks, and the GraphQL backend.

---

## Contract 1: `useNotes` Hook (enhanced)

**File**: `packages/notebook/src/hooks/useNotes.ts`

**Purpose**: Provides note CRUD operations and real-time list via GraphQL. Replaces `window.__notebook` write calls with Apollo mutations.

```typescript
interface UseNotesResult {
  notes: Note[];          // current list, ordered by updatedAt desc
  loading: boolean;       // true while initial fetch is in flight
  error: string | null;   // user-facing error message or null
  saveNote: (id: string | null, data: NoteInput) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
}
```

**Behaviour**:
- `notes` is populated from `GET_NOTES` Apollo query with `fetchPolicy: 'cache-and-network'`
- `saveNote(null, data)` → `ADD_NOTE` mutation; `saveNote(id, data)` → `UPDATE_NOTE` mutation
- Both mutations use `refetchQueries: [GET_NOTES]` to keep the list fresh
- `notes` is filtered client-side when `search` prop is passed (no new hook param — filtering done in component)
- When not authenticated, returns `notes: []`, `loading: false`, `error: null`

---

## Contract 2: `NoteList` Component

**File**: `packages/notebook/src/components/NoteList.tsx`

```typescript
interface NoteListProps {
  notes: Note[];
  loading: boolean;
  search: string;
  onSearchChange: (q: string) => void;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  isAuthenticated: boolean;
}
```

**Behaviour**:
- Renders search input bound to `search` / `onSearchChange`
- "New Note" button visible only when `isAuthenticated`
- Empty state: "No notes yet" when `notes` empty and `search` is blank; "No results" when search active
- Each note card shows `title` (or "Untitled" if empty), truncated `content` preview, and `updatedAt` relative time

---

## Contract 3: `NoteEditor` Component

**File**: `packages/notebook/src/components/NoteEditor.tsx`

```typescript
interface NoteEditorProps {
  note?: Note;                  // undefined = new note
  onSave: (id: string | null, data: NoteInput) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
}
```

**Behaviour**:
- Title field: single-line text input, placeholder "Title (optional)"
- Content field: multiline textarea
- Save disabled when both title and content are empty/whitespace
- Delete button shown only when `onDelete` is provided (existing note); requires `window.confirm` guard
- Cancel navigates back without saving

---

## Contract 4: GraphQL Operations

**Source**: `packages/shared/src/apollo/queries.ts`

| Export name         | Type     | Variables                         | Returns           |
|---------------------|----------|-----------------------------------|-------------------|
| `GET_NOTES`         | Query    | `$search: String`                 | `Note[]`          |
| `ADD_NOTE`          | Mutation | `$input: NoteInput!`              | `Note`            |
| `UPDATE_NOTE`       | Mutation | `$id: ID!, $input: NoteUpdateInput!` | `Note`         |
| `DELETE_NOTE`       | Mutation | `$id: ID!`                        | `Boolean`         |

All four must be exported from `@mycircle/shared` (via the existing `export *` in `apollo/index.ts`).

---

## Contract 5: Routes

**File**: `packages/shell/src/App.tsx`

Existing routes (no changes required):

| Path                | View            | Auth required |
|---------------------|-----------------|---------------|
| `/notebook`         | Note list       | Yes           |
| `/notebook/new`     | New note editor | Yes           |
| `/notebook/:noteId` | Edit note       | Yes           |

No new routes are required for this feature.

---

## Contract 6: i18n Keys

If any new visible strings are introduced in the enhanced components, keys must be added to all 3 locales (`en`, `es`, `zh`). Expected new keys (if any):

| Key | English value |
|-----|---------------|
| `notebook.untitled` | `Untitled` |
| `notebook.noResults` | `No notes match your search` |

All existing `notebook.*` keys remain unchanged.
