#!/usr/bin/env node
/**
 * Seed: Your Name by Paul Baloche
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-your-name.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Your Name",
    artist: "Paul Baloche",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro} * 2
[G] [C] [D] [G]

{Verse}
[G]As morning [C]dawns and [D]evening [G]fades
[G]You in[C]spire [D]songs of [G]praise
[G]That rise from [C]earth to [D]touch Your [Em]heart
[C]And [D]glorify Your [G]Name

{Chorus}
[D]Your [Em]Name is a [G]strong and mighty [C]tower
[D]Your [Em]Name is a [G]shelter like no [C]other
[D]Your [Em]Name, let the [G]nations sing it [C]louder
[G]'Cause nothing has the [C]power to [D]save
[G]But Your [C]Name [D] [G]`,
    notes: "Key of G, Capo 3. Strong praise anthem.",
    bpm: 84,
    tags: ["worship", "praise", "name of god"],
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
