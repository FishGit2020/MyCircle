#!/usr/bin/env node
/**
 * Seed: Lord I Lift Your Name On High by Hillsong
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-lord-i-lift-your-name-on-high.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Lord I Lift Your Name On High",
    artist: "Hillsong",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]Lord I [F]lift your name on [G]high [F]
[C]Lord I [F]love to sing Your [G]praises [F]
[C]I'm so [F]glad you're in my [G]life [F]
[C]I'm so [F]glad You came to [G]save [F]us

{Chorus}
[C]You came from [F]heaven to [G]earth to [F]show the [C]way
[C]From the [F]earth to the [G]cross my [F]debt to [C]pay
[C]From the [F]cross to the [G]grave from the [Am]grave to the [Dm]sky
[F]Lord I [G]lift Your name on [C]high`,
    notes: "Key of C. Classic, upbeat praise. Simple congregational song.",
    bpm: 120,
    tags: ["worship", "praise", "gospel"],
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
