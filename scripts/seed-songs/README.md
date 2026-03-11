# Worship Songs Seed Scripts

Scripts to populate the Firestore `worshipSongs` collection with ChordPro chord charts.

## Seeding a New Database

```bash
# 1. Install firebase-admin (if not already installed)
pnpm add -D firebase-admin

# 2. Set your Firebase service account key
#    Download from: Firebase Console > Project Settings > Service Accounts > Generate New Private Key
export GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json

# 3. Seed ALL songs (run every artist script with --skip-existing)
for f in scripts/seed-songs/*.mjs; do
  echo "=== $(basename $f) ==="
  node "$f" --skip-existing
done

# Or seed a single artist:
node scripts/seed-songs/bethel-music.mjs --skip-existing
```

The `--skip-existing` flag checks Firestore for duplicates (by title + artist) before inserting.

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

# Remove songs from a specific artist:
GOOGLE_APPLICATION_CREDENTIALS=./path/to/key.json node -e "
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const snap = await db.collection('worshipSongs').where('artist', '==', 'ARTIST_NAME_HERE').get();
console.log('Deleting ' + snap.size + ' songs by ARTIST_NAME_HERE...');
const batch = db.batch();
snap.docs.forEach(d => batch.delete(d.ref));
await batch.commit();
console.log('Done.');
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
| `jeremy-riddle.mjs` | 15 | Jeremy Riddle |
| `maverick-city-music.mjs` | 12 | Maverick City Music |
| `traditional-modern.mjs` | 11 | Traditional (Modern) |
| `phil-wickham.mjs` | 9 | Phil Wickham |
| `casting-crowns.mjs` | 9 | Casting Crowns |
| `matt-redman.mjs` | 8 | Matt Redman |
| `mercyme.mjs` | 8 | MercyMe |
| `keith-and-kristyn-getty.mjs` | 8 | Keith & Kristyn Getty |
| `crowder.mjs` | 7 | Crowder |
| `tauren-wells.mjs` | 6 | Tauren Wells |
| `hillsong-young-and-free.mjs` | 6 | Hillsong Young & Free |
| `rend-collective.mjs` | 6 | Rend Collective |
| `we-the-kingdom.mjs` | 6 | We The Kingdom |
| `israel-houghton.mjs` | 6 | Israel Houghton |
| `todd-dulaney.mjs` | 6 | Todd Dulaney |
| `planetshakers.mjs` | 6 | Planetshakers |
| `michael-w-smith.mjs` | 6 | Michael W. Smith |
| `delirious.mjs` | 6 | Delirious? |
| `third-day.mjs` | 6 | Third Day |
| `shane-and-shane.mjs` | 5 | Shane & Shane |
| `matt-maher.mjs` | 5 | Matt Maher |
| `housefires.mjs` | 5 | Housefires |
| `all-sons-and-daughters.mjs` | 5 | All Sons & Daughters |
| `tasha-cobbs-leonard.mjs` | 5 | Tasha Cobbs Leonard |
| `william-mcdowell.mjs` | 5 | William McDowell |
| `gateway-worship.mjs` | 5 | Gateway Worship |
| `paul-baloche.mjs` | 5 | Paul Baloche |
| `cody-carnes.mjs` | 5 | Cody Carnes |
| `pat-barrett.mjs` | 5 | Pat Barrett |
| `dante-bowe.mjs` | 5 | Dante Bowe |
| `david-crowder-band.mjs` | 5 | David Crowder Band |
| `newsboys.mjs` | 5 | Newsboys |
| `stuart-townend.mjs` | 4 | Stuart Townend |
| `charity-gayle.mjs` | 4 | Charity Gayle |
| `naomi-raine.mjs` | 4 | Naomi Raine |
| `doe.mjs` | 4 | DOE |
| `forrest-frank.mjs` | 4 | Forrest Frank |
| `tim-hughes.mjs` | 4 | Tim Hughes |
| `darlene-zschech.mjs` | 4 | Darlene Zschech |
| `other-artists.mjs` | 22 | Passion, Anne Wilson, Amanda Cook, Lauren Daigle, CityAlight, and others |

**Total: ~720 songs across 51 scripts**
