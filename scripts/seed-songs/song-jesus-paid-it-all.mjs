#!/usr/bin/env node
/**
 * Seed: Jesus Paid It All by Traditional Hymn
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-jesus-paid-it-all.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Jesus Paid It All",
    artist: "Traditional Hymn",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]I hear the Savior say
[D]Thy strength indeed is [G]small
[Em]Child of weakness, watch and [C]pray
[D]Find in [G]Me thine all in all

{Chorus}
[G]Jesus paid it [Em]all
[G]All to [D]Him I owe
[G]Sin had left a [C]crimson stain
[G]He washed it white as [D]snow

{Verse 2}
[G]Lord, now indeed I find
[D]Thy power and Thine a[G]lone
[Em]Can change the leper's [C]spots
[D]And melt the [G]heart of stone

{Verse 3}
[G]And when before the throne
[D]I stand in Him com[G]plete
[Em]Jesus died my soul to [C]save
[D]My lips shall [G]still repeat

{Bridge}
[G]O praise the [C]one who paid my debt
[Am]And raised this [D]life up from the dead [C]`,
    notes: "Classic hymn. Key of G, 3/4 feel. Powerful cross-centered message.",
    bpm: 72,
    tags: ["hymn", "cross", "salvation"],
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
