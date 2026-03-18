#!/usr/bin/env node
/**
 * Seed: Raise A Hallelujah by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-raise-a-hallelujah.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Raise A Hallelujah",
    artist: "Bethel Music",
    originalKey: "C",
    format: "chordpro",
    content: `{Verse 1}
[C]I raise a Hallelujah in the [F]presence of my enemies
[Am]I raise a Hallelujah [G]louder than the unbelief
[C]I raise a Hallelujah, my [F]weapon is a melody
[Am]I raise a Hallelujah, [G]heaven comes to fight for me

{Chorus}
[F]I'm gonna sing in the [C]middle of the storm
[Am]Louder and louder, you're gonna [G]hear my praises roar
[F]Up from the ashes, [C]hope will arise
[Am]Death is defeated, the [G]King is alive

{Bridge}
[C]Sing a little louder (in the presence of my enemies)
[G]Sing a little louder (louder than the unbelief)
[Am]Sing a little louder (my weapon is a melody)
[F]Sing a little louder (heaven comes to fight for me)

{Tag}
[C]I raise a Hallelujah
[F]I raise a Hallelujah
[Am]I raise a Hallelujah
[G]I raise a Hallelujah`,
    notes: "Key of C. Spiritual warfare anthem.",
    bpm: 84,
    tags: ["worship", "spiritual warfare", "praise"],
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
