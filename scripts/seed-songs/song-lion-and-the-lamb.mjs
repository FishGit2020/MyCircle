#!/usr/bin/env node
/**
 * Seed: Lion And The Lamb by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-lion-and-the-lamb.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Lion And The Lamb",
    artist: "Bethel Music",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro (2X)}
[C] [Dm] [F]

{Verse 1}
[C]He's coming on the clouds
[Dm]Kings and kingdoms [F]will bow down
[Am]And every chain will break
[G]As broken [F]hearts declare His praise
For who can stop the [G]Lord almighty?

{Chorus}
[C]Our God is the Lion, [G]the Lion of [Am]Judah
He's roaring with [G]power and fighting our [F]battles
[G]Every knee will bow before [C]Him
Our God is the Lamb, [G]the Lamb that was [Am]slain
For the sins of the world, [G]His blood breaks the [F]chains
[G]Every knee will bow before
[F]the Lion and the Lamb

{Bridge}
[Dm]Who can stop the [C/E]Lord almighty?
[F]Who can stop the [G]Lord almighty?`,
    notes: "Key of D, Capo 2. Powerful declaration.",
    bpm: 90,
    tags: ["worship", "praise", "declaration"],
  },
];

const skipExisting = process.argv.includes("--skip-existing");

async function main() {
  const col = db.collection("worshipSongs");
  let existingTitles = new Set();

  if (skipExisting) {
    const snapshot = await col.select("title").get();
    snapshot.forEach((doc) => existingTitles.add(doc.data().title));
  }

  let batch = db.batch();
  let count = 0;

  for (const song of SONGS) {
    if (skipExisting && existingTitles.has(song.title)) {
      console.log("SKIP (exists): " + song.title);
      continue;
    }
    const ref = col.doc();
    batch.set(ref, {
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
      format: song.format,
      content: song.content,
      notes: song.notes,
      bpm: song.bpm,
      tags: song.tags,
      createdBy: "seed-script",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    count++;
    console.log("ADD: " + song.title);
  }

  if (count > 0) {
    await batch.commit();
    console.log("Seeded " + count + " song(s).");
  } else {
    console.log("No new songs to seed.");
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
