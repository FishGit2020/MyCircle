# Component Contracts: Audiobook Batch Download

## `AudioDownload` Component

**File**: `packages/digital-library/src/components/AudioDownload.tsx`

### Props Interface

```typescript
interface AudioDownloadProps {
  bookId: string;
  bookTitle: string;
  chapters: Array<{ index: number; title: string; audioUrl?: string }>;
  zipStatus: string;         // 'none' | 'processing' | 'ready' | 'error'
  zipUrl?: string;
  zipSize?: number;          // bytes
  zipGeneratedAt?: string;   // ISO timestamp
  zipError?: string;
  onRefreshBook: () => Promise<void>;  // called every 10s while zipStatus === 'processing'
}
```

### Behavior Contract

**Sequential download section**:
- Enabled only when `chapters.filter(ch => ch.audioUrl).length > 0`
- Disabled state shows an explanatory hint
- On click: downloads each chapter with `audioUrl` sequentially via `fetch()` + Blob URL + `<a download>`
- Progress state: `{ current: number, total: number, cancelled: boolean }`
- File naming: `` `${bookTitle} - Ch${index} ${title}.mp3` ``
- Cancel: uses `AbortController`; sets cancelled flag; no further chapters downloaded

**ZIP section state machine**:

| `zipStatus` | Rendered UI |
|-------------|-------------|
| `'none'` | "Generate Audiobook ZIP" button + hint text |
| `'processing'` | Spinner + "Generating ZIP..." + polling active |
| `'ready'` | Green card: size + date + "Download ZIP" link + "Generate New ZIP" button |
| `'error'` | Red card: error message + "Retry" button |

**Polling**:
- Active only when `zipStatus === 'processing'`
- Interval: 10 000 ms
- Calls `onRefreshBook()` on each tick
- Cleared on unmount and when `zipStatus` changes away from `'processing'`

---

## `BookReader` Props Extension

**File**: `packages/digital-library/src/components/BookReader.tsx`

New prop added to `BookReaderProps`:

```typescript
onRefreshBook?: () => Promise<void>;
```

Passed through to `<AudioDownload onRefreshBook={onRefreshBook ?? (() => Promise.resolve())} />`.

---

## `DigitalLibrary` Component Changes

**File**: `packages/digital-library/src/components/DigitalLibrary.tsx`

**`Book` interface — new fields**:
```typescript
interface Book {
  // ... existing fields ...
  audioError?: string;      // added for completeness (was in resolver, missing from interface)
  zipStatus?: 'none' | 'processing' | 'ready' | 'error';
  zipUrl?: string;
  zipSize?: number;
  zipGeneratedAt?: string;
  zipError?: string;
}
```

**`<BookReader>` call — new prop**:
```typescript
<BookReader
  // ... existing props ...
  zipStatus={selectedBook.zipStatus ?? 'none'}
  zipUrl={selectedBook.zipUrl}
  zipSize={selectedBook.zipSize}
  zipGeneratedAt={selectedBook.zipGeneratedAt}
  zipError={selectedBook.zipError}
  onRefreshBook={async () => { await refetch(); }}
/>
```

Where `refetch` is the `refetch` function from the `useQuery(GET_BOOKS)` hook.
