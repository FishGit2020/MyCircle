# Quickstart: NAS Audio Offload Development

**Branch**: `025-nas-audio-offload` | **Date**: 2026-04-02

## Prerequisites

- Synology NAS accessible at an external URL (DDNS or static IP) with DSM FileStation enabled
- Firebase project with existing digital library data (books with converted audio chapters)
- Local dev environment with `pnpm` and Firebase emulator

## Implementation Order

Follow this order to avoid broken intermediate states:

```
1. functions/src/nasClient.ts                      ← NAS client + cache
2. functions/src/resolvers/nas.ts                  ← Resolvers
3. functions/src/schema.ts                         ← Schema extensions
4. functions/src/resolvers/index.ts                ← Wire resolvers
5. functions/src/resolvers/digitalLibrary.ts       ← Add nasArchived/nasPath to bookChapters
6. i18n: en.ts, zh.ts, es.ts                      ← All 3 locales
7. firestore.rules                                 ← NAS subcollection rule
8. pnpm codegen                                    ← Regenerate generated.ts
9. packages/shared/src/apollo/queries.ts           ← NAS queries + extend GET_BOOK_CHAPTERS
10. pnpm build:shared                              ← Rebuild shared
11. packages/setup/src/components/NasConnectionSection.tsx  ← Setup UI
12. packages/setup/src/components/Setup.tsx        ← Add NAS tab
13. packages/digital-library/src/components/ChapterConvertList.tsx  ← NAS actions
```

## Verification Steps

### Backend

```bash
cd functions && npx tsc --noEmit
```

Must pass with zero errors (`noUnusedLocals: true` is enforced).

### Full Suite

```bash
pnpm build:shared
pnpm lint && pnpm test:run && pnpm typecheck
```

All three must pass before pushing.

### MCP Validators

```
validate_all
```

Run after completing all changes. Verifies i18n parity, Dockerfile, widget registry.

## Manual Smoke Test

1. Start local dev: `pnpm dev`
2. Navigate to **Setup** — verify new **NAS Storage** tab appears
3. Enter NAS URL, username, password, destination folder → **Save & Test** → verify green "Connected" status
4. Navigate to **Digital Library** → open a book with converted audio
5. Verify **Offload to NAS** button appears per chapter (when NAS connected)
6. Click **Offload to NAS** on one chapter → verify:
   - Loading indicator during transfer
   - Chapter shows "NAS" chip after completion
   - Play button replaced by "Restore from NAS"
   - Firebase Storage file is deleted
7. Click **Restore from NAS** → verify:
   - Loading indicator during transfer
   - Play button returns
   - "NAS" chip remains visible
8. Verify **Offload All to NAS** toolbar button appears when NAS connected + audio chapters exist
9. Remove NAS connection from Setup → verify offload/restore buttons disappear from Digital Library

## Key Files Reference

| File | Purpose |
|------|---------|
| `functions/src/nasClient.ts` | Synology FileStation API client; NAS config cache |
| `functions/src/resolvers/nas.ts` | All NAS GraphQL resolver logic |
| `functions/src/schema.ts` | GraphQL type definitions (lines ~219-227 for BookChapter) |
| `packages/shared/src/apollo/queries.ts` | NAS GQL queries/mutations; extended GET_BOOK_CHAPTERS |
| `packages/setup/src/components/NasConnectionSection.tsx` | NAS connection form (mirrors SqlConnectionSection) |
| `packages/digital-library/src/components/ChapterConvertList.tsx` | Chapter list with NAS offload/restore actions |
| `specs/025-nas-audio-offload/contracts/graphql.md` | Full GraphQL contract with all fields and behaviors |

## Common Pitfalls

- **Rebase i18n duplicate keys**: After rebasing, always run `pnpm build:shared` — a rebase onto main can introduce duplicate i18n comment blocks causing `TS1117`.
- **Spanish i18n Unicode escapes**: `es.ts` uses `\u00f3` etc. — read the exact surrounding lines before editing.
- **`audioStoragePath` is unreliable**: Use the convention path `books/{bookId}/audio/chapter-{index}.mp3` for Storage operations, not `audioStoragePath` from Firestore.
- **`cd functions && npx tsc --noEmit`**: Run this separately — root `pnpm typecheck` does NOT check `functions/` due to its separate strict tsconfig.
- **Node 22 native fetch**: Cloud Functions Node 22 has native `fetch` and `FormData` — no need to import or polyfill. Use directly.
