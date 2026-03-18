#!/usr/bin/env node
/**
 * Seed: Make Room by The Church Will Sing
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-make-room.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Make Room",
    artist: "The Church Will Sing",
    originalKey: "E",
    format: "chordpro",
    content: `{Intro}
[E] [B] [F#m] [A]
[E] [B] [F#m] [A]

{Verse 1}
[E]Here is where I [B]lay it down
[F#m]Every burden, every crown
[A]This is my surrender
[A]This is my surrender

[E]Here is where I [B]lay it down
[F#m]Every lie and every doubt
[A]This is my surrender

{Chorus} * 2
[E]And I will make room for You
[B]To do whatever You [F#m7]want to
[A]To do whatever You want to

{Bridge} * 4
[E]Shake up the ground
of all my tradition
[B]Break down the walls
of all my religion
[F#m]Your way is better
[A]Oh Your way is better

{Verse 2}
[E]Here is where I [B]lay it down
[F#m]You are all I'm chasing now
[A]This is my surrender
[A]This is my surrender`,
    notes: "Key of E (also Gb with Capo 4). Surrender anthem. Bridge repeats build with energy.",
    bpm: 72,
    tags: ["worship", "surrender", "devotion"],
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
