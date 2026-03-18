#!/usr/bin/env node
/**
 * Seed: Fall Afresh by Jeremy Riddle
 * Usage: GOOGLE_APPLICATION_CREDENTIALS=./key.json node scripts/seed-songs/song-fall-afresh.mjs --skip-existing
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const SONGS = [
  {
    title: "Fall Afresh",
    artist: "Jeremy Riddle",
    originalKey: "C",
    format: "chordpro",
    content: `{Intro}
[C] [F]

{Verse}
[C]Awaken my [F]soul, come [C]awake [F]
[C]To hunger, to [F]seek, to [Am]thirst [F]
[C]Awaken first [F]love, come [C]awake [F]
[C]And do as You [F]did at [Am]first [F]

{Chorus}
[C]Spirit of the [F]Living God come [C]fall afresh on [G]me
[Am]Come wake me from my [F]sleep
[Am]Blow through the [F]caverns of my [C]soul
[G]Pour in me to [Am]over[F]flow, [C] [G]
[C]to overflow

{Bridge} x2
[F]Come and fill this [C]place
[F]Let Your glory now in[C]vade
[F]Spirit come and [Am]fill this place
[F]Let Your glory now in[G]vade`,
    notes: "Capo 4, original key E. Prayerful invocation of the Holy Spirit. Keep gentle and building.",
    bpm: 72,
    tags: ["worship", "holy spirit", "prayer"],
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
