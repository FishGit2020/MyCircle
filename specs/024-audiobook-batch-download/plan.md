# Implementation Plan: Audiobook Batch Download

**Branch**: `024-audiobook-batch-download` | **Date**: 2026-04-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-audiobook-batch-download/spec.md`

## Summary

Add batch audiobook download to the Digital Library's Listen tab in two modes: (1) immediate sequential client-side download of individual chapter MP3s with progress tracking and cancel support, and (2) a "Google Takeout"-style server-side ZIP generation job where the user requests assembly, leaves, and returns to download a single archive. ZIP generation is triggered via a Firestore document write to a new `zipJobs` subcollection on the book, processed by a new `onZipJobCreated` Cloud Function using the `archiver` library (store compression), and the result URL is polled by the frontend every 10 seconds until ready.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + Cloud Functions Node 22)
**Primary Dependencies**: React 18, Apollo Client (via `@mycircle/shared`), Firebase Cloud Functions v2, `archiver@^7` (new — ZIP assembly), `@types/archiver@^6` (new dev dep)
**Storage**: Firestore `books/{bookId}` (5 new fields) + `books/{bookId}/zipJobs/{jobId}` (new subcollection) · Firebase Storage `books/{bookId}/audiobook.zip` (new file)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web (MFE) + Firebase Cloud Functions
**Project Type**: MFE feature addition + Cloud Function worker
**Performance Goals**: ZIP generation must complete within 9-minute Cloud Function timeout for books up to 363 MB; sequential download progress updates per chapter
**Constraints**: 1 GiB memory for zip worker; single ZIP per book at a time; no duplicate jobs; authenticated users only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Federated Isolation** | PASS | New `AudioDownload` component imports only from `@mycircle/shared`; no direct `@apollo/client` imports |
| **II. Complete Integration** | PASS | No new MFE — feature extends existing `digital-library` package; no 20-point checklist applies |
| **III. GraphQL-First Data Layer** | PASS | `requestBookZip` and `deleteBookZip` are GraphQL mutations; ZIP job trigger via Firestore write (backend-only, not MFE REST) |
| **IV. Inclusive by Default** | PASS | All strings use `t('library.*')` keys in all 3 locales; dark mode variants on all color classes; touch targets ≥ 44px; `type="button"` on non-submit buttons |
| **V. Fast Tests, Safe Code** | PASS | Unit tests mock `fetch`, `@mycircle/shared`, and timers; no assertion timeouts > 5000ms; `userEvent.setup({ delay: null })` |
| **VI. Simplicity** | PASS | No new abstraction layers; `AudioDownload` is a single file; polling uses `setInterval` (existing codebase pattern) |

## Project Structure

### Documentation (this feature)

```text
specs/024-audiobook-batch-download/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — Firestore schema + GraphQL changes
├── quickstart.md        # Phase 1 — dev setup + key files
├── contracts/
│   ├── graphql-mutations.md   # Phase 1 — mutation contracts
│   └── component-props.md     # Phase 1 — component interface contracts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code

```text
functions/
├── package.json                          # Add archiver + @types/archiver
└── src/
    ├── schema.ts                         # Add 5 zip fields to Book type + 2 mutations
    ├── index.ts                          # Export onZipJobCreated
    ├── handlers/
    │   └── zipWorker.ts                  # NEW — onZipJobCreated Firestore trigger
    └── resolvers/
        └── digitalLibrary.ts             # docToBook() + requestBookZip + deleteBookZip + permanentDeleteBook cleanup

packages/
├── shared/src/
│   ├── apollo/
│   │   └── queries.ts                    # Add zip fields to BOOK_FIELDS + 2 mutation constants
│   └── i18n/locales/
│       ├── en.ts                         # Add 16 library.* keys
│       ├── es.ts                         # Spanish translations
│       └── zh.ts                         # Chinese translations
└── digital-library/src/components/
    ├── AudioDownload.tsx                  # NEW — sequential + zip download UI
    ├── AudioDownload.test.tsx             # NEW — component tests
    ├── DigitalLibrary.tsx                 # Add zip fields to Book interface + pass to BookReader
    └── BookReader.tsx                     # Add zip props + onRefreshBook + render AudioDownload
```

**Structure Decision**: This feature adds to existing packages only (no new MFE). Backend work lives entirely in `functions/`; frontend work extends the existing `digital-library` package. The new `AudioDownload` component is a sibling to existing components in `packages/digital-library/src/components/`.

## Implementation Phases

### Phase 1: Backend

#### 1.1 `functions/package.json`
- Add `"archiver": "^7.0.0"` to `dependencies`
- Add `"@types/archiver": "^6.0.0"` to `devDependencies`
- Run `cd functions && npm install`

