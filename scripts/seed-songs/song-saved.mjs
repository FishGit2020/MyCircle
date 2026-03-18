#!/usr/bin/env node
/**
 * Seed: Saved by Vineyard Songs
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-saved.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Saved",
    artist: "Vineyard Songs",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[G/C] | [G/C] | [C/F] | [C/F] | [x2]

{Verse}
[G/C]I have been re[C/F]stored to the love of God
[G/C]I thought it was the [C/F]end, but it's just begun
[G/C]I'm a sinner [C/F]saved by the grace of God
[G/C]Not for what I've [C/F]done or for what I've not

{Chorus}
[G/C]You, my Jesus, my [C/F]strength and fortress
[G/C]My hope and [C/F]purpose, You are all this, (and more)

{Interlude}
[G/C] | [G/C] | [C/F] | [C/F] | [x2]

{Bridge}
[G/C]I love, I love, I love
[C/F]I love You, oh I love You [x4]`,
    notes: "Key of C. Simple grace testimony. Let repetition build intimacy.",
    bpm: 80,
    tags: ["worship", "grace", "love"],
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
