#!/usr/bin/env node
/**
 * Seed Matt Maher worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/matt-maher.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Lord I Need You",
    artist: "Matt Maher",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Lord I come I con[C]fess
[Em]Bowing here I [D]find my rest
[G]Without You I [C]fall apart
[Em]You're the one that [D]guides my heart

{Chorus}
[C]Lord I [D]need You oh I [G]need You
[Em]Every [C]hour I [D]need You
[G]My one de[C]fense my [D]righteousness
[Em]Oh God how [C]I need [G]You

{Verse 2}
[G]Where sin runs [C]deep Your grace is more
[Em]Where grace is [D]found is where You are`,
    notes: "Classic modern hymn. Piano-led with gentle build. Great for communion.",
    bpm: 72,
    tags: ["worship","dependence","grace","hymn"],
  },
  {
    title: "Because He Lives (Amen)",
    artist: "Matt Maher",
    originalKey: "Db",
    format: "chordpro",
    content: `{Verse 1}
[Db]I believe in the [Gb]Son
[Db]I believe in the [Ab]Risen One
[Bbm]I believe I over[Gb]come
[Db]By the power of [Ab]His blood

{Chorus}
[Db]Amen [Gb]amen
[Db]I'm alive I'm alive because He [Ab]lives
[Bbm]Amen [Gb]amen
[Db]Let my song join the [Ab]one that never [Db]ends
[Gb]Because He [Db]lives

{Verse 2}
[Db]I was dead in the [Gb]grave
[Db]I was covered in [Ab]sin and shame
[Bbm]I heard mercy call my [Gb]name
[Db]He rolled the stone a[Ab]way`,
    notes: "Celebratory Easter anthem. Full band energy on the chorus.",
    bpm: 128,
    tags: ["worship","easter","resurrection","declaration"],
  },
  {
    title: "Your Grace Is Enough",
    artist: "Matt Maher",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Great is Your [C]faithfulness O God
[Em]You wrestle with the [D]sinner's restless heart
[G]You lead us by [C]still waters into mercy
[Em]And nothing can keep [D]us apart

{Chorus}
[C]So remember Your [G]people
[D]Remember Your [Em]children
[C]Remember Your [D]promise O [G]God

{Verse 2}
[G]Your grace is e[C]nough
[G]Your grace is e[D]nough
[Em]Your grace is e[C]nough for [G]me`,
    notes: "Congregational anthem. Strong and confident. Works well with acoustic guitar leading.",
    bpm: 86,
    tags: ["worship","grace","anthem"],
  },
  {
    title: "Alive Again",
    artist: "Matt Maher",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[D]I woke up in [A]darkness
[Bm]Surrounded by [G]silence
[D]Oh where were [A]You
[Bm]Where where were [G]You

{Chorus}
[D]And as I stumbled [A]searching
[Bm]Thirsting for [G]truth
[D]I discovered a [A]grace I never [Bm]knew [G]

{Verse 2}
[D]I'm alive [A]again
[Bm]From the dead [G]again
[D]I'm alive [A]again
[Bm]And forever [G]God is glorified in [D]me`,
    notes: "Builds from quiet verse to powerful chorus. Great testimony song.",
    bpm: 80,
    tags: ["worship","testimony","resurrection","new life"],
  },
  {
    title: "Hold Us Together",
    artist: "Matt Maher",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]It don't have a job it [C]don't pay your bills
[Em]Won't fix your life in [D]five easy steps
[G]Ain't the law of the [C]land or the arm of the law
[Em]It don't even know [D]what it means to be wrong

{Chorus}
[C]Love will [D]hold us to[Em]gether
[C]Make us a [D]shelter to [Em]weather the storm
[C]And I'll [D]be my brother's [Em]keeper
[C]So the whole [D]world will [Em]know that we're not alone

{Verse 2}
[G]It's waiting for [C]you knocking at your door
[Em]In the moment of [D]truth when your heart hits the floor`,
    notes: "Upbeat and hopeful. Acoustic pop feel. Great for community gatherings.",
    bpm: 116,
    tags: ["worship","love","community","unity"],
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
