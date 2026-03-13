# Worship Songs Seed Scripts

Scripts to populate the Firestore `worshipSongs` collection with ChordPro chord charts.

## Seeding a New Database

```bash
# 1. Authenticate with Google Cloud (creates ADC credentials)
gcloud auth application-default login

# 2. Set credentials (if ADC is in a non-standard path, e.g. Windows Microsoft Store Python)
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/application_default_credentials.json"

# 3. Seed ALL songs (run every artist script with --skip-existing)
for f in scripts/seed-songs/*.mjs; do
  [[ "$(basename $f)" == "update-all.mjs" || "$(basename $f)" == "force-update-all.mjs" ]] && continue
  echo "=== $(basename $f) ==="
  node "$f" --skip-existing
done

# Or seed a single artist:
node scripts/seed-songs/bethel-music.mjs --skip-existing
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

## Per-Artist Scripts

| Script | Songs | Artist(s) |
|--------|------:|-----------|
| `bethel-music.mjs` | 60 | Bethel Music |
| `elevation-worship.mjs` | 59 | Elevation Worship |
| `chris-tomlin.mjs` | 50 | Chris Tomlin |
| `hillsong-worship.mjs` | 41 | Hillsong Worship |
| `jesus-culture.mjs` | 39 | Jesus Culture |
| `brandon-lake.mjs` | 36 | Brandon Lake |
| `hillsong-united.mjs` | 35 | Hillsong UNITED |
| `upperroom.mjs` | 35 | UPPERROOM |
| `vineyard-worship.mjs` | 35 | Vineyard Worship |
| `kari-jobe.mjs` | 30 | Kari Jobe |
| `brooke-ligertwood.mjs` | 29 | Brooke Ligertwood |
| `other-artists.mjs` | 22 | Passion, Anne Wilson, Amanda Cook, Lauren Daigle, CityAlight, and others |
| `mission-house.mjs` | 15 | Mission House |
| `jeremy-riddle.mjs` | 15 | Jeremy Riddle |
| `maverick-city-music.mjs` | 12 | Maverick City Music |
| `traditional-modern.mjs` | 11 | Traditional (Modern) |
| `phil-wickham.mjs` | 9 | Phil Wickham |
| `casting-crowns.mjs` | 9 | Casting Crowns |
| `matt-redman.mjs` | 8 | Matt Redman |
| `mercyme.mjs` | 8 | MercyMe |
| `crowder.mjs` | 7 | Crowder |
| `hillsong-young-and-free.mjs` | 6 | Hillsong Young & Free |
| `we-the-kingdom.mjs` | 6 | We The Kingdom |
| `shane-and-shane.mjs` | 5 | Shane & Shane |
| `matt-maher.mjs` | 5 | Matt Maher |
| `housefires.mjs` | 5 | Housefires |
| `all-sons-and-daughters.mjs` | 5 | All Sons & Daughters |
| `gateway-worship.mjs` | 5 | Gateway Worship |
| `paul-baloche.mjs` | 5 | Paul Baloche |
| `cody-carnes.mjs` | 5 | Cody Carnes |
| `pat-barrett.mjs` | 5 | Pat Barrett |
| `david-crowder-band.mjs` | 5 | David Crowder Band |
| `church-sunday.mjs` | 3 | Hillsong Worship, Elevation Worship, Brooke Ligertwood |

## CCLI Top 100 Scripts

Songs from the [CCLI Top 100](https://songselect.ccli.com/ccli-top-100) (March 2, 2026). All tagged with `"ccli-top-100"` for easy filtering.

| Script | Songs |
|--------|------:|
| `ccli-top-100-part1.mjs` | 30 |
| `ccli-top-100-part2.mjs` | 30 |
| `ccli-top-100-part3.mjs` | 22 |
| `ccli-top-100-part4.mjs` | 28 |

**Total: ~720 songs across 37 scripts**

## Utility Scripts

| Script | Purpose |
|--------|---------|
| `update-all.mjs` | Add section labels to songs missing them |
| `force-update-all.mjs` | Sync all field corrections (content, key, tags) to Firestore |
