# Worship Songs Seed Scripts

Scripts to populate the Firestore `worshipSongs` collection with ChordPro chord charts.

## Seeding a New Database

```bash
# 1. Authenticate with Google Cloud (creates ADC credentials)
gcloud auth application-default login

# 2. Set credentials (if ADC is in a non-standard path, e.g. Windows Microsoft Store Python)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/application_default_credentials.json"

# 3. Seed ALL songs (run every song/pdf script with --skip-existing)
node scripts/seed-songs/reseed-all.mjs --skip-existing

# Or seed a single song:
node scripts/seed-songs/song-goodness-of-god.mjs --skip-existing
```

The `--skip-existing` flag checks Firestore for duplicates (by title + artist) before inserting.

## Updating Existing Songs

### `update-all.mjs` — Add Section Labels

Adds `{Verse 1}`, `{Chorus}`, `{Bridge}`, etc. section labels to songs that don't have them yet. Only updates the `content` field. Skips songs that already have labels.

```bash
# Preview changes
node scripts/seed-songs/update-all.mjs --dry-run

# Apply changes
node scripts/seed-songs/update-all.mjs
```

### `force-update-all.mjs` — Sync Chord/Key Corrections

Compares **all** fields (`content`, `originalKey`, `tags`) between seed scripts and Firestore. Updates any song where these fields differ. Use this after verifying/correcting chords in seed scripts.

```bash
# Preview what would change
node scripts/seed-songs/force-update-all.mjs --dry-run

# Apply all corrections
node scripts/seed-songs/force-update-all.mjs
```

**How it works:**
1. Reads all `*.mjs` seed files and extracts `title`, `artist`, `content`, `originalKey`, `tags`
2. Fetches all songs from Firestore
3. Matches by `title + artist`
4. If `content`, `originalKey`, or `tags` differ → updates Firestore
5. Logs each change with what was modified (e.g. `key: G -> A, content, tags`)

**When to use:** After making chord/key corrections or adding tags in seed scripts, run this to push those corrections to production Firestore.

## Chord Verification

All songs have been verified against published chord sources:
- [Ultimate Guitar](https://www.ultimate-guitar.com/)
- [Worship Together](https://www.worshiptogether.com/)
- [PraiseCharts](https://www.praisecharts.com/)

Songs use **ChordPro format** with proper section labels:
```
{Verse 1}
[G]Amazing [C]grace how [D]sweet the sound
[Em]That saved a [C]wretch like [G]me

{Chorus}
[G]I once was [C]lost but [D]now am found
[Em]Was blind but [C]now I [G]see
```

## Reverting / Removing Seeded Songs

```bash
# Remove ALL seed-script songs from Firestore:
GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json node -e "
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const col = db.collection('worshipSongs');
const snap = await col.where('createdBy', '==', 'seed-script').get();
console.log('Deleting ' + snap.size + ' seeded songs...');
let batch = db.batch();
let i = 0;
for (const doc of snap.docs) {
  batch.delete(doc.ref);
  i++;
  if (i % 450 === 0) { await batch.commit(); batch = db.batch(); }
}
if (i % 450 !== 0) await batch.commit();
console.log('Done. Removed ' + snap.size + ' songs.');
" --input-type=module
```

All seeded songs have `createdBy: 'seed-script'`, so they can be cleanly separated from user-created songs.

## Script Counts

- 112 individual song scripts (`song-*.mjs`)
- 6 PDF songbook scripts (`pdf-songbook-*.mjs`)

**Total: 118 seed scripts**

## Utility Scripts

| Script | Purpose |
|--------|---------|
| `reseed-all.mjs` | Seed all song and PDF scripts (with `--skip-existing` support) |
| `reseed-pdf-only.mjs` | Seed only PDF songbook scripts |
| `split-to-individual.mjs` | Split bulk scripts into individual song files |
| `update-all.mjs` | Add section labels to songs missing them |
| `force-update-all.mjs` | Sync all field corrections (content, key, tags) to Firestore |
