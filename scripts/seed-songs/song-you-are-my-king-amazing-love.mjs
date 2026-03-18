#!/usr/bin/env node
/**
 * Seed: You Are My King (Amazing Love) by Billy Foote
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-you-are-my-king-amazing-love.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "You Are My King (Amazing Love)",
    artist: "Billy Foote",
    originalKey: "D",
    format: "chordpro",
    content: `{Verse}
[D/F#]I'm for[G2]given be[Asus]cause You were for[A]saken
[D/F#]I'm ac[G2]cepted, [Asus]You were con[A]demned
[D/F#]I'm a[G2]live and well, Your [Asus]Spirit is with[A]in me
[G2]Because You [A]died and rose a[D]gain

{Chorus}
[D]Amazing love, how [G]can it be
[D]That You my [Asus]King would die for [A] [G/A]me (To Verse / Chorus)
[A]Amazing love, I [G]know it's true
[A]It's my joy to [D]honor You
In all I do, I honor You

{Bridge}
[D]You are my King
[D]You are my King
[D]Jesus, You are my King
[D]Jesus, You are my King`,
    notes: "Key of D, 65 BPM. Simple cross anthem. Bridge is quiet declaration.",
    bpm: 65,
    tags: ["worship", "love", "cross"],
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
