#!/usr/bin/env node
/**
 * Seed: Nothing Else by Cody Carnes
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-nothing-else.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Nothing Else",
    artist: "Cody Carnes",
    originalKey: "C",
    format: "chordpro",
    content: `{Chorus}
[Dm7(4)]I'm caught up in Your [F2]presence
[C]I just want to sit here at Your feet
[Dm7(4)]I'm caught up in this [F2]holy moment
[C]I never want to leave
[Dm7(4)]Oh I'm not here for [F2]blessings
[C]Jesus You don't owe me anything
[Dm7(4)]More than any[F2]thing that You can do
[C]I just want You

{Verse 1}
[F2]I'm sorry when I've just gone through the motions
[C/E]I'm sorry when I just sang another song
[F2]Take me back to where we [C]started
I open up my heart to You

{Bridge}
[Dm]I just want [F]You, nothing [Am]else
Nothing [G]else will do`,
    notes: "Key of C, Tempo 68. Intimate worship.",
    bpm: 68,
    tags: ["worship", "intimacy", "devotion"],
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
