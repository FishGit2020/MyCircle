#!/usr/bin/env node
/**
 * Seed: Living Hope by Phil Wickham/Brian Johnson
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-living-hope.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Living Hope",
    artist: "Phil Wickham/Brian Johnson",
    originalKey: "G",
    format: "chordpro",
    content: `{Intro}
[G] [C] [G] [C]

{Verse 1}
[G]How great the chasm that [D]lay between us
[C]How high the [Em]mountain I [D]could not climb
[G]In desperation I [D]turned to heaven
[C]And spoke Your [D]name into the [G]night
[C]Then through the darkness Your [G]loving kindness
[Em]Tore through the [D]shadows of my soul
[G]The work is finished, the [D]end is written
[C]Jesus [D]Christ, my [G]Living Hope

{Chorus}
[C] [G]Hallelujah, [D]praise the one who set me [Em]free
[C] [G]Hallelujah, [D]death has lost its grip on [Em]me
[C]You have [G]broken every [D]chain, there's [Em]salvation in Your Name
[C]Jesus [D]Christ, my [G]Living Hope

{Verse 3}
[G]Then came the morning that [D]sealed the promise
[C]Your buried [Em]body be[D]gan to breathe
[G]Out of the silence the [D]roaring Lion
[C]Declared the [D]grave has no [G]claim on me
[C]Jesus, [D]Yours is the [G]victory

{Final}
[C]Jesus Christ, my [D]Living [Em]Hope [G]
[C]Oh God, You [D]are my Living [G]Hope`,
    notes: "Original Eb, Capo 3 plays G. Resurrection anthem.",
    bpm: 72,
    tags: ["worship", "hope", "resurrection"],
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
