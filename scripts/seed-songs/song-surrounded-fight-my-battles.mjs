#!/usr/bin/env node
/**
 * Seed: Surrounded (Fight My Battles) by Elyssa Smith
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-surrounded-fight-my-battles.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Surrounded (Fight My Battles)",
    artist: "Elyssa Smith",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[C]There's a [G]table [D]that You've [Em]prepared for me
[C]In the [G]pres[D]ence of my [Em]enemies
[C]It's Your [G]body and [D]Your blood You shed for [Em]me
[C]This is how I [G]fight my [D]bat[Em]tles

{Pre-Chorus}
[G/B]And I [C]believe You've over[Dsus]come
[Em]And I will [G/B]lift my song of
[C]Praise for what You've [Dsus]done

{Chorus}
[G]This is how I [C2]fight my battles
[Dsus]This is how I [Em7]fight my battles
[G]This is how I [C2]fight my battles
[D]This is [Em]how

{Bridge}
[G/B]It may look like [C2]I'm surrounded
[Dsus]But I'm sur[Em7]rounded by You`,
    notes: "Key of G, 69 BPM. Trust song.",
    bpm: 69,
    tags: ["worship", "spiritual warfare", "trust"],
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