#### 1.2 `functions/src/schema.ts`
Add to the `Book` type (after `audioError: String`):
```graphql
zipStatus: String
zipUrl: String
zipSize: Int
zipGeneratedAt: String
zipError: String
```
Add to the `Mutation` type:
```graphql
requestBookZip(bookId: ID!): Boolean!
deleteBookZip(bookId: ID!): Boolean!
```

#### 1.3 `functions/src/resolvers/digitalLibrary.ts`

**`docToBook()` additions** (after `audioError`):
```typescript
zipStatus: data.zipStatus ?? 'none',
zipUrl: data.zipUrl ?? null,
zipSize: data.zipSize ?? null,
zipGeneratedAt: data.zipGeneratedAt ? toIso(data.zipGeneratedAt) : null,
zipError: data.zipError ?? null,
```

**`requestBookZip` mutation resolver**:
- `requireAuth(context)`
- Fetch book doc; throw `NOT_FOUND` if missing
- Fetch chapters subcollection; throw `BAD_USER_INPUT` if no chapter has `audioUrl`
- Throw `BAD_USER_INPUT` if `data.zipStatus === 'processing'`
- `await bookRef.update({ zipStatus: 'processing', zipError: null })`
- Create `bookRef.collection('zipJobs').doc(uuid())` with `{ status: 'pending', bookId, createdAt: FieldValue.serverTimestamp() }`
- Return `true`

**`deleteBookZip` mutation resolver**:
- `requireAuth(context)`
- Fetch book doc; throw `NOT_FOUND` if missing
- `try { await bucket.file(`books/${bookId}/audiobook.zip`).delete() } catch { /* ignore */ }`
- Delete all docs in `books/{bookId}/zipJobs` subcollection via batch
- `await bookRef.update({ zipStatus: 'none', zipUrl: null, zipSize: null, zipGeneratedAt: null, zipError: null })`
- Return `true`

**`permanentDeleteBook` additions** (after existing audio file cleanup):
```typescript
try { await bucket.file(`books/${bookId}/audiobook.zip`).delete(); } catch { /* ignore */ }
try {
  const zipJobsSnap = await bookRef.collection('zipJobs').get();
  const zipBatch = db.batch();
  for (const d of zipJobsSnap.docs) zipBatch.delete(d.ref);
  if (zipJobsSnap.size > 0) await zipBatch.commit();
} catch { /* ignore */ }
```

#### 1.4 `functions/src/handlers/zipWorker.ts` (new file)

```typescript
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import archiver from 'archiver';
import { PassThrough } from 'stream';
import { uploadToStorage } from './shared.js';

export const onZipJobCreated = onDocumentCreated(
  { document: 'books/{bookId}/zipJobs/{jobId}', memory: '1GiB', timeoutSeconds: 540 },
  async (event) => {
    const { bookId, jobId } = event.params;
    const db = getFirestore();
    const bucket = getStorage().bucket();
    const jobRef = db.collection('books').doc(bookId).collection('zipJobs').doc(jobId);
    const bookRef = db.collection('books').doc(bookId);

    // Idempotency guard
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists || jobDoc.data()!.status !== 'pending') return;
    await jobRef.update({ status: 'processing', updatedAt: new Date() });

    try {
      // Load book + chapters
      const bookDoc = await bookRef.get();
      const bookTitle = bookDoc.data()!.title as string;

      const chaptersSnap = await bookRef.collection('chapters').get();
      const chapterMap = new Map<number, string>();
      for (const doc of chaptersSnap.docs) {
        const d = doc.data();
        chapterMap.set(d.index as number, d.title as string);
      }

      // List audio files in Storage
      const [audioFiles] = await bucket.getFiles({ prefix: `books/${bookId}/audio/` });
      if (audioFiles.length === 0) throw new Error('No audio files found');

      // Sort by chapter index (extract from filename: chapter-{index}.mp3)
      const sorted = audioFiles.sort((a, b) => {
        const ai = parseInt(a.name.match(/chapter-(\d+)\.mp3$/)?.[1] ?? '0', 10);
        const bi = parseInt(b.name.match(/chapter-(\d+)\.mp3$/)?.[1] ?? '0', 10);
        return ai - bi;
      });

      // Stream into archiver → buffer
      const archive = archiver('zip', { store: true });
      const passThrough = new PassThrough();
      const chunks: Buffer[] = [];
      passThrough.on('data', (chunk: Buffer) => chunks.push(chunk));

      archive.pipe(passThrough);

      for (const file of sorted) {
        const indexMatch = file.name.match(/chapter-(\d+)\.mp3$/);
        const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
        const chapterTitle = chapterMap.get(index) ?? `Chapter ${index}`;
        const [fileBuffer] = await file.download();
        const entryName = `${bookTitle} - Ch${index} ${chapterTitle}.mp3`;
        archive.append(fileBuffer, { name: entryName });
      }

      await archive.finalize();
      await new Promise<void>((resolve, reject) => {
        passThrough.on('end', resolve);
        passThrough.on('error', reject);
        archive.on('error', reject);
      });

      const zipBuffer = Buffer.concat(chunks);
      const storagePath = `books/${bookId}/audiobook.zip`;
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, zipBuffer, 'application/zip');

      await bookRef.update({
        zipStatus: 'ready',
        zipUrl: downloadUrl,
        zipSize: zipBuffer.length,
        zipGeneratedAt: new Date(),
        zipError: null,
      });
      await jobRef.update({ status: 'complete', updatedAt: new Date() });

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      await bookRef.update({ zipStatus: 'error', zipError: msg });
      await jobRef.update({ status: 'error', error: msg, updatedAt: new Date() });
    }
  }
);
```

