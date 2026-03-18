#!/usr/bin/env node
/**
 * Seed: Break Every Chain by Will Reagan
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-break-every-chain.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Break Every Chain",
    artist: "Will Reagan",
    originalKey: "Bm",
    format: "chordpro",
    content: `{Intro}
[Em] / [C] / | [G] / [D] / | [Em] / [C] / | [G] / / /

{Chorus 1}
[Em]There is [C]power in the [G]name of [D]Jesus [3x]
[Em]To break every chain, to [C]break every chain,
[G]To break [D]every chain

{Tag}
[Em] / [C] / | [G] / [D] / [repeat]

{Verse}
[Em]All suf[C]ficient [G]sacri[D]fice so [Em]freely [C]given
[G]Such a [D]price [Em]bought our [C]re[G]demp[D]tion
[Em]Heaven's [C]gates swing [G]wide [D]

{Chorus 2}
[Em]There's an [C]army [G]rising [D]up [8x]
[Em]To break every chain, to [C]break every chain,
[G]To break [D]every chain

{Ending}
[Em]There's power in the [C]Name of [G]Je[D]sus`,
    notes: "Key of Bm, commonly played with capo 2 in Em shapes. High-energy declaration. Build through choruses.",
    bpm: 75,
    tags: ["worship", "freedom", "spiritual warfare"],
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
