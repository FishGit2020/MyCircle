#!/usr/bin/env node
/**
 * Seed DOE worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/doe.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "When I Pray",
    artist: "DOE",
    originalKey: "F",
    format: "chordpro",
    content: `[F]Something happens when I [C]pray
[Dm]Your power falls, Your [Bb]glory stays
[F]Every mountain has to [C]move
[Dm]Every chain is breaking [Bb]through

[F]When I pray, [C]when I pray
[Dm]Heaven meets me [Bb]all the way
[F]When I call on [C]Your name
[Dm]Everything will [Bb]change
[F]When I [C]pray
[Dm]When I [Bb]pray`,
    notes: "Prayer anthem, builds with each repetition",
    bpm: 90,
    tags: ["worship","prayer","power"],
  },
  {
    title: "Heart of God",
    artist: "DOE",
    originalKey: "Bb",
    format: "chordpro",
    content: `[Bb]Show me the heart of [F]God
[Gm]Love that won't let [Eb]go
[Bb]Grace that finds me [F]here
[Gm]In my brokenness You're [Eb]near

[Bb]The heart of God is [F]for me
[Gm]The heart of God is [Eb]love
[Bb]It's deeper than the [F]ocean
[Gm]Higher than the [Eb]stars above
[Bb]And nothing can sep[F]arate me
[Gm]From the heart of [Eb]God
[Bb]The heart of [F]God`,
    notes: "Tender and soulful, R&B gospel influence",
    bpm: 72,
    tags: ["worship","love","soulful"],
  },
  {
    title: "So Good (DOE)",
    artist: "DOE",
    originalKey: "G",
    format: "chordpro",
    content: `[G]Every morning mercy [D]new
[Em]Every evening gratitude [C]overflowing
[G]Look at all You've brought me [D]through
[Em]Your goodness and Your [C]love keep on showing

[G]You're so good, [D]You're so good
[Em]Lord You're so good [C]to me
[G]So so good, [D]so so good
[Em]Lord You're so good [C]to me

[G]When I count my blessings [D]can't count them all
[Em]When I think of Your goodness [C]I just stand in awe
[G]You're so [D]good [Em]so [C]good`,
    notes: "Upbeat gospel groove, infectious joy",
    bpm: 110,
    tags: ["worship","gratitude","gospel"],
  },
  {
    title: "Mercy Flows",
    artist: "DOE",
    originalKey: "D",
    format: "chordpro",
    content: `[D]Like a river running [A]steady
[Bm]Like a fountain ever [G]flowing
[D]Your mercy never [A]runs out
[Bm]Your mercy keeps on [G]going

[D]Mercy flows, [A]mercy flows
[Bm]Like a river that [G]never runs dry
[D]Mercy flows, [A]mercy flows
[Bm]Washing over this [G]heart of mine

[D]New every morning [A]new every night
[Bm]Your mercies are [G]faithful
[D]Mercy [A]flows
[Bm]Mercy [G]flows`,
    notes: "Flowing and gentle, great for communion",
    bpm: 76,
    tags: ["worship","mercy","communion"],
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