#### 1.5 `functions/src/index.ts`
Add: `export { onZipJobCreated } from './handlers/zipWorker.js';`

---

### Phase 2: Shared Package

#### 2.1 `packages/shared/src/apollo/queries.ts`
In `BOOK_FIELDS` fragment, after `audioError`:
```graphql
zipStatus zipUrl zipSize zipGeneratedAt zipError
```

Add after `PERMANENT_DELETE_BOOK`:
```typescript
export const REQUEST_BOOK_ZIP = gql`
  mutation RequestBookZip($bookId: ID!) {
    requestBookZip(bookId: $bookId)
  }
`;

export const DELETE_BOOK_ZIP = gql`
  mutation DeleteBookZip($bookId: ID!) {
    deleteBookZip(bookId: $bookId)
  }
`;
```

#### 2.2 Codegen + rebuild
```bash
pnpm codegen
pnpm build:shared
```

---

### Phase 3: i18n (3 files)

Add before the blank line that precedes `widgets.*` in each locale file.

**`en.ts`** (insert after `library.readingTheme` line):
```typescript
'library.audioDownload': 'Audio Download',
'library.downloadAllChapters': 'Download All Chapters',
'library.downloadingChapter': 'Downloading {{current}}/{{total}}...',
'library.downloadComplete': 'Download complete',
'library.downloadCancelled': 'Download cancelled',
'library.cancelDownload': 'Cancel',
'library.generateZip': 'Generate Audiobook ZIP',
'library.generatingZip': 'Generating ZIP...',
'library.zipReady': 'ZIP ready',
'library.zipGenerated': 'Generated {{date}}',
'library.downloadZip': 'Download ZIP',
'library.generateNewZip': 'Generate New ZIP',
'library.deleteZip': 'Delete ZIP',
'library.zipFailed': 'ZIP generation failed',
'library.sequentialHint': 'Downloads each chapter as a separate MP3 file',
'library.zipHint': 'Generates a single ZIP file \u2014 come back later to download',
```

**`es.ts`** (Unicode escapes for accented chars):
```typescript
'library.audioDownload': 'Descarga de Audio',
'library.downloadAllChapters': 'Descargar Todos los Cap\u00edtulos',
'library.downloadingChapter': 'Descargando {{current}}/{{total}}...',
'library.downloadComplete': 'Descarga completa',
'library.downloadCancelled': 'Descarga cancelada',
'library.cancelDownload': 'Cancelar',
'library.generateZip': 'Generar ZIP del Audiolibro',
'library.generatingZip': 'Generando ZIP...',
'library.zipReady': 'ZIP listo',
'library.zipGenerated': 'Generado {{date}}',
'library.downloadZip': 'Descargar ZIP',
'library.generateNewZip': 'Generar Nuevo ZIP',
'library.deleteZip': 'Eliminar ZIP',
'library.zipFailed': 'Error al generar el ZIP',
'library.sequentialHint': 'Descarga cada cap\u00edtulo como un archivo MP3 separado',
'library.zipHint': 'Genera un \u00fanico archivo ZIP \u2014 vuelve m\u00e1s tarde para descargarlo',
```

