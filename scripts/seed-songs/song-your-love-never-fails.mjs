#!/usr/bin/env node
/**
 * Seed: Your Love Never Fails by Chris McClarney/Anthony Skinner
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-your-love-never-fails.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Your Love Never Fails",
    artist: "Chris McClarney/Anthony Skinner",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[Em]Nothing can [C]separate, [G]even if I [D]ran away
[Em]Your love [C]never [G]fails [D]
[Em]I know I [C]still make mistakes, but
[G]You have new mercy for [D]me everyday
[Em]Your love [C]never [G]fails [D]

{Chorus}
[C]You stay the [G]same through the [D]ages, [Am]Your love never [C]changes
[G]There may be [D]pain in the [Am]night, but [C]joy comes in the morning
[G]And when the [D]oceans rage, [Am]I don't have to be [C]afraid
[G]Because I [D]know that You love me, and Your love never fails

{Bridge}
[C]You make [Em]all things work together for my [D]good`,
    notes: "Key of G. Love declaration anthem.",
    bpm: 80,
    tags: ["worship", "love", "faithfulness"],
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
