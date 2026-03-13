#!/usr/bin/env node
/**
 * Seed Church Sunday worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/church-sunday.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Never Walk Alone",
    artist: "Hillsong Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[G]You're my deli[C]verer
[Em]I know I never [D]walk alone
[G]You're always [C]faithful
[Em]You're strong and [D]able
[G]For all of my [C]life
[Em]Your favour has followed, You're [D]my covering
[G]Every hour, every [C]minute
[Em]You have always [D]been there
[G]I have never [C]walked alone
[Em]I've never been a[D]bandoned

{Chorus}
[G]In every triumph, [C]every failure
[Em]You are loyal [D]to me
[G]You are my in[C]heritance
[Em]You are my strength and [D]shield
[G]You are faithful and [C]You always [D]will be

{Verse 2}
[G]You're always [C]present
[Em]You're always [D]with me
[G]I'm safe in [C]Your love
[Em]Your army of angels [D]watch over me
[G]Your heart is [C]for me
[Em]Your ear is [D]listening
[G]And I have [C]confidence
[Em]You go be[D]fore me

{Bridge}
[G]I'm lifting my [C]head
[Em]In You I find help, You're [D]my providence
[G]You are faithful, and [C]You always [D]will be, yeah`,
    notes: "Key of B, commonly played in G with capo 4. Let the dynamics breathe through the bridge.",
    bpm: 72,
    tags: ["worship", "faithfulness", "trust"],
  },
  {
    title: "On Repeat",
    artist: "Elevation Worship",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse 1}
[G]You welcome me with [D]open arms
[Em]No matter where I [C]have been
[G]I find grace more [D]precious than I did before
[Em]So I'm gonna lay my [C]world down
[G]Here at Your [D]feet
[Em]Every time I come [C]running
[G]I find grace on [D]repeat

{Chorus}
[G]Grace upon [D]grace
[Em]Morning by [C]morning
[G]God be ex[D]alted
[Em]Over and over a[C]gain
[G]My hope in every [D]waking hour
[Em]And the strength I [C]lean on
[G]Every time I sur[D]render
[Em]Every time I [C]fall
[G]I'm gonna sing my [D]heart out
[Em]Praise on re[C]peat
[G]Oh, grace upon [D]grace
[Em]Morning by [C]morning

{Verse 2}
[G]Look to the [D]Heavens
[Em]For all I [C]need
[G]You're the mercy at [D]midnight
[Em]You're the kindness of [C]dawn
[G]Every time it comes to [D]sundown
[Em]And the night sets [C]in
[G]Let my soul re[D]member
[Em]Just how good You've [C]been

{Bridge}
[G]Day after day will I [D]sing
[Em]Praise upon [C]praise
[G]To the God who's never [D]given up on me
[Em]And again and again, my [C]heart will sing`,
    notes: "Key of B, commonly played in G with capo 4. Repetitive chorus builds momentum.",
    bpm: 78,
    tags: ["worship", "grace", "praise"],
  },
  {
    title: "A Thousand Hallelujahs",
    artist: "Brooke Ligertwood",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Who else would rocks cry [D]out to worship
[Em]Whose glory taught the [C]stars to shine
[G]Perhaps creation [D]longs to have the words to sing
[Em]But this joy is [C]mine

{Chorus}
[G]Lord Jesus this song is [D]forever Yours
[Em]A thousand halle[C]lujahs, and a thousand more
[G]With a thousand halle[D]lujahs
[Em]We magnify Your [C]Name
[G]You alone deserve the [D]glory
[Em]The honour and the [C]praise

{Verse 2}
[G]Who else would die for [D]our redemption
[Em]Whose resurrection [C]means I'll rise
[G]There isn't time e[D]nough to sing of all You've done
[Em]But I have eter[C]nity to try

{Bridge}
[G]Now He [D]reigns
[Em]We will sing for[C]ever
[G]To the King of [D]heaven
[Em]Praise for He [C]rose
[G]Praise to the [D]Lord
[Em]To the [C]Lamb`,
    notes: "Key of G, no capo needed. Expansive worship anthem with a soaring bridge.",
    bpm: 72,
    tags: ["worship", "hallelujah", "praise", "Jesus"],
  },
];

const skipExisting = process.argv.includes('--skip-existing');

async function main() {
  const col = db.collection('worshipSongs');
  let existingKeys = new Set();
  if (skipExisting) {
    const snapshot = await col.get();
    for (const doc of snapshot.docs) {
      const d = doc.data();
      existingKeys.add(`${d.title}|||${d.artist}`);
    }
    console.log(`Found ${existingKeys.size} existing songs in Firestore.`);
  }
  let batch = db.batch();
  let count = 0;
  let batchCount = 0;
  for (const song of SONGS) {
    const key = `${song.title}|||${song.artist}`;
    if (skipExisting && existingKeys.has(key)) {
      console.log(`  SKIP: ${song.title} - ${song.artist}`);
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      ...song,
      createdBy: 'seed-script',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    batchCount++;
    console.log(`  ADD:  ${song.title} - ${song.artist}`);
    if (batchCount >= 450) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }
  if (batchCount > 0) await batch.commit();
  console.log(`\nSeeded ${count} songs (total in script: ${SONGS.length}).`);
}

main().catch((err) => { console.error('Seed failed:', err); process.exit(1); });