**`zh.ts`** (Unicode escapes for Chinese chars):
```typescript
'library.audioDownload': '\u97f3\u9891\u4e0b\u8f7d',
'library.downloadAllChapters': '\u4e0b\u8f7d\u6240\u6709\u7ae0\u8282',
'library.downloadingChapter': '\u6b63\u5728\u4e0b\u8f7d {{current}}/{{total}}...',
'library.downloadComplete': '\u4e0b\u8f7d\u5b8c\u6210',
'library.downloadCancelled': '\u4e0b\u8f7d\u5df2\u53d6\u6d88',
'library.cancelDownload': '\u53d6\u6d88',
'library.generateZip': '\u751f\u6210\u6709\u58f0\u4e66ZIP',
'library.generatingZip': '\u6b63\u5728\u751f\u6210ZIP...',
'library.zipReady': 'ZIP\u5df2\u51c6\u5907',
'library.zipGenerated': '\u751f\u6210\u4e8e {{date}}',
'library.downloadZip': '\u4e0b\u8f7d ZIP',
'library.generateNewZip': '\u91cd\u65b0\u751f\u6210ZIP',
'library.deleteZip': '\u5220\u9664ZIP',
'library.zipFailed': 'ZIP\u751f\u6210\u5931\u8d25',
'library.sequentialHint': '\u5c06\u6bcf\u4e2a\u7ae0\u8282\u4e0b\u8f7d\u4e3a\u72ec\u7acb\u7684MP3\u6587\u4ef6',
'library.zipHint': '\u751f\u6210\u5355\u4e2aZIP\u6587\u4ef6\u2014\u7a0d\u540e\u8fd4\u56de\u4e0b\u8f7d',
```

---

### Phase 4: Frontend — `AudioDownload` Component

**New file**: `packages/digital-library/src/components/AudioDownload.tsx`

Structure:
- Import `useMutation`, `REQUEST_BOOK_ZIP`, `useTranslation` from `@mycircle/shared`
- `useEffect` for 10-second polling when `zipStatus === 'processing'`
- `AbortController` ref for sequential download cancel
- Section A: sequential download with progress state `{ current, total }` or `null`
- Section B: zip state machine switch on `zipStatus`
- All Tailwind classes include `dark:` variants
- All buttons have `type="button"`
- File size formatter: `formatBytes(n)` → `"247 MB"` etc.
- Date formatter: `new Date(zipGeneratedAt).toLocaleDateString()`

**Edit**: `packages/digital-library/src/components/BookReader.tsx`
- Add `zipStatus`, `zipUrl`, `zipSize`, `zipGeneratedAt`, `zipError`, `onRefreshBook` to `BookReaderProps`
- Import and render `<AudioDownload>` after `<ChapterConvertList>` in the listen tab

**Edit**: `packages/digital-library/src/components/DigitalLibrary.tsx`
- Add `audioError?`, `zipStatus?`, `zipUrl?`, `zipSize?`, `zipGeneratedAt?`, `zipError?` to `Book` interface
- Extract `refetch` from the `GET_BOOKS` `useQuery` call
- Pass all zip fields + `onRefreshBook={async () => { await refetch(); }}` to `<BookReader>`

---

### Phase 5: Tests

**New file**: `packages/digital-library/src/components/AudioDownload.test.tsx`

Test cases:
1. Renders "Download All Chapters" button enabled when chapters have `audioUrl`
2. Renders "Download All Chapters" button disabled when no chapters have `audioUrl`
3. Shows progress during sequential download (mock `fetch`, advance through chapters)
4. Cancel stops download mid-sequence
5. ZIP `none` state: renders "Generate Audiobook ZIP" button
6. ZIP `processing` state: renders spinner + "Generating ZIP..."
7. ZIP `processing` state: calls `onRefreshBook` after 10s interval (use `vi.useFakeTimers()`)
8. ZIP `ready` state: renders download link + size + date + "Generate New ZIP" button
9. ZIP `error` state: renders error message + "Retry" button
10. Clicking "Generate Audiobook ZIP" calls `REQUEST_BOOK_ZIP` mutation
11. Clicking "Retry" calls `REQUEST_BOOK_ZIP` mutation

Mock pattern:
```typescript
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (k: string, opts?: Record<string, unknown>) => k }),
  useMutation: vi.fn().mockReturnValue([vi.fn(), { loading: false }]),
  REQUEST_BOOK_ZIP: {},
  DELETE_BOOK_ZIP: {},
}));
```

---

### Phase 6: Verification

```bash
cd functions && npm install          # install archiver
cd .. && pnpm codegen                # regenerate types
pnpm build:shared                    # rebuild after i18n + query changes
cd functions && npx tsc --noEmit     # strict functions typecheck
pnpm lint && pnpm test:run && pnpm typecheck
```

Run MCP validators:
- `validate_all` — confirms no integration point gaps
- `validate_i18n` — confirms all 3 locales match keys

## Complexity Tracking

No constitution violations. All complexity is justified by the feature requirements:

| Complexity | Why Needed |
|------------|------------|
| New Cloud Function (`onZipJobCreated`) | ZIP assembly exceeds browser memory/timeout limits for 363 MB books; must be server-side |
| `archiver` new dependency | No ZIP assembly capability exists in the project; `archiver` is the standard Node.js streaming ZIP library |
| 10-second polling in UI | ZIP generation is async; no WebSocket/subscription infrastructure exists in this MFE; polling is the existing pattern |
