# GraphQL Contract: NAS Audio Offload

**Branch**: `025-nas-audio-offload` | **Date**: 2026-04-02

All NAS operations are exposed through the existing Apollo GraphQL service. All mutations and queries require Firebase Authentication (`uid` in context).

---

## Queries

### `nasConnectionStatus`

Returns the current user's NAS connection configuration. Returns `null` if no connection has been configured.

```graphql
query GetNasConnectionStatus {
  nasConnectionStatus {
    nasUrl
    destFolder
    status
    lastTestedAt
    hasCredentials
  }
}
```

**Response fields**:
- `nasUrl`: The NAS base URL (e.g. `https://mynas.synology.me:5001`)
- `destFolder`: Root folder used for archives (e.g. `/MyCircle`)
- `status`: `"connected"` | `"error"` | `"unknown"`
- `lastTestedAt`: ISO 8601 string or `null`
- `hasCredentials`: `true` if username+password are stored; `false` otherwise

**Authorization**: Returns data only for the authenticated user. Returns `null` (not an error) if unconfigured.

---

### `bookChapters` (extended)

Existing query — now returns two additional fields per chapter:

```graphql
query GetBookChapters($bookId: ID!) {
  bookChapters(bookId: $bookId) {
    id
    index
    title
    href
    characterCount
    audioUrl
    audioDuration
    nasArchived   # NEW
    nasPath       # NEW
  }
}
```

**New fields**:
- `nasArchived`: `Boolean` — `true` when audio has been offloaded to NAS
- `nasPath`: `String` — full NAS file path when archived; `null` otherwise

---

## Mutations

### `saveNasConnection`

Saves NAS credentials and runs a connection test. Returns the resulting status.

```graphql
mutation SaveNasConnection($input: NasConnectionInput!) {
  saveNasConnection(input: $input) {
    nasUrl
    destFolder
    status
    lastTestedAt
    hasCredentials
  }
}
```

**Input**:
```graphql
input NasConnectionInput {
  nasUrl: String!      # Full URL e.g. https://mynas.synology.me:5001
  username: String!    # DSM user account
  password: String     # Optional on update — omit to keep existing credential
  destFolder: String!  # Root folder, must start with /
}
```

**Errors**: Throws if not authenticated. Returns `status: "error"` (not a GraphQL error) if the NAS is unreachable.

---

### `testNasConnection`

Re-tests the existing NAS connection without changing credentials.

```graphql
mutation TestNasConnection {
  testNasConnection {
    nasUrl
    destFolder
    status
    lastTestedAt
    hasCredentials
  }
}
```

**Errors**: Throws `"No NAS connection configured"` if no config exists.

---

### `deleteNasConnection`

Removes the NAS configuration. Chapters that were archived remain in `nasArchived: true` state.

```graphql
mutation DeleteNasConnection {
  deleteNasConnection
}
```

**Returns**: `Boolean` — `true` on success.

---

### `archiveChapterToNas`

Offloads a single chapter's audio from Firebase Storage to NAS.

```graphql
mutation ArchiveChapterToNas($bookId: ID!, $chapterIndex: Int!) {
  archiveChapterToNas(bookId: $bookId, chapterIndex: $chapterIndex) {
    bookId
    chapterIndex
    success
    nasPath
    error
  }
}
```

**Behavior**:
1. Verifies `audioUrl` exists on the chapter
2. Downloads audio buffer from Firebase Storage
3. Logs in to NAS, creates book subfolder if needed
4. Uploads to `{destFolder}/books/{bookId}/chapter-{chapterIndex}.mp3`
5. On success: deletes from Firebase Storage, updates chapter doc (`nasArchived: true`, `nasPath`, clears `audioUrl`/`audioStoragePath`)
6. On failure: chapter doc unchanged; returns `success: false, error: <message>`

**Errors**: Throws if not authenticated, NAS not configured, or chapter not found.

---

### `archiveBookToNas`

Batch-offloads all audio-bearing chapters for a book.

```graphql
mutation ArchiveBookToNas($bookId: ID!) {
  archiveBookToNas(bookId: $bookId) {
    bookId
    chapterIndex
    success
    nasPath
    error
  }
}
```

**Behavior**:
- Single NAS login session for the entire batch
- Processes chapters sequentially (avoids memory spikes)
- Continues on individual chapter failure (partial results returned)
- Returns one `NasArchiveResult` per audio chapter attempted

**Errors**: Throws if not authenticated or NAS not configured. Does not throw on per-chapter failures — those are returned in the result array.

---

### `restoreChapterFromNas`

Restores a NAS-archived chapter back to Firebase Storage.

```graphql
mutation RestoreChapterFromNas($bookId: ID!, $chapterIndex: Int!) {
  restoreChapterFromNas(bookId: $bookId, chapterIndex: $chapterIndex) {
    id
    index
    title
    href
    characterCount
    audioUrl
    audioDuration
    nasArchived
    nasPath
  }
}
```

**Behavior**:
1. Verifies `nasArchived: true` and `nasPath` set
2. Downloads audio from NAS via FileStation API
3. Re-uploads to Firebase Storage at `books/{bookId}/audio/chapter-{index}.mp3`
4. Updates chapter doc: sets `audioUrl`, `audioStoragePath`; keeps `nasArchived: true` and `nasPath`
5. Returns full updated `BookChapter`

**Errors**: Throws if not authenticated, NAS not configured, chapter not archived on NAS, or NAS unreachable.

---

## i18n Keys

All new user-visible strings use `t('key')`. Keys added to all 3 locale files (`en`, `es`, `zh`):

### `setup.nas.*`
```
setup.tabs.nas                   → "NAS Storage"
setup.nas.title                  → "Synology NAS Connection"
setup.nas.description            → "Connect your Synology NAS to offload audio chapters and free up cloud storage."
setup.nas.nasUrl                 → "NAS URL"
setup.nas.nasUrlPlaceholder      → "https://mynas.synology.me:5001"
setup.nas.username               → "Username"
setup.nas.usernamePlaceholder    → "admin"
setup.nas.password               → "Password"
setup.nas.passwordPlaceholder    → "Leave blank to keep existing"
setup.nas.destFolder             → "Destination Folder"
setup.nas.destFolderPlaceholder  → "/MyCircle"
setup.nas.saveAndTest            → "Save & Test"
setup.nas.retest                 → "Retest"
setup.nas.delete                 → "Remove"
setup.nas.deleteConfirm          → "Remove NAS connection? Archived chapters will remain archived."
setup.nas.testing                → "Testing..."
setup.nas.savedSuccess           → "Connection saved"
setup.nas.savedWithError         → "Saved but connection failed"
setup.nas.lastTested             → "Last tested"
setup.nas.status.connected       → "Connected"
setup.nas.status.error           → "Connection error"
setup.nas.status.disconnected    → "Not connected"
setup.nas.status.none            → "Not configured"
```

### `library.nas.*`
```
library.nas.offload              → "Offload to NAS"
library.nas.offloadAll           → "Offload All to NAS"
library.nas.restore              → "Restore from NAS"
library.nas.archived             → "NAS"
library.nas.offloading           → "Offloading..."
library.nas.restoring            → "Restoring..."
library.nas.offloadSuccess       → "Offloaded to NAS"
library.nas.restoreSuccess       → "Restored from NAS"
library.nas.offloadError         → "Offload failed"
library.nas.restoreError         → "Restore failed"
library.nas.batchSummary         → "{{success}} chapters offloaded, {{failed}} failed"
library.nas.archivedTooltip      → "Audio archived on NAS — restore to play"
```
