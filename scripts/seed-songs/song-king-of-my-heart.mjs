#!/usr/bin/env node
/**
 * Seed: King Of My Heart by Bethel Music
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-king-of-my-heart.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "King Of My Heart",
    artist: "Bethel Music",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse}
[G]Let the king of my heart
[C]Be the mountain where I [G]run
[Em]The fountain I drink [D]from
[C]He is my [G]song
[G]Let the king of my heart
[C]Be the shadow where I [G]hide
[Em]The ransom for my [D]life
[C]He is my [G]song

{Chorus}
[Em]You are good
[D]Good
[C]Oh, [G]oh

{Verse 3}
[G]Let the king of my heart
[C]Be the wind inside my [G]sails
[Em]The anchor in the [D]waves
[C]He is my [G]song

{Bridge 1}
[G]You're never gonna let me down
You're never gonna let
Never gonna let me down

{Bridge 2}
[G]You're never gonna let
[C]Never gonna let me [D]down
[Em]You're never gonna [D]let
[C]Never gonna let me [G]down`,
    notes: "Key of G, BPM 70. Devotion anthem. Bridge builds with 'never gonna let me down' repetition.",
    bpm: 70,
    tags: ["worship", "devotion", "trust"],
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
