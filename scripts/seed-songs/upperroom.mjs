#!/usr/bin/env node
/**
 * Seed UPPERROOM worship songs into Firestore.
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/upperroom.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Surrounded (UPPERROOM)",
    artist: "UPPERROOM",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]It may look like I'm sur[C]rounded
[G]But I'm surrounded by [D]You
[Em]It may look like I'm sur[C]rounded
[G]But I'm surrounded by [D]You

{Chorus}
[G]This is how I [C]fight my battles
[G]This is how I [D]fight my battles
[Em]This is how I [C]fight my battles
[G]This is how I [D]fight my battles

{Bridge}
[C]It may look like I'm sur[G]rounded
[D]But I'm surrounded by [Em]You
[C]God is on my [G]side`,
    notes: "Spontaneous worship feel. Let the repetition build prophetically.",
    bpm: 72,
    tags: ["worship","spiritual warfare","declaration","spontaneous"],
  },
  {
    title: "Yahweh",
    artist: "UPPERROOM",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]All of my hopes [Am]all of my plans
[F]All of my dreams I [G]place in Your hands
[C]All of my fears [Am]all of my past
[F]All of my questions I [G]lay at Your feet

{Chorus}
[C]Yahweh [Am]Yahweh
[F]I will trust in You a[G]lone
[C]Yahweh [Am]Yahweh
[F]I will follow where You [G]go

{Verse 2}
[C]All of the earth [Am]all of the sky
[F]Everything trembles at the [G]sound of Your name`,
    notes: "Simple and devotional. Room for spontaneous worship moments.",
    bpm: 70,
    tags: ["worship","surrender","trust","devotional"],
  }
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
