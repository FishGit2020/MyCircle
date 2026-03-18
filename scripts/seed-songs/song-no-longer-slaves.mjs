#!/usr/bin/env node
/**
 * Seed: No Longer Slaves by Jonathan David Helser/Melissa Helser
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-no-longer-slaves.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "No Longer Slaves",
    artist: "Jonathan David Helser/Melissa Helser",
    originalKey: "C",
    format: "chordpro",
    content: `[C]You unravel me, with a melody
[F/C]You surround me with a [G/C]song of deliverance
[F/C]from my [G/C]enemies
Till all my fears are gone

{Chorus}
[F]I'm no [G(add4)]longer a [C]slave to [Am]fear
[G]I am a [C]child of God
[F]I'm no [G(add4)]longer a [C]slave to fear
[Am]I am a child of [C]God

{Verse 2}
[D]From my Mother's womb [F#m]You have chosen me
[G]Love has [A]called my [D]name
[D]I've been born again, into a [F#5]family
[G]Your blood flows through my [C]veins

{Bridge}
[Am]You split the [G7/B]sea, so I could walk [C]right through it
[Am]My fears were [G7/B]drowned in per[C]fect love
[Am]You rescued [G7/B]me, so I could [C]stand and sing
[F]I am a [G7]child of [C]God`,
    notes: "Key of C, also D. Freedom anthem. Build through bridge.",
    bpm: 72,
    tags: ["worship", "freedom", "identity"],
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
