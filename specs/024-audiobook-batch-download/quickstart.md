# Quickstart: Audiobook Batch Download

## Prerequisites

- Node.js 22, pnpm
- Firebase CLI + emulator suite
- Working digital library with at least one book that has converted audio chapters

## Development Sequence

```bash
# 1. Install archiver in functions
cd functions && npm install archiver@^7 && npm install --save-dev @types/archiver@^6

# 2. After schema changes:
cd .. && pnpm codegen

# 3. After queries.ts changes:
pnpm build:shared

# 4. Run full check suite before pushing
pnpm lint && pnpm test:run && pnpm typecheck

# 5. Verify functions strict TS
cd functions && npx tsc --noEmit
```

## Key Files

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add 5 zip fields to `Book` type + 2 new mutations |
| `functions/src/resolvers/digitalLibrary.ts` | Add zip fields to `docToBook()`, add `requestBookZip` / `deleteBookZip`, update `permanentDeleteBook` |
| `functions/src/handlers/zipWorker.ts` | **New** — `onZipJobCreated` Firestore-triggered function |
| `functions/src/index.ts` | Export `onZipJobCreated` |
| `functions/package.json` | Add `archiver` + `@types/archiver` |
| `packages/shared/src/apollo/queries.ts` | Add zip fields to `BOOK_FIELDS` fragment + 2 mutation constants |
| `packages/shared/src/index.ts` | Re-export `REQUEST_BOOK_ZIP`, `DELETE_BOOK_ZIP` |
| `packages/digital-library/src/components/AudioDownload.tsx` | **New** — download panel component |
| `packages/digital-library/src/components/AudioDownload.test.tsx` | **New** — component tests |
| `packages/digital-library/src/components/DigitalLibrary.tsx` | Add zip fields to `Book` interface + pass to `BookReader` |
| `packages/digital-library/src/components/BookReader.tsx` | Add zip props + `onRefreshBook` + render `<AudioDownload>` |
| `packages/shared/src/i18n/locales/en.ts` | Add 16 `library.*` keys |
| `packages/shared/src/i18n/locales/es.ts` | Spanish translations |
| `packages/shared/src/i18n/locales/zh.ts` | Chinese translations |

## Test the Feature End-to-End

1. Open a book with all chapters converted
2. Switch to the **Listen** tab
3. Scroll to the **Audio Download** section (below `ChapterConvertList`)
4. **Sequential**: click "Download All Chapters" — observe per-chapter progress; verify MP3 files saved
5. **ZIP**: click "Generate Audiobook ZIP" — status changes to "Generating ZIP..."; wait for worker; verify "ZIP ready" card appears with size + date; click "Download ZIP"
6. **Regenerate**: with ZIP ready, click "Generate New ZIP" — status resets to processing

## i18n Keys Added

```
library.audioDownload          "Audio Download"
library.downloadAllChapters    "Download All Chapters"
library.downloadingChapter     "Downloading {{current}}/{{total}}..."
library.downloadComplete       "Download complete"
library.downloadCancelled      "Download cancelled"
library.cancelDownload         "Cancel"
library.generateZip            "Generate Audiobook ZIP"
library.generatingZip          "Generating ZIP..."
library.zipReady               "ZIP ready"
library.zipGenerated           "Generated {{date}}"
library.downloadZip            "Download ZIP"
library.generateNewZip         "Generate New ZIP"
library.deleteZip              "Delete ZIP"
library.zipFailed              "ZIP generation failed"
library.sequentialHint         "Downloads each chapter as a separate MP3 file"
library.zipHint                "Generates a single ZIP file — come back later to download"
```
