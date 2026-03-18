#!/usr/bin/env node
/**
 * Seed: The Wonderful Cross by Chris Tomlin/Jesse Reeves/Isaac Watts/J.D. Walt
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-the-wonderful-cross.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "The Wonderful Cross",
    artist: "Chris Tomlin/Jesse Reeves/Isaac Watts/J.D. Walt",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]When I survey the wondrous cross
[C]On which the [F]Prince of [C]glory [G]died,
[C]My richest gain I [F]count but [C]loss,
[C]And pour [G]contempt on [C]all my pride.

{Verse 2}
See from His head, His hands, His feet,
Sorrow and love flow mingled down:
Did e'er such love and sorrow meet,
Or thorns compose so rich a crown?

{Chorus}
[F]Oh the [C/E]wonderful [F]Cross, [C/E]oh the wonderful Cross
[F]Bids me come and [C/E]die and find that [Gsus]I may truly live
[F]Oh the [C/E]wonderful [F]Cross, [C/E]oh the wonderful Cross
[F]All who gather [C/E]here by grace draw near
[Gsus]And bless Your name

{Verse 3}
Were the whole realm of Nature mine,
That were an offering far too small;
Love so amazing, so divine,
Demands my soul, my life, my all!`,
    notes: "Key of C, Capo 2 for original D. Classic hymn with modern chorus.",
    bpm: 72,
    tags: ["hymn", "cross", "worship"],
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
