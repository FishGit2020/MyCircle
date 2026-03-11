#!/usr/bin/env node
/**
 * Seed Forrest Frank worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/forrest-frank.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Good Day",
    artist: "Forrest Frank",
    originalKey: "C",
    format: "chordpro",
    content: `[C]Woke up this morning with the [G]sun in my eyes
[Am]God gave me another day and [F]I feel alive
[C]No matter what may come my [G]way
[Am]I've got Jesus and I've [F]got today

[C]It's a good day to have a [G]good day
[Am]It's a good day to be a[F]live
[C]I've got the joy of the [G]Lord inside
[Am]And it's a good day to have a [F]good day

[C]Every morning, [G]brand new mercy
[Am]Every sunrise, [F]new and worthy
[C]It's a good [G]day
[Am]It's a good [F]day`,
    notes: "Bright and joyful pop worship, upbeat throughout",
    bpm: 120,
    tags: ["worship","joy","pop"],
  },
  {
    title: "No Pressure",
    artist: "Forrest Frank",
    originalKey: "G",
    format: "chordpro",
    content: `[G]I don't gotta prove my [D]worth to anyone
[Em]God already said that [C]I am enough
[G]I don't gotta carry [D]all of this weight
[Em]Gave it to the Lord and [C]He took it away

[G]No pressure, no [D]pressure
[Em]Living in the grace of [C]God forever
[G]No pressure, no [D]pressure
[Em]My identity is [C]in the Father

[G]He said come as you [D]are
[Em]Rest inside My [C]arms
[G]No pressure`,
    notes: "Chill and reassuring, modern worship pop",
    bpm: 96,
    tags: ["worship","identity","grace"],
  },
  {
    title: "Life Is Good",
    artist: "Forrest Frank",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Sun is shining, birds are [A]singing
[Bm]Heart is beating for the [G]King of kings
[D]Trouble tries but I'm not [A]worried
[Bm]Got a God who handles [G]everything

[D]Life is good cause [A]God is great
[Bm]Life is good in [G]every way
[D]Doesn't mean there's [A]no hard days
[Bm]But life is good cause [G]God is great

[D]Count my blessings [A]one two three
[Bm]God has given [G]everything to me
[D]Life is [A]good
[Bm]Life is [G]good`,
    notes: "Feel-good worship, acoustic guitar with light production",
    bpm: 112,
    tags: ["worship","gratitude","pop"],
  },
  {
    title: "Praise God (Forrest Frank)",
    artist: "Forrest Frank",
    originalKey: "A",
    format: "chordpro",
    content: `[A]When the morning comes I'll [E]praise God
[F#m]When the evening falls I'll [D]praise God
[A]In the highs and lows I [E]praise God
[F#m]Everywhere I go I [D]praise God

[A]Praise God from whom all [E]blessings flow
[F#m]Praise Him all creatures [D]here below
[A]Praise Him above ye [E]heavenly hosts
[F#m]Praise Father Son and [D]Holy Ghost

[A]I will praise, [E]I will praise
[F#m]I will praise [D]God
[A]All my days, [E]all my days
[F#m]I'll praise [D]God`,
    notes: "Modern take on the Doxology, infectious rhythm",
    bpm: 116,
    tags: ["worship","praise","doxology"],
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
