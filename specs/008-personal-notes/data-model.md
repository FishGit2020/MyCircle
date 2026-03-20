# Data Model: Personal Notes

**Branch**: `008-personal-notes` | **Date**: 2026-03-20

---

## Entities

### Note

A private text document owned by a single authenticated user.

| Field       | Type     | Required | Description                                       |
|-------------|----------|----------|---------------------------------------------------|
| `id`        | string   | Yes      | Unique document ID (Firestore auto-generated)     |
| `title`     | string   | Yes      | Optional short label; empty string if not given   |
| `content`   | string   | Yes      | Free-form plain text body                         |
| `createdAt` | string   | Yes      | ISO 8601 timestamp — set on create, never updated |
| `updatedAt` | string   | Yes      | ISO 8601 timestamp — updated on every save        |

**Ownership**: Notes live at `users/{uid}/notes/{noteId}` in Firestore. The owning user is implicit from the path — notes have no explicit `createdBy` field (unlike top-level collections that use `createdBy` for scoping).

**Validation rules**:
- `title` and `content` cannot both be empty at the same time (at least one must have non-whitespace content)
- `title` max length: 500 characters
- `content` max length: 50,000 characters (per spec assumption)
- `createdAt` is immutable after creation

**Search**: Title and content are searched together as a combined text match (client-side `.includes()` on lowercase strings). No server-side full-text index is required.

---

## GraphQL Schema Changes

### Existing (already in schema)

```graphql
type Note {
  id: ID!
  title: String!
  content: String!
  createdAt: String!
  updatedAt: String!
}

# Query (already registered)
notes(limit: Int, search: String): [Note!]!
```

### New additions required

```graphql
# New input types
input NoteInput {
  title: String!
  content: String!
}

input NoteUpdateInput {
  title: String
  content: String
}

# New mutations
addNote(input: NoteInput!): Note!
updateNote(id: ID!, input: NoteUpdateInput!): Note!
deleteNote(id: ID!): Boolean!

# Query enhancement — increase default/max limit
notes(limit: Int, search: String): [Note!]!   # limit default 100 → 500
```

---

## Firestore Layout

```
users/
  {uid}/
    notes/
      {noteId}/
        title: string        # "" if untitled
        content: string      # plain text body
        createdAt: Timestamp # server timestamp on create
        updatedAt: Timestamp # server timestamp on every save
```

No sub-collections. No indexes beyond the default (Firestore auto-indexes single-field).
Composite index required: `updatedAt DESC` — already satisfied by Firestore's default single-field index.

---

## Resolver Pattern

The `createNotesResolvers()` factory in `functions/src/resolvers/notes.ts` needs to add:

```
Mutation:
  addNote(input)    → write new doc to users/{uid}/notes → return Note
  updateNote(id, input) → verify doc exists for uid → merge fields → return Note
  deleteNote(id)    → verify doc belongs to uid → delete → return Boolean
```

All three mutations require `requireAuth()`. `updateNote` and `deleteNote` must verify the document path is under the requesting user's uid (guaranteed by the `users/{uid}/notes/{id}` collection path, so a simple `get()` on the scoped path is sufficient — if the doc doesn't exist, return false/throw).

---

## Apollo Shared Query Operations (new additions to `packages/shared/src/apollo/queries.ts`)

```graphql
fragment NoteFields on Note {
  id
  title
  content
  createdAt
  updatedAt
}

query GetNotes($search: String) {
  notes(limit: 500, search: $search) { ...NoteFields }
}

mutation AddNote($input: NoteInput!) {
  addNote(input: $input) { ...NoteFields }
}

mutation UpdateNote($id: ID!, $input: NoteUpdateInput!) {
  updateNote(id: $id, input: $input) { ...NoteFields }
}

mutation DeleteNote($id: ID!) {
  deleteNote(id: $id)
}
```
