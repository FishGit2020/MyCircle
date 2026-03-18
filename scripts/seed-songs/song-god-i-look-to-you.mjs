#!/usr/bin/env node
/**
 * Seed: God I Look To You by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-god-i-look-to-you.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "God I Look To You",
    artist: "Bethel Music",
    originalKey: "B",
    format: "chordpro",
    content: `{Verse}
[C]God I look to [G]You, I won't be overwhelmed
[F]Give me [Am]vision to [G]see things like You do
[C]God I look to [G]You, You're where my help comes from
[F]Give me wis[Am]dom; You know just [G]what to do

{Chorus (version 1)}
[F]I will love You [Dm]Lord my [G]strength
[F]I will love You [Dm]Lord my [G]shield
[F]I will love You [Dm]Lord my [G]rock for[C]ever
[F]All my days I [G]will love You [C]God

{Bridge}
[F]Hallelujah our [Am]God [G]reigns
[F]Hallelujah our [Am]God [G]reigns
[F]Hallelujah our [Am]God reigns for[G]ever [C]
[F]All my days [G]Halle[C]lujah`,
    notes: "Original key B. Commonly played C or D with capo. Simple and powerful trust declaration.",
    bpm: 72,
    tags: ["worship", "trust", "strength"],
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
