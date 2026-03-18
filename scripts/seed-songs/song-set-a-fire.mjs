#!/usr/bin/env node
/**
 * Seed: Set A Fire by Jesus Culture
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-set-a-fire.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Set A Fire",
    artist: "Jesus Culture",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G/C] [C/F] [Em/Am] [C/F]

{Chorus}
[G/C]Set a fire down in my [C/F]soul
That I can't con[Em/Am]tain and I can't control
[C/F]I want more of You God, I want [C]more of You God.

{Verse}
[G/C]There's no place I'd rather be
[C/F]There's no place I'd rather be
[Em/Am]There's no place I'd rather be
[C/F]Than here in Your love, here in Your love`,
    notes: "Key of C, BPM 139, Capo 5 for original. Simple prayer chorus. Let it repeat and build.",
    bpm: 139,
    tags: ["worship", "fire", "prayer"],
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
