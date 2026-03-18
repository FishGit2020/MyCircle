#!/usr/bin/env node
/**
 * Seed: Angels We Have Heard On High by Traditional Christmas
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-angels-we-have-heard-on-high.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Angels We Have Heard On High",
    artist: "Traditional Christmas",
    originalKey: "G",
    format: "chordpro",
    content: `{Verse 1}
[G]Angels we have [D7]heard on [G]high
[G]Sweetly singing [D7]o'er the [G]plains
[G]And the mountains [D7]in re[G]ply
[G]Echoing their [D7]joyous [G]strains

{Refrain}
[G]Glo[Am]ria [G]in ex[D]celsis De--o
[G]Glo[Am]ria [G]in ex[D]celsis De--o

{Verse 2}
[G]Shepherds, why this [D7]jubi[G]lee?
[G]Why your joyous [D7]strains pro[G]long?
[G]What the gladsome [D7]tidings [G]be
[G]Which inspire your [D7]heavenly [G]song?

{Verse 3}
[G]Come to Bethle[D7]hem and [G]see
[G]Him whose birth the [D7]angels [G]sing
[G]Come, adore on [D7]bended [G]knee
[G]Christ the Lord, the [D7]newborn [G]King`,
    notes: "Traditional Christmas hymn. Key of G. Gloria section builds with full choir feel.",
    bpm: 120,
    tags: ["hymn", "christmas", "praise"],
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
