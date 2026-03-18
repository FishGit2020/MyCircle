#!/usr/bin/env node
/**
 * Seed: Holy by Jesus Culture
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-holy.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Holy",
    artist: "Jesus Culture",
    originalKey: "Am",
    format: "chordpro",
    content: `{Verse}
[Am] [Dm] [C] [Em]

[Am]And only one word [Dm]comes to mind. [C]There's only one word to [Em]describe

{Chorus}
[Am]Holy, [Dm]Holy! Lord, [C]God, Al[Em]mighty!
[Am]Holy, [Dm]Holy! Lord, [C]God, Al[Em]mighty!

{Bridge}
[Am]There is no one [Dm]like You, [C]You are holy, [Em]holy`,
    notes: "Key of Am. Simple, powerful holiness declaration. 69 BPM. Let the simplicity carry weight.",
    bpm: 69,
    tags: ["worship", "holiness", "awe"],
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
