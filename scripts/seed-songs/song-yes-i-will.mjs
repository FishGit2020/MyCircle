#!/usr/bin/env node
/**
 * Seed: Yes I Will by Mia Fieldes/Eddie Hoagland/Jonathan Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-yes-i-will.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Yes I Will",
    artist: "Mia Fieldes/Eddie Hoagland/Jonathan Smith",
    originalKey: "C",
    format: "chordpro",
    content: `[F]I count on one [C]thing, the same God that [G]never [Am]fails
[F]Will not fail [C]me now, You won't fail [G]me [Am]now
[F]In the waiting, the [C]same God who's [G]never [Am]late
[F]Is working all [C]things out, is [G]working all [Am]things out

[F]Yes I [C]will, lift You high in the [G]lowest [Am]valley
[F]Yes I [C]will, bless Your name
[F]Oh yes I [C]will, sing for [G]joy when my [Am]heart is heavy
[F]For all my [C]days, oh [G]yes I [Am]will

[F]For all my [C]days, oh [G]yes I [Am]will

[F]And I choose to [C]praise, to glorify, [G]glorify
[F]The Name of all [C]names that nothing can [G]stand against [x4]

[F]For all my [C]days, [G]yes, I [C]will`,
    notes: "Key of C. Commitment anthem. Bridge builds with bold declaration.",
    bpm: 80,
    tags: ["worship", "faithfulness", "perseverance"],
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
