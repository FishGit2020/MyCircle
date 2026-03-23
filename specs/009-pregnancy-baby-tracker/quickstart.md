# Quickstart: Baby Memory Journal Development

**Branch**: `009-pregnancy-baby-tracker`
**Approach**: Extending `packages/baby-tracker` — no new MFE package.

## Prerequisites

- Node 20+, pnpm 9+, Firebase CLI (`npm i -g firebase-tools`)

## First-time Setup

```bash
pnpm install          # installs workspace deps; runs pnpm codegen via postinstall
pnpm build:shared     # required before baby-tracker can compile
```

## Running in Dev

```bash
pnpm dev:baby         # start baby-tracker MFE + shell
# or
pnpm dev              # start everything
```

Baby Tracker available at `http://localhost:5173/baby`.

## After Schema Changes

```bash
# After editing functions/src/schema.ts or packages/shared/src/apollo/queries.ts:
pnpm codegen
pnpm build:shared
```

## Running Tests

```bash
# Full suite (required before pushing):
pnpm lint && pnpm test:run && pnpm typecheck

# Baby-tracker package only:
pnpm --filter @mycircle/baby-tracker test:run

# Functions backend strict typecheck:
cd functions && npx tsc --noEmit
```

## Running the Migration Script

After implementing the new journal album (US2), run this **once** per user environment to migrate existing per-stage milestone photos:

```bash
# Migrate all users (uses Firebase Admin SDK, requires GOOGLE_APPLICATION_CREDENTIALS):
node scripts/migrate-baby-photos.mjs --all

# Migrate a single user (for testing):
node scripts/migrate-baby-photos.mjs --uid=<firebase-uid>
```

The script is idempotent — safe to re-run.

## Key Files Being Modified

| File | Change |
|------|--------|
| `packages/baby-tracker/src/components/BabyTracker.tsx` | Add 3 collapsible sections; remove per-stage MilestonePhoto |
| `packages/baby-tracker/src/components/MilestonePhoto.tsx` | **Deleted** (replaced by JournalPhotoSection) |
| `packages/baby-tracker/src/hooks/useBabyPhotos.ts` | **Deleted** (replaced by useJournalPhotos) |
| `functions/src/schema.ts` | Add MilestoneEvent, JournalPhoto, InfantAchievement types |
| `functions/src/resolvers/milestoneEvents.ts` | New file |
| `functions/src/resolvers/journalPhotos.ts` | New file (replaces babyPhotos.ts logic) |
| `functions/src/resolvers/infantAchievements.ts` | New file |
| `functions/src/handlers/journalPhotos.ts` | New file |
| `packages/shared/src/apollo/queries.ts` | Add new query/mutation documents |
| `scripts/migrate-baby-photos.mjs` | New migration script |
