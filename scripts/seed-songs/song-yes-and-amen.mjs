#!/usr/bin/env node
/**
 * Seed: Yes And Amen by Anthony Brown/Chris McClarney/Nate Moore
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-yes-and-amen.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Yes And Amen",
    artist: "Anthony Brown/Chris McClarney/Nate Moore",
    originalKey: "D",
    format: "chordpro",
    content: `{Intro}
[D] [Em7] [C2] [G] [x2]

{Verse 1}
[D]Father of [Em7]kindness, You have [C2]poured out [G]grace
[D]Brought me out [Em7]of darkness, You have [C2]filled me with [D]peace
[Em7]Giver of [C2]mercy, You're my [C2]help in time of need
[D]Lord, I can't help but [G]sing

{Chorus}
[D]Faithful, [Em7]You are, [C] [G] [D]faithful, [Em7]forever [C]You will [G]be
[D]Faithful, [Em7]You are, all Your [Em7]promises are [C]yes and [G]amen

{Bridge}
[Dsus] [Em]I will rest [C]in Your [G]promises [x4]
My confidence [C]is Your [G]faithfulness`,
    notes: "Key of D. Faithfulness anthem.",
    bpm: 72,
    tags: ["worship", "faithfulness", "promises"],
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
