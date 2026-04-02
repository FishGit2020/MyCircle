# GraphQL Contracts: Audiobook Batch Download

## New Mutations

### `requestBookZip`

Triggers server-side ZIP generation for a book's converted audio chapters.

```graphql
mutation RequestBookZip($bookId: ID!) {
  requestBookZip(bookId: $bookId)
}
```

**Returns**: `Boolean!` — `true` on success

**Preconditions**:
- Caller must be authenticated
- Book must exist and not be soft-deleted
- At least one chapter must have a converted audio URL
- `zipStatus` must not currently be `'processing'`

**Effect**:
- Sets `books/{bookId}.zipStatus = 'processing'`
- Clears `books/{bookId}.zipError = null`
- Creates `books/{bookId}/zipJobs/{uuid}` with `{ status: 'pending', bookId, createdAt }`
- The `onZipJobCreated` Cloud Function picks up the job doc and begins assembling the ZIP

**Error conditions**:
- `NOT_FOUND` — book does not exist
- `FORBIDDEN` — caller is not authenticated
- `BAD_USER_INPUT` — no chapters have audio, or ZIP is already processing

---

### `deleteBookZip`

Deletes the stored ZIP archive and resets the book's ZIP state to `'none'`.

```graphql
mutation DeleteBookZip($bookId: ID!) {
  deleteBookZip(bookId: $bookId)
}
```

**Returns**: `Boolean!` — `true` on success

**Preconditions**:
- Caller must be authenticated
- Book must exist

**Effect**:
- Deletes `books/{bookId}/audiobook.zip` from Firebase Storage (errors silently ignored)
- Deletes all docs in `books/{bookId}/zipJobs` subcollection
- Resets book fields: `zipStatus = 'none'`, `zipUrl = null`, `zipSize = null`, `zipGeneratedAt = null`, `zipError = null`

**Error conditions**:
- `NOT_FOUND` — book does not exist
- `FORBIDDEN` — caller is not authenticated

---

## Extended `Book` Fields

The following fields are added to the existing `Book` GraphQL type and returned by all queries that use the `BOOK_FIELDS` fragment:

| Field | Type | Description |
|-------|------|-------------|
| `zipStatus` | `String` | `'none'` \| `'processing'` \| `'ready'` \| `'error'` |
| `zipUrl` | `String` | Authenticated download URL for the ZIP; `null` unless `zipStatus === 'ready'` |
| `zipSize` | `Int` | ZIP file size in bytes; `null` unless `zipStatus === 'ready'` |
| `zipGeneratedAt` | `String` | ISO 8601 timestamp; `null` unless `zipStatus === 'ready'` |
| `zipError` | `String` | Error message; `null` unless `zipStatus === 'error'` |

All fields default to `null` / `'none'` for books where ZIP generation was never requested.
