#!/usr/bin/env node
/**
 * Seed: Reckless Love by Cory Asbury/Caleb Culver/Ran Jackson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-reckless-love.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Reckless Love",
    artist: "Cory Asbury/Caleb Culver/Ran Jackson",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse 1}
[Am]Before I spoke a word, [G]You were singing over [F2]me
[Am]You have been so, [G]so good to [F2]me
[Am]Before I took a [G]breath, You breathed Your [F2]life in me
[Am]You have been so, [G]so kind to [F2]me

{Chorus}
[Am]Oh, the overwhelming, [G]never-ending, [F]reckless love of [C]God
[Am]Oh, it chases me down, [G]fights til I'm found, [F]leaves the ninety-[C]nine
[Am]I couldn't earn it, I [G]don't deserve it, still [F]You give Yourself a[C]way
[Am]Oh, the overwhelming, [G]never-ending, [F]reckless love of [C]God

{Bridge}
[Am]There's no shadow You [G]won't light up
Mountain You won't [C]climb up, coming after me
[Am7]There's no wall You won't [G]kick down
Lie You won't tear [C]down, coming after me [x3]`,
    notes: "Original key D, Capo 2 with C shapes.",
    bpm: 88,
    tags: ["worship", "love", "grace"],
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
