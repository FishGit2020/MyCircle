#!/usr/bin/env node
/**
 * Seed: Forever by Chris Tomlin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-forever.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Forever",
    artist: "Chris Tomlin",
    originalKey: "A",
    format: "chordpro",
    content: `{Verse 1}
[A]Give thanks to the Lord our God and King
[A]His love endures forever
[D]For He is good, He is above all things
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise

{Verse 2}
[A]With a mighty hand and outstretched arm
[A]His love endures forever
[D]For the life that's been reborn
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise

{Pre-Chorus}
[E]Sing [D2/F#]praise, sing praise

{Chorus}
[A]Forever God is [F#m7]faithful
[E]Forever God is [D]strong [A]
Forever God is with us, for[E]ever, for[A]ever

{Verse 3}
[A]From the rising to the setting sun
[A]His love endures forever
[D]And by the grace of God we will carry on
[D]His love endures for[A]ever
[E]Sing [D2/F#]praise, sing praise`,
    notes: "Key of A, Tempo 120. Upbeat praise. Driving rhythm. Also commonly played in G with capo 2.",
    bpm: 120,
    tags: ["worship", "praise", "faithfulness"],
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
